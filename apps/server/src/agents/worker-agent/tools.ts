import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { arcadeDb } from "@/lib/arcadedb/client";
import { generateEmbedding, cosineSimilarity } from "@/agents/utils/embeddings";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sqlLiteral = (value: string) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const toRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const r = value as { result?: unknown[]; results?: unknown[] };
    return r.result ?? r.results ?? [];
  }
  return [];
};

const fmt = (rows: unknown[]) =>
  rows.length === 0 ? "No results found." : JSON.stringify(rows, null, 2);

// ── Read tools ────────────────────────────────────────────────────────────────

export const searchEntities = tool(
  async ({ query, kind }) => {
    const kindClause = kind ? `AND kind = ${sqlLiteral(kind)}` : "";
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      const result = await arcadeDb.query(
        `SELECT name, kind, topic, scheduledAt, rawTemporal, todoDescription, completedAt
         FROM Entity
         WHERE name LIKE ${sqlLiteral(`%${query}%`)} ${kindClause}
         LIMIT 10`,
      );
      return fmt(toRows(result));
    }

    const allRows = await arcadeDb.query(
      `SELECT name, kind, topic, scheduledAt, rawTemporal, todoDescription, completedAt, embedding
       FROM Entity WHERE embedding IS NOT NULL ${kindClause}`,
    );

    type Row = {
      name: string;
      kind: string;
      topic?: string;
      scheduledAt?: string;
      rawTemporal?: string;
      todoDescription?: string;
      completedAt?: string;
      embedding: string;
    };

    const scored = (toRows(allRows) as Row[])
      .map((row) => {
        try {
          const vec = JSON.parse(row.embedding) as number[];
          const score = cosineSimilarity(queryEmbedding, vec);
          const { embedding: _emb, ...rest } = row;
          return { ...rest, score };
        } catch {
          return null;
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score: _s, ...r }) => r);

    return fmt(scored);
  },
  {
    name: "search_entities",
    description: "Semantic search across all existing knowledge graph entities.",
    schema: z.object({
      query: z.string().describe("Search query"),
      kind: z.enum(["Topic", "Todo", "Event", "Person", "Project", "Technology", "Platform", "Organization", "Location", "Other"]).optional(),
    }),
  }
);

export const getTopicDetail = tool(
  async ({ topicName }) => {
    const childRows = await arcadeDb.query(
      `SELECT name, kind, todoDescription, scheduledAt, rawTemporal, completedAt
       FROM Entity
       WHERE topic = ${sqlLiteral(topicName)}
       ORDER BY kind ASC`,
    );

    const msgRows = await arcadeDb.command(
      `MATCH (msg:Message)-[:MENTIONS]->(e:Entity)
       WHERE e.topic = ${sqlLiteral(topicName)} OR e.name = ${sqlLiteral(topicName)}
       OPTIONAL MATCH (author:Person)-[:AUTHORED]->(msg)
       RETURN DISTINCT msg.content AS content, msg.createdAt AS createdAt,
              author.name AS author
       ORDER BY createdAt DESC
       LIMIT 5`,
      "cypher",
    );

    return JSON.stringify({
      topic: topicName,
      entities: toRows(childRows),
      recentMessages: toRows(msgRows),
    }, null, 2);
  },
  {
    name: "get_topic_detail",
    description: "Get full details for a topic: related entities and recent source messages.",
    schema: z.object({
      topicName: z.string().describe("Exact topic name"),
    }),
  }
);

// ── Write tools ───────────────────────────────────────────────────────────────

export const createEntity = tool(
  async ({ name, kind, topic, todoDescription, scheduledAt, rawTemporal, sourceMessageName }) => {
    const canonicalName = normalizeName(name);
    const now = new Date().toISOString();
    const embedding = await generateEmbedding(`${kind}: ${canonicalName}`);

    const sets = [
      `e.kind = ${sqlLiteral(kind)}`,
      topic ? `e.topic = ${sqlLiteral(topic)}` : null,
      todoDescription ? `e.todoDescription = ${sqlLiteral(todoDescription)}` : null,
      scheduledAt ? `e.scheduledAt = ${sqlLiteral(scheduledAt)}` : null,
      rawTemporal ? `e.rawTemporal = ${sqlLiteral(rawTemporal)}` : null,
      `e.firstSeenAt = ${sqlLiteral(now)}`,
      embedding ? `e.embedding = ${sqlLiteral(JSON.stringify(embedding))}` : null,
    ].filter(Boolean).join(", ");

    await arcadeDb.command(
      `MERGE (e:Entity {name: ${sqlLiteral(canonicalName)}})
       ON CREATE SET ${sets}
       ON MATCH SET e.kind = ${sqlLiteral(kind)}
                   ${embedding ? `, e.embedding = ${sqlLiteral(JSON.stringify(embedding))}` : ""}
                   ${topic ? `, e.topic = ${sqlLiteral(topic)}` : ""}
                   ${todoDescription ? `, e.todoDescription = ${sqlLiteral(todoDescription)}` : ""}
                   ${scheduledAt ? `, e.scheduledAt = ${sqlLiteral(scheduledAt)}` : ""}
                   ${rawTemporal ? `, e.rawTemporal = ${sqlLiteral(rawTemporal)}` : ""}`,
      "cypher",
    );

    // Link message
    await arcadeDb.command(
      `MATCH (msg:Message {name: ${sqlLiteral(sourceMessageName)}}),
             (entity:Entity {name: ${sqlLiteral(canonicalName)}})
       MERGE (msg)-[:MENTIONS]->(entity)`,
      "cypher",
    );

    return `Created ${kind} entity "${canonicalName}" and linked to source message.`;
  },
  {
    name: "create_entity",
    description: "Create a new entity (Topic, Todo, Event, Person, etc.) in the graph database.",
    schema: z.object({
      name: z.string().describe("Entity name"),
      kind: z.enum(["Topic", "Todo", "Event", "Person", "Project", "Technology", "Platform", "Organization", "Location", "Other"]),
      topic: z.string().nullable().optional().describe("Parent topic name (omit for Topic entity itself)"),
      todoDescription: z.string().nullable().optional().describe("Todo description (if kind is Todo)"),
      scheduledAt: z.string().nullable().optional().describe("ISO 8601 scheduled date/time"),
      rawTemporal: z.string().nullable().optional().describe("Raw temporal text expression"),
      sourceMessageName: z.string().describe("The source message name context"),
    }),
  }
);

export const updateEntity = tool(
  async ({ name, fields, sourceMessageName }) => {
    const sets: string[] = [];
    if (fields.topic !== undefined) sets.push(`e.topic = ${sqlLiteral(fields.topic ?? "")}`);
    if (fields.todoDescription !== undefined) sets.push(`e.todoDescription = ${sqlLiteral(fields.todoDescription ?? "")}`);
    if (fields.scheduledAt !== undefined) sets.push(`e.scheduledAt = ${sqlLiteral(fields.scheduledAt ?? "")}`);
    if (fields.rawTemporal !== undefined) sets.push(`e.rawTemporal = ${sqlLiteral(fields.rawTemporal ?? "")}`);

    if (sets.length === 0) return "No fields provided to update.";

    await arcadeDb.command(
      `MATCH (e:Entity {name: ${sqlLiteral(name)}})
       SET ${sets.join(", ")}`,
      "cypher",
    );

    // Link message to show this message caused the update
    await arcadeDb.command(
      `MATCH (msg:Message {name: ${sqlLiteral(sourceMessageName)}}),
             (entity:Entity {name: ${sqlLiteral(name)}})
       MERGE (msg)-[:MENTIONS]->(entity)`,
      "cypher",
    );

    return `Updated entity "${name}": ${sets.join(", ")} and linked to source message.`;
  },
  {
    name: "update_entity",
    description: "Update fields on an existing entity in the graph database.",
    schema: z.object({
      name: z.string().describe("Exact entity name"),
      fields: z.object({
        topic: z.string().nullable().optional().describe("New parent topic name"),
        todoDescription: z.string().nullable().optional().describe("New todo description"),
        scheduledAt: z.string().nullable().optional().describe("New ISO 8601 scheduled date/time"),
        rawTemporal: z.string().nullable().optional().describe("New raw temporal expression"),
      }),
      sourceMessageName: z.string().describe("The source message name context"),
    }),
  }
);

export const markTodoComplete = tool(
  async ({ name, sourceMessageName }) => {
    const now = new Date().toISOString();
    await arcadeDb.command(
      `MATCH (e:Entity {name: ${sqlLiteral(name)}, kind: 'Todo'})
       SET e.completedAt = ${sqlLiteral(now)}`,
      "cypher",
    );

    await arcadeDb.command(
      `MATCH (msg:Message {name: ${sqlLiteral(sourceMessageName)}}),
             (entity:Entity {name: ${sqlLiteral(name)}})
       MERGE (msg)-[:MENTIONS]->(entity)`,
      "cypher",
    );

    return `Marked Todo "${name}" as completed and linked to source message.`;
  },
  {
    name: "mark_todo_complete",
    description: "Mark a todo as completed and link it to the source message.",
    schema: z.object({
      name: z.string().describe("Exact todo entity name"),
      sourceMessageName: z.string().describe("The source message name context"),
    }),
  }
);

export const workerAgentTools = [
  searchEntities,
  getTopicDetail,
  createEntity,
  updateEntity,
  markTodoComplete,
];
