import type { DiscordMessageJob } from "./discord";
import type { SlackMessageJob } from "./slack";

export type EventMessageJob = DiscordMessageJob | SlackMessageJob;

export const isDiscordMessageJob = (
	message: EventMessageJob,
): message is DiscordMessageJob => "authorUsername" in message;

export const formatEventMessage = (message: EventMessageJob): string => {
	if (isDiscordMessageJob(message)) {
		return `[discord] ${message.authorUsername} in ${message.guildId}#${message.channelId}: ${message.content || "<empty>"}`;
	}

	return `[slack] ${message.authorId} in ${message.teamId}#${message.channelId}: ${message.content || "<empty>"}`;
};
