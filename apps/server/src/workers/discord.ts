import { Worker } from "bullmq";
import { env } from "@second-brain/env/server";
import type { DiscordMessageJob } from "../lib/discord";

const worker = new Worker<DiscordMessageJob[]>(
	"discord",
	async (job) => {
		for (const message of job.data) {
			console.log(
				`[discord] ${message.authorUsername} in ${message.guildId}#${message.channelId}: ${message.content || "<empty>"}`,
			);
		}

		return job.data;
	},
	{
		connection: {
			url: env.REDIS_URL,
		},
	},
);

const shutdown = async () => {
	await worker.close();
	process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

worker.on("failed", (job, error) => {
	console.error("[discord] job failed", job?.id, error);
});

console.log("[discord] worker started");
