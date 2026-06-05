import { arcadeDb } from "@/lib/arcadedb/client";
import type { EventMessageJob } from "@/lib/events";

const sqlLiteral = (value: string) => `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const getPersonName = (message: EventMessageJob): string => `${message.client}:${message.authorId}`;

const getMessageName = (message: EventMessageJob): string => `${message.client}:${message.messageId}`;

export function deterministicMessageName(message: EventMessageJob): string {
	return normalizeName(getMessageName(message));
}

export async function persistDeterministicMessage(message: EventMessageJob): Promise<void> {
	const personName = normalizeName(getPersonName(message));
	const messageName = normalizeName(getMessageName(message));
	const now = new Date().toISOString();

	await arcadeDb.command(
		`UPDATE Person SET name = ${sqlLiteral(personName)} UPSERT WHERE name = ${sqlLiteral(personName)}`,
	);

	// Set firstSeenAt only on first insertion — never overwrite on re-upsert
	await arcadeDb.command(
		`UPDATE Person SET firstSeenAt = ${sqlLiteral(now)} WHERE name = ${sqlLiteral(personName)} AND firstSeenAt IS NULL`,
	);

	await arcadeDb.command(
		`UPDATE Message SET name = ${sqlLiteral(messageName)}, content = ${sqlLiteral(message.content || "")}, createdAt = ${sqlLiteral(message.createdAt)} UPSERT WHERE name = ${sqlLiteral(messageName)}`,
	);

	await arcadeDb.command(
		`CREATE EDGE AUTHORED FROM (SELECT FROM Person WHERE name = ${sqlLiteral(personName)} LIMIT 1) TO (SELECT FROM Message WHERE name = ${sqlLiteral(messageName)} LIMIT 1) IF NOT EXISTS`,
	);
}
