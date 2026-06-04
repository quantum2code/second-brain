"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Zap, Mail, FileText, Github, Calendar, MessageSquare,
  Slack, Brain, RefreshCw, Filter, Search, ArrowRight,
  CheckCircle2, AlertCircle, Info, Clock,
} from "lucide-react";

type ActivityEvent = {
  id: number;
  type: "sync" | "query" | "insight" | "connect" | "alert";
  source: string;
  title: string;
  detail: string;
  time: string;
  timestamp: number;
};

const ACTIVITY: ActivityEvent[] = [
  { id: 1,  type: "sync",    source: "slack",    title: "Slack channels synced",              detail: "47 nodes indexed from #product-updates and #dev-chat",     time: "2m ago",   timestamp: Date.now() - 120000 },
  { id: 2,  type: "query",   source: "brain",    title: "Query executed",                     detail: "\"Summarize this week's key decisions from Slack\"",         time: "5m ago",   timestamp: Date.now() - 300000 },
  { id: 3,  type: "insight", source: "brain",    title: "New insight generated",              detail: "Communication bottleneck detected in design team threads",    time: "12m ago",  timestamp: Date.now() - 720000 },
  { id: 4,  type: "sync",    source: "gmail",    title: "Gmail sync complete",                detail: "23 threads processed, 3 action items flagged",              time: "15m ago",  timestamp: Date.now() - 900000 },
  { id: 5,  type: "query",   source: "brain",    title: "Query executed",                     detail: "\"What are my action items from Gmail in the last 48h?\"",   time: "1h ago",   timestamp: Date.now() - 3600000 },
  { id: 6,  type: "alert",   source: "github",   title: "PR review requested",               detail: "feat/ai-context-engine #142 — awaiting your review",         time: "1h ago",   timestamp: Date.now() - 3700000 },
  { id: 7,  type: "sync",    source: "notion",   title: "Notion workspace indexed",           detail: "81 pages updated, 12 new relationship edges discovered",     time: "5m ago",   timestamp: Date.now() - 300000 },
  { id: 8,  type: "connect", source: "calendar", title: "Google Calendar connected",          detail: "Successfully authorized and pulling schedule data",          time: "2h ago",   timestamp: Date.now() - 7200000 },
  { id: 9,  type: "sync",    source: "notion",   title: "Notion re-indexed",                  detail: "Project timeline pages refreshed after Slack mention spike",  time: "3h ago",   timestamp: Date.now() - 10800000 },
  { id: 10, type: "query",   source: "brain",    title: "Query executed",                     detail: "\"Connect GitHub PRs to Notion project timeline\"",           time: "3h ago",   timestamp: Date.now() - 11000000 },
  { id: 11, type: "insight", source: "brain",    title: "Trend insight surfaced",             detail: "Productivity peaks on Tuesday/Thursday 9–11am identified",   time: "5h ago",   timestamp: Date.now() - 18000000 },
  { id: 12, type: "sync",    source: "slack",    title: "Slack selective sync",               detail: "15 new messages indexed from #announcements",               time: "6h ago",   timestamp: Date.now() - 21600000 },
];

const SOURCE_ICON: Record<string, React.ReactNode> = {
  slack:    <Slack    className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />,
  gmail:    <Mail     className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />,
  notion:   <FileText className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />,
  github:   <Github   className="w-3.5 h-3.5" style={{ color: "#e2e8f0" }} />,
  calendar: <Calendar className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />,
  discord:  <MessageSquare className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />,
  brain:    <Brain    className="w-3.5 h-3.5" style={{ color: "#c084fc" }} />,
};

const SOURCE_BG: Record<string, string> = {
  slack:    "bg-purple-950/40 border-purple-500/20",
  gmail:    "bg-red-950/40 border-red-500/20",
  notion:   "bg-slate-900/60 border-slate-700/30",
  github:   "bg-slate-900/60 border-slate-700/30",
  calendar: "bg-blue-950/40 border-blue-500/20",
  discord:  "bg-indigo-950/40 border-indigo-500/20",
  brain:    "bg-purple-950/30 border-purple-500/15",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  sync:    <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  query:   <Zap         className="w-3 h-3 text-purple-400" />,
  insight: <Brain       className="w-3 h-3 text-blue-400" />,
  connect: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  alert:   <AlertCircle  className="w-3 h-3 text-amber-400" />,
};

const ALL_SOURCES = ["all", "slack", "gmail", "notion", "github", "calendar", "brain"];

export default function ActivityPage() {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [search, setSearch] = useState("");

  const filtered = ACTIVITY.filter((a) => {
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (typeFilter   !== "all" && a.type   !== typeFilter)   return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.detail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight mb-1.5">Activity</h1>
          <p className="text-[14px] text-slate-400">
            Full chronological log of syncs, queries, and intelligence events.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0e0f14] border border-slate-900/80 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-400 font-mono">{ACTIVITY.length} events today</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#0e0f14] border border-slate-900 focus:border-slate-800 focus:outline-none rounded-xl text-slate-300 placeholder:text-slate-600 transition-all"
          />
        </div>

        {/* Source pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border capitalize transition-all duration-150 cursor-pointer ${
                sourceFilter === s
                  ? "text-purple-300 bg-purple-950/30 border-purple-500/25"
                  : "text-slate-500 bg-transparent border-slate-800 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              {s !== "all" && SOURCE_ICON[s]}
              {s === "all" ? `All` : s}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5 ml-2">
          {["all", "sync", "query", "insight", "alert"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border capitalize transition-all duration-150 cursor-pointer ${
                typeFilter === t
                  ? "text-blue-300 bg-blue-950/30 border-blue-500/25"
                  : "text-slate-600 border-transparent hover:border-slate-800 hover:text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-900" />

        <div className="space-y-1">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
              <Info className="w-6 h-6 mb-2" />
              <p className="text-[13px]">No events match your filters</p>
            </div>
          )}

          {filtered.map((event) => (
            <div key={event.id} className="relative flex items-start gap-4 group">
              {/* Node dot */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 transition-all duration-200 group-hover:scale-110 ${SOURCE_BG[event.source]}`}>
                {SOURCE_ICON[event.source]}
              </div>

              {/* Content */}
              <div className="flex-1 flex items-start justify-between gap-4 py-2.5 px-4 mb-1 bg-[#0e0f14]/80 border border-slate-900/60 rounded-xl hover:border-slate-800 transition-all duration-200 group-hover:-translate-y-[1px]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {TYPE_ICON[event.type]}
                    <p className="text-[12.5px] font-semibold text-slate-200 truncate">{event.title}</p>
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-snug">{event.detail}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-slate-600">{event.time}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-300 transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
