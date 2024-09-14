const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
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
  // TODO: query()に渡すパラムを宣言
  const param = {
    TableName,
    //キー、インデックスによる検索の定義
    KeyConditionExpression: "userName=:userName",
    //プライマリーキー以外の属性でのフィルタ;
    FilterExpression: "password=:pkey",
    //検索値のプレースホルダの定義
    ExpressionAttributeValues: marshall({
      ":userName": userName,
      ":pkey": password,
    }),
  };
  // console.log(body);
  // userIdとpasswordが一致するデータを検索するコマンドを用意
  const command = new QueryCommand(param);
  try {
    // client.send()の実行でuserIdとpasswordが一致するデータの検索
    const res = await client.send(command);
    
    //TODO: 該当するデータが見つからない場合の処理を記述(ヒント：resの中には個数のプロパティが入っています。)
    if(res.Items==0){
      throw new Error("do not match pass or email");
    }
    // response.body=JSON.stringify(res);
    //TODO: 認証が成功した場合のレスポンスボディを設定する。
    response.body=JSON.stringify({token:"iruka"});
    
    return response
    // if(event.headers.authorization!=="fit"){
    //   response.statusCode=401;
    //   response.body=JSON.stringify({
    //     message:"Invalid request header"
    //   });
    //   return response;
    // }
    
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
