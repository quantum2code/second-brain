import { worker as discordWorker } from "./discord";
import { worker as slackWorker } from "./slack";
import { worker as groqAgentWorker } from "./agent";
import { closeAiQueue } from "@/lib/ai";

const shutdown = async () => {
	await Promise.all([
		discordWorker.close(),
		slackWorker.close(),
		groqAgentWorker.close(),
		closeAiQueue(),
	]);
	process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log("[workers] all workers started");
