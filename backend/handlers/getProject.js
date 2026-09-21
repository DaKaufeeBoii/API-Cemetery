const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const projectId = event.pathParameters?.projectId;
  if (!projectId) {
    return response(400, { error: "Missing projectId" });
  }

  try {
    const tableName = process.env.PROJECTS_TABLE || "api-cemetery-projects";
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id: projectId }
      })
    );

    if (!result.Item) {
      // Demo fallback if requesting demo project
      if (projectId === "proj-demo-001") {
        return response(200, {
          id: "proj-demo-001",
          name: "Acme SaaS Platform",
          description: "Production API infrastructure with legacy service deprecation tracking",
          endpointCount: 24,
          consumerCount: 15,
          createdAt: new Date().toISOString()
        });
      }
      return response(404, { error: "Project not found" });
    }

    return response(200, result.Item);
  } catch (err) {
    console.error("Error getting project:", err);
    return response(500, { error: "Internal server error" });
  }
};
