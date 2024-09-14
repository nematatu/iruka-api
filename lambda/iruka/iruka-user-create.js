const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand,UpdateItemCommand, ProjectionType } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const userTableName = "iruka-user";
// const IDTableName = "iruka-userName-userId";

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
    const userExists=await checkUserNameExists(userName);
    if(userExists){
      response.statusCode=400;
      response.body=JSON.stringify({
        message:"User already exists"
      })
      return response;
    }

    const userId=await generateUniqueUserId();
  // TODO: DBに登録するための情報をparamオブジェクトとして宣言する（中身を記述）
    const userparam = {
      TableName:userTableName,
      Item:marshall({
        userId,
        userName,
        password
      })
  };

//   userId=await getNextUserId();
//   const userIdparam = {
//     TableName:IDTableName,
//     Item:marshall({
//       userId,
//       userName
//     })
// };

  //key:DI52JYB6QqyPfVYy4NW3XQV8s
  //secret:D1HeKJ1v2cK1DirUUVatJA4t4P81BO4KvYqDlVB6vPKj0qHMNG

  //accessToken:1639312054757789696-u3eLYSEoEukfj3h8c5QUXTieTvWSTI
  //accessTokenSecret:Yz6TEs1A3Ki2e86Cy3Z5ZxYHvesecl4FPBgJUNgBSxhCy
  
  //bearerToken:AAAAAAAAAAAAAAAAAAAAACnbsQEAAAAAaTUvJMX4n4cghc8DxXriRSUl4Zw%3DvCCepLVLwroynSGYVC8OUtA46iRmzgeOuvum5aLb9clRdIxM2G
  // DBにデータを登録するコマンドを用意
    const usercommand = new PutItemCommand(userparam);
    // client.send()でDBにデータを登録するコマンドを実行
    await client.send(usercommand);


    // const userIdcommand = new PutItemCommand(userIdparam);
    // // client.send()でDBにデータを登録するコマンドを実行
    // await client.send(userIdcommand);


    // TODO: 登録に成功した場合の処理を記載する。(status codeの設定と、response bodyの設定)
    response.statusCode=201;
    response.body=JSON.stringify({userName,userId});
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

const checkUserNameExists=async(userName)=>{
  const params={
    TableName:userTableName,
    Key:marshall({userName})
  };

  try{
    const {Item}=await client.send(new GetItemCommand(params));
    return Item!==undefined;
  }catch(e){
    console.error(e);
    throw new Error("Could not check if userName exists");
  }
}

// const getNextUserId = async () => {
//   const param = {
//     TableName: IDTableName,
//     Key: marshall({ userId:1 }), // 一意なキーを使用
//     UpdateExpression: "SET #counter = if_not_exists(#counter, :start) + :increment",
//     ExpressionAttributeNames: {
//       "#counter": "counter",
//     },
//     ExpressionAttributeValues: {
//       ":increment": { N: "1" }, // 1ずつインクリメント
//       ":start": { N: "1" },     // 初期値が無ければ1からスタート
//     },
//     ReturnValues: "UPDATED_NEW", // 更新後の値を返す
//   };

//   try {
//     const updateCommand = new UpdateItemCommand(param);
//     const result = await client.send(updateCommand);

//     console.log("test");
//     // カウンター値が存在し、数値型として正しく返っているかチェック
//     const nextId = parseInt(result.Attributes.counter.N, 10);
//     if (isNaN(nextId)) {
//       throw new Error("Invalid counter value (NaN)");
//     }
//     return nextId;
//   } catch (error) {
//     console.error("Error incrementing userId:", error);
//     throw new Error("Could not retrieve next userId");
//   }
// };

const generateUniqueUserId=async()=>{
  const minUserId=2;
  const maxUserId=1000;

  const scanParams={
    TableName:userTableName,
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