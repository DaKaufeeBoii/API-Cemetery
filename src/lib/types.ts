export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ApiStatus = "ACTIVE" | "LOW_TRAFFIC" | "UNUSED" | "DEPRECATED" | "UNDOCUMENTED" | "AT_RISK";

export type DocumentationStatus = "DOCUMENTED" | "PARTIAL" | "MISSING";

export type DeleteVerdict = "SAFE" | "REVIEW" | "DO_NOT_DELETE";

export interface Consumer {
  id: string;
  name: string;
  type: "internal" | "external" | "third-party";
  description?: string;
}

export interface Dependency {
  fromEndpointId: string;
  toEndpointId: string;
  type: "calls" | "depends_on" | "implements";
}

export interface UsageSummary {
  endpointId: string;
  requestCount: number;
  lastUsedAt: string;
  uniqueConsumers: number;
  trafficTrend: number; // percentage change
}

export interface Endpoint {
  id: string;
  projectId: string;
  method: HttpMethod;
  path: string;
  service: string;
  description: string;
  status: ApiStatus;
  requestCount: number;
  lastUsedAt: string;
  consumerIds: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  documentationStatus: DocumentationStatus;
  deprecationDate?: string;
  tags: string[];
  version?: string;
}

export interface AnalysisResult {
  endpointId: string;
  verdict: DeleteVerdict;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  concerns: string[];
  affectedConsumers: Consumer[];
  trafficEvidence: TrafficEvidence;
  dependencies: Dependency[];
  recommendation: string[];
}

export interface TrafficEvidence {
  totalRequests: number;
  requestsLast90Days: number;
  requestsLast30Days: number;
  uniqueConsumers: number;
  trafficTrend: number;
  lastUsedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  endpointCount: number;
  consumerCount: number;
}

export interface IngestionJob {
  id: string;
  projectId: string;
  type: "openapi" | "usage_logs" | "demo";
  status: "uploading" | "parsing" | "indexing" | "building_graph" | "analyzing" | "complete" | "error";
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export const RISK_LEVEL_THRESHOLDS: Record<RiskLevel, [number, number]> = {
  LOW: [0, 29],
  MEDIUM: [30, 59],
  HIGH: [60, 79],
  CRITICAL: [80, 100],
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
};

export const STATUS_COLORS: Record<ApiStatus, string> = {
  ACTIVE: "text-emerald-400",
  LOW_TRAFFIC: "text-amber-400",
  UNUSED: "text-gray-400",
  DEPRECATED: "text-purple-400",
  UNDOCUMENTED: "text-pink-400",
  AT_RISK: "text-red-400",
};
