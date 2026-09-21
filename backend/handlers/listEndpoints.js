const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const projectId = event.pathParameters?.projectId;
  if (!projectId) {
    return response(400, { error: "Missing projectId" });
  }

  try {
    const tableName = process.env.ENDPOINTS_TABLE || "api-cemetery-endpoints";
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "ProjectIndex",
        KeyConditionExpression: "projectId = :pid",
        ExpressionAttributeValues: { ":pid": projectId }
      })
    );

    return response(200, result.Items || []);
  } catch (err) {
    console.error("Error listing endpoints:", err);
    return response(500, { error: "Internal server error" });
  }
};
