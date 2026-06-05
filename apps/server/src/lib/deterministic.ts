import { arcadeDb } from "@/lib/arcadedb/client";
import type { EventMessageJob } from "@/lib/events";

const sqlLiteral = (value: string) => `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const getMessageName = (message: EventMessageJob): string =>
	`${message.client}:${message.messageId}`;

export function deterministicMessageName(message: EventMessageJob): string {
	return normalizeName(getMessageName(message));
}

export async function persistDeterministicMessage(message: EventMessageJob): Promise<void> {
	// authorUsername is always populated by the time the job reaches here:
	//   Discord → authorUsername from event payload (discord.js always provides it)
	//   Slack   → resolved via Slack users.info API before the job is queued
	const username  = normalizeName(message.authorUsername);
	const messageName = normalizeName(getMessageName(message));
	const now = new Date().toISOString();

	// Platform-specific ID field to store alongside the username
	const platformIdField = message.client === "discord" ? "discordId" : "slackId";
	const platformId = message.authorId;

	// ── Person: MERGE on username, store platform ID on create or match ──────
	// If the same person appears on both Discord and Slack with the same username,
	// they share one vertex and accumulate both discordId and slackId.
	await arcadeDb.command(
		`MERGE (p:Person {name: ${sqlLiteral(username)}})
		 ON CREATE SET p.firstSeenAt = ${sqlLiteral(now)}, p.${platformIdField} = ${sqlLiteral(platformId)}
		 ON MATCH SET  p.${platformIdField} = ${sqlLiteral(platformId)}`,
		"cypher",
	);

	// ── Message: UPSERT (SQL — ArcadeDB UPSERT is still cleaner for flat rows) ─
	await arcadeDb.command(
		`UPDATE Message SET name = ${sqlLiteral(messageName)}, content = ${sqlLiteral(message.content || "")}, createdAt = ${sqlLiteral(message.createdAt)} UPSERT WHERE name = ${sqlLiteral(messageName)}`,
	);

	// ── AUTHORED edge: Cypher MERGE — idempotent, no pre-check needed ─────────
	await arcadeDb.command(
		`MATCH (p:Person {name: ${sqlLiteral(username)}}), (m:Message {name: ${sqlLiteral(messageName)}})
		 MERGE (p)-[:AUTHORED]->(m)`,
		"cypher",
	);
}
