export abstract class Provider {
	abstract start(): Promise<void>;
	abstract close(): Promise<void>;
}
