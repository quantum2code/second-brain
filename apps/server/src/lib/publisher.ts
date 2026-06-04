import { Queue, type JobsOptions } from "bullmq";
import { env } from "@second-brain/env/server";

export class Publisher<TPayload> {
	private readonly queue: Queue;
	private readonly batchWindowMs = 2000;
	private buffer: TPayload[] = [];
	private timer: ReturnType<typeof setTimeout> | undefined;

	constructor(queueName = "discord") {
		this.queue = new Queue(queueName, {
			connection: {
				url: env.REDIS_URL,
			},
		});
	}

	async append(payload: TPayload): Promise<void> {
		this.buffer.push(payload);
		this.resetTimer();
	}

	private resetTimer(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(() => {
			void this.flush();
		}, this.batchWindowMs);
	}

	private async flush(): Promise<void> {
		this.timer = undefined;
		const batch = this.buffer;

		if (batch.length === 0) {
			return;
		}

		this.buffer = [];
		await this.enqueue(batch);
	}

	protected async enqueue(payload: TPayload[]): Promise<string | undefined> {
		const job = await this.queue.add("default", payload as never, {
			removeOnComplete: true,
			removeOnFail: 1000,
		} satisfies JobsOptions);

		return job.id;
	}

	async close(): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}

		await this.flush();
		await this.queue.close();
	}
}
