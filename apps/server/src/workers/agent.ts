import { invokeWorkerAgent } from "@/agents/worker-agent/agent";
import { formatAiInput, type EventMessageJob } from "@/lib/events";
import { deterministicMessageName } from "@/lib/deterministic";
import { AI_QUEUE_NAME, closeAiQueue } from "@/lib/ai";
import { Worker } from "bullmq";
import { env } from "@second-brain/env/server";

export const worker = new Worker<EventMessageJob[]>(
	AI_QUEUE_NAME,
	async (job) => {
		for (const message of job.data) {
			const text = formatAiInput(message);
			const sourceMessageName = deterministicMessageName(message);
			const messageAuthor = message.authorUsername || message.authorId;

			if (!text.trim()) {
				continue;
			}

			try {
				await invokeWorkerAgent({
					text,
					sourceMessageName,
					messageCreatedAt: message.createdAt,
					messageAuthor,
				});
				console.log("[groq_ai] worker agent completed processing message", sourceMessageName);
			} catch (error) {
				console.error("[groq_ai] extraction failed", job.id, error);
				throw error;
			}
		}

		return { processed: job.data.length };
	},
	{
		connection: {
			url: env.REDIS_URL,
		},
	},
);

worker.on("failed", (job, error) => {
	console.error("[groq_ai] job failed", job?.id, error);
});

process.once("beforeExit", () => {
	void closeAiQueue();
});

console.log("[groq_ai] worker started");
