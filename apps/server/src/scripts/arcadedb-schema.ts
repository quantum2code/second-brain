/**
 * arcadedb:schema — interactive CLI to reset or update the ArcadeDB schema.
 *
 * Usage:
 *   pnpm arcadedb:schema          — apply / migrate schema (safe, IF NOT EXISTS)
 *   pnpm arcadedb:schema --reset  — DROP the entire database then re-create it
 *
 * The --reset flag is DESTRUCTIVE. It prompts for confirmation before proceeding.
 */

import { arcadeDb } from "@/lib/arcadedb/client";
import { initializeArcadeDb } from "@/lib/arcadedb/init";
import { env } from "@second-brain/env/server";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const isReset = process.argv.includes("--reset");

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

async function dropDatabase(): Promise<void> {
  console.log(`\n⚠️  Dropping database "${env.ARCADEDB_DATABASE}" …`);
  try {
    await arcadeDb.dropDatabase();
    console.log("✅  Database dropped.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("does not exist")) {
      console.log("   (database did not exist — skipping drop)");
    } else {
      throw err;
    }
  }
}

async function applySchema(): Promise<void> {
  console.log(`\n🔧 Applying schema to "${env.ARCADEDB_DATABASE}" …`);
  await initializeArcadeDb();
  console.log("✅  Schema applied.");
}

async function printSchemaSummary(): Promise<void> {
  try {
    const result = await arcadeDb.query<{
      result?: Array<{ name: string; type: string }>;
    }>("SELECT name, type FROM schema:types ORDER BY name ASC");

    const rows = result.result ?? [];
    if (rows.length === 0) {
      console.log("\n   (no types found)");
      return;
    }

    const vertices = rows.filter((r) => r.type === "vertex").map((r) => r.name);
    const edges    = rows.filter((r) => r.type === "edge").map((r) => r.name);

    console.log("\n📋 Schema summary:");
    if (vertices.length) console.log(`   Vertices : ${vertices.join(", ")}`);
    if (edges.length)    console.log(`   Edges    : ${edges.join(", ")}`);
  } catch {
    // schema summary is best-effort; don't fail the command
  }
}

async function main(): Promise<void> {
  const hr = "=".repeat(55);
  console.log(hr);
  console.log("  ArcadeDB Schema Manager");
  console.log(hr);
  console.log(`  Database : ${env.ARCADEDB_DATABASE}`);
  console.log(`  Host     : ${env.ARCADEDB_URL}`);
  console.log(`  Mode     : ${isReset ? "RESET + migrate" : "migrate (safe)"}`);
  console.log(hr);

  if (isReset) {
    const ok = await confirm(
      `\n⚠️  This will permanently DELETE all data in "${env.ARCADEDB_DATABASE}".\n   Type "y" to confirm: `,
    );

    if (!ok) {
      console.log("\n❌  Aborted.\n");
      process.exit(0);
    }

    await dropDatabase();
  }

  await applySchema();
  await printSchemaSummary();

  console.log("\n🎉  Done.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Schema command failed:", err);
  process.exit(1);
});
