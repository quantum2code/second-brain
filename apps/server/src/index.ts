import { env } from "@second-brain/env/server";
import cors from "cors";
import express from "express";
import { CalendarProvider } from "./lib/calendar";
import { DiscordProvider } from "./lib/discord";
import { GmailProvider } from "./lib/gmail";
import { SlackProvider } from "./lib/slack";

const app = express();
const discordProvider = new DiscordProvider();
const slackProvider = new SlackProvider();
const gmailProvider = new GmailProvider();
const calendarProvider = new CalendarProvider();

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

app.post("/slack/events", async (req, res) => {
  const result = await slackProvider.handleWebhook(req);

  if (typeof result === "string") {
    return res.send(result);
  }

  res.sendStatus(200);
});

const shutdown = async () => {
	await discordProvider.close();
	await slackProvider.close();
	await gmailProvider.close();
	await calendarProvider.close();
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

void gmailProvider.start().catch((error) => {
	console.error("Gmail polling failed to start", error);
});

void calendarProvider.start().catch((error) => {
	console.error("Calendar polling failed to start", error);
});
