import type { DiscordMessageJob } from "./discord";
import type { SlackMessageJob } from "./slack";

export type EventMessageJob = DiscordMessageJob | SlackMessageJob;

export const formatEventMessage = (message: EventMessageJob): string => {
	switch (message.client) {
		case "discord":
			return `[discord] ${message.authorUsername} in ${message.guildId}#${message.channelId}: ${message.content || "<empty>"}`;
		case "slack":
			return `[slack] ${message.authorId} in ${message.teamId}#${message.channelId}: ${message.content || "<empty>"}`;
	}
};

/**
 * Strip platform-specific mention syntax so raw IDs don't reach the LLM.
 * Handles Slack/Discord: <@USER>, <#CHANNEL>, <!here>, <!channel>, <@&ROLE>
 */
const stripMentions = (content: string): string =>
	content.replace(/<[#!@][^>]*>/g, "").replace(/\s{2,}/g, " ").trim();

export const formatAiInput = (message: EventMessageJob): string => {
	switch (message.client) {
		case "discord":
			return [
				`author: ${message.authorUsername || message.authorId}`,
				`content: ${stripMentions(message.content) || "<empty>"}`,
			].join("\n");
		case "slack":
			return [
				`author: ${message.authorId}`,
				`content: ${stripMentions(message.content) || "<empty>"}`,
			].join("\n");
	}
};
