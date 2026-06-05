import { extractKnowledge, generateUpdatePlan } from "./utils/groq";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { arcadeDb } from "@/lib/arcadedb/client";
import {
  type Extraction,
  type ExtractedEntity,
  type UpdatePlan,
} from "./utils/schema";
import type { EnrichmentCandidate, ExistingEntityMatch, TopicContextEntity } from "./utils/types";
export type { EnrichmentCandidate, ExistingEntityMatch } from "./utils/types";
import {
  cosineSimilarity,
  generateEmbedding,
  SIMILARITY_THRESHOLD,
} from "./utils/embeddings";

// ── Shared types ──────────────────────────────────────────────────────────────

type CreatedEdge = { from: string; type: string; to: string };

type State = {
  text: string;
  sourceMessageName: string;
  messageCreatedAt: string;
  messageAuthor: string;
  entities: ExtractedEntity[];
  entityEmbeddings: Record<string, number[]>;
  enrichmentCandidates: EnrichmentCandidate[];
  topicRelatedEntities: TopicContextEntity[];
  updatePlan: UpdatePlan | null;
  createdEdges: CreatedEdge[];
  persisted: boolean;
};

// ── SQL helpers ───────────────────────────────────────────────────────────────

const sqlLiteral = (value: string) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const toRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as { result?: unknown[]; results?: unknown[] };
    return record.result ?? record.results ?? [];
  }

  return [];
};

// ── DB helpers ────────────────────────────────────────────────────────────────


type StoredEntityRow = {
  name: string;
  embedding: string;
  kind: string;
  firstSeenAt?: string;
  scheduledAt?: string;
  rawTemporal?: string;
};

/**
 * Query stored entities that have an embedding.
 * When `kind` is provided the query is filtered to that kind; omit it to
 * fetch ALL entities — used for cross-kind similarity dedup.
 */
async function queryStoredEntities(kind?: string): Promise<StoredEntityRow[]> {
  const whereClause = kind
    ? `WHERE kind = ${sqlLiteral(kind)} AND embedding IS NOT NULL`
    : `WHERE embedding IS NOT NULL`;

  const result = await arcadeDb.query(
    `SELECT name, embedding, kind, firstSeenAt, scheduledAt, rawTemporal
     FROM Entity
     ${whereClause}`,
  );

  return toRows(result) as StoredEntityRow[];
}

/**
 * From a set of stored rows, find the single closest match above
 * SIMILARITY_THRESHOLD. Used by upsertEntity for dedup.
 */
function findBestMatch(
  rows: StoredEntityRow[],
  queryEmbedding: number[],
): string | null {
  let bestName: string | null = null;
  let bestScore = 0;

  for (const row of rows) {
    try {
      const stored = JSON.parse(row.embedding) as number[];
      const score = cosineSimilarity(queryEmbedding, stored);

      if (score > bestScore) {
        bestScore = score;
        bestName = row.name;
      }
    } catch {
      // skip malformed stored embeddings
    }
  }

  return bestScore >= SIMILARITY_THRESHOLD ? bestName : null;
}

/**
 * Upsert an entity into ArcadeDB.
 * Accepts an optional pre-computed embedding (from embedNode) to avoid a
 * second API call. Falls back to generating one if not provided.
 * Returns the canonical name actually stored.
 */
async function upsertEntity(
  entity: ExtractedEntity,
  precomputedEmbedding?: number[],
): Promise<string> {
  const name = normalizeName(entity.name);
  const now = new Date().toISOString();

  const embedding = precomputedEmbedding ?? await generateEmbedding(`${entity.kind}: ${name}`);

  if (embedding) {
    // Search across ALL kinds — prevents cross-kind duplicates
    const rows = await queryStoredEntities();
    const existingName = findBestMatch(rows, embedding);

    if (existingName) {
      console.log(
        `[embeddings] merged ${sqlLiteral(name)} → existing "${existingName}" (similarity ≥ ${SIMILARITY_THRESHOLD})`,
      );

      const propagated = [
        entity.topic           ? `topic = ${sqlLiteral(entity.topic)}`                       : "",
        entity.scheduledAt     ? `scheduledAt = ${sqlLiteral(entity.scheduledAt)}`           : "",
        entity.rawTemporal     ? `rawTemporal = ${sqlLiteral(entity.rawTemporal)}`           : "",
        entity.todoDescription ? `todoDescription = ${sqlLiteral(entity.todoDescription)}`   : "",
      ]
        .filter(Boolean)
        .join(", ");

      if (propagated) {
        await arcadeDb.command(
          `UPDATE Entity SET ${propagated} WHERE name = ${sqlLiteral(existingName)}`,
        );
      }

      return existingName;
    }
  }

  // --- No match — create or update the entity via a single Cypher MERGE ---
  // ON CREATE SET: all fields including firstSeenAt (set once, never overwritten).
  // ON MATCH SET:  same fields minus firstSeenAt — preserves the original value.
  const optionalSets = [
    entity.topic           ? `e.topic = ${sqlLiteral(entity.topic)}`                       : "",
    entity.scheduledAt     ? `e.scheduledAt = ${sqlLiteral(entity.scheduledAt)}`           : "",
    entity.rawTemporal     ? `e.rawTemporal = ${sqlLiteral(entity.rawTemporal)}`           : "",
    entity.todoDescription ? `e.todoDescription = ${sqlLiteral(entity.todoDescription)}`   : "",
    embedding              ? `e.embedding = ${sqlLiteral(JSON.stringify(embedding))}`      : "",
  ].filter(Boolean);

  const baseSet     = [`e.kind = ${sqlLiteral(entity.kind)}`, ...optionalSets].join(", ");
  const onCreateSet = [`e.firstSeenAt = ${sqlLiteral(now)}`, ...optionalSets, `e.kind = ${sqlLiteral(entity.kind)}`].join(", ");

  await arcadeDb.command(
    `MERGE (e:Entity {name: ${sqlLiteral(name)}})
     ON CREATE SET ${onCreateSet}
     ON MATCH SET  ${baseSet}`,
    "cypher",
  );

  return name;
}

/**
 * Persist all extracted entities, deduplicating via embedding similarity.
 * Accepts pre-computed embeddings from embedNode so we don't re-call the API.
 * Returns a map from the normalised input name → canonical stored name.
 */
async function persistExtraction(
  extraction: Extraction,
  entityEmbeddings: Record<string, number[]>,
): Promise<Map<string, string>> {
  const uniqueEntities = new Map<string, ExtractedEntity>();

  for (const entity of extraction.entities) {
    uniqueEntities.set(normalizeName(entity.name), {
      ...entity,
      name: normalizeName(entity.name),
    });
  }

  const nameMap = new Map<string, string>();

  for (const entity of uniqueEntities.values()) {
    const embedding = entityEmbeddings[entity.name];
    const canonical = await upsertEntity(entity, embedding);
    nameMap.set(entity.name, canonical);
  }

  return nameMap;
}

// ── Graph nodes ───────────────────────────────────────────────────────────────

async function extractNode(state: Pick<State, "text" | "messageCreatedAt" | "messageAuthor">) {
  return extractKnowledge(state.text, state.messageCreatedAt, state.messageAuthor);
}

/**
 * Pre-compute embeddings for every extracted entity before any DB writes.
 * Stores them in state so searchNode and persistNode both use the same vectors.
 */
async function embedNode(state: Pick<State, "entities">) {
  const entityEmbeddings: Record<string, number[]> = {};

  await Promise.all(
    state.entities.map(async (entity) => {
      const name = normalizeName(entity.name);
      const embedding = await generateEmbedding(`${entity.kind}: ${name}`);

      if (embedding) {
        entityEmbeddings[name] = embedding;
      }
    }),
  );

  return { entityEmbeddings };
}

/**
 * For each entity with a pre-computed embedding, compare against ALL stored
 * entities (regardless of kind). Entities with ≥2 matches above the threshold
 * are flagged as enrichment candidates for planNode.
 *
 * A single match is fine (upsertEntity handles dedup); 2+ means genuine
 * ambiguity that requires LLM judgment.
 */
async function searchNode(
  state: Pick<State, "entities" | "entityEmbeddings">,
) {
  const enrichmentCandidates: EnrichmentCandidate[] = [];

  // Fetch ALL stored entities once — cross-kind dedup
  const allStoredRows = await queryStoredEntities();

  for (const entity of state.entities) {
    const name = normalizeName(entity.name);
    const incomingEmbedding = state.entityEmbeddings[name];

    if (!incomingEmbedding) continue;

    const matches: ExistingEntityMatch[] = [];

    for (const row of allStoredRows) {
      try {
        const stored = JSON.parse(row.embedding) as number[];
        const similarity = cosineSimilarity(incomingEmbedding, stored);

        if (similarity >= SIMILARITY_THRESHOLD) {
          matches.push({
            name: row.name,
            similarity,
            kind: row.kind,
            firstSeenAt: row.firstSeenAt,
            scheduledAt: row.scheduledAt,
            rawTemporal: row.rawTemporal,
          });
        }
      } catch {
        // skip malformed embeddings
      }
    }

    if (matches.length >= 2) {
      enrichmentCandidates.push({ incomingEntity: entity, incomingEmbedding, matches });
    }
  }

  // ── Topic context: fetch existing children of the matched Topic ────────────
  // When the incoming message's Topic matches a stored one, pull all entities
  // that belong to it so planNode can propagate temporal updates to them.
  let topicRelatedEntities: TopicContextEntity[] = [];
  const incomingTopic = state.entities.find((e) => e.kind === "Topic");

  if (incomingTopic) {
    const topicName = normalizeName(incomingTopic.name);
    const topicEmbedding = state.entityEmbeddings[topicName];

    if (topicEmbedding) {
      const matchedTopicName = findBestMatch(allStoredRows, topicEmbedding);

      if (matchedTopicName) {
        const result = await arcadeDb.query(
          `SELECT name, kind, scheduledAt, rawTemporal, todoDescription
           FROM Entity
           WHERE topic = ${sqlLiteral(matchedTopicName)}`,
        );
        topicRelatedEntities = toRows(result) as TopicContextEntity[];
      }
    }
  }

  return { enrichmentCandidates, topicRelatedEntities };
}

/**
 * Ask the Groq LLM to produce a structured update plan.
 * Reached when there are enrichment candidates OR topic-related entities
 * that may need temporal updates propagated to them.
 */
async function planNode(
  state: Pick<State, "enrichmentCandidates" | "topicRelatedEntities" | "entities">,
) {
  // Incoming entities that carry temporal data (excludes the Topic itself)
  const incomingTemporalEntities = state.entities.filter(
    (e) => e.kind !== "Topic" && (e.scheduledAt || e.rawTemporal),
  );

  const topicContext =
    state.topicRelatedEntities.length > 0
      ? { incomingTemporalEntities, existingTopicEntities: state.topicRelatedEntities }
      : undefined;

  const updatePlan = await generateUpdatePlan(state.enrichmentCandidates, topicContext);
  console.log("[groq_ai] update plan", JSON.stringify(updatePlan, null, 2));
  return { updatePlan };
}

/**
 * Execute the LLM-generated update plan against ArcadeDB.
 * Runs before persistNode so merges consolidate entities before new edges
 * are created.
 */
async function executeNode(state: Pick<State, "updatePlan">) {
  if (!state.updatePlan) return {};

  for (const action of state.updatePlan.actions) {
    switch (action.action) {
      case "merge": {
        console.log(
          `[groq_ai] execute merge: "${action.incomingName}" → "${action.targetName}" — ${action.reason}`,
        );

        // Re-route every MENTIONS edge that points at incomingName to targetName.
        // MERGE (instead of CREATE) is idempotent — safe if the edge already exists.
        // DELETE r removes the old edge once the new one is in place.
        await arcadeDb.command(
          `MATCH (msg:Message)-[r:MENTIONS]->(old:Entity {name: ${sqlLiteral(action.incomingName)}})
           MATCH (target:Entity {name: ${sqlLiteral(action.targetName)}})
           MERGE (msg)-[:MENTIONS]->(target)
           DELETE r`,
          "cypher",
        );

        // DETACH DELETE removes the vertex AND any remaining edges — safer than a
        // plain DELETE which may leave orphaned edges in some graph DBs.
        await arcadeDb.command(
          `MATCH (e:Entity {name: ${sqlLiteral(action.incomingName)}})
           DETACH DELETE e`,
          "cypher",
        );
        break;
      }

      case "update": {
        console.log(
          `[groq_ai] execute update: "${action.targetName}" fields=${JSON.stringify(action.fields)} — ${action.reason}`,
        );

        const setParts = Object.entries(action.fields)
          .filter(([_, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k} = ${sqlLiteral(v as string)}`)
          .join(", ");

        if (setParts) {
          await arcadeDb.command(
            `UPDATE Entity SET ${setParts} WHERE name = ${sqlLiteral(action.targetName)}`,
          );
        }
        break;
      }

      case "noop":
        console.log(`[groq_ai] execute noop: ${action.reason}`);
        break;
    }
  }

  return {};
}

async function persistNode(
  state: Pick<State, "entities" | "sourceMessageName" | "entityEmbeddings">,
) {
  if (state.entities.length === 0) {
    return { persisted: false, createdEdges: [] };
  }

  // Persist entities and get back canonical names (after dedup)
  const nameMap = await persistExtraction(
    { entities: state.entities },
    state.entityEmbeddings,
  );

  const createdEdges: CreatedEdge[] = [];

  // Create MENTIONS edges from the source message to each canonical entity.
  // MATCH (msg), (entity) naturally acts as the existence guard — if either
  // vertex is missing the MATCH returns nothing and MERGE is never reached.
  // This replaces the previous findEntity() pre-check + CREATE EDGE IF NOT EXISTS.
  for (const canonicalName of new Set(nameMap.values())) {
    await arcadeDb.command(
      `MATCH (msg:Message {name: ${sqlLiteral(state.sourceMessageName)}}),
             (entity:Entity {name: ${sqlLiteral(canonicalName)}})
       MERGE (msg)-[:MENTIONS]->(entity)`,
      "cypher",
    );

    createdEdges.push({
      from: `Message:${state.sourceMessageName}`,
      type: "MENTIONS",
      to: `Entity:${canonicalName}`,
    });
  }

  return { persisted: true, createdEdges };
}

// ── LangGraph wiring ──────────────────────────────────────────────────────────

export const GraphState = Annotation.Root({
  text: Annotation<string>,
  sourceMessageName: Annotation<string>,
  messageCreatedAt: Annotation<string>,
  messageAuthor: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  entities: Annotation<ExtractedEntity[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  entityEmbeddings: Annotation<Record<string, number[]>>({
    reducer: (_, next) => next,
    default: () => ({}),
  }),
  enrichmentCandidates: Annotation<EnrichmentCandidate[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  topicRelatedEntities: Annotation<TopicContextEntity[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  updatePlan: Annotation<UpdatePlan | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  createdEdges: Annotation<CreatedEdge[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  persisted: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});

export const knowledgeGraphWorkflow = new StateGraph(GraphState)
  .addNode("extract", extractNode)
  .addNode("embed", embedNode)
  .addNode("search", searchNode)
  .addNode("plan", planNode)
  .addNode("execute", executeNode)
  .addNode("persist", persistNode)
  .addEdge(START, "extract")
  .addEdge("extract", "embed")
  .addEdge("embed", "search")
  .addConditionalEdges("search", (state) => {
    const hasEnrichmentCandidates = state.enrichmentCandidates.length > 0;
    // Only trigger planNode for topic-context updates when there are actual
    // incoming temporal entities — prevents a needless LLM call when the
    // message simply mentions a known topic with no dates or times.
    const hasIncomingTemporalData =
      state.topicRelatedEntities.length > 0 &&
      state.entities.some((e) => e.kind !== "Topic" && (e.scheduledAt || e.rawTemporal));
    return hasEnrichmentCandidates || hasIncomingTemporalData ? "plan" : "persist";
  })
  .addEdge("plan", "execute")
  .addEdge("execute", "persist")
  .addEdge("persist", END)
  .compile();
