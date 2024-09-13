const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondTraining";

exports.handler = async (event, context) => {
  //レスポンスの雛形
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const trainingId = parseInt(event.queryStringParameters.trainingId)

  //バリデーション
  if (!trainingId){
    response.statusCode=400;
    response.body=JSON.stringify({
      message: "Invalid request. trainingId is not set."
    });
    return response;
  }

  //TODO: 取得対象のテーブル名と検索に使うキーをparamに宣言
  const param = {
    TableName,
    Key:marshall({
      trainingId,
    },
    ),
  };

  // 指定したアイテムを取得するコマンドを用意
  const command = new GetItemCommand(param);

  try {
    //client.send()の実行でDBからデータを取得
    const training = (await client.send(command)).Item;

    if(!training){
      response.statusCode=404;
      response.body=JSON.stringify({
        message:"user not found."
      })
    }
    
    //TODO: レスポンスボディに取得したUserの情報を設定する
    response.body=JSON.stringify(unmarshall(training));
  } catch (e) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "予期せぬエラーが発生しました。",
      errorDetail: e.toString(),
    });
  }

  return response;
};
