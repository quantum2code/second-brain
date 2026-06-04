"use client";
import React, { useState } from "react";

type ConnectorCardProps = {
  id: string;
  name: string;
  description: string;
  iconType: "slack" | "gmail" | "discord" | "calendar" | "notion" | "github";
  status: "synced" | "disconnected" | "available";
  lastSync: string;
  onStatusChange: (id: string, newStatus: "synced" | "disconnected" | "available") => void;
};

// Render custom SVGs for the connectors
const ConnectorIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "slack":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zM6.302 15.165a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.822a2.528 2.528 0 0 1-2.52-2.52v-5.042z" fill="currentColor" />
          <path d="M8.822 5.043a2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zM8.822 6.302a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.822a2.528 2.528 0 0 1 2.52-2.52h5.042z" fill="currentColor" />
          <path d="M18.958 8.822a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.52h-2.522v-2.52zM17.698 8.822a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042z" fill="currentColor" />
          <path d="M15.178 18.958a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zM15.178 17.698a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.042a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.042z" fill="currentColor" />
        </svg>
      );
    case "gmail":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
        </svg>
      );
    case "discord":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.27 4.73C17.85 4.08 16.32 3.61 14.73 3.35C14.53 3.7 14.31 4.16 14.15 4.54C12.47 4.29 10.8 4.29 9.14 4.54C8.98 4.16 8.75 3.7 8.55 3.35C6.96 3.61 5.43 4.08 4.01 4.73C1.14 9.02 0.38 13.2 0.77 17.33C2.67 18.73 4.51 19.58 6.31 20.14C6.76 19.52 7.15 18.86 7.49 18.16C6.84 17.91 6.22 17.61 5.63 17.26C5.79 17.14 5.95 17.02 6.1 16.89C9.72 18.56 13.63 18.56 17.2 16.89C17.35 17.02 17.51 17.14 17.67 17.26C17.08 17.61 16.46 17.91 15.81 18.16C16.15 18.86 16.54 19.52 16.99 20.14C18.79 19.58 20.63 18.73 22.53 17.33C23.01 12.51 21.75 8.37 19.27 4.73ZM8.34 14.65C7.26 14.65 6.37 13.66 6.37 12.44C6.37 11.22 7.24 10.23 8.34 10.23C9.44 10.23 10.33 11.23 10.31 12.44C10.31 13.66 9.43 14.65 8.34 14.65ZM15.01 14.65C13.93 14.65 13.04 13.66 13.04 12.44C13.04 11.22 13.91 10.23 15.01 10.23C16.11 10.23 17 11.23 16.98 12.44C16.98 13.66 16.11 14.65 15.01 14.65Z" fill="currentColor" />
        </svg>
      );
    case "calendar":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20ZM7 11H12V16H7V11Z" fill="currentColor" />
        </svg>
      );
    case "notion":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM13 9V3.5L18.5 9H13Z" fill="currentColor" />
        </svg>
      );
    case "github":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" />
        </svg>
      );
  }
  return null;
};

const getBrandColors = (type: string) => {
  switch (type) {
    case "slack":
      return { 
        border: "border-purple-500/20 dark:border-purple-500/20", 
        iconBg: "bg-purple-50 dark:bg-purple-950/40", 
        iconColor: "text-purple-600 dark:text-purple-300" 
      };
    case "gmail":
      return { 
        border: "border-red-500/20 dark:border-red-500/20", 
        iconBg: "bg-red-50 dark:bg-red-950/40", 
        iconColor: "text-red-600 dark:text-red-300" 
      };
    case "discord":
      return { 
        border: "border-indigo-500/20 dark:border-indigo-500/20", 
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40", 
        iconColor: "text-indigo-600 dark:text-indigo-300" 
      };
    case "calendar":
      return { 
        border: "border-blue-500/20 dark:border-blue-500/20", 
        iconBg: "bg-blue-50 dark:bg-blue-950/40", 
        iconColor: "text-blue-600 dark:text-blue-300" 
      };
    case "notion":
      return { 
        border: "border-slate-500/20 dark:border-slate-500/20", 
        iconBg: "bg-slate-100 dark:bg-slate-900/60", 
        iconColor: "text-slate-700 dark:text-slate-300" 
      };
    case "github":
      return { 
        border: "border-slate-400/20 dark:border-slate-400/20", 
        iconBg: "bg-slate-100 dark:bg-slate-900/60", 
        iconColor: "text-slate-800 dark:text-slate-200" 
      };
    default:
      return { 
        border: "border-slate-200 dark:border-slate-800", 
        iconBg: "bg-slate-100 dark:bg-slate-900", 
        iconColor: "text-slate-600 dark:text-slate-400" 
      };
  }
};

export default function ConnectorCard({
  id,
  name,
  description,
  iconType,
  status,
  lastSync,
  onStatusChange,
}: ConnectorCardProps) {
  const [connecting, setConnecting] = useState(false);
  const brand = getBrandColors(iconType);

  const handleAction = () => {
    if (status === "synced") {
      onStatusChange(id, "disconnected");
    } else {
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        onStatusChange(id, "synced");
      }, 1500);
    }
  };

  return (
    <div className={`relative flex flex-col justify-between p-6 bg-white dark:bg-[#12131a]/95 border border-slate-200 dark:border-slate-900 rounded-2xl shadow-sm dark:shadow-xl transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-800 hover:-translate-y-[2px] hover:shadow-md dark:hover:shadow-2xl overflow-hidden group`}>
      {/* Dynamic Background Glow on Hover */}
      <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
      
      <div>
        {/* Header (Icon + Status Badge) */}
        <div className="flex items-center justify-between mb-5">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${brand.iconBg} border ${brand.border} ${brand.iconColor} shadow-sm dark:shadow-md dark:shadow-slate-950/20`}>
            <ConnectorIcon type={iconType} />
          </div>

          {/* Status Badge */}
          {status === "synced" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[9px] font-mono tracking-widest text-blue-600 dark:text-blue-400 font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>
              Synced
            </div>
          ) : status === "disconnected" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[9px] font-mono tracking-widest text-slate-500 font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
              Disconnected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[9px] font-mono tracking-widest text-slate-600 dark:text-slate-400 font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Available
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100 mb-2 tracking-wide group-hover:text-slate-950 group-hover:dark:text-white transition-colors duration-300">
          {name}
        </h3>

        {/* Description */}
        <p className="text-[12.5px] leading-[1.6] text-slate-600 dark:text-slate-400 font-normal mb-6 min-h-[60px] tracking-normal">
          {description}
        </p>
      </div>

      {/* Footer (Sync Status + Action Button) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-900/60">
        <span className="text-[11px] font-sans text-slate-400 dark:text-slate-500">
          {connecting ? "Connecting..." : status === "synced" ? `Last sync: ${lastSync}` : status === "disconnected" ? "Never synced" : "Auth required"}
        </span>

        {status === "synced" ? (
          <button
            onClick={handleAction}
            disabled={connecting}
            className="px-4 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1b24] dark:hover:bg-[#222430] border border-slate-200 dark:border-slate-800 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Manage
          </button>
        ) : (
          <button
            onClick={handleAction}
            disabled={connecting}
            className="relative px-4 py-1.5 text-[12px] font-semibold text-slate-950 bg-[#d8b4fe] hover:bg-[#e9d5ff] rounded-lg transition-all duration-200 shadow-md shadow-purple-500/10 active:scale-95 cursor-pointer overflow-hidden disabled:opacity-85"
          >
            {connecting ? (
              <span className="flex items-center justify-center gap-1">
                <svg className="animate-spin h-3 w-3 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ...
              </span>
            ) : (
              "Connect"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
