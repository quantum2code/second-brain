"use client";
import React, { useState, useEffect } from "react";
import { Brain } from "lucide-react";

const MESSAGES = [
  "Initializing neural pathways...",
  "Syncing connected sources...",
  "Mapping knowledge graph...",
  "Second Brain is ready.",
];

/* Neural node positions: [x%, y%] */
const NODES = [
  { x: 8,  y: 12, size: 3, anim: "floatA", delay: "0s",    dur: "6s"  },
  { x: 18, y: 68, size: 2, anim: "floatB", delay: "1s",    dur: "8s"  },
  { x: 30, y: 30, size: 4, anim: "floatC", delay: "0.5s",  dur: "7s"  },
  { x: 72, y: 15, size: 3, anim: "floatA", delay: "2s",    dur: "9s"  },
  { x: 85, y: 55, size: 2, anim: "floatB", delay: "0.8s",  dur: "6s"  },
  { x: 92, y: 80, size: 4, anim: "floatC", delay: "1.5s",  dur: "7.5s"},
  { x: 45, y: 8,  size: 2, anim: "floatA", delay: "0.3s",  dur: "8s"  },
  { x: 60, y: 85, size: 3, anim: "floatB", delay: "1.2s",  dur: "6.5s"},
  { x: 78, y: 38, size: 2, anim: "floatC", delay: "0.7s",  dur: "9s"  },
  { x: 12, y: 45, size: 3, anim: "floatA", delay: "1.8s",  dur: "7s"  },
];

/* SVG lines between nearby nodes (pairs by index) */
const CONNECTIONS = [
  [0, 2], [2, 6], [6, 4], [1, 3], [3, 8], [5, 8], [7, 5], [9, 1], [4, 6],
];

export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [msgIdx,   setMsgIdx]   = useState(0);
  const [exiting,  setExiting]  = useState(false);
  const [hidden,   setHidden]   = useState(false);

  useEffect(() => {
    // Check if we've already shown the loader this session
    if (sessionStorage.getItem("sb_loaded")) {
      setHidden(true);
      return;
    }

    const p = [
      [20,  200],
      [45,  650],
      [72, 1150],
      [100,1700],
    ];
    const m = [[1, 600], [2, 1200], [3, 1650]];

    p.forEach(([val, t]) => setTimeout(() => setProgress(val as number), t as number));
    m.forEach(([idx, t]) => setTimeout(() => setMsgIdx(idx as number), t as number));

    setTimeout(() => setExiting(true), 2100);
    setTimeout(() => {
      setHidden(true);
      sessionStorage.setItem("sb_loaded", "1");
    }, 2800);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#07080a] select-none"
      style={{
        transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        opacity:   exiting ? 0 : 1,
        transform: exiting ? "scale(1.018)" : "scale(1)",
        pointerEvents: exiting ? "none" : "all",
      }}
    >
      {/* ── Neural network background ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ animation: "connectorPulse 4s ease-in-out infinite" }}
      >
        {CONNECTIONS.map(([a, b], i) => (
          <line
            key={i}
            x1={`${NODES[a].x}%`} y1={`${NODES[a].y}%`}
            x2={`${NODES[b].x}%`} y2={`${NODES[b].y}%`}
            stroke="rgba(168,85,247,0.12)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Floating nodes */}
      {NODES.map((n, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-purple-500"
          style={{
            left: `${n.x}%`, top: `${n.y}%`,
            width: n.size * 2, height: n.size * 2,
            opacity: 0.35,
            animation: `${n.anim} ${n.dur} ease-in-out ${n.delay} infinite`,
            boxShadow: `0 0 ${n.size * 4}px rgba(168,85,247,0.4)`,
          }}
        />
      ))}

      {/* ── Central loader ── */}
      <div className="relative flex flex-col items-center gap-7">
        {/* Outer orbit rings */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Ring 1 – slow clockwise */}
          <div className="absolute inset-0 rounded-full"
            style={{
              border: "1px solid rgba(168,85,247,0.18)",
              animation: "spin 12s linear infinite",
            }}
          />
          {/* Ring 2 – medium counter-clockwise with dashes */}
          <div className="absolute rounded-full"
            style={{
              inset: 14,
              border: "1px dashed rgba(99,102,241,0.22)",
              animation: "spin 8s linear infinite reverse",
            }}
          />
          {/* Ring 3 – fast inner */}
          <div className="absolute rounded-full"
            style={{
              inset: 30,
              border: "1px solid rgba(192,132,252,0.15)",
              animation: "spin 5s linear infinite",
            }}
          />

          {/* Orbiting dot 1 */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "spin 3.2s linear infinite" }}>
            <div className="absolute" style={{ top: 0, left: "50%", marginLeft: -3, marginTop: -3 }}>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"
                style={{ boxShadow: "0 0 8px rgba(168,85,247,0.9)" }} />
            </div>
          </div>
          {/* Orbiting dot 2 */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "spin 5s linear infinite reverse" }}>
            <div className="absolute" style={{ bottom: 14, left: "50%", marginLeft: -2 }}>
              <div className="w-1 h-1 rounded-full bg-indigo-400"
                style={{ boxShadow: "0 0 6px rgba(99,102,241,0.9)" }} />
            </div>
          </div>

          {/* Glow behind core */}
          <div className="absolute rounded-full bg-purple-700/20 blur-xl"
            style={{ inset: 32 }} />

          {/* Core brain */}
          <div
            className="relative z-10 flex items-center justify-center rounded-full bg-[#10091e] border border-purple-600/40"
            style={{
              width: 72, height: 72,
              animation: "logoPulse 2.4s ease-in-out infinite",
            }}
          >
            <Brain className="w-9 h-9 text-purple-300" />
          </div>
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-[22px] font-bold text-white tracking-tight" style={{ animation: "fadeIn 0.5s ease 0.3s both" }}>
            Second Brain
          </h1>
          <span className="text-[8.5px] font-mono tracking-[0.3em] text-purple-400/80 font-bold uppercase" style={{ animation: "fadeIn 0.5s ease 0.5s both" }}>
            Extended Intelligence
          </span>
        </div>

        {/* Status message */}
        <p
          className="text-[10.5px] font-mono text-slate-500 tracking-widest text-center"
          style={{
            minWidth: 260, minHeight: 16,
            animation: "fadeIn 0.3s ease both",
            transition: "opacity 0.3s ease",
          }}
        >
          {MESSAGES[msgIdx]}
          <span style={{ animation: "textBlink 0.9s step-start infinite" }}>_</span>
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2" style={{ width: 260 }}>
        <div className="h-px w-full bg-slate-900/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #5b21b6, #a855f7, #c084fc)",
              transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
              animation: "progressGlow 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[8.5px] font-mono text-slate-700 tracking-widest">LOADING</span>
          <span className="text-[8.5px] font-mono text-slate-600 tracking-wider">{progress}%</span>
        </div>
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right,#0f172a18 1px,transparent 1px),linear-gradient(to bottom,#0f172a18 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
