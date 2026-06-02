import { env } from "@second-brain/env/server";
import cors from "cors";
import express from "express";
import { createSupabaseClient, getBearerToken } from "./lib/supabase";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/auth/me", async (req, res) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: error?.message ?? "Unauthorized" });
      return;
    }

    res.status(200).json({ user: data.user });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
