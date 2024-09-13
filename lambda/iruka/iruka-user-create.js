const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand,UpdateItemCommand, ProjectionType } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "iruka-user";

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  // TODO: リクエストボディの中身をJavaScriptオブジェクトに変換し、1つ、あるいは複数の変数に代入する
  const {userName,password}=JSON.parse(event.body);
  
    //バリデーション
  if (!userName || !password){
    response.statusCode=400;
    response.body=JSON.stringify({
      message: "Invalid request. Required parameters are not set in request body."
    })
    return response;
  }

  try {
    userId=await getNextUserId();
    frequency=await generateUniqueFrequency();
  // TODO: DBに登録するための情報をparamオブジェクトとして宣言する（中身を記述）
    const param = {
      TableName,
      Item:marshall({
        userId,
        userName,
        password,
        frequency
    })
  };
  
  // DBにデータを登録するコマンドを用意
    const command = new PutItemCommand(param);
    // client.send()でDBにデータを登録するコマンドを実行
    await client.send(command);
    // TODO: 登録に成功した場合の処理を記載する。(status codeの設定と、response bodyの設定)
    response.statusCode=201;
    response.body=JSON.stringify({userId,userName,frequency});
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
const getNextUserId = async () => {
  const param = {
    TableName: TableName,
    Key: marshall({ userId:0 }), // 一意なキーを使用
    UpdateExpression: "SET #counter = if_not_exists(#counter, :start) + :increment",
    ExpressionAttributeNames: {
      "#counter": "counter",
    },
    ExpressionAttributeValues: {
      ":increment": { N: "1" }, // 1ずつインクリメント
      ":start": { N: "1" },     // 初期値が無ければ1からスタート
    },
    ReturnValues: "UPDATED_NEW", // 更新後の値を返す
  };

  try {
    const updateCommand = new UpdateItemCommand(param);
    const result = await client.send(updateCommand);

    console.log("test");
    // カウンター値が存在し、数値型として正しく返っているかチェック
    const nextId = parseInt(result.Attributes.counter.N, 10);
    if (isNaN(nextId)) {
      throw new Error("Invalid counter value (NaN)");
    }
    return nextId;
  } catch (error) {
    console.error("Error incrementing userId:", error);
    throw new Error("Could not retrieve next userId");
  }
};

const generateUniqueFrequency=async()=>{
  const minFrequency=20000;
  const maxFrequency=100000;
  const frequencyStep=100;

  const scanParams={
    TableName,
    ProjectionExpression:"frequency",
  }

  const scanCommand=new ScanCommand(scanParams);
  const scanResult=await client.send(scanCommand);

  const usedFrequencies=scanResult.Items.map(item=>unmarshall(item).frequency);

  let frequency;

  for(let i=minFrequency;i<=maxFrequency;i+=frequencyStep){
    if(!usedFrequencies.includes(i)){
      frequency=i;
      break;
    }
  }

  if(!frequency){
    throw new Error("Frequency is already used");
  }
  
  return frequency;
}