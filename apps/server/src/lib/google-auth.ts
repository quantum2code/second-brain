import { env } from "@second-brain/env/server";
import { google } from "googleapis";

export type GoogleOAuth2Client = InstanceType<typeof google.auth.OAuth2>;

/**
 * Creates a configured Google OAuth2 client using credentials from env.
 * Shared by GmailProvider, CalendarProvider, and any future Google API integrations.
 */
export function createGoogleAuthClient(): GoogleOAuth2Client {
	const client = new google.auth.OAuth2(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
	);

	client.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });

	return client;
}

/**
 * Returns true if all required Google credentials are present in env.
 */
export function hasGoogleCredentials(): boolean {
	return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
}
