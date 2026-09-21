const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

function computeRisk(ep) {
  let score = 0;

  // Status weight
  if (ep.status === "AT_RISK") score += 40;
  else if (ep.status === "DEPRECATED") score += 25;
  else if (ep.status === "UNUSED") score += 15;

  // Undocumented risk
  if (ep.documentationStatus === "UNDOCUMENTED") score += 20;

  // Consumer blast radius
  const consumers = ep.consumerIds ? ep.consumerIds.length : 0;
  if (consumers > 5) score += 30;
  else if (consumers > 0) score += consumers * 5;

  // Clamp 0-100
  score = Math.min(100, Math.max(0, score));

  let level = "LOW";
  if (score >= 80) level = "CRITICAL";
  else if (score >= 60) level = "HIGH";
  else if (score >= 35) level = "MEDIUM";

  return { score, level };
}

exports.handler = async (event) => {
  const projectId = event.pathParameters?.projectId;
  if (!projectId) {
    return response(400, { error: "Missing projectId" });
  }

  try {
    const endpointsTable = process.env.ENDPOINTS_TABLE || "api-cemetery-endpoints";
    const endpointsResult = await docClient.send(
      new QueryCommand({
        TableName: endpointsTable,
        IndexName: "ProjectIndex",
        KeyConditionExpression: "projectId = :pid",
        ExpressionAttributeValues: { ":pid": projectId }
      })
    );

    const endpoints = endpointsResult.Items || [];
    const updated = [];

    for (const ep of endpoints) {
      const { score, level } = computeRisk(ep);
      await docClient.send(
        new UpdateCommand({
          TableName: endpointsTable,
          Key: { id: ep.id },
          UpdateExpression: "SET riskScore = :s, riskLevel = :l",
          ExpressionAttributeValues: { ":s": score, ":l": level }
        })
      );
      updated.push({ id: ep.id, path: ep.path, riskScore: score, riskLevel: level });
    }

    return response(200, {
      message: "Analysis completed successfully",
      analyzedCount: updated.length,
      results: updated
    });
  } catch (err) {
    console.error("Analysis failed:", err);
    return response(500, { error: "Analysis failed: " + err.message });
  }
};
