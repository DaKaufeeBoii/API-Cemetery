const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const endpointId = event.pathParameters?.endpointId;
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

    const endpoint = result.Item;
    if (!endpoint) {
      return response(404, { error: "Endpoint not found" });
    }

    // Determine safety
    const consumerCount = endpoint.consumerIds ? endpoint.consumerIds.length : 0;
    const requestCount = endpoint.requestCount || 0;

    let verdict = "SAFE";
    let reasons = [];
    let recommendations = [];

    if (consumerCount > 0) {
      verdict = "DO_NOT_DELETE";
      reasons.push(`Endpoint has ${consumerCount} active consumer services.`);
      recommendations.push("Migrate all consuming services before deleting.");
    }

    if (requestCount > 1000) {
      verdict = "DO_NOT_DELETE";
      reasons.push(`High traffic volume detected (${requestCount} requests).`);
      recommendations.push("Implement a 90-day deprecation notice with 410 Gone simulation.");
    } else if (requestCount > 0 && verdict !== "DO_NOT_DELETE") {
      verdict = "REVIEW";
      reasons.push(`Low background traffic detected (${requestCount} requests).`);
      recommendations.push("Audit incoming traffic logs to identify callers.");
    }

    if (verdict === "SAFE") {
      reasons.push("Zero detected consumers and zero recent request traffic.");
      recommendations.push("Create a backup OpenAPI specification snapshot before removal.");
      recommendations.push("Safe to remove from API gateway routing tables.");
    }

    const analysis = {
      endpointId,
      path: endpoint.path,
      method: endpoint.method,
      verdict,
      reasons,
      recommendations,
      analyzedAt: new Date().toISOString()
    };

    return response(200, analysis);
  } catch (err) {
    console.error("Delete analysis failed:", err);
    return response(500, { error: "Delete analysis failed: " + err.message });
  }
};
