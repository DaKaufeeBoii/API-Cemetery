import {
  Endpoint,
  Consumer,
  Dependency,
  Project,
  HttpMethod,
  ApiStatus,
  DocumentationStatus,
} from "./types";
import { calculateRiskScore, scoreToRiskLevel } from "./riskEngine";

const SERVICES = [
  "users",
  "orders",
  "payments",
  "inventory",
  "reports",
  "notifications",
  "auth",
  "billing",
  "search",
  "analytics",
];

const CONSUMER_NAMES = [
  "web-app",
  "mobile-app",
  "billing-service",
  "analytics-worker",
  "admin-panel",
  "notification-service",
  "search-indexer",
  "report-generator",
  "third-party-partner-api",
  "mobile-bff",
  "webhook-relay",
  "email-worker",
  "sms-gateway",
  "crm-sync",
  "erp-connector",
  "inventory-manager",
  "fraud-detector",
  "loyalty-engine",
  "review-service",
  "notification-aggregator",
  "audit-logger",
  "data-warehouse",
  "ab-testing-service",
  "feature-flag-service",
  "rate-limiter",
  "api-gateway-monitor",
  "session-store",
  "cache-warmer",
  "subscription-manager",
  "payment-orchestrator",
  "shipping-calculator",
  "tax-calculator",
];

const DESCRIPTIONS: Record<string, string[]> = {
  users: ["Retrieve user profile by ID", "List all users", "Create new user account", "Update user settings", "Delete user account", "Authenticate user session", "Get user preferences", "Search users by criteria"],
  orders: ["Get order details", "Create order", "Update order status", "List all orders", "Cancel order", "Get order history", "Refund order", "Track order shipment"],
  payments: ["Process payment", "Refund payment", "Get payment status", "List payments", "Authorize payment", "Capture authorized payment", "Void pending payment", "Get transaction history"],
  inventory: ["Check stock levels", "Update inventory count", "Reserve inventory for order", "Get product stock", "Adjust inventory", "List warehouse stock", "Low stock alerts", "Transfer inventory between warehouses"],
  reports: ["Generate sales report", "Get usage analytics report", "Export report as PDF", "Schedule report generation", "View report template", "Create custom report", "Get report generation status", "List available reports"],
  notifications: ["Send notification to user", "List user notifications", "Get notification preferences", "Update notification settings", "Delete notification", "Bulk send notifications", "Get notification history", "Preview notification payload"],
  auth: ["Authenticate user credentials", "Refresh authentication token", "Revoke user session", "List active sessions", "Change user password", "Verify email address", "Reset password", "Get user permissions"],
  billing: ["Generate invoice", "List invoices", "Pay invoice", "Update billing information", "Get subscription details", "Change subscription plan", "Cancel subscription", "Get trial status"],
  search: ["Search products catalog", "Search orders", "Search users", "Get search suggestions", "Index document for search", "Remove document from index", "Get search metrics", "Reindex full catalog"],
  analytics: ["Track analytics event", "Get event metrics", "Aggregate analytics data", "Get funnel conversion data", "List tracked events", "Export analytics data", "Create analytics dashboard", "Get realtime stats"],
};

const TAGS_BY_STATUS: Record<string, string[]> = {
  ACTIVE: ["core", "v1"],
  LOW_TRAFFIC: ["legacy", "v1"],
  UNUSED: ["deprecated", "v1"],
  DEPRECATED: ["deprecated", "sunset"],
  UNDOCUMENTED: ["internal", "undocumented"],
  AT_RISK: ["experimental", "v2-beta"],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateConsumers(count: number): Consumer[] {
  const consumers: Consumer[] = [];
  for (let i = 0; i < count; i++) {
    let type: Consumer["type"] = "internal";
    if (i >= count - 3) type = "external";
    else if (i >= count - 6) type = "third-party";

    consumers.push({
      id: `consumer-${i}`,
      name: CONSUMER_NAMES[i],
      type,
      description:
        type === "external"
          ? "External partner integration"
          : type === "third-party"
          ? "Third-party service"
          : "Internal microservice",
    });
  }
  return consumers;
}

function generateEndpointsForService(
  service: string,
  serviceIdx: number,
  now: number
): Endpoint[] {
  const descs = DESCRIPTIONS[service] || ["API endpoint"];
  const endpoints: Endpoint[] = [];
  const methods: HttpMethod[] = ["GET", "GET", "GET", "POST", "PUT", "PATCH", "DELETE"];
  const numEndpoints = randInt(6, 14);

  for (let i = 0; i < numEndpoints; i++) {
    const method = methods[i % methods.length];
    const desc = descs[i % descs.length];
    const path = `/${service}/${
      i === 0
        ? "{id}"
        : i < 3
        ? "list"
        : desc.toLowerCase().replace(/\s+/g, "-")
    }`;
    const statusRoll = Math.random();
    let status: ApiStatus;
    if (statusRoll < 0.35) status = "ACTIVE";
    else if (statusRoll < 0.50) status = "LOW_TRAFFIC";
    else if (statusRoll < 0.60) status = "UNUSED";
    else if (statusRoll < 0.72) status = "DEPRECATED";
    else if (statusRoll < 0.85) status = "UNDOCUMENTED";
    else status = "AT_RISK";

    const docRoll = Math.random();
    let docStatus: DocumentationStatus;
    if (docRoll < 0.7) docStatus = "DOCUMENTED";
    else if (docRoll < 0.85) docStatus = "PARTIAL";
    else docStatus = "MISSING";

    let requests = 0;
    let lastUsed = new Date(now - randInt(1, 365) * 24 * 60 * 60 * 1000).toISOString();
    if (status === "ACTIVE") {
      requests = randInt(50000, 500000);
      lastUsed = new Date(now - randInt(1, 60) * 60 * 1000).toISOString();
    } else if (status === "LOW_TRAFFIC") {
      requests = randInt(50, 5000);
      lastUsed = new Date(now - randInt(5, 90) * 24 * 60 * 60 * 1000).toISOString();
    } else if (status === "UNUSED") {
      requests = randInt(0, 10);
      lastUsed = new Date(now - randInt(90, 800) * 24 * 60 * 60 * 1000).toISOString();
    } else if (status === "DEPRECATED") {
      requests = randInt(0, 5000);
      lastUsed = new Date(now - randInt(30, 500) * 24 * 60 * 60 * 1000).toISOString();
    } else if (status === "UNDOCUMENTED") {
      requests = randInt(100, 50000);
      lastUsed = new Date(now - randInt(1, 60) * 24 * 60 * 60 * 1000).toISOString();
    } else if (status === "AT_RISK") {
      requests = randInt(1000, 100000);
      lastUsed = new Date(now - randInt(10, 120) * 24 * 60 * 60 * 1000).toISOString();
    }


    const deprecationDate =
      status === "DEPRECATED"
        ? new Date(now - randInt(30, 400) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    endpoints.push({
      id: `ep-${serviceIdx}-${i}`,
      projectId: "",
      method,
      path,
      service,
      description: desc,
      status,
      requestCount: requests,
      lastUsedAt: lastUsed,
      consumerIds: [],
      riskScore: 0,
      riskLevel: "LOW",
      documentationStatus: docStatus,
      deprecationDate,
      tags: TAGS_BY_STATUS[status] || ["v1"],
      version: "v1",
    });
  }
  return endpoints;
}

export function generateDemoData(): {
  project: Project;
  endpoints: Endpoint[];
  consumers: Consumer[];
  dependencies: Dependency[];
} {
  const now = Date.now();
  const projectId = "proj-demo-001";
  const project: Project = {
    id: projectId,
    name: "Acme SaaS Platform",
    description: "Production API surface for Acme SaaS Platform",
    createdAt: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
    endpointCount: 0,
    consumerCount: 0,
  };

  const consumers = generateConsumers(CONSUMER_NAMES.length);
  const allEndpoints = SERVICES.flatMap((service, sIdx) => {
    const eps = generateEndpointsForService(service, sIdx, now);
    eps.forEach((ep) => (ep.projectId = projectId));
    return eps;
  });

  // Calculate risk for all endpoints first (with empty deps/consumers)
  allEndpoints.forEach((ep) => {
    ep.riskScore = calculateRiskScore(ep, [], consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  });

  // Assign consumers
  allEndpoints.forEach((ep) => {
    let consumerCount = ep.consumerIds.length;
    if (consumerCount === 0) {
      if (ep.status === "ACTIVE") consumerCount = randInt(3, 8);
      else if (ep.status === "LOW_TRAFFIC") consumerCount = randInt(1, 3);
      else consumerCount = 0;
    }
    const shuffled = [...consumers].sort(() => Math.random() - 0.5);
    ep.consumerIds = shuffled.slice(0, Math.min(consumerCount, shuffled.length)).map((c) => c.id);
  });

  // Recalculate with consumers
  allEndpoints.forEach((ep) => {
    ep.riskScore = calculateRiskScore(ep, [], consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  });

  // Generate dependencies
  const dependencies: Dependency[] = [];
  const servicesWithEndpoints: Record<string, string[]> = {};
  allEndpoints.forEach((ep) => {
    if (!servicesWithEndpoints[ep.service]) servicesWithEndpoints[ep.service] = [];
    servicesWithEndpoints[ep.service].push(ep.id);
  });

  SERVICES.forEach((service) => {
    const targetServices = SERVICES.filter((s) => s !== service);
    const numDeps = randInt(1, 3);
    for (let i = 0; i < numDeps; i++) {
      const fromService = service;
      const toService = randChoice(targetServices);
      const fromEps = servicesWithEndpoints[fromService] || [];
      const toEps = servicesWithEndpoints[toService] || [];
      if (fromEps.length > 0 && toEps.length > 0) {
        dependencies.push({
          fromEndpointId: randChoice(fromEps),
          toEndpointId: randChoice(toEps),
          type: randChoice(["calls", "depends_on", "implements"]) as Dependency["type"],
        });
      }
    }
  });

  SERVICES.forEach((service) => {
    const eps = servicesWithEndpoints[service] || [];
    if (eps.length > 2) {
      for (let i = 1; i < eps.length; i++) {
        if (Math.random() > 0.6) {
          dependencies.push({
            fromEndpointId: eps[i],
            toEndpointId: eps[0],
            type: "calls",
          });
        }
      }
    }
  });

  // Recalculate risk with dependencies
  allEndpoints.forEach((ep) => {
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  });

  // === Fix specific demo edge cases ===

  // 1. Completely unused API (status: UNUSED, 0 requests)
  const unusedEps = allEndpoints.filter((e) => e.status === "UNUSED");
  if (unusedEps.length > 0) {
    const ep = unusedEps[0];
    ep.requestCount = 0;
    ep.lastUsedAt = new Date(now - 250 * 24 * 60 * 60 * 1000).toISOString();
    ep.consumerIds = [];
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  // 2. Highly used API (most requests)
  const highUseEp = [...allEndpoints].sort((a, b) => b.requestCount - a.requestCount)[0];
  if (highUseEp) {
    highUseEp.requestCount = 892453;
    highUseEp.lastUsedAt = new Date(now - 2 * 60 * 1000).toISOString();
    highUseEp.riskScore = calculateRiskScore(highUseEp, dependencies, consumers);
    highUseEp.riskLevel = scoreToRiskLevel(highUseEp.riskScore);
  }

  // 3. Deprecated but still heavily used
  const depEps = allEndpoints.filter((e) => e.status === "DEPRECATED" && e.requestCount > 5000);
  if (depEps.length > 0) {
    const ep = depEps[0];
    ep.requestCount = 45200;
    ep.lastUsedAt = new Date(now - 3 * 60 * 60 * 1000).toISOString();
    ep.deprecationDate = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  // 4. Undocumented API with significant traffic
  const undocEps = allEndpoints.filter((e) => e.status === "UNDOCUMENTED" && e.requestCount > 3000);
  if (undocEps.length > 0) {
    const ep = undocEps[0];
    ep.requestCount = 32000;
    ep.lastUsedAt = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
    ep.documentationStatus = "MISSING";
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  // 5. API with many consumers
  const activeEps = allEndpoints.filter((e) => e.status === "ACTIVE");
  if (activeEps.length > 0) {
    const ep = activeEps[0];
    const manyConsumers = consumers.slice(0, 7);
    ep.consumerIds = manyConsumers.map((c) => c.id);
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  // 6. API with dangerous downstream dependency
  const depEndpointEps = allEndpoints.filter((e) =>
    dependencies.some((d) => d.fromEndpointId === e.id)
  );
  if (depEndpointEps.length > 0) {
    const ep = depEndpointEps[0];
    ep.status = "AT_RISK";
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  // 7. API that looks unused but has external consumer warning
  const lowEps = allEndpoints.filter(
    (e) => e.status === "UNUSED" || e.status === "LOW_TRAFFIC"
  );
  if (lowEps.length > 0) {
    const ep = lowEps[0];
    const externalConsumer = consumers.find((c) => c.type === "external");
    if (externalConsumer) {
      ep.requestCount = 5;
      ep.consumerIds = [externalConsumer.id];
      ep.lastUsedAt = new Date(now - 120 * 24 * 60 * 60 * 1000).toISOString();
      ep.status = "LOW_TRAFFIC";
      ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
      ep.riskLevel = scoreToRiskLevel(ep.riskScore);
    }
  }

  // 8. API with rapidly increasing traffic
  const atRiskEps = allEndpoints.filter((e) => e.status === "AT_RISK");
  if (atRiskEps.length > 0) {
    const ep = atRiskEps[0];
    ep.requestCount = 234500;
    ep.riskScore = calculateRiskScore(ep, dependencies, consumers);
    ep.riskLevel = scoreToRiskLevel(ep.riskScore);
  }

  project.endpointCount = allEndpoints.length;
  project.consumerCount = consumers.length;

  return { project, endpoints: allEndpoints, consumers, dependencies };
}
