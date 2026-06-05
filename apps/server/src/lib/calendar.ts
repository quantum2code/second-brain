import { env } from "@second-brain/env/server";
import { google } from "googleapis";
import { createGoogleAuthClient, hasGoogleCredentials } from "./google-auth";
import { Provider } from "./provider";
import { EVENT_QUEUE_NAME, Publisher } from "./publisher";

export type CalendarEventJob = {
	eventId: string;
	calendarId: string;
	title: string;
	description: string;
	location: string;
	startAt: string;
	endAt: string;
	isAllDay: boolean;
	status: "confirmed" | "tentative" | "cancelled";
	organizerEmail: string;
	updatedAt: string;
};

function mapStatus(status: string | null | undefined): CalendarEventJob["status"] {
	if (status === "tentative") return "tentative";
	if (status === "cancelled") return "cancelled";
	return "confirmed";
}

export class CalendarProvider extends Provider {
	private readonly oauth2Client = createGoogleAuthClient();
	private readonly calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
	private syncToken: string | undefined;
	private pollingTimer: ReturnType<typeof setInterval> | undefined;

	constructor(private readonly publisher = new Publisher<CalendarEventJob>(EVENT_QUEUE_NAME)) {
		super();
	}

	async start(): Promise<void> {
		if (!hasGoogleCredentials()) {
			console.warn("Calendar polling disabled: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN to enable.");
			return;
		}

		// Initial full sync — fetches all current events and stores the sync token
		await this.fullSync();

		const intervalMs = env.GMAIL_POLL_INTERVAL_MS;
		this.pollingTimer = setInterval(() => {
			void this.poll().catch((err) => console.error("[calendar] poll error", err));
		}, intervalMs);

		console.log(`[calendar] polling started (interval: ${intervalMs}ms)`);
	}

	/**
	 * Performs a full sync to seed the syncToken.
	 * We do NOT enqueue events from the initial sync — only future changes matter.
	 */
	private async fullSync(): Promise<void> {
		let pageToken: string | undefined;

		do {
			const res = await this.calendar.events.list({
				calendarId: "primary",
				pageToken,
				maxResults: 250,
			});

			pageToken = res.data.nextPageToken ?? undefined;

			if (!pageToken && res.data.nextSyncToken) {
				this.syncToken = res.data.nextSyncToken;
			}
		} while (pageToken);

		console.log(`[calendar] initial sync complete (syncToken acquired)`);
	}

	private async poll(): Promise<void> {
		if (!this.syncToken) return;

		try {
			const res = await this.calendar.events.list({
				calendarId: "primary",
				syncToken: this.syncToken,
			});

			const events = res.data.items ?? [];

			for (const event of events) {
				const job: CalendarEventJob = {
					eventId: event.id ?? "",
					calendarId: "primary",
					title: event.summary ?? "(no title)",
					description: event.description ?? "",
					location: event.location ?? "",
					startAt: event.start?.dateTime ?? event.start?.date ?? "",
					endAt: event.end?.dateTime ?? event.end?.date ?? "",
					isAllDay: !event.start?.dateTime, // all-day events use `date`, not `dateTime`
					status: mapStatus(event.status),
					organizerEmail: event.organizer?.email ?? "",
					updatedAt: event.updated ?? new Date().toISOString(),
				};

				await this.publisher.append(job);
			}

			if (res.data.nextSyncToken) {
				this.syncToken = res.data.nextSyncToken;
			}
		} catch (err: any) {
			// HTTP 410 Gone means the sync token has expired — do a full re-sync
			if (err?.code === 410 || err?.status === 410) {
				console.warn("[calendar] sync token expired, performing full re-sync...");
				this.syncToken = undefined;
				await this.fullSync();
			} else {
				throw err;
			}
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
