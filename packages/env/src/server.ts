import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    ARCADEDB_URL: z.string().url().default("http://localhost:2480/api/v1"),
    ARCADEDB_DATABASE: z.string().min(1).default("SecondBrain"),
    ARCADEDB_USERNAME: z.string().min(1).default("root"),
    ARCADEDB_PASSWORD: z.string().min(1).default("playwithdata"),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    DISCORD_GUILD_IDS: z.string().min(1).optional(),
    CORS_ORIGIN: z.url(),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
