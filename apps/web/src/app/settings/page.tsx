"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useTheme } from "next-themes";
import {
  User, Bell, Shield, Zap, Palette, Database,
  ChevronRight, Check, Moon, Sun, Monitor,
  Eye, EyeOff, Save, RefreshCw, Trash2,
} from "lucide-react";

type SettingsSection = "profile" | "notifications" | "privacy" | "intelligence" | "appearance" | "data";

const SECTIONS = [
  { id: "profile",       label: "Profile",        icon: User,     desc: "Personal info & account" },
  { id: "notifications", label: "Notifications",  icon: Bell,     desc: "Alerts & digest settings" },
  { id: "privacy",       label: "Privacy",        icon: Shield,   desc: "Data access & permissions" },
  { id: "intelligence",  label: "Intelligence",   icon: Zap,      desc: "AI behaviour & context" },
  { id: "appearance",    label: "Appearance",     icon: Palette,  desc: "Theme & display options" },
  { id: "data",          label: "Data & Storage", icon: Database, desc: "Export, reset & manage" },
] as const;

/* ─────────────────────────────────────────────
   Beautiful Toggle Switch (On/Off Mode)
───────────────────────────────────────────── */
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center gap-2.5 animate-[fadeIn_0.3s_ease]">
      {/* Status label */}
      <span
        className={`text-[9.5px] font-mono font-bold tracking-widest uppercase transition-all duration-250 w-6 text-right select-none ${
          checked ? "text-purple-400" : "text-slate-600"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>

      {/* Track */}
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative flex items-center rounded-full cursor-pointer transition-all duration-300 outline-none border focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0f14] ${
          checked
            ? "bg-purple-600 border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.35)]"
            : "bg-[#0a0b12] border-slate-800 hover:border-slate-700"
        }`}
        style={{
          width: 44,
          height: 24,
        }}
      >
        {/* Thumb */}
        <span
          className="absolute z-10 rounded-full transition-all duration-300"
          style={{
            width: 16,
            height: 16,
            top: 3,
            left: checked ? 23 : 3,
            background: checked
              ? "linear-gradient(135deg, #ffffff 60%, #e9d5ff 100%)"
              : "#475569",
            boxShadow: checked
              ? "0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)"
              : "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Setting Row
───────────────────────────────────────────── */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-900/50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors duration-150">
          {label}
        </p>
        {description && (
          <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section divider label
───────────────────────────────────────────── */
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-slate-600">
        {title}
      </span>
      <div className="flex-1 h-px bg-slate-900/60" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>("profile");
  const [saved,  setSaved]  = useState(false);

  // Profile
  const [name,         setName]         = useState("Alexander V.");
  const [email,        setEmail]        = useState("alex@secondbrain.ai");
  const [showPassword, setShowPassword] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    syncComplete: true,
    actionItems:  true,
    weeklyDigest: true,
    insights:     false,
    prReviews:    true,
  });

  // Intelligence
  const [intel, setIntel] = useState({
    autoInsights:   true,
    deepContext:    true,
    crossSource:    true,
    suggestQueries: false,
  });

  // Appearance
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);
  const [animations,  setAnimations]  = useState(true);

  // Privacy
  const [privacy, setPrivacy] = useState({ dataCollection: true, telemetry: false });

  const toggleNotif   = (k: keyof typeof notifs)   => setNotifs((p)   => ({ ...p, [k]: !p[k] }));
  const toggleIntel   = (k: keyof typeof intel)    => setIntel((p)    => ({ ...p, [k]: !p[k] }));
  const togglePrivacy = (k: keyof typeof privacy)  => setPrivacy((p)  => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    setSaved(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaved(false);
  };

  const NOTIF_META: Record<string, { label: string; desc: string }> = {
    syncComplete: { label: "Sync Complete",    desc: "Notify when a source finishes syncing" },
    actionItems:  { label: "Action Items",     desc: "Alert when new action items are detected" },
    weeklyDigest: { label: "Weekly Digest",    desc: "Summary email every Monday morning" },
    insights:     { label: "New Insights",     desc: "Push notification for AI-generated insights" },
    prReviews:    { label: "PR Review Alerts", desc: "Alert when a GitHub PR needs your attention" },
  };

  const INTEL_META: Record<string, { label: string; desc: string }> = {
    autoInsights:   { label: "Auto-Generate Insights", desc: "Automatically surface patterns from your data" },
    deepContext:    { label: "Deep Context Mode",       desc: "Use historical data for richer query answers" },
    crossSource:    { label: "Cross-Source Synthesis",  desc: "Combine data from multiple connectors per query" },
    suggestQueries: { label: "Query Suggestions",       desc: "Show AI-suggested queries on the dashboard" },
  };

  const renderContent = () => {
    switch (active) {
      /* ── Profile ── */
      case "profile":
        return (
          <div>
            <SectionDivider title="Account Details" />
            <SettingRow label="Full Name" description="Displayed across your dashboard">
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-[210px] px-3.5 py-2 text-[12.5px] bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl text-slate-200 transition-all" />
            </SettingRow>
            <SettingRow label="Email Address" description="Used for auth & digest emails">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                className="w-[210px] px-3.5 py-2 text-[12.5px] bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl text-slate-200 transition-all" />
            </SettingRow>
            <SectionDivider title="Security" />
            <SettingRow label="Password" description="Last changed 30 days ago">
              <div className="relative w-[210px]">
                <input type={showPassword ? "text" : "password"} defaultValue="••••••••••"
                  className="w-full pl-3.5 pr-9 py-2 text-[12.5px] bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl text-slate-200 transition-all" />
                <button onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </SettingRow>
            <SectionDivider title="Subscription" />
            <SettingRow label="Current Plan" description="Your active subscription tier">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/25 text-[11px] font-bold text-purple-300 font-mono tracking-wider uppercase">
                <Zap className="w-3 h-3" /> Pro Intelligence
              </span>
            </SettingRow>
          </div>
        );

      /* ── Notifications ── */
      case "notifications":
        return (
          <div>
            <SectionDivider title="Alert Preferences" />
            {Object.entries(notifs).map(([key, val]) => (
              <SettingRow key={key} label={NOTIF_META[key].label} description={NOTIF_META[key].desc}>
                <Toggle checked={val} onChange={() => toggleNotif(key as keyof typeof notifs)} />
              </SettingRow>
            ))}
          </div>
        );

      /* ── Intelligence ── */
      case "intelligence":
        return (
          <div>
            <SectionDivider title="AI Behaviour" />
            {Object.entries(intel).map(([key, val]) => (
              <SettingRow key={key} label={INTEL_META[key].label} description={INTEL_META[key].desc}>
                <Toggle checked={val} onChange={() => toggleIntel(key as keyof typeof intel)} />
              </SettingRow>
            ))}
            <SectionDivider title="Data Range" />
            <SettingRow label="Context Window" description="How many days of data to include in queries">
              <select className="px-3.5 py-2 text-[12.5px] bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:outline-none rounded-xl text-slate-200 cursor-pointer">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
              </select>
            </SettingRow>
          </div>
        );

      /* ── Appearance ── */
      case "appearance":
        return (
          <div>
            <SectionDivider title="Theme" />
            <SettingRow label="Colour Scheme" description="Choose your preferred display theme">
              <div className="flex items-center gap-2">
                {(["dark", "light", "system"] as const).map((t) => {
                  const Icon = t === "dark" ? Moon : t === "light" ? Sun : Monitor;
                  const isActive = theme === t;
                  return (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold border capitalize transition-all cursor-pointer ${
                        isActive
                          ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-500/25 shadow-[0_0_10px_rgba(168,85,247,0.08)]"
                          : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-300"
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {t}
                    </button>
                  );
                })}
              </div>
            </SettingRow>
            <SectionDivider title="Layout" />
            <SettingRow label="Compact Mode" description="Reduce spacing for denser information display">
              <Toggle checked={compactMode} onChange={() => setCompactMode((v) => !v)} />
            </SettingRow>
            <SettingRow label="Animations" description="Enable smooth transitions and micro-animations">
              <Toggle checked={animations} onChange={() => setAnimations((v) => !v)} />
            </SettingRow>
          </div>
        );

      /* ── Privacy ── */
      case "privacy":
        return (
          <div>
            <SectionDivider title="Data Sharing" />
            <SettingRow label="Usage Analytics" description="Allow anonymous usage data to improve the product">
              <Toggle checked={privacy.dataCollection} onChange={() => togglePrivacy("dataCollection")} />
            </SettingRow>
            <SettingRow label="Error Telemetry" description="Send anonymized crash reports to our engineering team">
              <Toggle checked={privacy.telemetry} onChange={() => togglePrivacy("telemetry")} />
            </SettingRow>
            <SectionDivider title="Session" />
            <SettingRow label="Session Timeout" description="Auto-logout after a period of inactivity">
              <select className="px-3.5 py-2 text-[12.5px] bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:outline-none rounded-xl text-slate-200 cursor-pointer">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </SettingRow>
          </div>
        );

      /* ── Data ── */
      case "data":
        return (
          <div>
            <SectionDivider title="Export" />
            <SettingRow label="Export All Data" description="Download a full JSON export of your nodes & queries">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 bg-[#0a0b12] hover:text-white rounded-xl transition-all cursor-pointer">
                <Database className="w-3.5 h-3.5" /> Export JSON
              </button>
            </SettingRow>
            <SectionDivider title="Maintenance" />
            <SettingRow label="Re-index Sources" description="Force a full re-sync of all connected sources">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-blue-300 border border-blue-800/40 bg-blue-950/20 hover:bg-blue-950/40 rounded-xl transition-all cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Re-index
              </button>
            </SettingRow>
            <SectionDivider title="Danger Zone" />
            <SettingRow label="Clear Query History" description="Permanently delete all past queries — cannot be undone">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-red-400 border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 rounded-xl transition-all cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            </SettingRow>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 dark:text-white tracking-tight mb-1.5">Settings</h1>
          <p className="text-[14px] text-slate-400">Manage your account, intelligence, and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-bold rounded-xl transition-all duration-300 active:scale-95 shadow-lg cursor-pointer ${
            saved
              ? "bg-emerald-500 text-white shadow-emerald-900/30"
              : "bg-[#c3b2e9] hover:bg-[#d2c4f3] text-[#090a0f] shadow-purple-900/20"
          }`}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-[200px] shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  active === id
                    ? "bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-500/25 text-purple-700 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.07)]"
                    : "border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active === id ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="text-[12.5px] font-semibold">{label}</span>
                {active === id && <ChevronRight className="w-3 h-3 ml-auto text-purple-600 dark:text-purple-500/50" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 bg-white dark:bg-[#0e0f14] border border-slate-200/80 dark:border-slate-900/80 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-0.5">
            {SECTIONS.find((s) => s.id === active)?.label}
          </h2>
          <p className="text-[12px] text-slate-500 mb-4">
            {SECTIONS.find((s) => s.id === active)?.desc}
          </p>
          <div className="border-t border-slate-200 dark:border-slate-900/50">{renderContent()}</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
