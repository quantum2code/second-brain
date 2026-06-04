import { worker as discordWorker } from "./discord";
import { worker as gmailWorker } from "./gmail";
import { worker as slackWorker } from "./slack";

const shutdown = async () => {
	await Promise.all([discordWorker.close(), slackWorker.close(), gmailWorker.close()]);
	process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log("[workers] all workers started");
