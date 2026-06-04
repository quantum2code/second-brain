import type { DiscordMessageJob } from "./discord";
import type { GmailMessageJob } from "./gmail";
import type { SlackMessageJob } from "./slack";

export type EventMessageJob = DiscordMessageJob | SlackMessageJob | GmailMessageJob;

export const isDiscordMessageJob = (
	message: EventMessageJob,
): message is DiscordMessageJob => "authorUsername" in message;

export const isGmailMessageJob = (
	message: EventMessageJob,
): message is GmailMessageJob => "snippet" in message;

export const formatEventMessage = (message: EventMessageJob): string => {
	if (isDiscordMessageJob(message)) {
		return `[discord] ${message.authorUsername} in ${message.guildId}#${message.channelId}: ${message.content || "<empty>"}`;
	}

	if (isGmailMessageJob(message)) {
		return `[gmail] ${message.from} → subject: "${message.subject}" — ${message.snippet || "<empty>"}`;
	}

	return `[slack] ${message.authorId} in ${message.teamId}#${message.channelId}: ${message.content || "<empty>"}`;
};
