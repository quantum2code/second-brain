import type { Request } from "express";
import { Provider, type ProviderCapabilities, type WebhookProvider } from "./provider";
import { EVENT_QUEUE_NAME, Publisher } from "./publisher";
import { getUsernameResolver } from "./usernames";

export type SlackMessageJob = {
	client: "slack";
	teamId: string;
	channelId: string;
	messageId: string;
	authorId: string;
	/** Resolved from Slack users.info API — may fall back to authorId if unavailable. */
	authorUsername: string;
	content: string;
	createdAt: string;
};

const mapMessage = (
	event: any,
	teamId: string,
): Omit<SlackMessageJob, "authorUsername"> => ({
	client: "slack",
	teamId,
	channelId: event.channel,
	messageId: event.ts,
	authorId: event.user,
	content: event.text,
	createdAt: new Date(
		Number(event.ts.split(".")[0]) * 1000,
	).toISOString(),
});

export class SlackProvider extends Provider implements WebhookProvider {
	readonly capabilities: ProviderCapabilities = {
		inbound: ["webhook"],
		write: [],
	};

	private readonly resolver = getUsernameResolver();

	constructor(private readonly publisher = new Publisher<SlackMessageJob>(EVENT_QUEUE_NAME)) {
		super();
	}

	async handleWebhook(req: Request) {
		const body = req.body;

		if (body.type === "url_verification") {
			return body.challenge;
		}

		if (body.type === "event_callback") {
			await this.handleEvent(body);
		}
	}

	async handleEvent(body: any) {
		if (body.event?.type === "message" && body.event.user) {
			const partial = mapMessage(body.event, body.team_id);

			// Resolve username via Slack API (cached after first lookup)
			const authorUsername = await this.resolver.resolve(
				"slack",
				partial.authorId,
			);

			await this.publisher.append({ ...partial, authorUsername });
		}
	}

	override async close(): Promise<void> {
		await this.publisher.close();
	}
}
