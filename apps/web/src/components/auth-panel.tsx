"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type { Route } from "next";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

type AuthMode = "sign-in" | "sign-up";

type AuthPanelProps = {
  redirectTo?: Route;
  mode: AuthMode;
};

export default function AuthPanel({ mode: initialMode, redirectTo = "/home" }: AuthPanelProps) {
  const supabaseConfig = getSupabaseConfig();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseConfig) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser();

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const authAction =
      mode === "sign-in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await authAction;

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(mode === "sign-in" ? "Signed in. redirecting to home" : "Account created. redirecting to home");
      router.push(redirectTo);
    }

    setLoading(false);
  }

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setMessage(error ? error.message : "Signed out.");
    setLoading(false);
  }

  return (
    <section className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
			{supabaseConfig && session && (
				<div className="bg-neutral-200/5 border rounded-2xl p-4 flex w-full justify-between items-center">
					<p className="text-sm text-muted-foreground">
					Signed in as {session.user.email ?? session.user.id}
					</p>
					<button className="rounded-md border px-3 py-1 text-sm" onClick={handleSignOut} disabled={loading}>
					Sign out
					</button>
			</div>
			)
			}

      </div>
      {supabaseConfig ? (
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <input
            className="rounded-md border px-3 py-2"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="rounded-md border px-3 py-2"
            type="password"
            placeholder="Password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border px-3 py-2" type="submit" disabled={loading}>
              {mode === "sign-in" ? "Sign in" : "Sign up"}
            </button>
            <button
              className="rounded-md border px-3 py-2"
              type="button"
              onClick={() => (mode === "sign-in" ? router.push("/signup") : router.push("/login"))}
              disabled={loading}
            >
              {mode === "sign-in" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className="mt-5 ml-2 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
