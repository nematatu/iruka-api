const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const TableName = "BeyondTraining";

export const handler = async (event, context) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ message: "" }),
  };

  const param = { TableName };

  const command = new ScanCommand(param);

  try {
    // 全トレーニングを取得
    const trainings = (await client.send(command)).Items;

    if (!trainings) {
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: "トレーニングが見つかりません。",
      });
      return response;
    }

    // 現在の時刻を取得 (秒単位で取得)
    const currentTime = Math.floor(Date.now() / 1000);

    // 開始時間が現在時刻よりも後のトレーニングをフィルタリング
    const unmarshalledTrainingsItems = trainings
      .map((item) => unmarshall(item))
      .filter((training) => training.start && training.start > currentTime);

    response.body = JSON.stringify({ Trainings: unmarshalledTrainingsItems });
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