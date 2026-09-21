"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload, FileJson, FileSpreadsheet, Loader2,
  CheckCircle, Database, LayoutDashboard, CloudUpload,
} from "lucide-react";
import { toast } from "sonner";
import { getGlobalData } from "@/app/layout";

// ─── Step stepper ─────────────────────────────────────────────
const STEPS = ["Upload", "Parse", "Index", "Build Graph", "Analyse", "Done"];

function Stepper({ current }: { current: string }) {
  const idx = STEPS.findIndex((s) => s.toLowerCase() === current.toLowerCase()) ?? 0;
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                    : "bg-[var(--muted)] text-slate-600 border border-[var(--border)]"
                }`}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <div className={`text-[9px] uppercase tracking-wide font-medium ${
                done ? "text-emerald-400" : active ? "text-blue-400" : "text-slate-600"
              }`}>
                {step}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-10 mx-1 -mt-4 rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-[var(--border)]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Drag-drop zone ───────────────────────────────────────────
function DropZone({
  accept,
  onFile,
  disabled,
  color,
  icon: Icon,
  title,
  desc,
}: {
  accept: string;
  onFile: (f: File) => void;
  disabled: boolean;
  color: string;
  icon: typeof Upload;
  title: string;
  desc: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile]
  );

  return (
    <label
      className={`relative flex flex-col items-center justify-center gap-3 card p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 border-dashed
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        ${dragging ? `border-2 ${color} bg-[var(--card-hover)] scale-[1.01]` : "border-2 border-dashed border-[var(--border)] hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)]"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? `bg-white/10` : "bg-[var(--surface)]"} border border-[var(--border)]`}>
        {dragging
          ? <CloudUpload className={`w-6 h-6 ${color.replace("border-", "text-").split("/")[0]}`} />
          : <Icon className={`w-6 h-6 ${color.replace("border-", "text-").split("/")[0]}`} />
        }
      </div>
      <div>
        <h3 className="font-semibold text-sm text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-2">{desc}</p>
        <span className={`text-xs font-medium flex items-center justify-center gap-1 ${color.replace("border-", "text-").split("/")[0]}`}>
          <Upload className="w-3 h-3" />
          {dragging ? "Drop to upload" : "Choose file or drag & drop"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { onFile(f); e.target.value = ""; }
        }}
      />
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function IngestionPage() {
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState("Upload");

  const data = getGlobalData();

  const runFakeIngest = useCallback(async (label: string) => {
    setUploading(true);
    const pipeline = [
      { step: "Parse",       ms: 700  },
      { step: "Index",       ms: 900  },
      { step: "Build Graph", ms: 1100 },
      { step: "Analyse",     ms: 800  },
      { step: "Done",        ms: 400  },
    ];
    setCurrentStep("Upload");
    for (const { step, ms } of pipeline) {
      await new Promise((r) => setTimeout(r, ms));
      setCurrentStep(step);
    }
    await new Promise((r) => setTimeout(r, 500));
    setUploading(false);
    setCurrentStep("Upload");
    toast.success(`${label} loaded!`, { description: "Navigate to the dashboard to explore." });
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-white mb-1">Add API Data</h1>
        <p className="text-sm text-slate-500">
          Upload your API spec or usage logs, or load the built-in demo to explore all features.
        </p>
      </div>

      {/* Upload cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in delay-100">
        {/* Demo */}
        <button
          onClick={() => runFakeIngest("Demo project")}
          disabled={uploading}
          className={`relative flex flex-col items-center justify-center gap-3 card p-6 sm:p-8 text-center transition-all duration-200 border-2 hover:bg-[var(--card-hover)] disabled:opacity-50 disabled:cursor-not-allowed
            ${uploading ? "border-[var(--border)]" : "border-dashed border-blue-500/30 hover:border-blue-400/50"}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white mb-1">Load Demo</h3>
            <p className="text-xs text-slate-500">
              110+ endpoints, 32 consumers, realistic usage patterns
            </p>
          </div>
          <span className="text-xs text-blue-400 font-medium">No file needed →</span>
        </button>

        {/* OpenAPI */}
        <DropZone
          accept=".json,.yaml,.yml"
          onFile={(f) => runFakeIngest(`OpenAPI spec "${f.name}"`)}
          disabled={uploading}
          color="border-purple-500/40 text-purple-400"
          icon={FileJson}
          title="Upload OpenAPI"
          desc="JSON or YAML specification file"
        />

        {/* Usage logs */}
        <DropZone
          accept=".json,.csv"
          onFile={(f) => runFakeIngest(`Usage logs "${f.name}"`)}
          disabled={uploading}
          color="border-emerald-500/40 text-emerald-400"
          icon={FileSpreadsheet}
          title="Upload Usage Logs"
          desc="CSV or JSON from your API gateway"
        />
      </div>

      {/* Progress */}
      {uploading && (
        <div className="card p-5 sm:p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Processing…</span>
          </div>

          {/* Stepper */}
          <div className="overflow-x-auto pb-1">
            <Stepper current={currentStep} />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700"
              style={{
                width: `${((STEPS.findIndex((s) => s.toLowerCase() === currentStep.toLowerCase()) + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Current project */}
      <div className="card p-5 animate-fade-in delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Current Project</h3>
          <Link href="/dashboard" className="btn-ghost text-xs gap-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Open Dashboard
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Name",      value: data.project.name },
            { label: "Endpoints", value: String(data.endpoints.length)   },
            { label: "Consumers", value: String(data.consumers.length)   },
            { label: "Last Sync", value: "Just now"         },
          ].map((d) => (
            <div key={d.label}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{d.label}</div>
              <div className="text-sm font-medium font-mono text-white truncate">{d.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Format hints */}
      <div className="card p-5 animate-fade-in delay-300">
        <h3 className="text-sm font-semibold text-white mb-3">Supported Formats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
          <div>
            <div className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-purple-400" /> OpenAPI
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>OpenAPI 3.0 / 3.1 JSON or YAML</li>
              <li>Swagger 2.0 JSON</li>
              <li>Postman Collection v2.1</li>
            </ul>
          </div>
          <div>
            <div className="text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Usage Logs
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>CSV with method, path, count columns</li>
              <li>JSON array with requestCount field</li>
              <li>AWS/GCP/Nginx access log format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
