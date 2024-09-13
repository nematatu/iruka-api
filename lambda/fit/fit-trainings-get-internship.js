const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondTraining";

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  
  
  const param = {TableName};
  
  const command = new ScanCommand(param);
   
    try {
    // client.send()で全件取得するコマンドを実行
    const trainings = (await client.send(command)).Items;
    
    if(!trainings){
      response.statusCode=404;
      response.body=JSON.stringify({
        message:"user not found."
      })
    }
    
    const unmarshalledTrainingsItems=trainings.map((item)=>unmarshall(item));
    response.body=JSON.stringify({Trainings:unmarshalledTrainingsItems});
    //TODO: レスポンスボディを設定する
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
