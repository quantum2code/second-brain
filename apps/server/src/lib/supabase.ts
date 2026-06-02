import { env } from "@second-brain/env/server";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase auth env vars: SUPABASE_URL and SUPABASE_ANON_KEY");
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function getBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length);
}
