import { RiskLevel, ApiStatus, RISK_LEVEL_COLORS, STATUS_COLORS } from "@/lib/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const colors = RISK_LEVEL_COLORS[level];
  return (
    <span className={`badge border ${colors}`}>
      {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApiStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`text-xs font-mono font-semibold ${colors}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function HttpMethodBadge({ method }: { method: string }) {
  const methodColors: Record<string, string> = {
    GET:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    POST:    "text-blue-400   bg-blue-500/10    border-blue-500/20",
    PUT:     "text-amber-400  bg-amber-500/10   border-amber-500/20",
    PATCH:   "text-purple-400 bg-purple-500/10  border-purple-500/20",
    DELETE:  "text-red-400    bg-red-500/10     border-red-500/20",
    HEAD:    "text-slate-400  bg-slate-500/10   border-slate-500/20",
    OPTIONS: "text-slate-400  bg-slate-500/10   border-slate-500/20",
  };
  return (
    <span className={`badge border text-[10px] font-bold font-mono ${methodColors[method] || methodColors.GET}`}>
      {method}
    </span>
  );
}
