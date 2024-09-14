import querystring from "querystring";
import { OAuth } from "oauth";

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    '1.0A',
    process.env.CALLBACK_URL,
    'HMAC-SHA1'
  );

  try {
    // OAuthリクエストトークンを取得するPromiseを作成
    const getRequestToken = () => {
      return new Promise((resolve, reject) => {
        oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
          if (error) {
            reject(error);
          } else {
            resolve({ oauthToken, oauthTokenSecret });
          }
        });
      });
    };

    // トークン取得
    const { oauthToken, oauthTokenSecret } = await getRequestToken();

    // クライアント側に返すリダイレクトURL
    const redirectUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;

    // クエリパラメータやCookieなどを使ってトークンを保持
    // ここではクエリパラメータとして返す例を示す
    const response = {
      statusCode: 302,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Location": redirectUrl, // Twitter認証ページへリダイレクト
        "Set-Cookie": `oauthTokenSecret=${oauthTokenSecret}; HttpOnly; Path=/;`, // セキュアに保持
      },
      body: JSON.stringify({ message: "Redirecting to Twitter for authentication" }),
    };

    return response;

  } catch (error) {
    console.error('Error obtaining request token:', error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: 'Failed to get request token' }),
    };
  }
};
