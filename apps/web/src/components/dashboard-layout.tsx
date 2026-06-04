"use client";
import React, { useState } from "react";
import {
  LayoutDashboard, Lightbulb, Network, History, Settings,
  HelpCircle, LogOut, Search, Bell, Plus, X, Zap, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NewQueryModal from "@/components/new-query-modal";
import NotificationsPanel from "@/components/notifications-panel";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

const menuItems = [
  { name: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
  { name: "Insights",     icon: Lightbulb,       href: "/insights"  },
  { name: "Integrations", icon: Network,          href: "/"          },
  { name: "Activity",     icon: History,          href: "/activity"  },
  { name: "Settings",     icon: Settings,         href: "/settings"  },
] as const;

export default function DashboardLayout({
  children,
  userName = "Alexander V.",
}: DashboardLayoutProps) {
  const pathname    = usePathname();
  const [queryOpen, setQueryOpen]  = useState(false);
  const [notifOpen, setNotifOpen]  = useState(false);
  const [searchVal, setSearchVal]  = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex w-full h-screen bg-slate-50 dark:bg-[#07080a] text-slate-800 dark:text-slate-100 font-sans overflow-hidden">

      {/* ══════ SIDEBAR ══════ */}
      <aside className="flex flex-col justify-between w-[220px] bg-white dark:bg-[#090a0f] border-r border-slate-200/60 dark:border-slate-900/60 p-5 select-none shrink-0 h-full overflow-hidden">
        <div className="flex flex-col gap-7">

          {/* Logo — waterfall step 1 */}
          <div className="flex flex-col gap-0.5 px-2 pt-2 sidebar-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <h1 className="text-[20px] font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Second Brain
            </h1>
            <span className="text-[8.5px] font-mono tracking-[0.25em] text-purple-600 dark:text-purple-400/80 font-bold uppercase">
              Extended Intelligence
            </span>
          </div>

          {/* New Query — step 2 */}
          <button
            onClick={() => setQueryOpen(true)}
            className="sidebar-in flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#c3b2e9] hover:bg-[#d2c4f3] active:scale-[0.98] text-[#090a0f] text-[13px] font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/10 dark:shadow-purple-900/20 cursor-pointer group"
            style={{ animationDelay: "160ms", animationFillMode: "both" }}
          >
            <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            New Query
          </button>

          {/* Nav — step 3+ (stagger each item) */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, i) => {
              const Icon   = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-in flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                    active
                      ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-500/25 shadow-inner"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-transparent"
                  }`}
                  style={{ animationDelay: `${260 + i * 65}ms`, animationFillMode: "both" }}
                >
                  <Icon className={`w-[17px] h-[17px] shrink-0 ${active ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500"}`} />
                  {item.name}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-purple-600 dark:text-purple-500/60" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer — last cascade items */}
        <div className="flex flex-col gap-1 border-t border-slate-200/60 dark:border-slate-900/60 pt-4">
          <button
            className="sidebar-in flex items-center gap-3 px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ animationDelay: "620ms", animationFillMode: "both" }}
          >
            <HelpCircle className="w-[17px] h-[17px] text-slate-500" />
            Help
          </button>
          <Link
            href="/login"
            className="sidebar-in flex items-center gap-3 px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-400 hover:text-red-300 hover:bg-red-950/10 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ animationDelay: "690ms", animationFillMode: "both" }}
          >
            <LogOut className="w-[17px] h-[17px] text-slate-500" />
            Logout
          </Link>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">

        {/* Top Header */}
        <header className="flex items-center justify-between px-7 py-4 border-b border-slate-200/60 dark:border-slate-900/60 bg-slate-50/80 dark:bg-[#07080a]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">

          {/* Search — header waterfall */}
          <div
            className={`header-in relative transition-all duration-300 ${searchFocused ? "w-[400px]" : "w-[300px]"}`}
            style={{ animationDelay: "120ms", animationFillMode: "both" }}
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search your consciousness..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-9 pr-4 py-2 text-[12.5px] text-slate-800 dark:text-slate-200 bg-slate-200/40 dark:bg-[#0e0f14]/80 border border-slate-200 dark:border-slate-900 focus:border-purple-500/50 dark:focus:border-purple-800/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:focus:ring-purple-800/20 rounded-xl transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
            {searchVal && (
              <button onClick={() => setSearchVal("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div
              className="header-in flex items-center gap-1.5 text-[10px] font-mono text-slate-500 tracking-widest uppercase"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Live
            </div>

            {/* Bell */}
            <div
              className="header-in relative"
              style={{ animationDelay: "270ms", animationFillMode: "both" }}
            >
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-900/30 transition-all duration-200 cursor-pointer"
              >
                <Bell className="w-[17px] h-[17px]" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
              </button>
              {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
            </div>

            {/* Profile */}
            <div
              className="header-in flex items-center gap-2.5 pl-4 border-l border-slate-200/60 dark:border-slate-900/60 cursor-pointer group"
              style={{ animationDelay: "340ms", animationFillMode: "both" }}
            >
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{userName}</span>
                <span className="text-[8px] font-mono tracking-wider text-purple-600 dark:text-purple-400/90 font-bold uppercase">Pro Intelligence</span>
              </div>
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-500/30 bg-gradient-to-br from-purple-700 to-indigo-700 dark:from-purple-900 dark:to-indigo-900 flex items-center justify-center font-bold text-[11px] text-purple-100 dark:text-purple-200 shadow-lg shadow-purple-900/20">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — final waterfall step */}
        <main
          className="content-in flex-1 overflow-y-auto p-7"
          style={{ animationDelay: "420ms", animationFillMode: "both" }}
        >
          {children}
        </main>
      </div>

      {queryOpen && <NewQueryModal onClose={() => setQueryOpen(false)} />}
    </div>
  );
}
