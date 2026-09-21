import {
  Endpoint,
  Consumer,
  Dependency,
  AnalysisResult,
  RiskLevel,
  TrafficEvidence,
  RISK_LEVEL_THRESHOLDS,
} from "./types";

function trafficRisk(endpoint: Endpoint): number {
  if (endpoint.requestCount === 0) return 0;
  if (endpoint.requestCount < 100) return 10;
  if (endpoint.requestCount < 1000) return 20;
  if (endpoint.requestCount < 10000) return 30;
  if (endpoint.requestCount < 50000) return 40;
  if (endpoint.requestCount < 100000) return 50;
  if (endpoint.requestCount < 500000) return 60;
  return 70;
}

function consumerRisk(endpoint: Endpoint): number {
  const count = endpoint.consumerIds.length;
  if (count === 0) return 0;
  if (count === 1) return 20;
  if (count === 2) return 30;
  if (count === 3) return 40;
  if (count <= 5) return 50;
  if (count <= 10) return 60;
  return 70;
}

function recencyRisk(endpoint: Endpoint): number {
  const lastUsed = new Date(endpoint.lastUsedAt).getTime();
  const now = Date.now();
  const daysSince = (now - lastUsed) / (1000 * 60 * 60 * 24);
  if (daysSince < 1) return 25;
  if (daysSince < 7) return 20;
  if (daysSince < 30) return 15;
  if (daysSince < 90) return 10;
  if (daysSince < 180) return 5;
  if (daysSince < 365) return 3;
  return 0;
}

function dependencyRisk(endpoint: Endpoint, allDependencies: Dependency[]): number {
  const downstream = allDependencies.filter((d) => d.fromEndpointId === endpoint.id);
  if (downstream.length === 0) return 0;
  if (downstream.length === 1) return 15;
  if (downstream.length <= 3) return 25;
  return 35;
}

function externalConsumerRisk(endpoint: Endpoint, consumers: Consumer[]): number {
  const hasExternal = endpoint.consumerIds.some((cid) => {
    const c = consumers.find((c) => c.id === cid);
    return c?.type === "external" || c?.type === "third-party";
  });
  if (hasExternal) return 30;
  return 0;
}

export function calculateRiskScore(
  endpoint: Endpoint,
  allDependencies: Dependency[],
  consumers: Consumer[]
): number {
  const raw =
    trafficRisk(endpoint) +
    consumerRisk(endpoint) +
    recencyRisk(endpoint) +
    dependencyRisk(endpoint, allDependencies) +
    externalConsumerRisk(endpoint, consumers);
  return Math.min(Math.round(raw), 100);
}

export function scoreToRiskLevel(score: number): RiskLevel {
  const [, medHigh] = RISK_LEVEL_THRESHOLDS.MEDIUM;
  const [, highHigh] = RISK_LEVEL_THRESHOLDS.HIGH;
  if (score < RISK_LEVEL_THRESHOLDS.MEDIUM[0]) return "LOW";
  if (score <= medHigh) return "MEDIUM";
  if (score <= highHigh) return "HIGH";
  return "CRITICAL";
}

export function classifyStatus(): void {
  // Status is stored on the endpoint and set during demo generation
}

export function analyzeDeleteSafety(
  endpoint: Endpoint,
  consumers: Consumer[],
  allDependencies: Dependency[]
): AnalysisResult {
  const score = calculateRiskScore(endpoint, allDependencies, consumers);
  const level = scoreToRiskLevel(score);

  const reasons: string[] = [];
  const concerns: string[] = [];
  const recommendation: string[] = [];

  const trafficEvidence: TrafficEvidence = {
    totalRequests: endpoint.requestCount,
    requestsLast90Days: endpoint.requestCount > 0 ? Math.floor(endpoint.requestCount * 0.15) : 0,
    requestsLast30Days: endpoint.requestCount > 0 ? Math.floor(endpoint.requestCount * 0.04) : 0,
    uniqueConsumers: endpoint.consumerIds.length,
    trafficTrend: 0,
    lastUsedAt: endpoint.lastUsedAt,
  };

  if (endpoint.requestCount === 0) {
    reasons.push("0 requests in the last 90 days");
  } else if (endpoint.requestCount < 100) {
    reasons.push(`Only ${endpoint.requestCount.toLocaleString()} requests total`);
  } else {
    reasons.push(`${endpoint.requestCount.toLocaleString()} requests total`);
  }

  if (endpoint.consumerIds.length === 0) {
    reasons.push("0 known consumers");
  } else {
    reasons.push(`${endpoint.consumerIds.length} known consumer(s)`);
  }

  if (endpoint.status === "DEPRECATED") {
    const depDays = endpoint.deprecationDate
      ? Math.floor((Date.now() - new Date(endpoint.deprecationDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    reasons.push(`Deprecated ${depDays > 0 ? `${depDays} days ago` : "recently"}`);
  }

  const downstream = allDependencies.filter((d) => d.fromEndpointId === endpoint.id);
  if (downstream.length === 0) {
    reasons.push("No downstream dependencies detected");
  } else {
    reasons.push(`${downstream.length} downstream dependency/dependencies`);
  }

  if (endpoint.documentationStatus === "MISSING") {
    concerns.push("Endpoint has no documentation");
  }

  if (endpoint.consumerIds.some((cid) => {
    const c = consumers.find((c) => c.id === cid);
    return c?.type === "external" || c?.type === "third-party";
  })) {
    concerns.push("External consumers cannot be ruled out from the provided traffic data.");
  }

  if (score >= 80) {
    concerns.push("CRITICAL risk level — extremely high blast radius.");
  } else if (score >= 60) {
    concerns.push("HIGH risk level — significant impact if removed.");
  }

  const verdict: AnalysisResult["verdict"] =
    score < 30 ? "SAFE" : score < 60 ? "REVIEW" : "DO_NOT_DELETE";

  switch (verdict) {
    case "SAFE":
      recommendation.push("Candidate for deprecation/removal.");
      recommendation.push("Suggested next step:");
      recommendation.push("1. Announce deprecation to consumers");
      recommendation.push("2. Monitor traffic for 14 days");
      recommendation.push("3. Remove endpoint");
      recommendation.push("4. Monitor error rate for 7 days");
      break;
    case "REVIEW":
      recommendation.push("Requires review before removal.");
      recommendation.push("Suggested next step:");
      recommendation.push("1. Notify all known consumers");
      recommendation.push("2. Provide migration timeline");
      recommendation.push("3. Deprecate with 90-day sunset");
      recommendation.push("4. Re-analyze after deprecation period");
      break;
    case "DO_NOT_DELETE":
      recommendation.push("DO NOT DELETE — high blast radius detected.");
      recommendation.push("Suggested next step:");
      recommendation.push("1. Document all consumers and dependencies");
      recommendation.push("2. Plan migration path for each consumer");
      recommendation.push("3. Maintain endpoint until all consumers migrated");
      recommendation.push("4. Schedule review in 30 days");
      break;
  }

  const affectedConsumers = endpoint.consumerIds
    .map((cid) => consumers.find((c) => c.id === cid))
    .filter(Boolean) as Consumer[];

  return {
    endpointId: endpoint.id,
    verdict,
    riskScore: score,
    riskLevel: level,
    reasons,
    concerns,
    affectedConsumers,
    trafficEvidence,
    dependencies: downstream,
    recommendation,
  };
}
