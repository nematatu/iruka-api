const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondPost";

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };
  
  // const userId = event.queryStringParameters.userId;
  // const start = event.queryStringParameters.start;
  // const end = event.queryStringParameters.end;
  // const category = event.queryStringParameters.category;
  
// const { userId = "", start = "0", end = "9999999999999", category = "" } = event.queryStringParameters || {};
  
//     const token = event.headers?.authorization;

//   // トークンの存在確認（ここでは簡単なチェックを実施）
//   if (!token) {
//     response.statusCode = 401; // Unauthorized
//     response.body = JSON.stringify({
//       message: "Unauthorized: Token is missing."
//     });
//     return response;
//   }
  //TODO: 取得対象のテーブル名をparamに宣言
  const param = {TableName, Limit: 100};

  const command = new ScanCommand(param);

  try {
    // client.send()で全件取得するコマンドを実行
    const posts = (await client.send(command)).Items;
    
    if(!posts){
      response.statusCode=404;
      response.body=JSON.stringify({
        message:"article not found."
      })
    }
    
    const unmarshalledPostsItems=posts.map((item)=>unmarshall(item));
    
    // const filteredArticles = unmarshalledArticlesItems.filter((e) => {
    
    //   const matchUserId = userId ? e.userId?.match(userId) : true

    //   const withinTimeRange = (start ? e.timestamp >= start : true) && (end ? e.timestamp <= end : true)
        
    //   const matchCategory =  category ? e.category?.match(category) : true

    //   return matchUserId && withinTimeRange && matchCategory
    // })
    
    response.body=JSON.stringify({posts: unmarshalledPostsItems});
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
