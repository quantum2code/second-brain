"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import ConnectorCard from "@/components/connector-card";
import InteractiveNodesGraph from "@/components/interactive-nodes-graph";

type ConnectorStatus = "synced" | "disconnected" | "available";

type Connector = {
  id: string;
  name: string;
  description: string;
  iconType: "slack" | "gmail" | "discord" | "calendar" | "notion" | "github";
  status: ConnectorStatus;
  lastSync: string;
};

const INITIAL_CONNECTORS: Connector[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Automatically extracts task-relevant threads, project updates, and decisions from selected channels.",
    iconType: "slack",
    status: "synced",
    lastSync: "2m ago",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Identifies critical deadlines, action items, and context from your primary inbox threads.",
    iconType: "gmail",
    status: "synced",
    lastSync: "15m ago",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Monitors community sentiment and organizes knowledge shared across specific guild channels.",
    iconType: "discord",
    status: "disconnected",
    lastSync: "Never synced",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Maps your schedule to your project timelines to provide preemptive context for upcoming meetings.",
    iconType: "calendar",
    status: "synced",
    lastSync: "1h ago",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Indexes databases and pages to build a comprehensive relationship graph of your personal notes.",
    iconType: "notion",
    status: "synced",
    lastSync: "5m ago",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Syncs PR descriptions and issues to bridge the gap between technical commits and high-level docs.",
    iconType: "github",
    status: "available",
    lastSync: "Auth required",
  },
];

export default function IntegrationsPage() {
  const [connectors, setConnectors] = useState<Connector[]>(INITIAL_CONNECTORS);

  const handleStatusChange = (id: string, newStatus: ConnectorStatus) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const connectedCount = connectors.filter((c) => c.status === "synced").length;
  const availableCount = connectors.filter(
    (c) => c.status === "available" || c.status === "disconnected"
  ).length;

  const connectionMap: Record<string, boolean> = {};
  connectors.forEach((c) => {
    connectionMap[c.id] = c.status === "synced";
  });

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 dark:text-white tracking-tight mb-1.5">
            Connectors
          </h1>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 font-normal">
            Unified data ecosystem for your Extended Intelligence.
          </p>
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#0e0f14] border border-slate-200/80 dark:border-slate-900/80 rounded-xl shadow-sm dark:shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-sm shadow-blue-400/60 animate-pulse" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Connected</span>
            </div>
            <span className="text-[18px] font-bold text-slate-800 dark:text-white">
              {connectedCount} <span className="text-[12px] font-normal text-slate-400 dark:text-slate-500">Apps</span>
            </span>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#0e0f14] border border-slate-200/80 dark:border-slate-900/80 rounded-xl shadow-sm dark:shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Available</span>
            </div>
            <span className="text-[18px] font-bold text-slate-800 dark:text-white">
              {availableCount} <span className="text-[12px] font-normal text-slate-400 dark:text-slate-500">Apps</span>
            </span>
          </div>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            id={connector.id}
            name={connector.name}
            description={connector.description}
            iconType={connector.iconType}
            status={connector.status}
            lastSync={connector.lastSync}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Interactive Nodes Graph */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
              Intelligence Network
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Visual map of your connected data sources and knowledge flows
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
            Live Sync
          </div>
        </div>
        <InteractiveNodesGraph connections={connectionMap} />
      </div>
    </DashboardLayout>
  );
}
