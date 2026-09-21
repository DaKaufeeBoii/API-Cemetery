"use client";

import { useMemo } from "react";
import { getGlobalData } from "@/app/layout";

export function useDashboardStats() {
  const { endpoints } = getGlobalData();

  return useMemo(() => {
    const total      = endpoints.length;
    const active     = endpoints.filter((e) => e.status === "ACTIVE").length;
    const lowTraffic = endpoints.filter((e) => e.status === "LOW_TRAFFIC").length;
    const unused     = endpoints.filter((e) => e.status === "UNUSED").length;
    const deprecated = endpoints.filter((e) => e.status === "DEPRECATED").length;
    const undocumented = endpoints.filter(
      (e) => e.status === "UNDOCUMENTED" || e.documentationStatus === "MISSING"
    ).length;
    const highRisk = endpoints.filter(
      (e) => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL"
    ).length;
    const critical = endpoints.filter((e) => e.riskLevel === "CRITICAL").length;

    return { total, active, lowTraffic, unused, deprecated, undocumented, highRisk, critical };
  }, [endpoints]);
}

export function useRecentEndpoints() {
  const { endpoints } = getGlobalData();
  return useMemo(
    () =>
      [...endpoints]
        .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
        .slice(0, 8),
    [endpoints]
  );
}

export function useAttentionEndpoints() {
  const { endpoints } = getGlobalData();
  return useMemo(
    () =>
      endpoints.filter(
        (e) =>
          e.riskLevel === "CRITICAL" ||
          e.status === "UNUSED" ||
          e.status === "AT_RISK"
      ),
    [endpoints]
  );
}
