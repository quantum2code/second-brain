"use client";
import React, { useState, useEffect, useRef } from "react";

type Node = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  connected: boolean;
  color: string;
};

interface InteractiveNodesGraphProps {
  connections: Record<string, boolean>;
}

export default function InteractiveNodesGraph({ connections }: InteractiveNodesGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: "slack", name: "Slack", type: "connector", x: 120, y: 80, connected: true, color: "#a855f7" },
    { id: "gmail", name: "Gmail", type: "connector", x: 260, y: 70, connected: true, color: "#ef4444" },
    { id: "discord", name: "Discord", type: "connector", x: 400, y: 90, connected: false, color: "#6366f1" },
    { id: "calendar", name: "Google Calendar", type: "connector", x: 100, y: 220, connected: true, color: "#3b82f6" },
    { id: "notion", name: "Notion", type: "connector", x: 250, y: 240, connected: true, color: "#9ca3af" },
    { id: "github", name: "GitHub", type: "connector", x: 420, y: 210, connected: false, color: "#f3f4f6" },
  ]);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Sync connection state from dashboard component
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        connected: connections[n.id] ?? n.connected,
      }))
    );
  }, [connections]);

  const centerNode = {
    id: "brain",
    name: "Second Brain",
    x: 270,
    y: 150,
    color: "#c084fc",
  };

  const handleMouseDown = (nodeId: string) => {
    setDraggedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNodeId || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain inside SVG viewbox dimensions (approx 540x300)
    const constrainedX = Math.max(20, Math.min(rect.width - 20, x));
    const constrainedY = Math.max(20, Math.min(rect.height - 20, y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggedNodeId ? { ...n, x: constrainedX, y: constrainedY } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  return (
    <div className="relative w-full h-[300px] bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md select-none group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>
      
      {/* Animated subtle central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-purple-900/10 blur-[60px] pointer-events-none"></div>

      <svg
        ref={svgRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        viewBox="0 0 540 300"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Custom Glow Filters */}
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.7   0 0 0 0 0.5   0 0 0 0 1   0 0 0 0.8 0"/>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lines / Connections */}
        {nodes.map((node) => {
          const isNodeHovered = hoveredNodeId === node.id;
          return (
            <g key={`link-${node.id}`}>
              {/* Animated pulses along active connection lines */}
              {node.connected && (
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={centerNode.x}
                  y2={centerNode.y}
                  stroke={node.color}
                  strokeWidth="2.5"
                  opacity="0.3"
                  className="animate-pulse"
                />
              )}
              <line
                x1={node.x}
                y1={node.y}
                x2={centerNode.x}
                y2={centerNode.y}
                stroke={node.connected ? node.color : "#334155"}
                strokeWidth={isNodeHovered ? "2" : "1.2"}
                strokeDasharray={node.connected ? "0" : "5,5"}
                opacity={node.connected ? "0.6" : "0.3"}
                className="transition-all duration-300"
              />
            </g>
          );
        })}

        {/* Central Core Brain Node */}
        <g transform={`translate(${centerNode.x}, ${centerNode.y})`} className="cursor-pointer">
          {/* Outer rotating/pulsing aura */}
          <circle
            r="26"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            className="animate-[spin_20s_linear_infinite]"
            opacity="0.4"
          />
          <circle
            r="22"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1"
            opacity="0.6"
            className="animate-ping"
            style={{ animationDuration: "3s" }}
          />
          <circle
            r="16"
            fill="url(#brain-gradient)"
            className="fill-purple-950 stroke-purple-400 stroke-[2.5]"
            filter="url(#glow-purple)"
          />
          {/* Simple brain-like node core visual */}
          <circle r="6" fill="#f3e8ff" />
          <text
            y="36"
            textAnchor="middle"
            className="fill-purple-300 font-mono text-[10px] tracking-widest uppercase font-semibold pointer-events-none"
          >
            {centerNode.name}
          </text>
        </g>

        {/* Surrounding Nodes */}
        {nodes.map((node) => {
          const isNodeHovered = hoveredNodeId === node.id;
          const scale = isNodeHovered ? 1.25 : 1;
          
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-grab active:cursor-grabbing transition-transform duration-250 ease-out"
              onMouseDown={() => handleMouseDown(node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{ transform: `translate(${node.x}px, ${node.y}px) scale(${scale})` }}
            >
              {/* Outer halo for connected items */}
              {node.connected && (
                <circle
                  r="14"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1"
                  opacity="0.25"
                  className="animate-pulse"
                />
              )}
              {/* Connector base circle */}
              <circle
                r="10"
                fill="#0b0f19"
                stroke={node.connected ? node.color : "#334155"}
                strokeWidth={node.connected ? "2" : "1.5"}
                className="transition-all duration-300"
                filter={node.connected ? "url(#glow-active)" : undefined}
              />
              {/* Core dot indicator */}
              <circle
                r="4"
                fill={node.connected ? node.color : "#475569"}
                className="transition-all duration-300"
              />
              
              {/* Label */}
              <text
                y="-18"
                textAnchor="middle"
                className={`font-sans text-[11px] font-medium pointer-events-none select-none transition-colors duration-300 ${
                  node.connected ? "fill-slate-200" : "fill-slate-500"
                }`}
              >
                {node.name}
              </text>
              {/* Status sublabel */}
              <text
                y="22"
                textAnchor="middle"
                className={`font-mono text-[8px] tracking-wider uppercase pointer-events-none select-none transition-colors duration-300 ${
                  node.connected ? "fill-blue-400" : "fill-slate-600"
                }`}
              >
                {node.connected ? "Synced" : "Offline"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Instructions */}
      <div className="absolute bottom-3 right-4 font-mono text-[9px] text-slate-500 pointer-events-none transition-opacity duration-300 group-hover:text-slate-400">
        DRAG NODES TO CUSTOMIZE RELATIONSHIPS
      </div>
    </div>
  );
}
