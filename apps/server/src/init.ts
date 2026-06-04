import { DiscordProvider } from "./lib/discord";
import { SlackProvider } from "./lib/slack";

export type ProviderInit = {
	discordProvider: DiscordProvider;
	slackProvider: SlackProvider;
	close: () => Promise<void>;
};

export async function initProviders(): Promise<ProviderInit> {
	const discordProvider = new DiscordProvider();
	const slackProvider = new SlackProvider();

	void discordProvider.start().catch((error) => {
		console.error("Discord bot failed to start", error);
	});

	return {
		discordProvider,
		slackProvider,
		close: async () => {
			await discordProvider.close();
			await slackProvider.close();
		},
	};
}
