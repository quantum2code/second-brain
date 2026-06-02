import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireSupabaseConfig } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseConfig();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}
