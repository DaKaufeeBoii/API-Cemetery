const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { projectId, endpointId } = event.pathParameters || {};
  if (!endpointId) {
    return response(400, { error: "Missing endpointId" });
  }

  try {
    const endpointsTable = process.env.ENDPOINTS_TABLE || "api-cemetery-endpoints";
    const result = await docClient.send(
      new GetCommand({
        TableName: endpointsTable,
        Key: { id: endpointId }
      })
    );

    if (!result.Item) {
      return response(404, { error: "Endpoint not found" });
    }

    return response(200, result.Item);
  } catch (err) {
    console.error("Error getting endpoint:", err);
    return response(500, { error: "Internal server error" });
  }
};
