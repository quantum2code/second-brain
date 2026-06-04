import { Worker } from "bullmq";
import { env } from "@second-brain/env/server";
import { formatEventMessage } from "../lib/events";
import { EVENT_QUEUE_NAME } from "../lib/publisher";
import type { EventMessageJob } from "../lib/events";

export const worker = new Worker<EventMessageJob[]>(
	EVENT_QUEUE_NAME,
	async (job) => {
		for (const message of job.data) {
			console.log(formatEventMessage(message));
		}

		return job.data;
	},
	{
		connection: {
			url: env.REDIS_URL,
		},
	},
);

worker.on("failed", (job, error) => {
	console.error("[slack] job failed", job?.id, error);
});

console.log("[slack] worker started");
