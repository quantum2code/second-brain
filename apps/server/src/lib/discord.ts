import { env } from "@second-brain/env/server";
import { Client, GatewayIntentBits, type Message } from "discord.js";
import { Provider, type ProviderCapabilities, type RealtimeProvider } from "./provider";
import { EVENT_QUEUE_NAME, Publisher } from "./publisher";

export type DiscordMessageJob = {
	client: "discord";
	guildId: string;
	channelId: string;
	messageId: string;
	authorId: string;
	authorUsername: string;
	content: string;
	createdAt: string;
	url: string;
};

const parseGuildIds = (value: string | undefined): Set<string> =>
	new Set((value ?? "").split(",").map((guildId) => guildId.trim()).filter(Boolean));

const mapMessage = (message: Message): DiscordMessageJob => ({
	client: "discord",
	guildId: message.guildId ?? "",
	channelId: message.channelId,
	messageId: message.id,
	authorId: message.author.id,
	authorUsername: message.author.username,
	content: message.content,
	createdAt: message.createdAt.toISOString(),
	url: message.url,
});

export class DiscordProvider extends Provider implements RealtimeProvider {
	readonly capabilities: ProviderCapabilities = {
		inbound: ["ws"],
		write: [],
	};

	private readonly client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	});

	private readonly guildIds = parseGuildIds(env.DISCORD_GUILD_IDS);

	constructor(private readonly publisher = new Publisher<DiscordMessageJob>(EVENT_QUEUE_NAME)) {
		super();
	}

	async start(): Promise<void> {
		const token = env.DISCORD_BOT_TOKEN;

		if (!token) {
			console.warn("Discord bot disabled: set DISCORD_BOT_TOKEN to listen to messages.");
			return;
		}

		this.client.on("messageCreate", async (message) => {
			if (message.author.bot || !message.guildId) {
				return;
			}

			if (this.guildIds.size > 0 && !this.guildIds.has(message.guildId)) {
				return;
			}

			await this.publisher.append(mapMessage(message));
		});

		await this.client.login(token);
	}

	override async close(): Promise<void> {
		this.client.removeAllListeners();
		await this.client.destroy();
		await this.publisher.close();
	}
}
