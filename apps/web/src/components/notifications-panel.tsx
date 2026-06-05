"use client";
import React from "react";
import { X, Zap, GitPullRequest, Mail, Bell, CheckCheck } from "lucide-react";

interface NotificationsPanelProps {
  onClose: () => void;
}

const NOTIFS = [
  {
    id: 1,
    icon: Zap,
    iconColor: "#a855f7",
    iconBg: "bg-purple-950/50 border-purple-500/20",
    title: "Slack sync complete",
    body: "47 new nodes indexed from #product-updates",
    time: "2m ago",
    unread: true,
  },
  {
    id: 2,
    icon: Mail,
    iconColor: "#ef4444",
    iconBg: "bg-red-950/50 border-red-500/20",
    title: "3 action items detected",
    body: "Gmail found critical deadlines in your inbox",
    time: "15m ago",
    unread: true,
  },
  {
    id: 3,
    icon: GitPullRequest,
    iconColor: "#e2e8f0",
    iconBg: "bg-slate-900/80 border-slate-700/40",
    title: "GitHub PR needs review",
    body: "feat/ai-context-engine awaits your input",
    time: "1h ago",
    unread: false,
  },
  {
    id: 4,
    icon: Bell,
    iconColor: "#3b82f6",
    iconBg: "bg-blue-950/50 border-blue-500/20",
    title: "Calendar reminder",
    body: "Design sprint standup in 30 minutes",
    time: "2h ago",
    unread: false,
  },
];

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#0d0e16] border border-slate-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Top gradient line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900/60">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[12px] font-semibold text-slate-200">Notifications</span>
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-600/80 text-[8px] font-bold text-white">
              2
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-900/40 max-h-[340px] overflow-y-auto">
          {NOTIFS.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-900/30 transition-colors cursor-pointer ${n.unread ? "bg-purple-950/5" : ""}`}
              >
                <div className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${n.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" style={{ color: n.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[12px] font-semibold truncate ${n.unread ? "text-slate-100" : "text-slate-400"}`}>
                      {n.title}
                    </p>
                    <span className="text-[9px] text-slate-600 shrink-0 font-mono">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                </div>
                {n.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-900/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">4 NOTIFICATIONS</span>
          <button className="flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        </div>
      </div>
    </>
  );
}
