const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondUser";

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  // TODO: リクエストボディの中身をJavaScriptオブジェクトに変換し、1つ、あるいは複数の変数に代入する
  const {email,username,password}=JSON.parse(event.body);
  
    //バリデーション
  if (!email || !username || !password){
    response.statusCode=400;
    response.body=JSON.stringify({
      message: "Invalid request. Required parameters are not set in request body."
    })
    return response;
  }

  try {
  // TODO: DBに登録するための情報をparamオブジェクトとして宣言する（中身を記述）
    const param = {
      TableName,
      Item:marshall({
        email,
        username,
        password,
    })
  };
  
  // DBにデータを登録するコマンドを用意
    const command = new PutItemCommand(param);
    // client.send()でDBにデータを登録するコマンドを実行
    await client.send(command);
    // TODO: 登録に成功した場合の処理を記載する。(status codeの設定と、response bodyの設定)
    response.statusCode=201;
    response.body=JSON.stringify({email,username,password});
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
