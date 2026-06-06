import { Router } from "express";
import { z } from "zod";
import { arcadeDb } from "./client";
import { initializeArcadeDb } from "./init";

const commandSchema = z.object({
  command: z.string().min(1),
});

const querySchema = z.object({
  query: z.string().min(1),
});

// ── Feed types ────────────────────────────────────────────────────────────────

type EntityRow = {
  name: string;
  kind: string;
  scheduledAt?: string;
  rawTemporal?: string;
  todoDescription?: string;
  topic?: string;
};

type MessageRow = {
  name: string;
  content: string;
  createdAt: string;
};

type AuthorRow = {
  name: string;
  firstSeenAt?: string;
};

type FeedEntity = {
  name: string;
  kind: string;
  scheduledAt?: string;
  rawTemporal?: string;
  todoDescription?: string;
  topic?: string;
};

type FeedItem = {
  id: string;
  messageId: string;
  content: string;
  createdAt: string;
  client: string;
  author: string;
  entities: FeedEntity[];
  /** Derived: first Event/Todo with a scheduledAt, if any */
  nextScheduledAt?: string;
  /** True when the message was received within the last 60 minutes */
  isRecent: boolean;
  /** True when the first scheduled entity is in the future */
  isUpcoming: boolean;
};

// ── Todos feed types ──────────────────────────────────────────────────────────

type TodoMessage = {
  id: string;
  content: string;
  createdAt: string;
  client: string;
  author: string;
};

type TodoFeedItem = {
  id: string;
  name: string;
  scheduledAt?: string;
  rawTemporal?: string;
  todoDescription?: string;
  topic?: string;
  messages: TodoMessage[];
  /** True when scheduledAt is in the future */
  isUpcoming: boolean;
  /** True when any source message was received within the last hour */
  isRecent: boolean;
};

type EventFeedItem = {
  id: string;
  title: string;
  detail: string;
  createdAt?: string;
  scheduledAt?: string;
  rawTemporal?: string;
  isUpcoming: boolean;
  isRecent: boolean;
};

const toRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const r = value as { result?: unknown[]; results?: unknown[] };
    return r.result ?? r.results ?? [];
  }
  return [];
};

/** Escape a string value for use inside ArcadeDB SQL single-quoted literals. */
const esc = (v: string): string => `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** Parse the client prefix out of a `{client}:{id}` message name. */
const parseClient = (messageName: string): string => {
  const prefix = messageName.split(":")[0];
  return prefix ?? "unknown";
};

// ── Router ────────────────────────────────────────────────────────────────────

export const arcadedbRouter: Router = Router();

arcadedbRouter.post("/setup", async (_req, res, next) => {
  try {
    await initializeArcadeDb();
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

arcadedbRouter.post("/command", async (req, res, next) => {
  try {
    const parsed = commandSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { command } = parsed.data;
    const result = await arcadeDb.command(command);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

arcadedbRouter.post("/query", async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { query } = parsed.data;
    const result = await arcadeDb.query(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/arcadedb/feed
 *
 * Returns the 20 most recent Messages enriched with:
 *  - The authoring Person (via AUTHORED edge)
 *  - All Entities mentioned in the message (via MENTIONS edges)
 *
 * Response: { items: FeedItem[] }
 */
arcadedbRouter.get("/feed", async (_req, res, next) => {
  try {
    // 1. Fetch the 20 most recent messages
    const messagesRaw = await arcadeDb.query(
      `SELECT name, content, createdAt FROM Message ORDER BY createdAt DESC LIMIT 20`,
    );
    const messages = toRows(messagesRaw) as MessageRow[];

    if (messages.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const now = new Date();
    const items: FeedItem[] = [];

    for (const msg of messages) {
      const safeName = esc(msg.name);

      // 2. Find the Person that authored this message (Message ←[AUTHORED]← Person)
      let author = "unknown";
      try {
        const personRaw = await arcadeDb.query(
          `SELECT expand(in("AUTHORED")) FROM Message WHERE name = ${safeName} LIMIT 1`,
        );
        const personRows = toRows(personRaw) as AuthorRow[];
        if (personRows.length > 0 && personRows[0]?.name) {
          author = personRows[0].name;
        }
      } catch {
        // keep "unknown" if traversal fails
      }

      // 3. Fetch all entities mentioned in this message via MENTIONS edges
      let entities: FeedEntity[] = [];
      try {
        const entitiesRaw = await arcadeDb.query(
          `SELECT expand(out("MENTIONS")) FROM Message WHERE name = ${safeName} LIMIT 50`,
        );
        const entityRows = toRows(entitiesRaw) as EntityRow[];
        entities = entityRows.map((e) => ({
          name: e.name,
          kind: e.kind,
          scheduledAt: e.scheduledAt,
          rawTemporal: e.rawTemporal,
          todoDescription: e.todoDescription,
          topic: e.topic,
        }));
      } catch {
        // keep empty entities if traversal fails
      }

      // 4. Derive convenience fields
      const msgCreatedAt = new Date(msg.createdAt);
      const ageMs = now.getTime() - msgCreatedAt.getTime();
      const isRecent = ageMs < 60 * 60 * 1000; // within last hour

      // Find the earliest scheduled entity
      const scheduledEntities = entities
        .filter((e) => e.scheduledAt)
        .sort((a, b) =>
          new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
        );

      const nextScheduledAt = scheduledEntities[0]?.scheduledAt;
      const isUpcoming = nextScheduledAt ? new Date(nextScheduledAt) > now : false;

      items.push({
        id: msg.name,
        messageId: msg.name,
        content: msg.content,
        createdAt: msg.createdAt,
        client: parseClient(msg.name),
        author,
        entities,
        nextScheduledAt,
        isRecent,
        isUpcoming,
      });
    }

    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/arcadedb/events
 *
 * Returns a horizontal event feed built from the most recent messages.
 * Each card includes the source, author, a primary entity context, and timing.
 *
 * Response: { events: EventFeedItem[] }
 */
arcadedbRouter.get("/events", async (_req, res, next) => {
  try {
    const eventsRaw = await arcadeDb.query(
      `SELECT name, scheduledAt, rawTemporal, firstSeenAt
       FROM Entity
       WHERE kind = 'Event'
       ORDER BY scheduledAt DESC LIMIT 12`,
    );
    const eventRows = toRows(eventsRaw) as Array<{
      name: string;
      scheduledAt?: string;
      rawTemporal?: string;
      firstSeenAt?: string;
    }>;

    if (eventRows.length === 0) {
      return res.status(200).json({ events: [] });
    }

    const now = new Date();
    const events: EventFeedItem[] = [];

    for (const event of eventRows) {
      const createdAt = event.firstSeenAt;
      const isRecent = createdAt ? now.getTime() - new Date(createdAt).getTime() < 60 * 60 * 1000 : false;
      const isUpcoming = event.scheduledAt ? new Date(event.scheduledAt) > now : false;
      const detail = event.scheduledAt
        ? `Scheduled ${new Date(event.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
        : event.rawTemporal
          ? `When: ${event.rawTemporal}`
          : "Event";

      events.push({
        id: event.name,
        title: event.name,
        detail,
        createdAt,
        scheduledAt: event.scheduledAt,
        rawTemporal: event.rawTemporal,
        isUpcoming,
        isRecent,
      });
    }

    events.sort((a, b) => {
      if (a.isUpcoming && !b.isUpcoming) return -1;
      if (!a.isUpcoming && b.isUpcoming) return 1;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json({ events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/arcadedb/todos
 *
 * Returns all Todo entities enriched with the Messages that mention them.
 * Each todo includes the list of messages that reference it, with author info.
 *
 * Response: { todos: TodoFeedItem[] }
 */
arcadedbRouter.get("/todos", async (_req, res, next) => {
  try {
    // 1. Fetch all Todo entities
    const todosRaw = await arcadeDb.query(
      `SELECT name, kind, scheduledAt, rawTemporal, todoDescription, topic
       FROM Entity WHERE kind = 'Todo'
       ORDER BY createdAt DESC LIMIT 50`,
    );
    const todoRows = toRows(todosRaw) as EntityRow[];

    if (todoRows.length === 0) {
      return res.status(200).json({ todos: [] });
    }

    const now = new Date();
    const todos: TodoFeedItem[] = [];

    for (const todo of todoRows) {
      const safeName = esc(todo.name);

      // 2. Find all Messages that mention this Todo (Entity ←[MENTIONS]← Message)
      let messages: TodoMessage[] = [];
      try {
        const msgsRaw = await arcadeDb.query(
          `SELECT name, content, createdAt FROM (
             SELECT expand(in("MENTIONS")) FROM Entity
             WHERE name = ${safeName} AND kind = 'Todo'
           ) ORDER BY createdAt DESC LIMIT 20`,
        );
        const msgRows = toRows(msgsRaw) as MessageRow[];

        // 3. For each message, resolve its author
        messages = await Promise.all(
          msgRows.map(async (msg) => {
            let author = "unknown";
            try {
              const personRaw = await arcadeDb.query(
                `SELECT expand(in("AUTHORED")) FROM Message WHERE name = ${esc(msg.name)} LIMIT 1`,
              );
              const personRows = toRows(personRaw) as AuthorRow[];
              if (personRows.length > 0 && personRows[0]?.name) {
                author = personRows[0].name;
              }
            } catch { /* keep unknown */ }

            return {
              id: msg.name,
              content: msg.content,
              createdAt: msg.createdAt,
              client: parseClient(msg.name),
              author,
            };
          }),
        );
      } catch { /* keep empty messages */ }

      // 4. Derive flags
      const isUpcoming = todo.scheduledAt
        ? new Date(todo.scheduledAt) > now
        : false;

      const isRecent = messages.some(
        (m) => now.getTime() - new Date(m.createdAt).getTime() < 60 * 60 * 1000,
      );

      todos.push({
        id: todo.name,
        name: todo.name,
        scheduledAt: todo.scheduledAt,
        rawTemporal: todo.rawTemporal,
        todoDescription: todo.todoDescription,
        topic: todo.topic,
        messages,
        isUpcoming,
        isRecent,
      });
    }

    // Sort: upcoming first, then by most recent message
    todos.sort((a, b) => {
      if (a.isUpcoming && !b.isUpcoming) return -1;
      if (!a.isUpcoming && b.isUpcoming) return 1;
      const aTime = a.messages[0] ? new Date(a.messages[0].createdAt).getTime() : 0;
      const bTime = b.messages[0] ? new Date(b.messages[0].createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json({ todos });
  } catch (error) {
    next(error);
  }
});
