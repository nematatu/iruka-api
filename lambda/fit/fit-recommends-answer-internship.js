const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondRecomend";

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  // TODO: リクエストボディの中身をJavaScriptオブジェクトに変換し、1つ、あるいは複数の変数に代入する
  const {email, hot, cool, bless, waist, dizziness, irritation}=JSON.parse(event.body);
  
    //バリデーション
//   if (!title || !discription || !start || !end || !category){
//     response.statusCode=400;
//     response.body=JSON.stringify({
//       title, discription, start, end, category
//     })
//     return response;
//   


  const date = Date.now();

  try {
  // TODO: DBに登録するための情報をparamオブジェクトとして宣言する（中身を記述）
    const param = {
      TableName,
      Item:marshall({
        email,
        date,
        hot,
        cool,
        bless,
        waist,
        dizziness,
        irritation
    })
  };
  
  // DBにデータを登録するコマンドを用意
    const command = new PutItemCommand(param);
    // client.send()でDBにデータを登録するコマンドを実行
    await client.send(command);
    // TODO: 登録に成功した場合の処理を記載する。(status codeの設定と、response bodyの設定)
    response.statusCode=201;
    response.body=JSON.stringify({
        email,
        date,
        hot,
        cool,
        bless,
        waist,
        dizziness,
        irritation
      });
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