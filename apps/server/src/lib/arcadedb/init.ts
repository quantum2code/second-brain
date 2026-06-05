import { arcadeDb, isAlreadyExistsError } from "./client";

const structuralCommands = [
  "CREATE VERTEX TYPE Project IF NOT EXISTS;",
  "CREATE VERTEX TYPE WorkspaceItem IF NOT EXISTS;",
  "CREATE VERTEX TYPE Person IF NOT EXISTS;",
  "CREATE VERTEX TYPE Event IF NOT EXISTS;",
  "CREATE VERTEX TYPE Concept IF NOT EXISTS;",
  "CREATE PROPERTY WorkspaceItem.embedding_vector IF NOT EXISTS ARRAY_OF_FLOATS;",
  "CREATE EDGE TYPE BELONGS_TO IF NOT EXISTS;",
  "CREATE EDGE TYPE AUTHORED_BY IF NOT EXISTS;",
  "CREATE EDGE TYPE REFERENCES IF NOT EXISTS;",
  "CREATE EDGE TYPE MENTIONS IF NOT EXISTS;",
  "CREATE EDGE TYPE SEMANTICALLY_SAME IF NOT EXISTS;",
];

const vectorIndexCommand =
  'CREATE INDEX ON WorkspaceItem (embedding_vector) LSM_VECTOR METADATA {dimensions: 1536, similarity: "COSINE"};';

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

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      await arcadeDb.command(vectorIndexCommand);
      return;
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        return;
      }

      if (attempts >= maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
