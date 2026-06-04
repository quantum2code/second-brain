"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Zap,
  Hash,
  Slack,
  Mail,
  Github,
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";

interface NewQueryModalProps {
  onClose: () => void;
}

const EXAMPLE_QUERIES = [
  "Summarize this week's Slack decisions across all channels",
  "What are my action items from Gmail in the last 48 hours?",
  "Connect my GitHub PRs to the Notion project timeline",
  "What meetings should I prepare for tomorrow?",
  "Find knowledge gaps in my Notion workspace",
];

const SOURCE_FILTERS = [
  { id: "slack", label: "Slack", icon: Slack, color: "#a855f7" },
  { id: "gmail", label: "Gmail", icon: Mail, color: "#ef4444" },
  { id: "notion", label: "Notion", icon: FileText, color: "#94a3b8" },
  { id: "github", label: "GitHub", icon: Github, color: "#e2e8f0" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "#3b82f6" },
  { id: "discord", label: "Discord", icon: MessageSquare, color: "#6366f1" },
];

export default function NewQueryModal({ onClose }: NewQueryModalProps) {
  const [query, setQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["slack", "gmail", "notion"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 2200));

    const mockResults: Record<string, string> = {
      default:
        "Based on your connected sources, I found 3 high-priority action items: (1) Review the Q2 roadmap PR on GitHub before Thursday, (2) Reply to Sarah's email about the design sprint, (3) Your 10am standup requires context from the #product-updates channel. Your Second Brain has synthesized 47 nodes to generate this insight.",
    };

    setResult(mockResults["default"]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[620px] bg-[#0d0e16] border border-slate-800/60 rounded-2xl shadow-2xl shadow-purple-950/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-bold text-slate-100">New Intelligence Query</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5">
                {selectedSources.length} source{selectedSources.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Source Filters */}
          <div>
            <p className="text-[10.5px] font-mono text-slate-500 tracking-widest uppercase mb-2.5">
              Query Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {SOURCE_FILTERS.map(({ id, label, icon: Icon, color }) => {
                const active = selectedSources.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleSource(id)}
                    style={active ? { borderColor: `${color}40`, backgroundColor: `${color}12` } : {}}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all duration-200 cursor-pointer ${
                      active
                        ? "text-slate-200"
                        : "border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? color : undefined }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Second Brain anything across your connected sources..."
              rows={3}
              className="w-full px-4 py-3.5 text-[13.5px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-800/60 focus:ring-1 focus:ring-purple-900/30 focus:outline-none rounded-xl resize-none transition-all duration-200 placeholder:text-slate-600 leading-relaxed"
              style={{ minHeight: "100px", maxHeight: "200px" }}
            />
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-600">
              ⌘ ENTER TO SEND
            </div>
          </div>

          {/* Example Queries */}
          {!query && !result && (
            <div>
              <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase mb-2">
                <Clock className="w-3 h-3 inline mr-1" />
                Suggested
              </p>
              <div className="space-y-1.5">
                {EXAMPLE_QUERIES.slice(0, 3).map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setQuery(eq)}
                    className="w-full text-left text-[11.5px] text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-900/50 border border-transparent hover:border-slate-800 transition-all duration-150 truncate group"
                  >
                    <Hash className="w-3 h-3 inline mr-2 text-slate-600 group-hover:text-purple-400" />
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Result */}
          {result && (
            <div className="bg-[#0a0b12] border border-purple-900/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-mono text-purple-400 tracking-widest uppercase">
                  Intelligence Response
                </span>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed">{result}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 mt-3">
                <span className="text-[9px] font-mono text-slate-600 tracking-wider">
                  SYNTHESIZED FROM {selectedSources.length} SOURCES · {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0b12] border border-slate-800/60 rounded-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[11.5px] text-slate-400 font-mono">
                Synthesizing across {selectedSources.length} sources...
              </span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-slate-600 tracking-wide">
              {query.length > 0 ? `${query.length} chars` : "Type to start"}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c3b2e9] hover:bg-[#d2c4f3] disabled:opacity-40 disabled:cursor-not-allowed text-[#090a0f] text-[12.5px] font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-purple-900/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#090a0f]/30 border-t-[#090a0f] rounded-full animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Run Query
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
