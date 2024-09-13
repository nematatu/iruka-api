const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
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

  // リクエストボディからemailを取得
  const requestBody = JSON.parse(event.body);
  const { email } = requestBody;

  if (!email) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: "email is required.",
    });
    return response;
  }

  const param = {
    TableName,
  };

  const command = new ScanCommand(param);

  try {
    // 全件スキャンを実行
    const result = await client.send(command);
    const recommends = result.Items;

    if (!recommends || recommends.length === 0) {
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: "No data found.",
      });
      return response;
    }

    // emailでフィルタリング
    const filteredItems = recommends
      .map((item) => unmarshall(item))
      .filter((item) => item.email === email);

    if (filteredItems.length === 0) {
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: "No data found for this email.",
      });
      return response;
    }

    // 最新30件を取得
    const sortedItems = filteredItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);

    // 各属性の変動を分析
    const attributes = ["hot", "cool", "waist", "irritation", "dizziness", "bless"];
    const attributeIncreases = {};  // 増加回数を格納
    const attributeData = {};  // 各属性のデータを格納

    attributes.forEach((attr) => {
      attributeData[attr] = sortedItems.map((item) => item[attr] || 0);
    });

    // 各属性の増加回数を計算
    attributes.forEach((attr) => {
      const data = attributeData[attr];
      let increaseCount = 0;

      for (let i = 1; i < data.length; i++) {
        if (data[i] > data[i - 1]) {
          increaseCount++;
        }
      }

      // 各属性の増加回数を保存
      attributeIncreases[attr] = increaseCount;
    });

    // 増加傾向の順にランキング作成
    const ranking = Object.entries(attributeIncreases)
      .sort((a, b) => b[1] - a[1])  // 増加回数が多い順にソート
      .map(([key]) => key);

    // レスポンスにランキングと属性データを設定
    response.body = JSON.stringify({
      ranking,
      attributeData,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "An unexpected error occurred.",
      errorDetail: e.toString(),
    });
  }

  return response;
};