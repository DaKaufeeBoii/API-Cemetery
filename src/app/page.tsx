import { Skull, ArrowRight, Shield, FileX, Search, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Search,
    title: "Discover",
    desc: "Surface APIs nobody remembers — undocumented, unused, or silently deprecated.",
    color: "text-blue-400",
    glow: "bg-blue-500/10 border-blue-500/20 hover:border-blue-400/40",
  },
  {
    icon: Shield,
    title: "Understand",
    desc: "See every consumer, traffic trend, and downstream dependency before you act.",
    color: "text-amber-400",
    glow: "bg-amber-500/10 border-amber-500/20 hover:border-amber-400/40",
  },
  {
    icon: FileX,
    title: "Decommission",
    desc: "Get a SAFE / REVIEW / DO NOT DELETE verdict with a clear migration playbook.",
    color: "text-emerald-400",
    glow: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-400/40",
  },
];

const stats = [
  { label: "Endpoints analysed", value: "110+" },
  { label: "Services mapped",    value: "10"   },
  { label: "Consumers tracked",  value: "32"   },
  { label: "Risk signals",       value: "5"    },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Background mesh */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center animate-fade-in">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-red-500/10 blur-xl scale-150" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-slate-800 border border-white/10 flex items-center justify-center">
              <Skull className="w-8 h-8 text-slate-300" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-6">
            <Zap className="w-3 h-3" />
            Developer tool · Zero cloud required
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 max-w-3xl text-balance leading-tight">
            Know what you can{" "}
            <span
              className="animate-gradient-x"
              style={{
                background:
                  "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              safely kill.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mb-8 text-balance">
            Map your APIs, understand real usage, and identify endpoints safe to
            deprecate — without the guesswork.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary px-5 py-2.5 text-sm shadow-glow-blue"
            >
              Explore Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ingest"
              className="btn inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Load API Data
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full animate-fade-in delay-200">
          {stats.map((s) => (
            <div
              key={s.label}
              className="card text-center py-4 px-3 hover:border-slate-600 transition-colors"
            >
              <div className="text-2xl font-bold text-white font-mono mb-0.5">
                {s.value}
              </div>
              <div className="text-[11px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Animated Dependency Diagram ──────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto card p-6 sm:p-8 animate-fade-in delay-300">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Blast Radius Visualisation
            </span>
          </div>

          {/* SVG diagram */}
          <div className="flex justify-center overflow-x-auto">
            <svg
              width="480"
              height="100"
              viewBox="0 0 480 100"
              className="max-w-full"
            >
              <defs>
                <marker
                  id="arrow-hero"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#2a3a50" />
                </marker>
                <filter id="glow-blue">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Node: web-app */}
              <rect x="10" y="28" width="88" height="44" rx="8" fill="#111827" stroke="#3b82f6" strokeWidth="1.5" filter="url(#glow-blue)" />
              <text x="54" y="47" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="monospace" fontWeight="600">web-app</text>
              <text x="54" y="62" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">consumer</text>

              {/* Arrow 1 */}
              <line x1="98" y1="50" x2="166" y2="50" stroke="#2a3a50" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-hero)">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.5s" repeatCount="indefinite" />
              </line>

              {/* Node: GET /orders — target */}
              <rect x="166" y="20" width="148" height="60" rx="8" fill="#1a0a0a" stroke="#ef4444" strokeWidth="2" filter="url(#glow-red)">
                <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </rect>
              <text x="240" y="44" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="700">GET /orders</text>
              <text x="240" y="60" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">CRITICAL · 89/100</text>

              {/* Arrow 2 */}
              <line x1="314" y1="50" x2="382" y2="50" stroke="#2a3a50" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-hero)">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.5s" repeatCount="indefinite" />
              </line>

              {/* Node: payments */}
              <rect x="382" y="28" width="88" height="44" rx="8" fill="#111827" stroke="#10b981" strokeWidth="1.5" filter="url(#glow-blue)" />
              <text x="426" y="47" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="600">payments</text>
              <text x="426" y="62" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">dependency</text>
            </svg>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            Deleting{" "}
            <code className="text-red-400 font-mono">GET /orders</code>{" "}
            would break <strong className="text-slate-400">web-app</strong> and{" "}
            <strong className="text-slate-400">payments</strong>
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500 mb-10">
            Everything you need to decommission safely
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`card-hover p-5 border animate-fade-in ${f.glow}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${f.glow} border`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-sm text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
