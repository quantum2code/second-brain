import { env } from "@second-brain/env/server";
import cors from "cors";
import express from "express";
import { DiscordProvider } from "./lib/discord";

const app = express();
const discordProvider = new DiscordProvider();

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

const shutdown = async () => {
	await discordProvider.close();
	process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

void discordProvider.start().catch((error) => {
	console.error("Discord bot failed to start", error);
});
