import axios from 'axios';
import querystring from 'querystring';
import { OAuth } from 'oauth';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand,UpdateItemCommand, ProjectionType } from '@aws-sdk/client-dynamodb';
import { marshall,unmarshall } from '@aws-sdk/util-dynamodb'; // DynamoDBのデータ変換用

const client = new DynamoDBClient({ region: 'ap-northeast-1' });

const TableName = "iruka-user";
const oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    '1.0A',
    process.env.CALLBACK_URL,
    'HMAC-SHA1'
);

export const handler = async (event) => {
    const { oauth_token, oauth_verifier } = event.queryStringParameters;

    if (!oauth_token || !oauth_verifier) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'OAuth token or verifier is missing' }),
        };
    }

    try {
        const oauthTokenSecret = await getOAuthTokenSecret(oauth_token); // DynamoDBやセッションストレージからトークンシークレットを取得

        // アクセストークンの取得
        const { oauthAccessToken, oauthAccessTokenSecret } = await getOAuthAccessToken(oauth_token, oauthTokenSecret, oauth_verifier);

        // ユーザー情報を取得
        const userInfo = await getUserInfo(oauthAccessToken, oauthAccessTokenSecret);

        const username = userInfo.name;
        const description = userInfo.description;
        const profile_image_url = userInfo.profile_image_url;

        // const checkflag=checkUserNameExists(username);
        // if(checkflag){
        //     return {
        //         statusCode: 400,
        //         body: JSON.stringify({ error: 'User already exists' }),
        //     };
        // }
        // DynamoDBにユーザー情報を保存
        await saveUserToDynamoDB(userInfo);

        return {
            statusCode: 200,
            body: JSON.stringify({
                username: userInfo.name,
                description: userInfo.description,
                profile_image_url: userInfo.profile_image_url,
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to authenticate user' }),
        };
    }
};

// OAuth Access Tokenの取得
const getOAuthAccessToken = (oauthToken, oauthTokenSecret, oauthVerifier) => {
    return new Promise((resolve, reject) => {
        oauth.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
            if (error) {
                return reject(error);
            }
            resolve({ oauthAccessToken, oauthAccessTokenSecret });
        });
    });
};

// ユーザー情報の取得
const getUserInfo = (oauthAccessToken, oauthAccessTokenSecret) => {
    return new Promise((resolve, reject) => {
        oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json', oauthAccessToken, oauthAccessTokenSecret, (error, data) => {
            if (error) {
                return reject(error);
            }
            resolve(JSON.parse(data));
        });
    });
};

// DynamoDBにユーザー情報を保存
const saveUserToDynamoDB = async (userInfo) => {
    const userId=await generateUniqueUserId();

    const params = {
        TableName,
        Item: marshall({
            userId, // TwitterユーザーID
            userName: userInfo.name, // ユーザー名
            profileImage: userInfo.profile_image_url_https, // プロフィール画像URL
        }),
    };

    await client.send(new PutItemCommand(params));
};

// OAuthトークンシークレットを取得する関数（セッション管理がない場合、DBやキャッシュに保存したりする）
const getOAuthTokenSecret = async (oauthToken) => {
    // 必要に応じて、DynamoDBやRedisなどからトークンシークレットを取得するロジックを追加
    // ここでは仮の例として固定のシークレットを返す
    return 'your-oauth-token-secret'; // 実際には事前に保存しておいたシークレットを返す
};

// ユーザー名がDynamoDBに存在するかチェックする関数
const checkUserNameExists = async (userName) => {
    const params = {
        TableName,
        Key: marshall({ userName }),
    };

    try {
        const { Item } = await client.send(new GetItemCommand(params));
        return Item !== undefined;
    } catch (e) {
        console.error(e);
        throw new Error("Could not check if userName exists");
    }
};

const generateUniqueUserId=async()=>{
    const minUserId=2;
    const maxUserId=1000;
  
    const scanParams={
      TableName:TableName,
      ProjectionExpression:"userId",
    }
  
    const scanCommand=new ScanCommand(scanParams);
    const scanResult=await client.send(scanCommand);
  
    const usedUserIds=scanResult.Items.map(item=>unmarshall(item).userId);
  
    let userId;
  
    for(let i=minUserId;i<=maxUserId;i++){
      if(!usedUserIds.includes(i)){
        userId=i;
        break;
      }
    }
  
    if(!userId){
      throw new Error("userId is already used");
    }
    
    return userId;
  }