const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "iruka-user";

exports.handler = async (event, context) => {
  // レスポンスの雛形
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const userName = event.queryStringParameters.userName; // 見たいユーザのuserName

  // バリデーション
  if (!userName) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: "Invalid request. userName is not set."
    });
    return response;
  }

  // テーブルから取得するためのパラメータを設定
  const param = {
    TableName,
    KeyConditionExpression: "userName = :userName",
    ExpressionAttributeValues: {
      ":userName": { S: userName }
    },
    ProjectionExpression: "userId" // 必要な属性のみを取得
  };

  // クエリを実行するコマンドを作成
  const command = new QueryCommand(param);

  try {
    // client.send() でデータを取得
    const result = await client.send(command);
    const items = result.Items;

    if (!items || items.length === 0) {
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: "User not found."
      });
      return response;
    }

    // データが見つかった場合、userId を取得
    const userId = unmarshall(items[0]).userId;
    
    // レスポンスボディに取得したuserIdを設定
    response.body = JSON.stringify({ userId });
  } catch (e) {
    console.error(e.message);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};
