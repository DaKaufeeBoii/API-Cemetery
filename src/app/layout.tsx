"use client";

import "./globals.css";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Skull,
  LayoutDashboard,
  Plus,
  Database,
  Menu,
  X,
  Activity,
  GitBranch,
  ArrowRightLeft,
  Users,
  ChevronRight,
} from "lucide-react";
import { Project, Endpoint, Consumer, Dependency } from "@/lib/types";
import { generateDemoData } from "@/lib/demoData";
import { Toaster, toast } from "sonner";

// ─── Global store ────────────────────────────────────────────
let globalData: {
  project: Project;
  endpoints: Endpoint[];
  consumers: Consumer[];
  dependencies: Dependency[];
} | null = null;

export function getGlobalData() {
  if (!globalData) globalData = generateDemoData();
  return globalData;
}
export function setGlobalData(data: typeof globalData) {
  globalData = data;
}

function makeEmptyData(): ReturnType<typeof getGlobalData> {
  return {
    project: {
      id: "proj-empty",
      name: "My Project",
      description: "Upload your API data to get started",
      createdAt: new Date().toISOString(),
      endpointCount: 0,
      consumerCount: 0,
    },
    endpoints: [],
    consumers: [],
    dependencies: [],
  };
}

// ─── Nav items ───────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard",  label: "Overview",    icon: LayoutDashboard },
  { href: "/dashboard",  label: "Endpoints",   icon: ArrowRightLeft   },
  { href: "/dashboard",  label: "Consumers",   icon: Users            },
  { href: "/dashboard",  label: "Graph",       icon: GitBranch        },
  { href: "/dashboard",  label: "Activity",    icon: Activity         },
];

// ─── Sidebar content ─────────────────────────────────────────
function SidebarContent({
  pathname,
  data,
  demoEnabled,
  onReloadDemo,
  onToggleDemo,
  onClose,
}: {
  pathname: string;
  data: ReturnType<typeof getGlobalData>;
  demoEnabled: boolean;
  onReloadDemo: () => void;
  onToggleDemo: () => void;
  onClose?: () => void;
}) {
  const criticalCount = data.endpoints.filter(
    (e) => e.riskLevel === "CRITICAL"
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600/30 to-red-600/20 group-hover:from-blue-500/40 group-hover:to-red-500/30 transition-all duration-300" />
            <Skull className="w-4 h-4 text-slate-300 relative z-10" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            API Cemetery
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-500 hover:text-white transition-colors rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Project badge */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">
              Project
            </div>
            <div className="text-xs font-medium text-slate-300 truncate">
              {data.project.name}
            </div>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 ml-2" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <div className="section-label px-2 py-1.5">Navigation</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/dashboard"));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Quick links */}
        <div className="section-label px-2 py-1.5 mt-4">Data</div>
        <Link
          href="/ingest"
          onClick={onClose}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            pathname.startsWith("/ingest")
              ? "bg-blue-600/15 text-blue-300 border border-blue-500/20"
              : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          Add API Data
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {criticalCount > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-xs text-red-400 font-medium">
              {criticalCount} critical endpoint{criticalCount !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px] text-red-400/60 uppercase tracking-wide">
              Action needed
            </span>
          </div>
        )}

        {/* Demo data toggle */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">Demo Data</span>
          </div>
          <button
            onClick={() => { onToggleDemo(); onClose?.(); }}
            aria-label={demoEnabled ? "Disable demo data" : "Enable demo data"}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus-visible:outline-none ${
              demoEnabled
                ? "bg-blue-600 border-blue-500"
                : "bg-[var(--muted)] border-[var(--border)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-px ${
                demoEnabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {demoEnabled && (
          <button
            onClick={() => { onReloadDemo(); onClose?.(); }}
            className="btn-ghost w-full justify-center text-xs py-1.5 text-slate-500"
          >
            ↺ Reshuffle demo data
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: "Endpoints", value: data.endpoints.length },
            { label: "Consumers", value: data.consumers.length },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]"
            >
              <div className="text-base font-bold text-white font-mono">{s.value}</div>
              <div className="text-[10px] text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root Layout ─────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [data, setData] = useState(() => getGlobalData());
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    globalData = data;
  }, [data]);

  const handleLoadDemo = useCallback(() => {
    const fresh = generateDemoData();
    setData(fresh);
    setGlobalData(fresh);
    setDemoEnabled(true);
    toast.success("Demo data reloaded!", { description: `${fresh.endpoints.length} endpoints loaded` });
  }, []);

  const handleToggleDemo = useCallback(() => {
    if (demoEnabled) {
      const empty = makeEmptyData();
      setData(empty);
      setGlobalData(empty);
      setDemoEnabled(false);
      toast.info("Demo data disabled", { description: "Load your own data via the Ingest page" });
    } else {
      const fresh = generateDemoData();
      setData(fresh);
      setGlobalData(fresh);
      setDemoEnabled(true);
      toast.success("Demo data enabled", { description: `${fresh.endpoints.length} endpoints loaded` });
    }
  }, [demoEnabled]);

  const criticalCount = mounted
    ? data.endpoints.filter((e) => e.riskLevel === "CRITICAL").length
    : 0;

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-[220px] bg-[var(--surface)] border-r border-[var(--border)] lg:hidden transition-transform duration-250 ${
            sidebarOpen ? "translate-x-0 animate-slide-right" : "-translate-x-full"
          }`}
        >
          {mounted && (
            <SidebarContent
              pathname={pathname}
              data={data}
              demoEnabled={demoEnabled}
              onReloadDemo={handleLoadDemo}
              onToggleDemo={handleToggleDemo}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex fixed top-0 left-0 z-30 h-full w-[220px] bg-[var(--surface)] border-r border-[var(--border)] flex-col">
          {mounted && (
            <SidebarContent
              pathname={pathname}
              data={data}
              demoEnabled={demoEnabled}
              onReloadDemo={handleLoadDemo}
              onToggleDemo={handleToggleDemo}
            />
          )}
        </aside>

        {/* Main area */}
        <div className="lg:pl-[220px] min-h-screen flex flex-col">
          {/* Top header */}
          <header className="glass sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 h-12 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden btn-ghost p-1.5"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm">
                <Skull className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-600">/</span>
                <span className="text-slate-300 font-medium">
                  {mounted ? data.project.name : "API Cemetery"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {criticalCount > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium critical-border-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {criticalCount} critical
                </div>
              )}
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600 font-mono">
                <span>{mounted ? data.endpoints.length : "—"} endpoints</span>
                <span className="text-slate-800">·</span>
                <span>{mounted ? data.consumers.length : "—"} consumers</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
