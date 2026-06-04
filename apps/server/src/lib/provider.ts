export abstract class Provider {
	abstract close(): Promise<void>;
}
