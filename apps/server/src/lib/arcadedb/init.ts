import { arcadeDb, isAlreadyExistsError } from "./client";

const structuralCommands = [
  "CREATE VERTEX TYPE Person IF NOT EXISTS;",
  "CREATE VERTEX TYPE Message IF NOT EXISTS;",
  "CREATE VERTEX TYPE Entity IF NOT EXISTS;",
  // Person properties
  "CREATE PROPERTY Person.name IF NOT EXISTS STRING;",
  "CREATE PROPERTY Person.firstSeenAt IF NOT EXISTS STRING;",
  // Message properties
  "CREATE PROPERTY Message.name IF NOT EXISTS STRING;",
  "CREATE PROPERTY Message.content IF NOT EXISTS STRING;",
  "CREATE PROPERTY Message.createdAt IF NOT EXISTS STRING;",
  // Entity properties
  "CREATE PROPERTY Entity.name IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.kind IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.firstSeenAt IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.scheduledAt IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.rawTemporal IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.embedding IF NOT EXISTS STRING;",
  "CREATE PROPERTY Entity.todoDescription IF NOT EXISTS STRING;",
  // Unique indexes
  "CREATE INDEX ON Person (name) UNIQUE;",
  "CREATE INDEX ON Message (name) UNIQUE;",
  "CREATE INDEX ON Entity (name) UNIQUE;",
  // Edge types
  "CREATE EDGE TYPE AUTHORED IF NOT EXISTS;",
  "CREATE EDGE TYPE MENTIONS IF NOT EXISTS;",
  "CREATE INDEX ON AUTHORED (`@out`, `@in`) UNIQUE;",
  "CREATE INDEX ON MENTIONS (`@out`, `@in`) UNIQUE;",
];

export async function initializeArcadeDb(): Promise<void> {
  await arcadeDb.ensureDatabase();

  for (const command of structuralCommands) {
    try {
      await arcadeDb.command(command);
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }
    }
  }
}
