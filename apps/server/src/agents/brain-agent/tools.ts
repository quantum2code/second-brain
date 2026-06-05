import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { arcadeDb } from "@/lib/arcadedb/client";
import { generateEmbedding, cosineSimilarity } from "@/agents/utils/embeddings";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sqlLiteral = (value: string) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

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

/**
 * Semantic entity search — generates an embedding for the query, scores every
 * stored entity by cosine similarity, and returns the top-8 matches.
 * Falls back to a SQL LIKE search when the embedding API is unavailable.
 */
export const searchEntities = tool(
  async ({ query, kind }) => {
    const kindClause = kind ? `AND kind = ${sqlLiteral(kind)}` : "";

    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      // Embedding unavailable — text fallback
      const result = await arcadeDb.query(
        `SELECT name, kind, topic, scheduledAt, rawTemporal, todoDescription, completedAt
         FROM Entity
         WHERE name LIKE ${sqlLiteral(`%${query}%`)} ${kindClause}
         LIMIT 10`,
      );
      return fmt(toRows(result));
    }

    // Fetch all embeddings and score locally
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
    description:
      "Semantic search across all knowledge graph entities (todos, events, topics, people, projects, …). " +
      "Always call this first when you need to check whether something already exists.",
    schema: z.object({
      query: z.string().describe("Natural language search query"),
      kind: z
        .enum([
          "Topic", "Todo", "Event", "Person",
          "Project", "Technology", "Platform",
          "Organization", "Location", "Other",
        ])
        .optional()
        .describe("Optional: filter results to this entity kind"),
    }),
  },
);

/**
 * List todos with optional topic filter and completed-items toggle.
 * Returns results sorted by scheduledAt ascending (overdue items first).
 */
export const listTodos = tool(
  async ({ topic, includeCompleted }) => {
    const conditions = [`kind = 'Todo'`];
    if (topic) conditions.push(`topic = ${sqlLiteral(topic)}`);
    if (!includeCompleted) conditions.push(`completedAt IS NULL`);

    const result = await arcadeDb.query(
      `SELECT name, topic, todoDescription, scheduledAt, rawTemporal, completedAt
       FROM Entity
       WHERE ${conditions.join(" AND ")}
       ORDER BY scheduledAt ASC`,
    );
    return fmt(toRows(result));
  },
  {
    name: "list_todos",
    description:
      "List todos from the knowledge graph sorted by due date. " +
      "Returns only pending (incomplete) todos by default.",
    schema: z.object({
      topic: z.string().optional().describe("Filter by parent topic name"),
      includeCompleted: z
        .boolean()
        .optional()
        .describe("Set true to also include completed todos"),
    }),
  },
);

/**
 * List upcoming events within a date window.
 */
export const listUpcomingEvents = tool(
  async ({ topic, daysAhead }) => {
    const now = new Date().toISOString();
    const until = new Date(
      Date.now() + (daysAhead ?? 7) * 24 * 60 * 60 * 1000,
    ).toISOString();

    const conditions = [
      `kind = 'Event'`,
      `scheduledAt >= ${sqlLiteral(now)}`,
      `scheduledAt <= ${sqlLiteral(until)}`,
    ];
    if (topic) conditions.push(`topic = ${sqlLiteral(topic)}`);

    const result = await arcadeDb.query(
      `SELECT name, topic, scheduledAt, rawTemporal
       FROM Entity
       WHERE ${conditions.join(" AND ")}
       ORDER BY scheduledAt ASC`,
    );
    return fmt(toRows(result));
  },
  {
    name: "list_upcoming_events",
    description:
      "List upcoming calendar events within the next N days (default 7). " +
      "Shows name, topic, and scheduled time.",
    schema: z.object({
      topic: z.string().optional().describe("Filter by parent topic name"),
      daysAhead: z
        .number()
        .optional()
        .describe("How many days to look ahead (default: 7)"),
    }),
  },
);

/**
 * Get full detail for a topic: its child entities and recent source messages.
 */
export const getTopicDetail = tool(
  async ({ topicName }) => {
    // Children (todos, events, people, etc.)
    const childRows = await arcadeDb.query(
      `SELECT name, kind, todoDescription, scheduledAt, rawTemporal, completedAt
       FROM Entity
       WHERE topic = ${sqlLiteral(topicName)}
       ORDER BY kind ASC`,
    );

    // Recent messages that mention any entity in this topic
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
    description:
      "Get a topic's full detail: all related todos, events, people, and the 5 most recent source messages.",
    schema: z.object({
      topicName: z.string().describe("Exact or approximate name of the topic"),
    }),
  },
);

// ── Write tools ───────────────────────────────────────────────────────────────

/**
 * Update mutable fields on any entity (scheduledAt, todoDescription, rawTemporal).
 */
export const updateEntity = tool(
  async ({ name, fields }) => {
    const sets: string[] = [];
    if (fields.scheduledAt !== undefined)
      sets.push(`e.scheduledAt = ${sqlLiteral(fields.scheduledAt ?? "")}`);
    if (fields.todoDescription !== undefined)
      sets.push(`e.todoDescription = ${sqlLiteral(fields.todoDescription ?? "")}`);
    if (fields.rawTemporal !== undefined)
      sets.push(`e.rawTemporal = ${sqlLiteral(fields.rawTemporal ?? "")}`);

    if (sets.length === 0) return "No fields provided to update.";

    await arcadeDb.command(
      `MATCH (e:Entity {name: ${sqlLiteral(name)}})
       SET ${sets.join(", ")}`,
      "cypher",
    );

    return `Updated "${name}": ${sets.join(", ")}`;
  },
  {
    name: "update_entity",
    description:
      "Update fields on an existing entity. Use search_entities first to confirm the exact name.",
    schema: z.object({
      name: z.string().describe("Exact entity name (from search_entities)"),
      fields: z.object({
        scheduledAt: z
          .string()
          .nullable()
          .optional()
          .describe("New ISO 8601 scheduled date"),
        todoDescription: z
          .string()
          .nullable()
          .optional()
          .describe("New todo description"),
        rawTemporal: z
          .string()
          .nullable()
          .optional()
          .describe("New raw temporal expression (e.g. 'next Monday')"),
      }),
    }),
  },
);

/**
 * Mark a Todo as completed by setting completedAt to now.
 */
export const markTodoComplete = tool(
  async ({ name }) => {
    const now = new Date().toISOString();
    await arcadeDb.command(
      `MATCH (e:Entity {name: ${sqlLiteral(name)}, kind: 'Todo'})
       SET e.completedAt = ${sqlLiteral(now)}`,
      "cypher",
    );
    return `Marked "${name}" as completed at ${now}.`;
  },
  {
    name: "mark_todo_complete",
    description: "Mark a todo as completed. Use search_entities to find the exact name first.",
    schema: z.object({
      name: z.string().describe("Exact todo entity name"),
    }),
  },
);

/**
 * Manually create a new Todo entity in the graph.
 */
export const createTodo = tool(
  async ({ name, topic, description, scheduledAt }) => {
    const now = new Date().toISOString();
    const sets = [
      `e.kind = 'Todo'`,
      `e.topic = ${sqlLiteral(topic)}`,
      `e.todoDescription = ${sqlLiteral(description)}`,
      `e.firstSeenAt = ${sqlLiteral(now)}`,
      scheduledAt ? `e.scheduledAt = ${sqlLiteral(scheduledAt)}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    await arcadeDb.command(
      `MERGE (e:Entity {name: ${sqlLiteral(name)}})
       ON CREATE SET ${sets}
       ON MATCH SET e.kind = 'Todo', e.topic = ${sqlLiteral(topic)},
                   e.todoDescription = ${sqlLiteral(description)}
                   ${scheduledAt ? `, e.scheduledAt = ${sqlLiteral(scheduledAt)}` : ""}`,
      "cypher",
    );

    return `Created todo "${name}" under topic "${topic}".`;
  },
  {
    name: "create_todo",
    description:
      "Manually create a new todo in the knowledge graph. " +
      "Use this when the user explicitly asks to add a task that doesn't exist yet.",
    schema: z.object({
      name: z.string().describe("Short name for the todo"),
      topic: z.string().describe("Parent topic this todo belongs to"),
      description: z.string().describe("Clear description of what must be done"),
      scheduledAt: z
        .string()
        .optional()
        .describe("Optional ISO 8601 due date/time"),
    }),
  },
);

// ── Exported tool list ────────────────────────────────────────────────────────

export const brainAgentTools = [
  searchEntities,
  listTodos,
  listUpcomingEvents,
  getTopicDetail,
  updateEntity,
  markTodoComplete,
  createTodo,
];
