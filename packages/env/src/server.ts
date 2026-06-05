import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    GROQ_API_KEY: z.string().min(1).optional(),
    GOOGLE_API_KEY: z.string().min(1).optional(),
    ARCADEDB_URL: z.string().url().default("http://localhost:2480/api/v1"),
    ARCADEDB_DATABASE: z.string().min(1).default("SecondBrain"),
    ARCADEDB_USERNAME: z.string().min(1).default("root"),
    ARCADEDB_PASSWORD: z.string().min(1).default("playwithdata"),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    DISCORD_GUILD_IDS: z.string().min(1).optional(),
    SLACK_BOT_TOKEN: z.string().min(1).optional(),
    SLACK_SIGNING_SECRET: z.string().min(1).optional(),
    CORS_ORIGIN: z.url(),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_REFRESH_TOKEN: z.string().min(1).optional(),
    GMAIL_POLL_INTERVAL_MS: z.coerce.number().positive().default(30000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
