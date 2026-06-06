"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { formatDateInIST } from "@/lib/time";
import {
  CheckSquare, ExternalLink, X, ChevronRight, Brain, Link2,
  AlertCircle, User, ArrowUpRight, Clock, MessageSquare, Zap,
  Sparkles, CalendarDays,
} from "lucide-react";

/* ─── Keyframes & CSS ─── */
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
@keyframes sectionFadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes skeletonPulse {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.75; }
}
@keyframes msgSlideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.timeline-line   { animation: drawLine 1.2s cubic-bezier(0.22,1,0.36,1) both; }
.timeline-scan   { position:absolute; left:0; right:0; height:60px;
                   background:linear-gradient(to bottom,transparent,rgba(168,85,247,0.08),transparent);
                   animation:scanDown 4s ease-in-out infinite; pointer-events:none; }
.dot-pop         { animation: dotPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
.card-slide      { animation: cardSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) both; }
.time-fade       { animation: timeFade 0.4s ease both; }
.panel-in        { animation: panelIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
.section-fade    { animation: sectionFadeUp 0.4s ease both; }
.skeleton-pulse  { animation: skeletonPulse 1.6s ease-in-out infinite; }
.msg-slide       { animation: msgSlideDown 0.25s ease both; }
.feed-scroll     { scrollbar-width: none; -ms-overflow-style: none; }
.feed-scroll::-webkit-scrollbar { display: none; }
`;

/* ─── API types (mirror server) ─── */
type TodoMessage = {
  id: string;
  content: string;
  createdAt: string;
  client: string;
  author: string;
};

type TodoFeedItem = {
  id: string;
  name: string;
  scheduledAt?: string;
  rawTemporal?: string;
  todoDescription?: string;
  topic?: string;
  messages: TodoMessage[];
  isUpcoming: boolean;
  isRecent: boolean;
};

type EventFeedItem = {
  id: string;
  title: string;
  detail: string;
  createdAt?: string;
  scheduledAt?: string;
  rawTemporal?: string;
  isUpcoming: boolean;
  isRecent: boolean;
};

/* ─── Helpers ─── */
function formatAge(createdAt: string): string {
  const delta = Date.now() - new Date(createdAt).getTime();
  const mins  = Math.floor(delta / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatScheduled(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs > 0) {
    const mins = Math.round(diffMs / 60_000);
    if (mins < 60)  return `Due in ${mins}m`;
    if (mins < 1440) return `Due in ${Math.round(mins / 60)}h`;
    return `Due ${formatDateInIST(d)}`;
  }
  const overMs = -diffMs;
  const overMins = Math.round(overMs / 60_000);
  if (overMins < 60)  return `Overdue ${overMins}m`;
  if (overMins < 1440) return `Overdue ${Math.round(overMins / 60)}h`;
  return `Overdue ${formatDateInIST(d)}`;
}

const clientToIcon = (c: string) => (["slack","discord","gmail","github","calendar"].includes(c) ? c : "github");
const clientToName = (c: string) => ({ slack:"Slack", discord:"Discord", gmail:"Gmail", github:"GitHub", calendar:"Calendar" }[c] ?? c.charAt(0).toUpperCase()+c.slice(1));

/* ─── Live todos hook ─── */
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

function useEvents() {
  const [events, setEvents] = useState<EventFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/arcadedb/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { events: EventFeedItem[] };
      if (data.events.length > 0) {
        setEvents(data.events);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const iv = setInterval(fetchEvents, 30_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, loading, error, isLive };
}

function useTodos() {
  const [todos,   setTodos]   = useState<TodoFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isLive,  setIsLive]  = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/arcadedb/todos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { todos: TodoFeedItem[] };
      if (data.todos.length > 0) {
        setTodos(data.todos);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    const iv = setInterval(fetchTodos, 30_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { todos, loading, error, isLive };
}

/* ─── Demo data ─── */
const DEMO_TODOS: TodoFeedItem[] = [
  {
    id: "Submit Launch Brief",
    name: "Submit Launch Brief",
    rawTemporal: "tomorrow",
    topic: "Product Launch",
    messages: [
      { id: "slack:001", content: "hey everyone, reminder to submit the launch brief by tomorrow EOD", createdAt: new Date(Date.now() - 4 * 60_000).toISOString(), client: "slack", author: "Sarah Chen" },
      { id: "slack:002", content: "I can help review it before submission if needed", createdAt: new Date(Date.now() - 2 * 60_000).toISOString(), client: "slack", author: "Dev Lead" },
    ],
    isUpcoming: true, isRecent: true,
  },
  {
    id: "Review Legal Redlines",
    name: "Review Legal Redlines",
    scheduledAt: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
    topic: "Q3 Contract MSA",
    messages: [
      { id: "gmail:001", content: "Please find attached MSA with three redlines in sections 7.2, 7.4 and 12.1", createdAt: new Date(Date.now() - 10 * 60_000).toISOString(), client: "gmail", author: "legal@partnerco.com" },
    ],
    isUpcoming: true, isRecent: false,
  },
  {
    id: "Review PR #142",
    name: "Review PR #142",
    rawTemporal: "today",
    topic: "AI Context Engine",
    messages: [
      { id: "github:001", content: "PR #142 is ready for review — context-retrieval refactored to streaming pipeline. 240 additions across 3 files.", createdAt: new Date(Date.now() - 60 * 60_000).toISOString(), client: "github", author: "dev-bot[bot]" },
    ],
    isUpcoming: false, isRecent: false,
  },
];

const DEMO_EVENTS: EventFeedItem[] = [
  {
    id: "slack:evt-001",
    title: "Launch brief reminder",
    detail: "Reminder to submit the launch brief by tomorrow EOD.",
    createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    isUpcoming: true,
    isRecent: true,
  },
  {
    id: "gmail:evt-002",
    title: "Legal redlines received",
    detail: "MSA attached with notes on sections 7.2, 7.4 and 12.1.",
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    isUpcoming: true,
    isRecent: false,
  },
  {
    id: "github:evt-003",
    title: "PR #142 ready for review",
    detail: "Context retrieval refactored to a streaming pipeline.",
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    isUpcoming: false,
    isRecent: false,
  },
];

function getEventTimeLabel(event: EventFeedItem) {
  if (event.scheduledAt) return formatScheduled(event.scheduledAt);
  if (event.rawTemporal) return event.rawTemporal;
  if (event.createdAt) return formatAge(event.createdAt);
  return "Event";
}

function EventCard({ event }: { event: EventFeedItem }) {
  return (
    <div className="snap-start min-w-[260px] max-w-[260px] rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#111218] overflow-hidden shadow-sm dark:shadow-none hover:-translate-y-0.5 transition-transform">
      <div className="h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Event
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {event.isUpcoming && (
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border text-blue-300 border-blue-700/40 bg-blue-950/30">
                Upcoming
              </span>
            )}
            {event.isRecent && !event.isUpcoming && (
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border text-purple-300 border-purple-700/40 bg-purple-950/30">
                New
              </span>
            )}
          </div>
        </div>

        <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{event.title}</h3>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500 leading-snug line-clamp-3">{event.detail}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600 shrink-0">{getEventTimeLabel(event)}</span>
        </div>
      </div>
    </div>
  );
}

function EventCarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden pb-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="min-w-[260px] max-w-[260px] rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#111218] p-4">
          <div className="skeleton-pulse h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800/70 mb-3" />
          <div className="skeleton-pulse h-3 w-20 rounded bg-slate-200 dark:bg-slate-800/70 mb-2" />
          <div className="skeleton-pulse h-4 w-44 rounded bg-slate-200 dark:bg-slate-800/70 mb-2" />
          <div className="skeleton-pulse h-3 w-full rounded bg-slate-200 dark:bg-slate-800/70 mb-1.5" />
          <div className="skeleton-pulse h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800/70" />
        </div>
      ))}
    </div>
  );
}

/* ─── Source Icon ─── */
function SourceIcon({ type, size = 13 }: { type: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  switch (type) {
    case "slack":    return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#a855f7" }}><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="currentColor"/></svg>;
    case "gmail":    return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#ef4444" }}><path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/></svg>;
    case "discord":  return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#6366f1" }}><path d="M19.27 4.73C17.85 4.08 16.32 3.61 14.73 3.35C14.53 3.7 14.31 4.16 14.15 4.54C12.47 4.29 10.8 4.29 9.14 4.54C8.98 4.16 8.75 3.7 8.55 3.35C6.96 3.61 5.43 4.08 4.01 4.73C1.14 9.02 0.38 13.2 0.77 17.33C2.67 18.73 4.51 19.58 6.31 20.14C6.76 19.52 7.15 18.86 7.49 18.16C6.84 17.91 6.22 17.61 5.63 17.26C5.79 17.14 5.95 17.02 6.1 16.89C9.72 18.56 13.63 18.56 17.2 16.89C17.35 17.02 17.51 17.14 17.67 17.26C17.08 17.61 16.46 17.91 15.81 18.16C16.15 18.86 16.54 19.52 16.99 20.14C18.79 19.58 20.63 18.73 22.53 17.33C23.01 12.51 21.75 8.37 19.27 4.73ZM8.34 14.65C7.26 14.65 6.37 13.66 6.37 12.44C6.37 11.22 7.24 10.23 8.34 10.23C9.44 10.23 10.33 11.23 10.31 12.44C10.31 13.66 9.43 14.65 8.34 14.65ZM15.01 14.65C13.93 14.65 13.04 13.66 13.04 12.44C13.04 11.22 13.91 10.23 15.01 10.23C16.11 10.23 17 11.23 16.98 12.44C16.98 13.66 16.11 14.65 15.01 14.65Z" fill="currentColor"/></svg>;
    case "calendar": return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#3b82f6" }}><path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM7 11H12V16H7V11Z" fill="currentColor"/></svg>;
    case "github":   return <svg viewBox="0 0 24 24" fill="none" style={{ ...s, color: "#e2e8f0" }}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/></svg>;
    default:         return <MessageSquare style={s} className="text-slate-500" />;
  }
}

/* ─── Skeleton ─── */
function FeedSkeleton() {
  return (
    <div className="flex gap-0">
      <div className="relative flex flex-col items-center pt-1 mr-4" style={{ width: 28 }}>
        <div className="absolute top-2 w-px bg-slate-800/40" style={{ left: "50%", transform: "translateX(-50%)", bottom: 0 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative z-10 flex items-center justify-center"
            style={{ marginBottom: i < 2 ? "calc(1rem + 140px)" : 0 }}>
            <div className="skeleton-pulse w-3 h-3 rounded-full bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="skeleton-pulse h-2 w-20 bg-slate-800 rounded mb-2" />
            <div className="skeleton-pulse bg-slate-800/60 border border-slate-800/50 rounded-xl p-4">
              <div className="skeleton-pulse h-3.5 w-48 bg-slate-700 rounded mb-3" />
              <div className="skeleton-pulse h-2 w-full bg-slate-700/60 rounded mb-2" />
              <div className="skeleton-pulse h-8 w-full bg-slate-800/80 rounded-lg mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Detail panel ─── */
function DetailPanel({ todo, onClose }: { todo: TodoFeedItem; onClose: () => void }) {
  const priority = todo.isUpcoming ? "high" : todo.isRecent ? "medium" : "low";
  const PRIORITY_STYLE: Record<string, string> = {
    high:   "text-amber-300 bg-amber-950/40 border-amber-700/40",
    medium: "text-blue-300 bg-blue-950/40 border-blue-700/40",
    low:    "text-slate-400 bg-slate-900/40 border-slate-700/40",
  };

  return (
    <div className="panel-in flex flex-col bg-white dark:bg-[#0d0e16] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden w-full overflow-y-auto shadow-md dark:shadow-none" style={{ maxHeight: "calc(100vh - 130px)" }}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent shrink-0" />

      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-900/60 shrink-0">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <CheckSquare className="w-3.5 h-3.5 mt-0.5 text-purple-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">{todo.name}</h3>
            {todo.topic && (
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{todo.topic}</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all shrink-0 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0 divide-y divide-slate-200 dark:divide-slate-900/50">
        {/* Meta */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-mono text-slate-500 dark:text-slate-600 uppercase tracking-widest">Priority</p>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${PRIORITY_STYLE[priority]}`}>
              {priority}
            </span>
          </div>
          <div className="space-y-1.5">
            {todo.scheduledAt && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-600">Due</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300">{formatScheduled(todo.scheduledAt)}</span>
              </div>
            )}
            {todo.rawTemporal && !todo.scheduledAt && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-600">When</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 capitalize">{todo.rawTemporal}</span>
              </div>
            )}
            {todo.todoDescription && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-600">Notes</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 text-right">{todo.todoDescription}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-600">Sources</span>
              <span className="text-[10px] text-slate-700 dark:text-slate-300">{todo.messages.length} message{todo.messages.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <p className="text-[9px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-widest font-bold">AI Analysis</p>
          </div>
          <p className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {todo.messages.length === 0
              ? "This todo has no linked messages yet."
              : `This task was surfaced from ${todo.messages.length} message${todo.messages.length > 1 ? "s" : ""} across ${[...new Set(todo.messages.map(m => clientToName(m.client)))].join(", ")}. `
                + (todo.scheduledAt ? `It is ${formatScheduled(todo.scheduledAt).toLowerCase()}. ` : todo.rawTemporal ? `It is due ${todo.rawTemporal}. ` : "")
                + (todo.topic ? `Context: ${todo.topic}.` : "")
            }
          </p>
        </div>

        {/* Source messages */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Link2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest">Source Messages</p>
          </div>
          {todo.messages.length === 0 ? (
            <p className="text-[10px] text-slate-500 dark:text-slate-600 italic">No messages linked yet.</p>
          ) : (
            <div className="space-y-2">
              {todo.messages.map((msg) => (
                <div key={msg.id} className="flex gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <SourceIcon type={clientToIcon(msg.client)} size={11} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 truncate">{msg.author}</span>
                      <span className="text-[8px] font-mono text-slate-400 dark:text-slate-600 shrink-0">{formatAge(msg.createdAt)}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">{msg.content}</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested actions */}
        <div className="px-4 py-3 section-fade" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <p className="text-[9px] font-mono text-slate-450 dark:text-slate-600 uppercase tracking-widest">Suggested Actions</p>
          </div>
          <div className="space-y-1.5">
            {[
              `Complete: ${todo.name}`,
              todo.scheduledAt ? `Set reminder for ${formatScheduled(todo.scheduledAt)}` : `Schedule this task`,
              `Reply on ${todo.messages[0] ? clientToName(todo.messages[0].client) : "source"}`,
            ].map((action, i) => (
              <button key={i} className="w-full flex items-center gap-2 px-2.5 py-2 text-[10.5px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg transition-all cursor-pointer text-left group">
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors shrink-0" />
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Todo Card ─── */
function TodoCard({
  todo, selected, onSelect,
}: { todo: TodoFeedItem; selected: boolean; onSelect: () => void }) {
  const due = todo.scheduledAt
    ? formatScheduled(todo.scheduledAt)
    : todo.rawTemporal
    ? todo.rawTemporal.charAt(0).toUpperCase() + todo.rawTemporal.slice(1)
    : null;

  const isOverdue = todo.scheduledAt
    ? new Date(todo.scheduledAt) < new Date()
    : false;

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white dark:bg-[#111218] border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer
        hover:-translate-y-[2px] hover:shadow-md dark:hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/40
        ${selected
          ? "border-purple-500 dark:border-purple-600/50 shadow-md dark:shadow-lg shadow-purple-200/40 dark:shadow-purple-950/30 -translate-y-[2px]"
          : todo.isRecent
          ? "border-purple-300 dark:border-purple-800/40 hover:border-slate-350 dark:hover:border-slate-700/60"
          : "border-slate-200 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700/60"
        }`}
    >
      {/* Top accent */}
      {selected && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-600 via-purple-400 to-transparent" />}
      {todo.isRecent && !selected && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/80 via-purple-300/60 to-transparent" />}

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <CheckSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selected ? "text-purple-500" : "text-slate-400 dark:text-slate-600"}`} />
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">{todo.name}</h3>
              {todo.topic && (
                <p className="text-[9px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">{todo.topic}</p>
              )}
            </div>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-all duration-200 ${selected ? "text-purple-600 dark:text-purple-400 rotate-90" : "text-slate-400 dark:text-slate-700"}`} />
        </div>

        {/* Due badge */}
        {due && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-widest mb-2.5 ${
            isOverdue
              ? "text-red-400 border-red-700/40 bg-red-950/30"
              : todo.isUpcoming
              ? "text-blue-400 border-blue-700/40 bg-blue-950/30"
              : "text-slate-400 border-slate-700/40 bg-slate-900/30"
          }`}>
            <Clock className="w-2.5 h-2.5" />
            {due}
          </div>
        )}

        {/* Messages list */}
        {todo.messages.length > 0 && (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-600" />
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                {todo.messages.length} message{todo.messages.length !== 1 ? "s" : ""}
              </span>
            </div>
            {todo.messages.map((msg, i) => (
              <div key={msg.id}
                className="msg-slide flex items-start gap-2 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40"
                style={{ animationDelay: `${i * 60}ms` }}>
                <SourceIcon type={clientToIcon(msg.client)} size={11} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 truncate">{msg.author}</span>
                    <span className="text-[8px] font-mono text-slate-400 dark:text-slate-600 shrink-0">{formatAge(msg.createdAt)}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-500 leading-snug mt-0.5 line-clamp-2">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!selected && (
          <p className="text-[9px] font-mono text-slate-400 dark:text-slate-700 mt-2.5 uppercase tracking-widest">Click to expand →</p>
        )}
      </div>
    </div>
  );
}

/* ─── Quick Pulse sidebar ─── */
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
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming">("all");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [mounted,      setMounted]      = useState(false);

  const { todos: liveTodos, loading, error, isLive } = useTodos();
  const { events: liveEvents, loading: eventsLoading, error: eventsError, isLive: eventsLive } = useEvents();

  useEffect(() => { setMounted(true); }, []);

  const allTodos = isLive ? liveTodos : DEMO_TODOS;
  const allEvents = eventsLive ? liveEvents : DEMO_EVENTS;
  const todos = activeFilter === "upcoming"
    ? allTodos.filter((t) => t.isUpcoming)
    : allTodos;

  const selectedTodo = todos.find((t) => t.id === selectedId) ?? null;

  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="flex gap-5 items-start" style={{ height: "calc(100vh - 80px)" }}>

        {/* ── Left: Todo Timeline ── */}
        <div className={`flex flex-col h-full transition-all duration-300 min-w-0 ${selectedId ? "w-[440px] shrink-0" : "flex-1"}`}>

          {/* Events carousel */}
          <div className="shrink-0 mb-4">
            <div className="flex items-end justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[9px] font-mono text-slate-500 dark:text-slate-600 uppercase tracking-[0.22em]">Events</p>
                  <span className={`flex items-center gap-1 text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                    eventsLive
                      ? "text-emerald-400 border-emerald-700/40 bg-emerald-950/30"
                      : "text-slate-500 border-slate-700/40 bg-slate-900/40"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${eventsLive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                    {eventsLoading ? "loading" : eventsLive ? "live" : eventsError ? "offline" : "demo"}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-500">Recent source activity in a quick scan.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-600 uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-purple-500" />
                {allEvents.length} cards
              </div>
            </div>

            <div className="feed-scroll overflow-x-auto overflow-y-hidden pb-1">
              {mounted && eventsLoading ? (
                <EventCarouselSkeleton />
              ) : allEvents.length === 0 ? (
                <div className="flex items-center justify-center h-[138px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-600 text-[11px]">
                  No events yet
                </div>
              ) : (
                <div className="flex gap-3 snap-x snap-mandatory">
                  {allEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pinned header */}
          <div className="flex items-end justify-between mb-5 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-[26px] font-bold text-slate-800 dark:text-white tracking-tight leading-none">Task Feed</h1>
                <span className={`flex items-center gap-1 text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                  isLive
                    ? "text-emerald-400 border-emerald-700/40 bg-emerald-950/30"
                    : "text-slate-500 border-slate-700/40 bg-slate-900/40"
                }`}>
                  <span className={`w-1 h-1 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                  {loading ? "connecting…" : isLive ? "live" : error ? "offline" : "demo"}
                </span>
              </div>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-500">
                {isLive
                  ? `${todos.length} todo${todos.length !== 1 ? "s" : ""} extracted from your knowledge graph.`
                  : "Todos extracted from your connected channels."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(["all", "upcoming"] as const).map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    activeFilter === f && f === "upcoming"
                      ? "text-blue-200 border-blue-600/60 bg-blue-950/40" :
                    activeFilter === f
                      ? "text-slate-200 border-slate-600 bg-slate-800/60" :
                    "text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-300 hover:border-slate-700"
                  }`}>
                  {f === "upcoming" && <Zap className="w-3 h-3" />}
                  {f === "all" ? "All Tasks" : "Upcoming"}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable timeline */}
          <div className="relative flex-1 min-h-0">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 z-10"
              style={{ background: "linear-gradient(to bottom, transparent, #09090f)" }} />

            <div className="feed-scroll overflow-y-auto h-full pb-14">
              {mounted && (
                loading ? <FeedSkeleton /> : todos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckSquare className="w-8 h-8 text-slate-700 mb-3" />
                    <p className="text-[12px] text-slate-500 font-mono uppercase tracking-widest">No tasks found</p>
                    <p className="text-[11px] text-slate-600 mt-1">Send a message with a todo to see it here</p>
                  </div>
                ) : (
                  <div className="flex gap-0">
                    {/* Timeline track */}
                    <div className="relative flex flex-col items-center pt-1 mr-4" style={{ width: 28 }}>
                      <div className="timeline-scan" />
                      <div className="timeline-line absolute top-2 w-px"
                        style={{ left: "50%", transform: "translateX(-50%)", bottom: 0,
                          background: "linear-gradient(to bottom,#7c3aed 0%,#4f46e5 40%,rgba(51,65,85,0.3) 90%,transparent 100%)" }} />
                      {todos.map((todo, i) => (
                        <div key={todo.id} className="relative z-10 flex items-center justify-center"
                          style={{ marginBottom: i < todos.length - 1 ? `calc(1rem + ${Math.max(100, 60 + todo.messages.length * 60)}px)` : 0 }}>
                          {i === 0 && <span className="absolute w-5 h-5 rounded-full bg-purple-500/20 animate-ping" />}
                          <div className="dot-pop relative z-10 rounded-full border-2 cursor-pointer transition-all duration-200"
                            onClick={() => setSelectedId(todo.id === selectedId ? null : todo.id)}
                            style={{
                              width: i === 0 ? 14 : 11, height: i === 0 ? 14 : 11,
                              animationDelay: `${i * 160 + 300}ms`, animationFillMode: "both",
                              borderColor: selectedId === todo.id ? "#c084fc" : i === 0 ? "#a855f7" : todo.isUpcoming ? "#3b82f6" : "#475569",
                              backgroundColor: selectedId === todo.id ? "#9333ea" : i === 0 ? "#7c3aed" : todo.isUpcoming ? "#1d4ed8" : "#1e293b",
                              boxShadow: selectedId === todo.id ? "0 0 0 3px rgba(168,85,247,0.25)" : "none",
                            }} />
                        </div>
                      ))}
                    </div>

                    {/* Cards */}
                    <div className="flex-1 space-y-4">
                      {todos.map((todo, i) => (
                        <div key={todo.id}>
                          <div className="time-fade flex items-center gap-2 mb-2"
                            style={{ animationDelay: `${i * 160 + 80}ms`, animationFillMode: "both" }}>
                            {todo.isRecent && (
                              <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-purple-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />New
                              </span>
                            )}
                            {todo.isUpcoming && (
                              <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase text-blue-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />Upcoming
                              </span>
                            )}
                            {todo.messages[0] && (
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
                                {formatAge(todo.messages[0].createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="card-slide" style={{ animationDelay: `${i * 160}ms`, animationFillMode: "both" }}>
                            <TodoCard
                              todo={todo}
                              selected={selectedId === todo.id}
                              onSelect={() => setSelectedId(todo.id === selectedId ? null : todo.id)}
                            />
                          </div>
                        </div>
                      ))}

                      <div className="time-fade flex items-center gap-3 mt-2"
                        style={{ animationDelay: `${todos.length * 160 + 200}ms`, animationFillMode: "both" }}>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-700 tracking-widest uppercase">
                          {isLive ? `${todos.length} task${todos.length !== 1 ? "s" : ""} · refreshes every 30s` : "End of feed"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Detail Panel OR Quick Pulse ── */}
        <div className={`feed-scroll overflow-y-auto h-full transition-all duration-300 ${selectedId ? "flex-1 min-w-0" : "w-[210px] shrink-0"}`}>
          {selectedTodo ? (
            <div className="pt-14">
              <DetailPanel todo={selectedTodo} onClose={() => setSelectedId(null)} />
            </div>
          ) : (
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
                  <div className="h-full rounded-full" style={{ width: "82%", background: "linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)", boxShadow: "0 0 12px rgba(168,85,247,0.4)" }} />
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
