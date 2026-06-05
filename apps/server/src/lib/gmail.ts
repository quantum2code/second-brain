import { env } from "@second-brain/env/server";
import { google } from "googleapis";
import { createGoogleAuthClient, hasGoogleCredentials } from "./google-auth";
import { Provider } from "./provider";
import { EVENT_QUEUE_NAME, Publisher } from "./publisher";

export type GmailMessageJob = {
	messageId: string;
	threadId: string;
	from: string;
	to: string;
	subject: string;
	snippet: string;
	body: string;
	receivedAt: string;
};

function decodeBase64Url(encoded: string): string {
	const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(base64, "base64").toString("utf-8");
}

function extractPlainTextBody(payload: any): string {
	if (!payload) return "";

	// Single-part plain text
	if (payload.mimeType === "text/plain" && payload.body?.data) {
		return decodeBase64Url(payload.body.data);
	}

	// Multipart — recurse through parts
	if (payload.parts) {
		for (const part of payload.parts) {
			const text = extractPlainTextBody(part);
			if (text) return text;
		}
	}

	return "";
}

function extractHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string): string {
	return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export class GmailProvider extends Provider {
	private readonly oauth2Client = createGoogleAuthClient();
	private readonly gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
	private lastHistoryId: string | undefined;
	private pollingTimer: ReturnType<typeof setInterval> | undefined;

	constructor(private readonly publisher = new Publisher<GmailMessageJob>(EVENT_QUEUE_NAME)) {
		super();
	}

	async start(): Promise<void> {
		if (!hasGoogleCredentials()) {
			console.warn("Gmail polling disabled: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to enable.");
			return;
		}

		// Seed the historyId from the current profile so we only capture future emails
		const profile = await this.gmail.users.getProfile({ userId: "me" });
		this.lastHistoryId = profile.data.historyId ?? undefined;

		const intervalMs = env.GMAIL_POLL_INTERVAL_MS;
		this.pollingTimer = setInterval(() => {
			void this.poll().catch((err) => console.error("[gmail] poll error", err));
		}, intervalMs);

		console.log(`[gmail] polling started (interval: ${intervalMs}ms, historyId: ${this.lastHistoryId})`);
	}

	private async poll(): Promise<void> {
		if (!this.lastHistoryId) return;

		const historyRes = await this.gmail.users.history.list({
			userId: "me",
			startHistoryId: this.lastHistoryId,
			historyTypes: ["messageAdded"],
		});

		const history = historyRes.data.history ?? [];
		const newHistoryId = historyRes.data.historyId;

		// Collect unique new message IDs
		const messageIds = new Set<string>();
		for (const record of history) {
			for (const added of record.messagesAdded ?? []) {
				if (added.message?.id) {
					messageIds.add(added.message.id);
				}
			}
		}

		for (const id of messageIds) {
			const msgRes = await this.gmail.users.messages.get({
				userId: "me",
				id,
				format: "full",
			});

			const msg = msgRes.data;
			const headers = msg.payload?.headers ?? [];

			const job: GmailMessageJob = {
				messageId: msg.id ?? id,
				threadId: msg.threadId ?? "",
				from: extractHeader(headers, "From"),
				to: extractHeader(headers, "To"),
				subject: extractHeader(headers, "Subject"),
				snippet: msg.snippet ?? "",
				body: extractPlainTextBody(msg.payload),
				receivedAt: msg.internalDate
					? new Date(Number(msg.internalDate)).toISOString()
					: new Date().toISOString(),
			};

			await this.publisher.append(job);
		}

		// Advance the cursor even if there were no new messages
		if (newHistoryId) {
			this.lastHistoryId = newHistoryId;
		}
	}

	override async close(): Promise<void> {
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = undefined;
		}
		await this.publisher.close();
	}
}
