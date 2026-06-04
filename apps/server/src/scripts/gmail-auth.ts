/**
 * One-time script to generate a Gmail OAuth2 refresh token.
 *
 * Usage:
 *   npx tsx src/scripts/gmail-auth.ts
 *
 * Prerequisites:
 *   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set in apps/server/.env
 *
 * Steps:
 *   1. The script prints a Google consent URL.
 *   2. Open it in your browser and sign in with the Gmail account to monitor.
 *   3. After authorising, Google redirects to localhost — copy the `code` from the URL.
 *   4. Paste the code back into this terminal when prompted.
 *   5. The script prints your GOOGLE_REFRESH_TOKEN — copy it into your .env file.
 */

import "dotenv/config";
import { google } from "googleapis";
import * as readline from "readline";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
	console.error(
		"Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in apps/server/.env",
	);
	process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
	clientId,
	clientSecret,
	"urn:ietf:wg:oauth:2.0:oob", // out-of-band redirect — copies code to terminal
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const authUrl = oauth2Client.generateAuthUrl({
	access_type: "offline",
	scope: SCOPES,
	prompt: "consent", // force refresh_token to be returned even if already consented
});

console.log("\n─────────────────────────────────────────────────────");
console.log("  Gmail OAuth2 Setup");
console.log("─────────────────────────────────────────────────────");
console.log("\n1. Open this URL in your browser:\n");
console.log("  ", authUrl);
console.log("\n2. Sign in and grant access.");
console.log("3. Copy the authorization code shown on screen.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Paste the authorization code here: ", async (code) => {
	rl.close();

	try {
		const { tokens } = await oauth2Client.getToken(code.trim());

		if (!tokens.refresh_token) {
			console.error(
				"\nNo refresh_token returned. This can happen if the account already granted access.",
				"\nRevoke access at https://myaccount.google.com/permissions and try again.",
			);
			process.exit(1);
		}

		console.log("\n─────────────────────────────────────────────────────");
		console.log("  Success! Add this to your apps/server/.env file:");
		console.log("─────────────────────────────────────────────────────\n");
		console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
		console.log("");
	} catch (err) {
		console.error("\nFailed to exchange code for tokens:", err);
		process.exit(1);
	}
});
