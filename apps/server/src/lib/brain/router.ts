import { Router } from "express";
import { arcadeDb } from "@/lib/arcadedb/client";
import { invokeBrainAgent } from "@/agents/brain-agent/agent";

export const brainRouter: Router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

const toRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const r = value as { result?: unknown[]; results?: unknown[] };
    return r.result ?? r.results ?? [];
  }
  return [];
};

/** "slack:1780662915.047049" → "slack" */
const parsePlatform = (messageName: string): string =>
  messageName.split(":")[0] ?? "unknown";

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageResult = {
  name?: string | null;
  content?: string | null;
  createdAt?: string | null;
  author?: string | null;
};

type TodoResult = {
  name: string;
  todoDescription?: string | null;
  topic?: string | null;
  scheduledAt?: string | null;
  rawTemporal?: string | null;
  firstSeenAt?: string | null;
  messages: MessageResult[];
};

// ── GET /api/brain/todos ──────────────────────────────────────────────────────

/**
 * Single Cypher traversal that:
 *   1. Matches all Todo entities
 *   2. For each todo, follows MENTIONS edges IN reverse to find Messages that
 *      referenced any entity under the same topic (or the topic vertex itself)
 *   3. Follows AUTHORED edges to reach the Person who sent each message
 *   4. Collects everything into a shaped response
 *
 * Graph pattern:
 *
 *   (Person)-[:AUTHORED]->(Message)-[:MENTIONS]->(Entity{topic=todo.topic})
 *                                                      ↑
 *                                               (Entity{kind:'Topic'})
 */
brainRouter.get("/todos", async (_req, res, next) => {
  try {
    const result = await arcadeDb.query(
      `
      MATCH (todo:Entity {kind: 'Todo'})
      OPTIONAL MATCH (msg:Message)-[:MENTIONS]->(related:Entity)
      WHERE related.topic = todo.topic
         OR related.name  = todo.topic
      OPTIONAL MATCH (author:Person)-[:AUTHORED]->(msg)
      WITH todo,
           CASE
             WHEN msg IS NOT NULL
             THEN { name: msg.name, content: msg.content, createdAt: msg.createdAt, author: author.name }
             ELSE null
           END AS msgData
      RETURN
        todo.name           AS name,
        todo.todoDescription AS todoDescription,
        todo.topic          AS topic,
        todo.scheduledAt    AS scheduledAt,
        todo.rawTemporal    AS rawTemporal,
        todo.firstSeenAt    AS firstSeenAt,
        collect(DISTINCT msgData) AS messages
      ORDER BY todo.scheduledAt ASC
      `,
      "cypher",
    );

    const rows = toRows(result) as TodoResult[];

    const shaped = rows.map((row) => ({
      name: row.name,
      todoDescription: row.todoDescription ?? null,
      topic: row.topic ?? null,
      scheduledAt: row.scheduledAt ?? null,
      rawTemporal: row.rawTemporal ?? null,
      firstSeenAt: row.firstSeenAt ?? null,
      messages: (row.messages ?? [])
        // OPTIONAL MATCH produces null entries when there are no matches
        .filter((m): m is MessageResult & { name: string } => !!m?.name)
        // Stable chronological order
        .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
        .map((m) => ({
          name: m.name,
          content: m.content ?? "",
          createdAt: m.createdAt ?? "",
          platform: parsePlatform(m.name ?? ""),   // "discord:xyz" → "discord"
          author: m.author ?? "",                  // Person.name is now the username directly
        })),
    }));

    res.json(shaped);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/brain/chat ──────────────────────────────────────────────────────
brainRouter.post("/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (typeof message !== "string") {
      res.status(400).json({ error: "message is required and must be a string" });
      return;
    }
    const result = await invokeBrainAgent(message);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

