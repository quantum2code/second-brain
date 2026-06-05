"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  FileText, ExternalLink, Reply, Zap, X,
  ChevronRight, Brain, Sparkles, Hash, Link2,
  AlertCircle, Calendar, Clock, User, ArrowUpRight,
} from "lucide-react";

/* ─── Keyframes ─── */
const STYLES = `
@keyframes drawLine {
  from { transform: scaleY(0); transform-origin: top; }
  to   { transform: scaleY(1); transform-origin: top; }
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateX(28px); }
  to   { opacity: 1; transform: translateX(0);    }
}
@keyframes dotPop {
  0%   { opacity: 0; transform: scale(0);    }
  60%  { opacity: 1; transform: scale(1.35); }
  100% { opacity: 1; transform: scale(1);    }
}
@keyframes timeFade {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes scanDown {
  0%   { top: 0;    opacity: 0;   }
  10%  { opacity: 0.7;            }
  90%  { opacity: 0.3;            }
  100% { top: 100%; opacity: 0;   }
}
@keyframes panelIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0);    }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes sectionFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
.timeline-line   { animation: drawLine 1.2s cubic-bezier(0.22,1,0.36,1) both; }
.timeline-scan   { position:absolute; left:0; right:0; height:60px;
                   background:linear-gradient(to bottom,transparent,rgba(168,85,247,0.08),transparent);
                   animation:scanDown 4s ease-in-out infinite; pointer-events:none; }
.dot-pop         { animation: dotPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
.card-slide      { animation: cardSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) both; }
.time-fade       { animation: timeFade 0.4s ease both; }
.panel-in        { animation: panelIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
.new-shimmer     { background:linear-gradient(90deg,rgba(168,85,247,0) 0%,rgba(168,85,247,0.08) 50%,rgba(168,85,247,0) 100%);
                   background-size:200% 100%; animation:shimmer 2.5s linear 0.8s 2; }
.section-fade    { animation: sectionFadeUp 0.4s ease both; }
`;

/* ─── Types ─── */
type ActionItem = { label: string; icon?: "reply"|"open"|"doc"; secondary?: boolean };
type FeedCard = {
  id: string; title: string; age: string;
  isNew?: boolean; isUpcoming?: boolean;
  sourceIcon: string; sourceName: string;
  sourceTag: string; sourceTagStyle?: "alert"|"ready"|"default";
  summaryLabel: string; body: string;
  actions: ActionItem[];
  attachments?: string[];
};
type CardDetail = {
  aiAnalysis: string;
  priority: "critical"|"high"|"medium"|"low";
  relatedNodes: { label: string; type: string; source: string }[];
  suggestedActions: string[];
  meta: { key: string; value: string }[];
  thread?: { author: string; time: string; text: string }[];
};

/* ─── Feed data ─── */
const FEED_CARDS: FeedCard[] = [
  {
    id: "product-launch", title: "Product Launch Prep", age: "4m ago", isNew: true,
    sourceIcon: "slack", sourceName: "Slack", sourceTag: "#Go-To-Market",
    summaryLabel: "Summary",
    body: "The engineering team is flagging a 24h delay on the API docs. Sarah suggests moving the press release to Thursday. High urgency for your approval on the revised timeline.",
    actions: [{ label: "Reply to Sarah", icon: "reply" }, { label: "Open App", icon: "open", secondary: true }],
  },
  {
    id: "quarterly-review", title: "Quarterly Review Contract", age: "10m ago",
    sourceIcon: "gmail", sourceName: "Gmail", sourceTag: "Action Required", sourceTagStyle: "alert",
    summaryLabel: "Deep Dive",
    body: "Legal has returned the MSA with three redlines on the liability clause. All other terms match our previous agreement. Estimated review time: 10 mins.",
    actions: [{ label: "Review Redlines" }, { label: "Contracts", icon: "doc", secondary: true }],
  },
  {
    id: "strategy-sync", title: "Strategy Sync: Q3 Roadmap", age: "In 45 mins", isUpcoming: true,
    sourceIcon: "calendar", sourceName: "Calendar", sourceTag: "Ready to Brief", sourceTagStyle: "ready",
    summaryLabel: "Preparation",
    body: "I've pulled your notes from last week's whiteboard session and the current velocity charts. The main friction point will be resource allocation for the 'Nebula' project.",
    actions: [],
    attachments: ["Roadmap_V2.pdf", "Sprint_Velocity.csv"],
  },
  {
    id: "github-pr", title: "PR #142 Needs Review", age: "1h ago",
    sourceIcon: "github", sourceName: "GitHub", sourceTag: "feat/ai-context-engine",
    summaryLabel: "Summary",
    body: "3 files changed, 240 additions. The context-retrieval logic has been refactored to use a streaming pipeline. No breaking changes to existing connectors.",
    actions: [{ label: "Review PR", icon: "open" }],
  },
];

/* ─── Rich detail per card ─── */
const CARD_DETAILS: Record<string, CardDetail> = {
  "product-launch": {
    aiAnalysis: "This is a high-urgency blocker. The API docs delay directly impacts the press release, which is tied to 3 downstream tasks: partner outreach, media brief, and CEO comms. Approving a Thursday delay now prevents a cascade failure across the GTM plan.",
    priority: "critical",
    relatedNodes: [
      { label: "Press Release Draft v3", type: "document", source: "Notion" },
      { label: "#product-updates", type: "channel", source: "Slack" },
      { label: "Sarah Chen", type: "contact", source: "Gmail" },
      { label: "GTM Milestone tracker", type: "document", source: "Notion" },
    ],
    suggestedActions: [
      "Reply to Sarah confirming Thursday shift",
      "Update milestone tracker in Notion",
      "Notify CEO & comms lead of delay",
    ],
    meta: [
      { key: "Channel", value: "#go-to-market" },
      { key: "Participants", value: "Sarah Chen, Dev Team (4)" },
      { key: "Urgency", value: "Critical — approval required today" },
      { key: "Indexed", value: "4 minutes ago" },
    ],
    thread: [
      { author: "Sarah Chen", time: "9:42am", text: "Hey team — engineering just flagged the API docs won't be ready until Thursday at earliest." },
      { author: "Dev Lead", time: "9:51am", text: "Confirmed. We need 24h more to complete the reference section." },
      { author: "Sarah Chen", time: "10:03am", text: "Can we get approval to shift the PR to Thursday? Need a decision ASAP." },
    ],
  },
  "quarterly-review": {
    aiAnalysis: "Legal's three redlines are concentrated in Section 7 (Liability) of the MSA. Based on your previous contract patterns, redlines 1 and 3 are standard negotiation postures — redline 2 (indemnification cap) requires your legal counsel's review before responding.",
    priority: "high",
    relatedNodes: [
      { label: "MSA Draft v2.1", type: "document", source: "Gmail" },
      { label: "Legal Review Notes", type: "document", source: "Notion" },
      { label: "Q2 Contract Archive", type: "folder", source: "Gmail" },
    ],
    suggestedActions: [
      "Forward redlines to legal counsel",
      "Schedule 30-min review call with legal",
      "Check precedent MSAs for liability cap range",
    ],
    meta: [
      { key: "From", value: "legal@partnerco.com" },
      { key: "Subject", value: "RE: MSA Q3 — Redlines" },
      { key: "Est. Review", value: "10 minutes" },
      { key: "Deadline", value: "EOD Friday" },
    ],
    thread: [
      { author: "Legal (Partner)", time: "8:15am", text: "Please find attached MSA with three redlines. Sections 7.2, 7.4, and 12.1 require your input." },
      { author: "You (AI Draft)", time: "—", text: "Draft reply available: acknowledge receipt, request 48h for internal review." },
    ],
  },
  "strategy-sync": {
    aiAnalysis: "You have 45 minutes before this meeting. Your Second Brain has pre-loaded the Q3 velocity data and cross-referenced it with the 'Nebula' project resource plan. The key talking point will be a 15% resource gap in weeks 8–10 that aligns with two other team commitments.",
    priority: "medium",
    relatedNodes: [
      { label: "Roadmap_V2.pdf", type: "document", source: "Notion" },
      { label: "Sprint_Velocity.csv", type: "data", source: "GitHub" },
      { label: "Nebula Project Plan", type: "document", source: "Notion" },
      { label: "Q3 Strategy Whiteboard", type: "note", source: "Notion" },
    ],
    suggestedActions: [
      "Review Roadmap_V2 resource section",
      "Prepare 3-slide exec summary",
      "Confirm attendees in Calendar",
    ],
    meta: [
      { key: "Meeting", value: "Strategy Sync: Q3 Roadmap" },
      { key: "Starts", value: "In 45 minutes" },
      { key: "Attendees", value: "6 people" },
      { key: "Duration", value: "60 minutes" },
    ],
  },
  "github-pr": {
    aiAnalysis: "PR #142 refactors the core context-retrieval pipeline to streaming. This unblocks 2 open issues (#139, #140) and improves query latency by an estimated 40%. The diff is clean but the streaming error-handling in line 287 should be verified against your existing retry logic.",
    priority: "medium",
    relatedNodes: [
      { label: "Issue #139 — Latency spike", type: "issue", source: "GitHub" },
      { label: "Issue #140 — Timeout errors", type: "issue", source: "GitHub" },
      { label: "Architecture Notes", type: "document", source: "Notion" },
    ],
    suggestedActions: [
      "Review streaming error handler (line 287)",
      "Run integration tests locally",
      "Approve or request changes",
    ],
    meta: [
      { key: "PR", value: "#142 — feat/ai-context-engine" },
      { key: "Author", value: "dev-bot[bot]" },
      { key: "Changes", value: "+240 / -18 across 3 files" },
      { key: "Status", value: "Awaiting review" },
    ],
  },
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "text-red-300 bg-red-950/40 border-red-700/40",
  high:     "text-amber-300 bg-amber-950/40 border-amber-700/40",
  medium:   "text-blue-300 bg-blue-950/40 border-blue-700/40",
  low:      "text-slate-400 bg-slate-900/40 border-slate-700/40",
};

/* ─── Sub helpers ─── */
function SourceIcon({ type, size = 14 }: { type: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  switch (type) {
    case "slack": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#a855f7" }}><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="currentColor"/></svg>;
    case "gmail": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#ef4444" }}><path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/></svg>;
    case "discord": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#6366f1" }}><path d="M19.27 4.73C17.85 4.08 16.32 3.61 14.73 3.35C14.53 3.7 14.31 4.16 14.15 4.54C12.47 4.29 10.8 4.29 9.14 4.54C8.98 4.16 8.75 3.7 8.55 3.35C6.96 3.61 5.43 4.08 4.01 4.73C1.14 9.02 0.38 13.2 0.77 17.33C2.67 18.73 4.51 19.58 6.31 20.14C6.76 19.52 7.15 18.86 7.49 18.16C6.84 17.91 6.22 17.61 5.63 17.26C5.79 17.14 5.95 17.02 6.1 16.89C9.72 18.56 13.63 18.56 17.2 16.89C17.35 17.02 17.51 17.14 17.67 17.26C17.08 17.61 16.46 17.91 15.81 18.16C16.15 18.86 16.54 19.52 16.99 20.14C18.79 19.58 20.63 18.73 22.53 17.33C23.01 12.51 21.75 8.37 19.27 4.73ZM8.34 14.65C7.26 14.65 6.37 13.66 6.37 12.44C6.37 11.22 7.24 10.23 8.34 10.23C9.44 10.23 10.33 11.23 10.31 12.44C10.31 13.66 9.43 14.65 8.34 14.65ZM15.01 14.65C13.93 14.65 13.04 13.66 13.04 12.44C13.04 11.22 13.91 10.23 15.01 10.23C16.11 10.23 17 11.23 16.98 12.44C16.98 13.66 16.11 14.65 15.01 14.65Z" fill="currentColor"/></svg>;
    case "calendar": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#3b82f6" }}><path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM7 11H12V16H7V11Z" fill="currentColor"/></svg>;
    case "github": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#e2e8f0" }}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/></svg>;
    default: return <FileText style={s} />;
  }
}

function ActionBtn({ label, icon, secondary }: ActionItem) {
  const base = "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border rounded transition-all duration-150 cursor-pointer";
  return (
    <button className={secondary
      ? `${base} text-slate-500 border-slate-300 dark:border-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600`
      : `${base} text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600/60 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/60`}>
      {icon === "reply" && <Reply className="w-3 h-3" />}
      {icon === "open"  && <ExternalLink className="w-3 h-3" />}
      {icon === "doc"   && <FileText className="w-3 h-3" />}
      {label}
    </button>
  );
}

/* ─── Detail Panel ─── */
function DetailPanel({ card, detail, onClose }: { card: FeedCard; detail: CardDetail; onClose: () => void }) {
  return (
    <div className="panel-in flex flex-col bg-white dark:bg-[#0d0e16] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden w-full overflow-y-auto shadow-md dark:shadow-none" style={{ maxHeight: "calc(100vh - 130px)" }}>
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent shrink-0" />

      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-900/60 shrink-0">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0"><SourceIcon type={card.sourceIcon} size={14} /></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">{card.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{card.sourceName}</span>
              <span className="text-slate-400 dark:text-slate-700">/</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                card.sourceTagStyle === "alert" ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40" :
                card.sourceTagStyle === "ready" ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-700/40" :
                "text-slate-500 border-transparent"
              }`}>{card.sourceTag}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0 divide-y divide-slate-200 dark:divide-slate-900/50">
        {/* Priority + meta */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest">Priority</p>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${PRIORITY_STYLE[detail.priority]}`}>
              {detail.priority}
            </span>
          </div>
          <div className="space-y-1.5">
            {detail.meta.map(({ key, value }) => (
              <div key={key} className="flex items-start justify-between gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-600 shrink-0">{key}</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 text-right leading-snug">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <p className="text-[9px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-widest font-bold">AI Analysis</p>
          </div>
          <p className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">{detail.aiAnalysis}</p>
        </div>

        {/* Thread (if present) */}
        {detail.thread && (
          <div className="px-4 py-3 section-fade" style={{ animationDelay: "180ms" }}>
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest mb-2.5">Thread</p>
            <div className="space-y-2.5">
              {detail.thread.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                    <User className="w-2.5 h-2.5 text-slate-550 dark:text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-750 dark:text-slate-300">{msg.author}</span>
                      <span className="text-[9px] text-slate-450 dark:text-slate-600 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-650 dark:text-slate-400 leading-snug mt-0.5">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related nodes */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Link2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest">Related Nodes</p>
          </div>
          <div className="space-y-1.5">
            {detail.relatedNodes.map((node) => (
              <div key={node.label}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-lg hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer group">
                <SourceIcon type={node.source.toLowerCase()} size={11} />
                <span className="text-[10.5px] text-slate-700 dark:text-slate-300 flex-1 truncate">{node.label}</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Suggested actions */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest">Suggested Actions</p>
          </div>
          <div className="space-y-1.5">
            {detail.suggestedActions.map((action, i) => (
              <button key={i}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[10.5px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-55 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg transition-all cursor-pointer text-left group">
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors shrink-0" />
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        {card.actions.length > 0 && (
          <div className="px-4 py-3 section-fade" style={{ animationDelay: "360ms" }}>
            <div className="flex flex-wrap gap-2">
              {card.actions.map((a) => <ActionBtn key={a.label} {...a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Quick Pulse sidebar (default state) ─── */
const QUICK_PULSE = [
  { id: "slack",    label: "Slack",           sub: "4 Active Channels", status: "syncing", icon: "slack"    },
  { id: "gmail",    label: "Gmail",           sub: "2 Priority Alerts", status: "idle",    icon: "gmail"    },
  { id: "discord",  label: "Discord",         sub: "Listening...",       status: "syncing", icon: "discord"  },
  { id: "calendar", label: "Google Calendar", sub: "No conflicts",       status: "live",    icon: "calendar" },
];

function StatusDot({ status }: { status: string }) {
  return status !== "idle" ? (
    <span className="flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-400">
      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${status === "syncing" ? "animate-pulse" : ""}`} />
      {status === "syncing" ? "Syncing" : "Live"}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest uppercase text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />Idle
    </span>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<"latest"|"all">("latest");
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const selectedCard   = FEED_CARDS.find((c) => c.id === selectedId) ?? null;
  const selectedDetail = selectedId ? CARD_DETAILS[selectedId] : null;

  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="flex gap-5 items-start">
        {/* ── Left: Timeline Feed ── */}
        <div className={`transition-all duration-300 min-w-0 ${selectedId ? "w-[400px] shrink-0" : "flex-1"}`}>
          {/* Header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-[26px] font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-1.5">Intelligence Feed</h1>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-500">Curated synthesis of your digital ecosystem.</p>
            </div>
            <div className="flex items-center gap-2">
              {(["latest","all"] as const).map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    activeFilter === f && f === "all"
                      ? "text-purple-750 dark:text-purple-200 border-purple-300 dark:border-purple-600/60 bg-purple-50 dark:bg-purple-950/40" :
                    activeFilter === f && f === "latest"
                      ? "text-slate-850 dark:text-slate-200 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/60" :
                    "text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}>
                  {f === "all" && <Zap className="w-3 h-3" />}
                  {f === "latest" ? "Latest 1h" : "AI Active"}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {mounted && (
            <div className="flex gap-0">
              {/* Track */}
              <div className="relative flex flex-col items-center pt-1 mr-4" style={{ width: 28 }}>
                <div className="timeline-scan" />
                <div className="timeline-line absolute top-2 w-px"
                  style={{ left: "50%", transform: "translateX(-50%)", bottom: 0,
                    background: "linear-gradient(to bottom,#7c3aed 0%,#4f46e5 40%,rgba(51,65,85,0.3) 90%,transparent 100%)" }} />
                {FEED_CARDS.map((card, i) => (
                  <div key={card.id} className="relative z-10 flex items-center justify-center"
                    style={{ marginBottom: i < FEED_CARDS.length - 1 ? "calc(1rem + 118px)" : 0 }}>
                    {i === 0 && <span className="absolute w-5 h-5 rounded-full bg-purple-500/20 animate-ping" />}
                    <div className="dot-pop relative z-10 rounded-full border-2 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedId(card.id === selectedId ? null : card.id)}
                      style={{
                        width: i === 0 ? 14 : 11, height: i === 0 ? 14 : 11,
                        animationDelay: `${i * 160 + 300}ms`, animationFillMode: "both",
                        borderColor: selectedId === card.id ? "#c084fc" : i === 0 ? "#a855f7" : card.isUpcoming ? "#3b82f6" : "#475569",
                        backgroundColor: selectedId === card.id ? "#9333ea" : i === 0 ? "#7c3aed" : card.isUpcoming ? "#1d4ed8" : "#1e293b",
                        boxShadow: selectedId === card.id ? "0 0 0 3px rgba(168,85,247,0.25)" : "none",
                      }} />
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-4">
                {FEED_CARDS.map((card, i) => (
                  <div key={card.id}>
                    <div className="time-fade flex items-center gap-2 mb-2"
                      style={{ animationDelay: `${i * 160 + 80}ms`, animationFillMode: "both" }}>
                      {card.isNew && <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-purple-650 dark:text-purple-400"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />New</span>}
                      {card.isUpcoming && <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />Upcoming</span>}
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">{card.age}</span>
                    </div>

                    {/* Clickable card */}
                    <div className="card-slide" style={{ animationDelay: `${i * 160}ms`, animationFillMode: "both" }}>
                      <div
                        onClick={() => setSelectedId(card.id === selectedId ? null : card.id)}
                        className={`relative bg-white dark:bg-[#111218] border rounded-xl overflow-hidden transition-all duration-250 cursor-pointer
                          hover:-translate-y-[2px] hover:shadow-md dark:hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/40
                          ${selectedId === card.id
                            ? "border-purple-500 dark:border-purple-600/50 shadow-md dark:shadow-lg shadow-purple-200/40 dark:shadow-purple-950/30 -translate-y-[2px]"
                            : card.isNew ? "border-purple-300 dark:border-purple-800/40 new-shimmer hover:border-slate-350 dark:hover:border-slate-700/60" : "border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700/60"
                          }`}
                      >
                        {/* Selected accent */}
                        {selectedId === card.id && (
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-600 via-purple-400 to-transparent" />
                        )}
                        {card.isNew && selectedId !== card.id && (
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/80 via-purple-300/60 to-transparent" />
                        )}

                        <div className="p-4">
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="mt-0.5 shrink-0"><SourceIcon type={card.sourceIcon} size={14} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[13.5px] font-bold text-slate-800 dark:text-white leading-tight">{card.title}</h3>
                                <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-all duration-200 ${selectedId === card.id ? "text-purple-600 dark:text-purple-400 rotate-90" : "text-slate-400 dark:text-slate-700"}`} />
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">{card.sourceName}</span>
                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                {card.sourceTagStyle === "alert" ? (
                                  <span className="text-[9px] font-mono font-bold uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-1.5 py-0.5 rounded tracking-widest">{card.sourceTag}</span>
                                ) : card.sourceTagStyle === "ready" ? (
                                  <span className="text-[9px] font-mono font-bold uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-700/40 px-1.5 py-0.5 rounded tracking-widest">{card.sourceTag}</span>
                                ) : (
                                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">{card.sourceTag}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-[12px] text-slate-605 dark:text-slate-400 leading-relaxed line-clamp-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{card.summaryLabel}: </span>{card.body}
                          </p>
                          {/* Hint when collapsed */}
                          {selectedId !== card.id && (
                            <p className="text-[9.5px] text-slate-400 dark:text-slate-600 font-mono mt-2 uppercase tracking-widest">Click to expand →</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="time-fade flex items-center gap-3 mt-2"
                  style={{ animationDelay: `${FEED_CARDS.length * 160 + 200}ms`, animationFillMode: "both" }}>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-700 tracking-widest uppercase">End of feed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Detail Panel OR Quick Pulse ── */}
        <div className={`transition-all duration-300 ${selectedId ? "flex-1 min-w-0" : "w-[210px] shrink-0"}`}>
          {selectedCard && selectedDetail ? (
            /* Detail panel */
            <div className="sticky top-0 pt-14">
              <DetailPanel
                card={selectedCard}
                detail={selectedDetail}
                onClose={() => setSelectedId(null)}
              />
            </div>
          ) : (
            /* Default: Quick Pulse + Brain Capacity */
            <div className="space-y-4 pt-14">
              <div className="bg-white dark:bg-[#111218] border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-4 pt-4 pb-3">
                  <p className="text-[9px] font-mono font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-3">Quick Pulse</p>
                  <div className="space-y-3.5">
                    {QUICK_PULSE.map((src) => (
                      <div key={src.id} className="flex items-center gap-2.5">
                        <SourceIcon type={src.icon} size={13} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-none">{src.label}</p>
                          <p className="text-[9px] text-slate-450 dark:text-slate-600 mt-0.5 truncate">{src.sub}</p>
                        </div>
                        <StatusDot status={src.status} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 pb-4 mt-1">
                  <button className="w-full py-2 text-[9px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-all cursor-pointer">
                    Manage Connections
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111218] border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 shadow-sm dark:shadow-none">
                <p className="text-[9px] font-mono font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-3">Brain Capacity</p>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[34px] font-black text-slate-800 dark:text-white leading-none">82%</span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Optimized</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-2.5">
                  <div className="h-full rounded-full" style={{ width:"82%", background:"linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)", boxShadow:"0 0 12px rgba(168,85,247,0.4)" }} />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed italic">
                  &ldquo;Your cognitive load is slightly high. AI is auto-archiving non-essential Slack notifications to maintain focus.&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
