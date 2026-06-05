import { Queue, type JobsOptions } from "bullmq";
import { env } from "@second-brain/env/server";
import type { EventMessageJob } from "./events";

export const AI_QUEUE_NAME = "ai-events";

let aiQueue: Queue<EventMessageJob[]> | undefined;

function getAiQueue(): Queue<EventMessageJob[]> {
	if (!aiQueue) {
		aiQueue = new Queue(AI_QUEUE_NAME, {
			connection: {
				url: env.REDIS_URL,
			},
		});
	}

	return aiQueue;
}

export async function enqueueAiBatch(payload: EventMessageJob[]): Promise<string | undefined> {
	const job = await getAiQueue().add("default", payload as never, {
		removeOnComplete: true,
		removeOnFail: 1000,
	} satisfies JobsOptions);

	return job.id;
}

export async function closeAiQueue(): Promise<void> {
	if (!aiQueue) {
		return;
	}

	await aiQueue.close();
	aiQueue = undefined;
}
