"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  Sparkles, TrendingUp, Brain, Lightbulb, ArrowRight,
  Slack, Mail, FileText, Github, Calendar, MessageSquare,
  RefreshCw, ThumbsUp, Bookmark,
} from "lucide-react";


const SOURCE_COLORS: Record<string, string> = {
  slack: "#a855f7",
  gmail: "#ef4444",
  notion: "#94a3b8",
  github: "#e2e8f0",
  calendar: "#3b82f6",
  discord: "#6366f1",
};

const INSIGHTS = [
  {
    id: 1,
    type: "pattern",
    title: "Communication Bottleneck Detected",
    body: "You spend 34% more time on Slack threads that involve the design team. 3 unresolved decision threads from last week may be blocking sprint progress.",
    sources: ["slack"],
    impact: "high",
    saved: false,
    liked: false,
  },
  {
    id: 2,
    type: "opportunity",
    title: "Cross-Source Context Gap",
    body: "Your GitHub PR #142 (feat/ai-context-engine) has no corresponding Notion documentation. This creates onboarding friction for 4 team members.",
    sources: ["github", "notion"],
    impact: "high",
    saved: false,
    liked: false,
  },
  {
    id: 3,
    type: "trend",
    title: "Productivity Peak Pattern",
    body: "Analysis of your calendar and Notion activity shows you complete 67% more deep-work tasks between 9–11am. Tuesday and Thursday are your highest-output days.",
    sources: ["calendar", "notion"],
    impact: "med",
    saved: true,
    liked: true,
  },
  {
    id: 4,
    type: "action",
    title: "Overdue Email Thread",
    body: "A Gmail thread from Sarah Chen (5 days old) contains 3 unresolved action items related to the Q2 roadmap. Automated context suggests a 15-minute reply would close all items.",
    sources: ["gmail"],
    impact: "med",
    saved: false,
    liked: false,
  },
  {
    id: 5,
    type: "pattern",
    title: "Knowledge Cluster Forming",
    body: "Your Notion pages around 'AI Architecture' are increasingly referenced in Slack. Suggest creating a dedicated team wiki page to reduce repeated context-sharing.",
    sources: ["notion", "slack"],
    impact: "low",
    saved: false,
    liked: false,
  },
];

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pattern: {
    label: "Pattern",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-500/20",
    icon: <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
  },
  opportunity: {
    label: "Opportunity",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-500/20",
    icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
  },
  trend: {
    label: "Trend",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-500/20",
    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
  },
  action: {
    label: "Action Needed",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-500/20",
    icon: <Lightbulb className="w-3.5 h-3.5 text-amber-650 dark:text-amber-400" />,
  },
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  slack: <Slack className="w-3 h-3" />,
  gmail: <Mail className="w-3 h-3" />,
  notion: <FileText className="w-3 h-3" />,
  github: <Github className="w-3 h-3" />,
  calendar: <Calendar className="w-3 h-3" />,
  discord: <MessageSquare className="w-3 h-3" />,
};

const IMPACT_STYLE: Record<string, string> = {
  high: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/20",
  med: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/20",
  low: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800",
};

export default function InsightsPage() {
  const [insights, setInsights] = useState(INSIGHTS);
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const toggle = (id: number, key: "saved" | "liked") =>
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: !i[key as keyof typeof i] } : i)));

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRefreshing(false);
  };

  const filters = ["all", "pattern", "opportunity", "trend", "action"];
  const filtered = filter === "all" ? insights : insights.filter((i) => i.type === filter);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 dark:text-white tracking-tight mb-1.5">Insights</h1>
          <p className="text-[14px] text-slate-500 dark:text-slate-400">
            AI-synthesized intelligence across all your connected sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#0e0f14] border border-slate-200 dark:border-slate-800 text-[12px] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:border-slate-350 dark:hover:text-white dark:hover:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-[#0e0f14] border border-slate-200 dark:border-slate-900/80 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {insights.length} insights · last updated 2m ago
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-lg capitalize transition-all duration-200 cursor-pointer ${
              filter === f
                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/25"
                : "text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent hover:border-slate-250 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/30"
            }`}
          >
            {f === "all" ? `All (${insights.length})` : f}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filtered.map((insight, idx) => {
          const typeStyle = TYPE_STYLES[insight.type];
          return (
            <ScrollReveal key={insight.id} delay={idx * 80}>
            <div
              className="p-5 bg-white dark:bg-[#0e0f14] border border-slate-200 dark:border-slate-900/80 rounded-2xl shadow-sm dark:shadow-none hover:border-slate-350 dark:hover:border-slate-800 hover:-translate-y-[2px] transition-all duration-200 group"
            >

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Type badge icon */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-xl border shrink-0 mt-0.5 ${typeStyle.bg} ${typeStyle.border}`}>
                    {typeStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[9.5px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md border ${typeStyle.bg} ${typeStyle.border} ${typeStyle.color}`}>
                        {typeStyle.label}
                      </span>
                      <span className={`text-[9.5px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md border ${IMPACT_STYLE[insight.impact]}`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-slate-950 group-hover:dark:text-white transition-colors">
                      {insight.title}
                    </h3>
                    <p className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.body}</p>

                    {/* Sources */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] text-slate-450 dark:text-slate-600 font-mono">Sources:</span>
                      <div className="flex items-center gap-1.5">
                        {insight.sources.map((s) => (
                          <div
                            key={s}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                            style={{ color: SOURCE_COLORS[s] }}
                          >
                            {SOURCE_ICONS[s]}
                            <span className="text-[9px] font-mono capitalize">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 border border-purple-200 dark:border-purple-500/20 rounded-lg transition-all duration-150 cursor-pointer">
                    Take Action <ArrowRight className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={() => toggle(insight.id, "liked")}
                      className={`p-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${insight.liked ? "text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20" : "text-slate-450 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-355 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggle(insight.id, "saved")}
                      className={`p-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${insight.saved ? "text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20" : "text-slate-450 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-355 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      <Bookmark className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </ScrollReveal>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
