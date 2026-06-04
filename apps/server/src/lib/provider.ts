import type { Request } from "express";

export type InboundTransport = "webhook" | "ws" | "push";
export type WriteCapability = "create" | "update" | "delete" | "reply";

export type ProviderCapabilities = {
	inbound: readonly InboundTransport[];
	write: readonly WriteCapability[];
};

export abstract class Provider {
	abstract readonly capabilities: ProviderCapabilities;
	abstract close(): Promise<void>;
}

export interface WebhookProvider {
	handleWebhook(req: Request): Promise<string | void>;
}

export interface RealtimeProvider {
	start(): Promise<void>;
}

export interface WritableProvider<TInput, TOutput = void> {
	write(input: TInput): Promise<TOutput>;
}
