const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
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

  const { email, trainingId } = JSON.parse(event.body);

  const updateParams = {
    TableName,
    Key: marshall({ email }),
    UpdateExpression: "SET #trainingIds = list_append(if_not_exists(#trainingIds, :emptyList), :newTrainingId)",
    ExpressionAttributeNames: {
      "#trainingIds": "trainingIds"
    },
    ExpressionAttributeValues: marshall({
      ":newTrainingId": [trainingId],
      ":emptyList": []
    }),
    ReturnValues: "ALL_NEW"
  };

  try {
    const updateCommand = new UpdateItemCommand(updateParams);
    const result = await client.send(updateCommand);
    response.statusCode = 200;
    response.body = JSON.stringify(result.Attributes);
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