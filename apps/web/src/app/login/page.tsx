"use client";
import React, { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Zap, Brain, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-800/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a20_1px,transparent_1px),linear-gradient(to_bottom,#0f172a20_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/25 shadow-lg shadow-purple-900/20 mb-1">
            <Brain className="w-6 h-6 text-purple-300" />
          </div>
          <h1 className="text-[22px] font-bold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent tracking-tight">
            Second Brain
          </h1>
          <span className="text-[9px] font-mono tracking-[0.3em] text-purple-400/80 font-bold uppercase">
            Extended Intelligence
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0d0e16]/90 border border-slate-800/60 rounded-2xl p-7 shadow-2xl shadow-black/50 backdrop-blur-sm">
          {/* Top gradient line */}
          <div className="absolute top-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent rounded-full" />

          <div className="mb-6">
            <h2 className="text-[19px] font-bold text-white mb-1 tracking-tight">Welcome back</h2>
            <p className="text-[12.5px] text-slate-400">Sign in to access your intelligence dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 text-[13px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl transition-all duration-200 placeholder:text-slate-600"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-4 pr-10 py-2.5 text-[13px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl transition-all duration-200 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-[11.5px] text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#c3b2e9] hover:bg-[#d2c4f3] disabled:opacity-60 disabled:cursor-not-allowed text-[#090a0f] text-[13.5px] font-bold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-purple-900/20 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#090a0f]/30 border-t-[#090a0f] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-900" />
            <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-slate-900" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-[12.5px] text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* Bottom text */}
        <p className="text-center text-[10.5px] text-slate-700 mt-5 font-mono tracking-wide">
          SECURED BY SUPABASE · END-TO-END ENCRYPTED
        </p>
      </div>
    </div>
  );
}
