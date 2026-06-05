import type { CalendarEventJob } from "./calendar";
import type { DiscordMessageJob } from "./discord";
import type { GmailMessageJob } from "./gmail";
import type { SlackMessageJob } from "./slack";

export type EventMessageJob = DiscordMessageJob | SlackMessageJob | GmailMessageJob | CalendarEventJob;

export const isDiscordMessageJob = (
	message: EventMessageJob,
): message is DiscordMessageJob => "authorUsername" in message;

export const isGmailMessageJob = (
	message: EventMessageJob,
): message is GmailMessageJob => "snippet" in message;

export const isCalendarEventJob = (
	message: EventMessageJob,
): message is CalendarEventJob => "calendarId" in message;

export const formatEventMessage = (message: EventMessageJob): string => {
	if (isDiscordMessageJob(message)) {
		return `[discord] ${message.authorUsername} in ${message.guildId}#${message.channelId}: ${message.content || "<empty>"}`;
	}

	if (isGmailMessageJob(message)) {
		return `[gmail] ${message.from} → subject: "${message.subject}" — ${message.snippet || "<empty>"}`;
	}

	if (isCalendarEventJob(message)) {
		const time = message.isAllDay
			? message.startAt
			: `${message.startAt} → ${message.endAt}`;
		return `[calendar] "${message.title}" | ${time} | ${message.status}`;
	}

	return `[slack] ${message.authorId} in ${message.teamId}#${message.channelId}: ${message.content || "<empty>"}`;
};
