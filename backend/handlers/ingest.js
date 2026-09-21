const { response } = require("./response");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({});

exports.handler = async (event) => {
  const projectId = event.pathParameters?.projectId;
  if (!projectId) {
    return response(400, { error: "Missing projectId" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return response(400, { error: "Invalid JSON body" });
  }

  const { type, openApiSpec, logs, endpoints } = payload;
  const ingestionId = `ingest-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  try {
    // 1. Archive raw payload to S3 if configured
    if (process.env.S3_BUCKET) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: `ingestions/${projectId}/${ingestionId}.json`,
          Body: JSON.stringify(payload),
          ContentType: "application/json"
        })
      );
    }

    let parsedEndpoints = [];

    // Parse OpenAPI Spec
    if (openApiSpec && openApiSpec.paths) {
      for (const [path, methods] of Object.entries(openApiSpec.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          if (["get", "post", "put", "delete", "patch", "head", "options"].includes(method.toLowerCase())) {
            parsedEndpoints.push({
              id: `ep-${crypto.randomBytes(6).toString("hex")}`,
              projectId,
              path,
              method: method.toUpperCase(),
              service: (details.tags && details.tags[0]) || "default",
              description: details.summary || details.description || "Ingested from OpenAPI",
              status: "ACTIVE",
              documentationStatus: "DOCUMENTED",
              requestCount: 0,
              errorRate: 0,
              consumerIds: [],
              riskScore: 10,
              riskLevel: "LOW",
              lastUsedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    } else if (Array.isArray(endpoints)) {
      parsedEndpoints = endpoints.map((ep) => ({
        ...ep,
        id: ep.id || `ep-${crypto.randomBytes(6).toString("hex")}`,
        projectId,
        createdAt: ep.createdAt || new Date().toISOString()
      }));
    }

    // Write to DynamoDB in chunks if any endpoints were parsed
    const endpointsTable = process.env.ENDPOINTS_TABLE || "api-cemetery-endpoints";
    if (parsedEndpoints.length > 0) {
      for (let i = 0; i < parsedEndpoints.length; i += 25) {
        const chunk = parsedEndpoints.slice(i, i + 25);
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [endpointsTable]: chunk.map((item) => ({
                PutRequest: { Item: item }
              }))
            }
          })
        );
      }
    }

    return response(200, {
      message: "Ingestion completed successfully",
      ingestionId,
      endpointCount: parsedEndpoints.length,
      endpoints: parsedEndpoints
    });
  } catch (err) {
    console.error("Ingestion failed:", err);
    return response(500, { error: "Ingestion processing failed: " + err.message });
  }
};
