import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "./config";

export function refreshSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  const cookiesToApply: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }> = [];

  if (!config) {
    return response;
  }

  const { url, anonKey } = config;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToApply.push(...cookiesToSet);
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const applyCookies = (target: NextResponse) => {
    cookiesToApply.forEach(({ name, value, options }) => {
      target.cookies.set(name, value, options);
    });
    return target;
  };

  return supabase.auth
    .getUser()
    .then(({ data }) => {
      const isAuthed = Boolean(data.user);

      if (pathname.startsWith("/home") && !isAuthed) {
        return applyCookies(NextResponse.redirect(new URL("/login", request.url)));
      }

      if (pathname === "/login" && isAuthed) {
        return applyCookies(NextResponse.redirect(new URL("/home", request.url)));
      }

      return applyCookies(response);
    })
    .catch(() => applyCookies(response));
}
