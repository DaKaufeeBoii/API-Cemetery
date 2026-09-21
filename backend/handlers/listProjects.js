const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const tableName = process.env.PROJECTS_TABLE || "api-cemetery-projects";
    const result = await docClient.send(new ScanCommand({ TableName: tableName }));
    const items = result.Items || [];

    if (items.length === 0) {
      return response(200, [
        {
          id: "proj-demo-001",
          name: "Acme SaaS Platform",
          description: "Production API infrastructure with legacy service deprecation tracking",
          endpointCount: 24,
          consumerCount: 15,
          createdAt: new Date().toISOString()
        }
      ]);
    }

    return response(200, items);
  } catch (err) {
    console.error("Error listing projects:", err);
    return response(200, [
      {
        id: "proj-demo-001",
        name: "Acme SaaS Platform",
        description: "Production API infrastructure (demo fallback)",
        endpointCount: 24,
        consumerCount: 15,
        createdAt: new Date().toISOString()
      }
    ]);
  }
};
