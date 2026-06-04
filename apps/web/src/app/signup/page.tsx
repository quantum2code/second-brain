"use client";
import React, { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Brain, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PERKS = [
  "Connect Slack, Gmail, Notion, GitHub & more",
  "AI-powered cross-source intelligence queries",
  "Auto-generated insights & action items",
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-900/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a20_1px,transparent_1px),linear-gradient(to_bottom,#0f172a20_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative w-full max-w-[860px] flex gap-6 items-stretch">
        {/* Left panel — value prop */}
        <div className="hidden lg:flex flex-col justify-between w-[340px] shrink-0 bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-900/25 rounded-2xl p-8">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/25">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-white leading-none">Second Brain</p>
                <p className="text-[8.5px] font-mono tracking-[0.25em] text-purple-400/80 font-bold uppercase mt-0.5">Extended Intelligence</p>
              </div>
            </div>

            <h2 className="text-[24px] font-bold text-white leading-tight mb-3">
              Build your Extended Intelligence today.
            </h2>
            <p className="text-[13px] text-slate-400 leading-relaxed mb-7">
              Connect all your digital tools. Let AI synthesize insights, surface action items, and help you think faster.
            </p>

            <div className="space-y-3">
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-950/60 border border-purple-500/30 shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <p className="text-[12.5px] text-slate-300 leading-snug">{perk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial-style quote */}
          <div className="mt-8 pt-6 border-t border-purple-900/30">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-400 leading-relaxed italic">
                &ldquo;Second Brain saved me 2 hours a day by surfacing what actually matters across all my tools.&rdquo;
              </p>
            </div>
            <p className="text-[10px] text-slate-600 font-mono ml-5">— BETA USER</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 mb-6 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/25">
              <Brain className="w-5 h-5 text-purple-300" />
            </div>
            <h1 className="text-[18px] font-bold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">Second Brain</h1>
          </div>

          <div className="bg-[#0d0e16]/90 border border-slate-800/60 rounded-2xl p-7 shadow-2xl shadow-black/50 backdrop-blur-sm h-full">
            <div className="h-px mb-7 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -mx-7 mt-[-28px] mb-7" />

            {done ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-bold text-white mb-1">Account created!</h3>
                  <p className="text-[12.5px] text-slate-400">Redirecting to your dashboard...</p>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-[19px] font-bold text-white mb-1">Create your account</h2>
                  <p className="text-[12.5px] text-slate-400">Start building your Second Brain for free.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alexander V."
                      className="w-full px-4 py-2.5 text-[13px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-2.5 text-[13px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full pl-4 pr-10 py-2.5 text-[13px] text-slate-200 bg-[#0a0b12] border border-slate-800 focus:border-purple-700/60 focus:ring-1 focus:ring-purple-800/20 focus:outline-none rounded-xl transition-all placeholder:text-slate-600"
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength */}
                    {password.length > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                strength >= level
                                  ? level === 1 ? "bg-red-500" : level === 2 ? "bg-amber-400" : "bg-emerald-400"
                                  : "bg-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-mono ${strength === 1 ? "text-red-400" : strength === 2 ? "text-amber-400" : "text-emerald-400"}`}>
                          {strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-950/30 border border-red-800/40 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <p className="text-[11.5px] text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#c3b2e9] hover:bg-[#d2c4f3] disabled:opacity-60 disabled:cursor-not-allowed text-[#090a0f] text-[13.5px] font-bold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-purple-900/20 cursor-pointer mt-1"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-[#090a0f]/30 border-t-[#090a0f] rounded-full animate-spin" />Creating account...</>
                    ) : (
                      <>Create Account <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-slate-900" />
                  <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">or</span>
                  <div className="flex-1 h-px bg-slate-900" />
                </div>

                <p className="text-center text-[12.5px] text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
          <p className="text-center text-[10.5px] text-slate-700 mt-4 font-mono tracking-wide">
            BY CREATING AN ACCOUNT, YOU AGREE TO OUR TERMS & PRIVACY POLICY
          </p>
        </div>
      </div>
    </div>
  );
}
