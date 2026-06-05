import { knowledgeGraphWorkflow } from "@/agents";
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

			if (!text.trim()) {
				continue;
			}

			try {
				const result = await knowledgeGraphWorkflow.invoke({ text, sourceMessageName, messageCreatedAt: message.createdAt });
				console.log("[groq_ai] extracted message", {
					entities: JSON.stringify(result.entities),
					relations: JSON.stringify(result.createdEdges),
					persisted: result.persisted,
				});
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
