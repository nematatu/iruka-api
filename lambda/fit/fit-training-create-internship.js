const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondTraining";
const CounterTableName = "TrainingIdCounter"; // trainingIdを管理するテーブル

exports.handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  // リクエストボディから各項目を取得
  const { title, description, date, time, menoCategory, category, trainerName, zoomUrl } = JSON.parse(event.body);

  // 文字列をパースしてDateオブジェクトを作成
  const startTimeDate = new Date(
    date.replace("年", "/")
        .replace("月", "/")
        .replace("日", " ")
        .replace("時", ":")
        .replace("分", "")
  );

  // トレーニング開始時刻をUnixタイムスタンプ(ミリ秒単位)に変換
  const start = startTimeDate.getTime();

  // トレーニングの終了時刻を計算 (ミリ秒に変換するために * 60000)
  const end = start + time * 60000;

  let trainingId;

  try {
    // trainingIdをインクリメントして取得
    trainingId = await getNextTrainingId();

    // BeyondTrainingテーブルに登録するためのパラメータ
    const param = {
      TableName,
      Item: marshall({
        trainingId,
        title,
        description,
        start,
        end,
        category,
        trainerName,
        zoomUrl,
        menoCategory
      })
    };

    // DBにデータを登録するコマンドを用意
    const putCommand = new PutItemCommand(param);

    // DBにデータを登録するコマンドを実行
    await client.send(putCommand);

    // 登録成功のレスポンス
    response.statusCode = 201;
    response.body = JSON.stringify({
      trainingId,
      title,
      description,
      start,
      end,
      category,
      trainerName,
      zoomUrl,
      menoCategory
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

// 次のtrainingIdを取得してインクリメントするための関数
const getNextTrainingId = async () => {
  const param = {
    TableName: CounterTableName,
    Key: marshall({ id: "trainingId" }), // 一意なキーを使用
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

    // カウンター値が存在し、数値型として正しく返っているかチェック
    const nextId = parseInt(result.Attributes.counter.N, 10);
    if (isNaN(nextId)) {
      throw new Error("Invalid counter value (NaN)");
    }
    return nextId;
  } catch (error) {
    console.error("Error incrementing trainingId:", error);
    throw new Error("Could not retrieve next trainingId");
  }
};
