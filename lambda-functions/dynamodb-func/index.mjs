import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const putToDynamoDb = async ({ table, payload }) => {
    console.log(payload);
    const client = new DynamoDBClient({});
    const command = new PutItemCommand({
            TableName: table,
            Item: payload
      });
    return await client.send(command);
};
// Main Lambda entry point
export const handler = async (event) => {
  return await processPayload(event)
}

const processPayload = async function(event) {
    const requestBody = JSON.parse(event.body);

    const TABLE = "fovus-files-table";
    const payload = requestBody;
    console.log(payload)
    let dbResponse = await putToDynamoDb({table: TABLE, payload:payload});

  return new Promise((resolve, reject) => {
    console.log("Here - ", dbResponse);
    resolve({
      "statusCode": 200,
      "isBase64Encoded": false,
      headers: {
        "Access-Control-Allow-Headers" : "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
    },
      "body": JSON.stringify({
          "message": dbResponse,
      })
    })
  })
}