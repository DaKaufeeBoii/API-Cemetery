"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getGlobalData } from "@/app/layout";
import { useDashboardStats } from "./hooks";
import { RiskLevel, ApiStatus, Endpoint } from "@/lib/types";
import {
  Search, ChevronDown, ChevronUp, ArrowUpRight,
  AlertTriangle, TrendingDown, Eye, Filter, Plus,
} from "lucide-react";

// ─── Color maps ──────────────────────────────────────────────
const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444",
};
const STATUS_COLOR_MAP: Record<ApiStatus, string> = {
  ACTIVE: "#10b981", LOW_TRAFFIC: "#f59e0b", UNUSED: "#64748b",
  DEPRECATED: "#a855f7", UNDOCUMENTED: "#ec4899", AT_RISK: "#ef4444",
};
const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  HEAD: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  OPTIONS: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};
const RISK_BADGE: Record<RiskLevel, string> = {
  LOW: "badge-risk-low", MEDIUM: "badge-risk-medium",
  HIGH: "badge-risk-high", CRITICAL: "badge-risk-critical",
};

// ─── Helpers ─────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Charts ──────────────────────────────────────────────────
function TrafficChart() {
  const { endpoints } = getGlobalData();
  const data = useMemo(() => {
    const b = [
      { r: "0", n: 0 }, { r: "≤100", n: 0 }, { r: "≤1K", n: 0 },
      { r: "≤10K", n: 0 }, { r: "≤100K", n: 0 }, { r: "100K+", n: 0 },
    ];
    endpoints.forEach((ep) => {
      if (ep.requestCount === 0) b[0].n++;
      else if (ep.requestCount <= 100) b[1].n++;
      else if (ep.requestCount <= 1000) b[2].n++;
      else if (ep.requestCount <= 10000) b[3].n++;
      else if (ep.requestCount <= 100000) b[4].n++;
      else b[5].n++;
    });
    return b;
  }, [endpoints]);

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="r" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
            formatter={(v) => [v, "endpoints"]}
            labelFormatter={(l) => `Range: ${l}`}
          />
          <Bar dataKey="n" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusDonut() {
  const { endpoints } = getGlobalData();
  const data = useMemo(() => {
    const c = new Map<ApiStatus, number>();
    endpoints.forEach((ep) => c.set(ep.status, (c.get(ep.status) || 0) + 1));
    return Array.from(c.entries()).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
      color: STATUS_COLOR_MAP[status] || "#64748b",
    }));
  }, [endpoints]);

  const total = endpoints.length;

  return (
    <div className="h-44 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={40} outerRadius={68} strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-xl font-bold text-white font-mono">{total}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">total</div>
        </div>
      </div>
    </div>
  );
}

function RiskBars() {
  const { endpoints } = getGlobalData();
  const data = useMemo(() => {
    const c = new Map<RiskLevel, number>();
    (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).forEach((l) => c.set(l, 0));
    endpoints.forEach((ep) => c.set(ep.riskLevel, (c.get(ep.riskLevel) || 0) + 1));
    return Array.from(c.entries()).map(([level, count]) => ({ level, count, color: RISK_COLORS[level] }));
  }, [endpoints]);

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.level} className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-semibold w-16 text-right" style={{ color: d.color }}>
            {d.level}
          </span>
          <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 w-8 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Endpoint row (desktop) ───────────────────────────────────
function EndpointRow({ ep, i }: { ep: Endpoint; i: number }) {
  return (
    <tr
      className="border-b border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer animate-fade-in"
      style={{ animationDelay: `${Math.min(i * 0.02, 0.4)}s` }}
    >
      <td className="px-4 py-3">
        <Link href={`/endpoints/${ep.id}`} className="flex items-center gap-2 group">
          <span className={`badge border text-[10px] font-bold font-mono ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}>
            {ep.method}
          </span>
          <span className="font-mono text-sm text-blue-400 group-hover:text-blue-300 transition-colors truncate max-w-[200px]">
            {ep.path}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs text-slate-400 font-mono">{ep.service}</span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`text-xs font-mono font-semibold`} style={{ color: STATUS_COLOR_MAP[ep.status] }}>
          {ep.status.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <span className="font-mono text-sm text-slate-300">{ep.requestCount.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <span className="text-xs text-slate-500">{timeAgo(ep.lastUsedAt)}</span>
      </td>
      <td className="px-4 py-3 text-right hidden md:table-cell">
        <span className="font-mono text-sm text-slate-400">{ep.consumerIds.length}</span>
      </td>
      <td className="px-4 py-3">
        <span className={RISK_BADGE[ep.riskLevel]}>
          {ep.riskScore}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className={`text-[11px] font-mono ${
          ep.documentationStatus === "DOCUMENTED" ? "text-emerald-400"
            : ep.documentationStatus === "PARTIAL" ? "text-amber-400"
            : "text-red-400"
        }`}>
          {ep.documentationStatus}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link href={`/endpoints/${ep.id}`} className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
}

// ─── Endpoint card (mobile) ───────────────────────────────────
function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <Link href={`/endpoints/${ep.id}`} className="block card-hover p-4 border animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`badge border text-[10px] font-bold font-mono shrink-0 ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}>
            {ep.method}
          </span>
          <span className="font-mono text-sm text-blue-400 truncate">{ep.path}</span>
        </div>
        <span className={RISK_BADGE[ep.riskLevel]}>{ep.riskScore}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="font-mono">{ep.service}</span>
        <span>·</span>
        <span style={{ color: STATUS_COLOR_MAP[ep.status] }}>{ep.status.replace(/_/g, " ")}</span>
        <span>·</span>
        <span>{ep.requestCount.toLocaleString()} reqs</span>
      </div>
    </Link>
  );
}

// ─── Sort types ───────────────────────────────────────────────
type SortKey = "risk" | "requests" | "lastUsed" | "consumers";
type SortDir = "asc" | "desc";

// ─── Dashboard page ───────────────────────────────────────────
export default function DashboardPage() {
  const stats = useDashboardStats();
  const { endpoints, consumers, dependencies } = getGlobalData();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApiStatus | "ALL">("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    let list = [...endpoints];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ep) =>
          ep.path.toLowerCase().includes(q) ||
          ep.service.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") list = list.filter((ep) => ep.status === statusFilter);
    if (riskFilter !== "ALL") list = list.filter((ep) => ep.riskLevel === riskFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "risk") cmp = a.riskScore - b.riskScore;
      else if (sortKey === "requests") cmp = a.requestCount - b.requestCount;
      else if (sortKey === "lastUsed") cmp = new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime();
      else if (sortKey === "consumers") cmp = a.consumerIds.length - b.consumerIds.length;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [endpoints, search, statusFilter, riskFilter, sortKey, sortDir]);

  const pagedEndpoints = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = pagedEndpoints.length < filtered.length;

  const criticalEndpoints = endpoints.filter(
    (e) => e.riskLevel === "CRITICAL" || e.status === "AT_RISK"
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "desc"
        ? <ChevronDown className="w-3 h-3 inline ml-0.5" />
        : <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : null;

  const statCards = [
    { label: "Total",       value: stats.total,      cls: "stat-white",  icon: null },
    { label: "Active",      value: stats.active,     cls: "stat-green",  icon: null },
    { label: "Low Traffic", value: stats.lowTraffic, cls: "stat-amber",  icon: null },
    { label: "Unused",      value: stats.unused,     cls: "stat-gray",   icon: <TrendingDown className="w-3.5 h-3.5 text-slate-500" /> },
    { label: "Deprecated",  value: stats.deprecated, cls: "stat-purple", icon: null },
    { label: "High Risk",   value: stats.highRisk,   cls: "stat-red",    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── Empty state when no data loaded ──────────── */}
      {endpoints.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-700/20 to-slate-900/20 blur-xl scale-150" />
            <div className="relative w-16 h-16 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-700" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No API data loaded</h2>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Enable Demo Data from the sidebar toggle, or upload your own OpenAPI spec or usage logs.
          </p>
          <div className="flex gap-3">
            <Link href="/ingest" className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              Load API Data
            </Link>
          </div>
        </div>
      )}

      {endpoints.length > 0 && (<>

      {/* ── Stat cards ────────────────────────────────── */}
      <section className="animate-fade-in">
        <div className="section-label mb-3">API Health</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
                {s.icon}
              </div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in delay-100">
        <div className="card p-4">
          <div className="section-label mb-3">Traffic Distribution</div>
          <TrafficChart />
        </div>
        <div className="card p-4">
          <div className="section-label mb-3">Status Breakdown</div>
          <StatusDonut />
        </div>
        <div className="card p-4 sm:col-span-2 lg:col-span-1">
          <div className="section-label mb-4">Risk Distribution</div>
          <RiskBars />
        </div>
      </div>

      {/* ── Attention Required ───────────────────────── */}
      {criticalEndpoints.length > 0 && (
        <section className="animate-fade-in delay-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="section-label text-red-400">
              Attention Required ({criticalEndpoints.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {criticalEndpoints.slice(0, 4).map((ep) => (
              <Link
                key={ep.id}
                href={`/endpoints/${ep.id}`}
                className="flex items-center justify-between card p-4 border border-red-500/20 hover:border-red-500/40 critical-border-pulse transition-all group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge border text-[10px] font-bold font-mono shrink-0 ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}>{ep.method}</span>
                    <span className="font-mono text-sm text-red-300 truncate">{ep.path}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {ep.service} · {ep.consumerIds.length} consumers · {ep.requestCount.toLocaleString()} req
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="badge-risk-critical">{ep.riskScore}</span>
                  <Eye className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Endpoint Table ───────────────────────────── */}
      <section className="animate-fade-in delay-200">
        {/* Header + search */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="section-label">
            Endpoints
            <span className="ml-2 text-slate-600 normal-case tracking-normal font-normal text-xs">
              ({filtered.length} / {endpoints.length})
            </span>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search path, service…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-8 w-full sm:w-56"
            />
          </div>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`btn-ghost gap-1.5 ${showFilters ? "text-blue-400" : ""}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-4 p-3 card border animate-fade-in">
            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider self-center mr-1">Status</span>
              {(["ALL", "ACTIVE", "LOW_TRAFFIC", "UNUSED", "DEPRECATED", "UNDOCUMENTED", "AT_RISK"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(0); }}
                  className={`chip ${statusFilter === s ? "chip-active" : ""}`}
                >
                  {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            {/* Risk chips */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider self-center mr-1">Risk</span>
              {(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRiskFilter(r); setPage(0); }}
                  className={`chip ${riskFilter === r ? "chip-active" : ""}`}
                >
                  {r === "ALL" ? "All" : r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th className="hidden md:table-cell">Service</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors hidden lg:table-cell"
                    onClick={() => toggleSort("requests")}
                  >
                    Requests <SortIcon k="requests" />
                  </th>
                  <th className="hidden xl:table-cell"
                    onClick={() => toggleSort("lastUsed")}
                    style={{ cursor: "pointer" }}
                  >
                    Last Used <SortIcon k="lastUsed" />
                  </th>
                  <th
                    className="text-right cursor-pointer hover:text-slate-300 transition-colors hidden md:table-cell"
                    onClick={() => toggleSort("consumers")}
                  >
                    Consumers <SortIcon k="consumers" />
                  </th>
                  <th
                    className="cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => toggleSort("risk")}
                  >
                    Risk <SortIcon k="risk" />
                  </th>
                  <th className="hidden lg:table-cell">Docs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagedEndpoints.map((ep, i) => (
                  <EndpointRow key={ep.id} ep={ep} i={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {pagedEndpoints.map((ep) => (
            <EndpointCard key={ep.id} ep={ep} />
          ))}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="card py-16 text-center animate-fade-in">
            <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <div className="text-sm text-slate-500">No endpoints match your filters</div>
            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); setRiskFilter("ALL"); }}
              className="btn-ghost mt-3 text-xs mx-auto"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn-ghost text-sm"
            >
              Load more ({filtered.length - pagedEndpoints.length} remaining)
            </button>
          </div>
        )}
      </section>

      {/* ── Footer strip ─────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-700 font-mono pt-2 border-t border-[var(--border-subtle)]">
        <span>{dependencies.length} dependencies mapped</span>
        <span>{consumers.length} consumers tracked</span>
        <span>Last analysis: just now</span>
      </div>
      </>)}
    </div>
  );
}
