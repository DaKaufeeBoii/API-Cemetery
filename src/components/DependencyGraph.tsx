"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  Node, Edge, ReactFlowProvider, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getGlobalData } from "@/app/layout";
import { useParams } from "next/navigation";
import { Endpoint, Consumer } from "@/lib/types";

const COLORS = {
  target:          "#ef4444",
  consumer:        "#10b981",
  consumerExt:     "#f97316",
  downstream:      "#6366f1",
  upstream:        "#ca8a04",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444",
};

function nodeStyle(border: string, bg: string): React.CSSProperties {
  return {
    background: bg,
    border: `2px solid ${border}`,
    color: "#e2e8f0",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    borderRadius: 8,
    padding: "6px 10px",
    boxShadow: `0 0 12px ${border}30`,
  };
}

function BlastRadiusGraphInner() {
  const params = useParams();
  const id = params.id as string;
  const { endpoints, consumers, dependencies } = getGlobalData();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const endpoint = endpoints.find((e) => e.id === id);

  const { nodes, edges } = useMemo(() => {
    if (!endpoint) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const cx = 460, cy = 280;

    // Target
    nodes.push({
      id: endpoint.id,
      type: "default",
      position: { x: cx, y: cy },
      data: { label: `${endpoint.method} ${endpoint.path}`, info: endpoint, kind: "target" },
      style: nodeStyle(RISK_COLORS[endpoint.riskLevel] || COLORS.target, "#1a0808"),
    });

    // Consumers — spread to the left
    endpoint.consumerIds.forEach((cid, i) => {
      const consumer = consumers.find((c) => c.id === cid);
      if (!consumer) return;
      const total = endpoint.consumerIds.length;
      const spread = Math.min(total * 80, 360);
      const startAngle = Math.PI - (spread / 2 / 180) * Math.PI;
      const angle = total > 1 ? startAngle + (i / (total - 1)) * (spread / 180) * Math.PI : Math.PI;
      const r = 220;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      const isExt = consumer.type === "external" || consumer.type === "third-party";
      nodes.push({
        id: cid,
        type: "default",
        position: { x, y },
        data: { label: consumer.name, info: consumer, kind: "consumer" },
        style: nodeStyle(isExt ? COLORS.consumerExt : COLORS.consumer, isExt ? "#1a0e00" : "#0a1a0e"),
      });
      edges.push({
        id: `e-c-${cid}`,
        source: cid, target: endpoint.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2a3a50" },
        style: { stroke: isExt ? "#f9741640" : "#10b98140" },
        label: "calls",
        labelStyle: { fill: "#475569", fontSize: 10 },
      });
    });

    // Downstream
    const downstream = dependencies.filter((d) => d.fromEndpointId === endpoint.id);
    downstream.forEach((dep, i) => {
      const ep = endpoints.find((e) => e.id === dep.toEndpointId);
      if (!ep) return;
      const total = downstream.length;
      const startAngle = -0.4;
      const angle = total > 1 ? startAngle + (i / (total - 1)) * 0.8 : 0;
      const r = 200;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const nodeId = `dep-${dep.toEndpointId}`;
      nodes.push({
        id: nodeId,
        type: "default",
        position: { x, y },
        data: { label: `${ep.method} ${ep.path}`, info: ep, kind: "downstream" },
        style: nodeStyle(COLORS.downstream, "#09091a"),
      });
      edges.push({
        id: `e-dep-${dep.toEndpointId}`,
        source: endpoint.id, target: nodeId,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f180" },
        style: { stroke: "#6366f150" },
        label: dep.type,
        labelStyle: { fill: "#475569", fontSize: 10 },
      });
    });

    // Upstream
    const upstream = dependencies.filter((d) => d.toEndpointId === endpoint.id);
    upstream.forEach((dep, i) => {
      const ep = endpoints.find((e) => e.id === dep.fromEndpointId);
      if (!ep) return;
      const total = upstream.length;
      const angle = Math.PI / 2 + (total > 1 ? ((i / (total - 1)) - 0.5) * 0.8 : 0);
      const r = 180;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const nodeId = `up-${dep.fromEndpointId}`;
      nodes.push({
        id: nodeId,
        type: "default",
        position: { x, y },
        data: { label: `${ep.method} ${ep.path}`, info: ep, kind: "upstream" },
        style: nodeStyle(COLORS.upstream, "#1a1800"),
      });
      edges.push({
        id: `e-up-${dep.fromEndpointId}`,
        source: nodeId, target: endpoint.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ca8a0480" },
        style: { stroke: "#ca8a0450" },
        label: dep.type,
        labelStyle: { fill: "#475569", fontSize: 10 },
      });
    });

    return { nodes, edges };
  }, [endpoint, consumers, dependencies, endpoints]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const selectedData = useMemo(() => {
    if (!selectedNode) return null;
    for (const n of nodes) {
      if (n.id === selectedNode) return { info: n.data.info as (Endpoint | Consumer), kind: n.data.kind as string };
    }
    return null;
  }, [selectedNode, nodes]);

  const LEGEND = [
    { color: COLORS.target, label: "Target endpoint" },
    { color: COLORS.consumer, label: "Internal consumer" },
    { color: COLORS.consumerExt, label: "External consumer" },
    { color: COLORS.downstream, label: "Downstream dep." },
    { color: COLORS.upstream, label: "Upstream dep." },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white">Blast Radius Graph</h2>
        <span className="text-xs text-slate-600 font-mono">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph */}
        <div className="lg:col-span-3 h-[420px] sm:h-[500px] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
          {/* @ts-ignore */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.15}
            maxZoom={2.5}
            fitViewOptions={{ padding: 0.25 }}
          >
            <Background color="#1e2a3a" gap={24} />
            <Controls />
            <MiniMap
              nodeColor={(n: any) => {
                const nd = n.data as any;
                if (nd?.kind === "target") return COLORS.target;
                if (nd?.kind === "consumer") return COLORS.consumer;
                if (nd?.kind === "downstream") return COLORS.downstream;
                if (nd?.kind === "upstream") return COLORS.upstream;
                return COLORS.consumerExt;
              }}
              className="!rounded-lg !border !border-[var(--border)]"
            />
          </ReactFlow>
        </div>

        {/* Panel */}
        <div className="space-y-3">
          {/* Selection detail */}
          <div className="card p-4">
            <div className="section-label mb-3">Selection</div>
            {selectedData ? (() => {
              const info = selectedData.info as any;
              return (
                <div className="space-y-2.5 text-sm">
                  <div className="font-mono font-bold text-white break-all">
                    {info.method ? `${info.method} ${info.path}` : (info.name || info.id)}
                  </div>
                  {info.description && (
                    <div className="text-xs text-slate-400">{info.description}</div>
                  )}
                  <div className="space-y-1.5">
                    {info.riskScore !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color: RISK_COLORS[info.riskLevel] || "#fff" }}>
                          {info.riskScore}
                        </span>
                      </div>
                    )}
                    {info.status && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Status</span>
                        <span className="font-mono">{info.status}</span>
                      </div>
                    )}
                    {info.type && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Type</span>
                        <span className="font-mono">{info.type}</span>
                      </div>
                    )}
                    {info.service && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Service</span>
                        <span className="font-mono">{info.service}</span>
                      </div>
                    )}
                    {info.requestCount !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Requests</span>
                        <span className="font-mono">{info.requestCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <p className="text-xs text-slate-600">Click a node to inspect it</p>
            )}
          </div>

          {/* Legend */}
          <div className="card p-4">
            <div className="section-label mb-3">Legend</div>
            <div className="space-y-2">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}60` }}
                  />
                  <span className="text-xs text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlastRadiusGraph() {
  return (
    <ReactFlowProvider>
      <BlastRadiusGraphInner />
    </ReactFlowProvider>
  );
}
