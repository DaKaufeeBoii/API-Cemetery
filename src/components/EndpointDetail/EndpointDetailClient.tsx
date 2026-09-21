"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getGlobalData } from "@/app/layout";
import { analyzeDeleteSafety } from "@/lib/riskEngine";
import { DeleteVerdict, Consumer, Endpoint, RiskLevel } from "@/lib/types";
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle,
  Users, GitBranch, Clock, BarChart3, FileText, Tag,
} from "lucide-react";
import dynamic from "next/dynamic";

const BlastRadiusGraph = dynamic(() => import("@/components/DependencyGraph"), { ssr: false });

// ─── Helpers ─────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  HEAD: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  OPTIONS: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};
const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444",
};
const RISK_TEXT: Record<RiskLevel, string> = {
  LOW: "text-emerald-400", MEDIUM: "text-amber-400",
  HIGH: "text-orange-400", CRITICAL: "text-red-400",
};
const VERDICT_CONFIG: Record<DeleteVerdict, {
  icon: typeof CheckCircle; cls: string; label: string;
}> = {
  SAFE: { icon: CheckCircle, cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", label: "SAFE TO DELETE" },
  REVIEW: { icon: AlertTriangle, cls: "text-amber-400 bg-amber-400/10 border-amber-400/30", label: "NEEDS REVIEW" },
  DO_NOT_DELETE: { icon: XCircle, cls: "text-red-400 bg-red-400/10 border-red-400/30 critical-border-pulse", label: "DO NOT DELETE" },
};

// ─── Risk Score Ring ─────────────────────────────────────────
function RiskRing({ score, level }: { score: number; level: RiskLevel }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dashArr = (score / 100) * circ;
  const color = RISK_COLORS[level];

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dashArr} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="relative text-center">
        <div className="text-xl font-bold font-mono" style={{ color }}>{score}</div>
        <div className="text-[9px] text-slate-600 uppercase tracking-wider">/ 100</div>
      </div>
    </div>
  );
}

// ─── Metric pill ─────────────────────────────────────────────
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-bold font-mono text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Consumer card ───────────────────────────────────────────
function ConsumerCard({ c }: { c: Consumer }) {
  const typeColors = {
    internal: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    external: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    "third-party": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };
  return (
    <div className="flex items-center justify-between card p-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border ${typeColors[c.type]}`}>
          {c.name[0].toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{c.name}</div>
          {c.description && (
            <div className="text-[10px] text-slate-500">{c.description}</div>
          )}
        </div>
      </div>
      <span className={`badge border text-[10px] ${typeColors[c.type]}`}>
        {c.type}
      </span>
    </div>
  );
}

// ─── Dependency row ──────────────────────────────────────────
function DepRow({ dir, type, epId, endpoints }: {
  dir: "↓" | "↑"; type: string; epId: string; endpoints: Endpoint[];
}) {
  const ep = endpoints.find((e) => e.id === epId);
  return (
    <div className="flex items-center gap-3 card p-3">
      <span className={`text-xs font-mono font-bold ${dir === "↓" ? "text-blue-400" : "text-amber-400"}`}>
        {dir}
      </span>
      <div className="flex-1 min-w-0">
        {ep ? (
          <Link href={`/endpoints/${ep.id}`} className="font-mono text-xs text-blue-400 hover:underline truncate block">
            {ep.method} {ep.path}
          </Link>
        ) : (
          <span className="font-mono text-xs text-slate-500">{epId}</span>
        )}
        <div className="text-[10px] text-slate-600">{ep?.service || "unknown"} · {type}</div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function EndpointDetailClient({ id: propId }: { id?: string }) {
  const params = useParams();
  const id = propId || (params?.id as string);
  const { endpoints, consumers, dependencies, project } = getGlobalData();
  const endpoint = endpoints.find((e) => e.id === id);

  const analysis = useMemo(() => {
    if (!endpoint) return null;
    return analyzeDeleteSafety(endpoint, consumers, dependencies);
  }, [endpoint, consumers, dependencies]);

  const downstream = useMemo(() =>
    endpoint ? dependencies.filter((d) => d.fromEndpointId === endpoint.id) : [],
    [endpoint, dependencies]);
  const upstream = useMemo(() =>
    endpoint ? dependencies.filter((d) => d.toEndpointId === endpoint.id) : [],
    [endpoint, dependencies]);
  const endpointConsumers: Consumer[] = useMemo(() => {
    if (!endpoint) return [];
    return endpoint.consumerIds.map((cid) => consumers.find((c) => c.id === cid)).filter(Boolean) as Consumer[];
  }, [endpoint, consumers]);

  if (!endpoint || !analysis) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <XCircle className="w-10 h-10 text-slate-700" />
        <div className="text-slate-500">Endpoint not found</div>
        <Link href="/dashboard" className="btn-ghost">← Back to dashboard</Link>
      </div>
    );
  }

  const verdict = VERDICT_CONFIG[analysis.verdict];
  const VerdictIcon = verdict.icon;
  const externalConsumers = endpointConsumers.filter((c) => c.type === "external" || c.type === "third-party");

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium", timeStyle: "short",
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-screen-xl">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="btn-ghost p-1.5 mt-0.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`badge border text-xs font-bold font-mono ${METHOD_COLORS[endpoint.method] || METHOD_COLORS.GET}`}>
                {endpoint.method}
              </span>
              <h1 className="font-mono text-lg sm:text-xl font-bold text-white break-all">
                {endpoint.path}
              </h1>
            </div>
            <div className="text-sm text-slate-500 flex flex-wrap gap-2">
              <span className="font-mono">{endpoint.service}</span>
              <span>·</span>
              <span>{project.name}</span>
              {endpoint.version && (
                <>
                  <span>·</span>
                  <span className="font-mono">{endpoint.version}</span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">{endpoint.description}</p>
          </div>
        </div>

        {/* Risk ring */}
        <div className="flex items-center gap-4 sm:shrink-0">
          <RiskRing score={endpoint.riskScore} level={endpoint.riskLevel} />
          <div>
            <div className={`text-sm font-bold font-mono ${RISK_TEXT[endpoint.riskLevel]}`}>
              {endpoint.riskLevel}
            </div>
            <div className="text-xs text-slate-500">risk level</div>
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Traffic metrics */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
              <span className="section-label">Traffic & Activity</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric label="Total Requests" value={endpoint.requestCount.toLocaleString()} />
              <Metric label="Consumers" value={String(endpoint.consumerIds.length)} />
              <Metric
                label="Last Used"
                value={(() => {
                  const d = Date.now() - new Date(endpoint.lastUsedAt).getTime();
                  const days = Math.floor(d / 86400000);
                  return days < 1 ? "Today" : `${days}d ago`;
                })()}
                sub={fmtDate(endpoint.lastUsedAt)}
              />
              <Metric
                label="Documentation"
                value={endpoint.documentationStatus}
              />
            </div>
          </section>

          {/* Delete verdict */}
          <section className="animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-3">
              <VerdictIcon className={`w-3.5 h-3.5 ${verdict.cls.split(" ")[0]}`} />
              <span className="section-label">Delete Safety Analysis</span>
            </div>
            <div className={`card border p-5 space-y-5 ${analysis.verdict === "DO_NOT_DELETE" ? "critical-border-pulse" : ""}`}
              style={analysis.verdict === "DO_NOT_DELETE" ? { borderColor: "rgba(239,68,68,0.3)" } : {}}>

              {/* Verdict badge */}
              <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${verdict.cls}`}>
                <VerdictIcon className="w-5 h-5" />
                <div>
                  <div className="font-bold text-sm">{verdict.label}</div>
                  <div className="text-xs opacity-75">
                    {analysis.riskScore}/100 · {analysis.riskLevel} risk
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <div className="section-label mb-2">Evidence</div>
                <ul className="space-y-1.5">
                  {analysis.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-slate-300">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              {analysis.concerns.length > 0 && (
                <div>
                  <div className="section-label mb-2">Concerns</div>
                  <ul className="space-y-1.5">
                    {analysis.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              <div>
                <div className="section-label mb-2">Recommendation</div>
                <ol className="space-y-1.5 list-none">
                  {analysis.recommendation.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      {i > 0 && String(step).match(/^\d\./) ? (
                        <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {step.charAt(0)}
                        </span>
                      ) : (
                        <span className="w-5 h-5 shrink-0" />
                      )}
                      <span className="text-slate-400">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Dependencies */}
          {(downstream.length > 0 || upstream.length > 0) && (
            <section className="animate-fade-in delay-200">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-3.5 h-3.5 text-slate-600" />
                <span className="section-label">Dependencies</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {downstream.length > 0 && (
                  <div>
                    <div className="text-xs text-blue-400 font-medium mb-2 flex items-center gap-1">
                      <span>↓</span> Downstream ({downstream.length})
                    </div>
                    <div className="space-y-2">
                      {downstream.map((dep, i) => (
                        <DepRow key={i} dir="↓" type={dep.type} epId={dep.toEndpointId} endpoints={endpoints} />
                      ))}
                    </div>
                  </div>
                )}
                {upstream.length > 0 && (
                  <div>
                    <div className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
                      <span>↑</span> Upstream ({upstream.length})
                    </div>
                    <div className="space-y-2">
                      {upstream.map((dep, i) => (
                        <DepRow key={i} dir="↑" type={dep.type} epId={dep.fromEndpointId} endpoints={endpoints} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Consumers */}
          <section className="animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="section-label">Consumers ({endpointConsumers.length})</span>
            </div>
            {endpointConsumers.length === 0 ? (
              <div className="card p-4 text-center text-sm text-slate-600">No known consumers</div>
            ) : (
              <div className="space-y-2">
                {externalConsumers.length > 0 && (
                  <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider px-1 mb-1">
                    ⚠ External ({externalConsumers.length})
                  </div>
                )}
                {endpointConsumers.map((c) => <ConsumerCard key={c.id} c={c} />)}
              </div>
            )}
          </section>

          {/* Details */}
          <section className="animate-fade-in delay-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span className="section-label">Details</span>
            </div>
            <div className="card p-4 space-y-2.5">
              {[
                { label: "Status", value: endpoint.status.replace(/_/g, " ") },
                { label: "Service", value: endpoint.service },
                { label: "Version", value: endpoint.version || "—" },
                { label: "Documentation", value: endpoint.documentationStatus },
                ...(endpoint.deprecationDate
                  ? [{ label: "Deprecated", value: new Date(endpoint.deprecationDate).toLocaleDateString() }]
                  : []),
              ].map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{d.label}</span>
                  <span className="font-mono text-slate-300">{d.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          {endpoint.tags.length > 0 && (
            <section className="animate-fade-in delay-300">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-3.5 h-3.5 text-slate-600" />
                <span className="section-label">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {endpoint.tags.map((tag) => (
                  <span key={tag} className="badge border text-slate-400 border-slate-700 bg-slate-800/50 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Last used */}
          <section className="animate-fade-in delay-300">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span className="section-label">Timeline</span>
            </div>
            <div className="card p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Last used</span>
                <span className="font-mono text-slate-300">{fmtDate(endpoint.lastUsedAt)}</span>
              </div>
              {endpoint.deprecationDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Deprecated</span>
                  <span className="font-mono text-red-400">{fmtDate(endpoint.deprecationDate)}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Blast Radius Graph ───────────────────────── */}
      <section className="card p-4 sm:p-6 animate-fade-in delay-200">
        <BlastRadiusGraph />
      </section>
    </div>
  );
}
