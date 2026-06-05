import { extractKnowledge, generateUpdatePlan } from "./utils/groq";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { arcadeDb } from "@/lib/arcadedb/client";
import {
  type Extraction,
  type ExtractedEntity,
  type UpdatePlan,
} from "./utils/schema";
import type { EnrichmentCandidate, ExistingEntityMatch } from "./utils/types";
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
  entities: ExtractedEntity[];
  /** name → embedding vector, populated by embedNode before any DB writes. */
  entityEmbeddings: Record<string, number[]>;
  /** Entities that have ≥2 similar matches in the graph — need LLM judgment. */
  enrichmentCandidates: EnrichmentCandidate[];
  /** LLM-generated update plan; null when enrichmentCandidates is empty. */
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

async function findEntity(name: string): Promise<boolean> {
  const result = await arcadeDb.query(
    `SELECT FROM Entity WHERE name = ${sqlLiteral(name)} LIMIT 1`,
  );

  return toRows(result).length > 0;
}

/**
 * Query all stored entities of a given kind that have an embedding.
 * Returns rows with enough data for similarity scoring and plan context.
 */
async function queryStoredEntities(kind: string): Promise<
  Array<{
    name: string;
    embedding: string;
    kind: string;
    firstSeenAt?: string;
    scheduledAt?: string;
    rawTemporal?: string;
  }>
> {
  const result = await arcadeDb.query(
    `SELECT name, embedding, kind, firstSeenAt, scheduledAt, rawTemporal
     FROM Entity
     WHERE kind = ${sqlLiteral(kind)} AND embedding IS NOT NULL`,
  );

  return toRows(result) as ReturnType<typeof queryStoredEntities> extends Promise<infer T> ? T : never;
}

/**
 * From a set of stored rows, find the single closest match above
 * SIMILARITY_THRESHOLD. Used by upsertEntity for dedup.
 */
function findBestMatch(
  rows: Awaited<ReturnType<typeof queryStoredEntities>>,
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
    const rows = await queryStoredEntities(entity.kind);
    const existingName = findBestMatch(rows, embedding);

    if (existingName) {
      console.log(
        `[embeddings] merged ${sqlLiteral(name)} → existing "${existingName}" (similarity ≥ ${SIMILARITY_THRESHOLD})`,
      );

      const propagated = [
        entity.scheduledAt      ? `scheduledAt = ${sqlLiteral(entity.scheduledAt)}`         : "",
        entity.rawTemporal      ? `rawTemporal = ${sqlLiteral(entity.rawTemporal)}`         : "",
        entity.todoDescription  ? `todoDescription = ${sqlLiteral(entity.todoDescription)}` : "",
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

  // --- No match — create or update the entity ---
  const extraFields = [
    entity.scheduledAt     ? `, scheduledAt = ${sqlLiteral(entity.scheduledAt)}`           : "",
    entity.rawTemporal     ? `, rawTemporal = ${sqlLiteral(entity.rawTemporal)}`           : "",
    entity.todoDescription ? `, todoDescription = ${sqlLiteral(entity.todoDescription)}`   : "",
    embedding              ? `, embedding = ${sqlLiteral(JSON.stringify(embedding))}`      : "",
  ].join("");

  await arcadeDb.command(
    `UPDATE Entity SET name = ${sqlLiteral(name)}, kind = ${sqlLiteral(entity.kind)}${extraFields} UPSERT WHERE name = ${sqlLiteral(name)}`,
  );

  // Set firstSeenAt only on first insertion — never overwrite
  await arcadeDb.command(
    `UPDATE Entity SET firstSeenAt = ${sqlLiteral(now)} WHERE name = ${sqlLiteral(name)} AND firstSeenAt IS NULL`,
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

async function extractNode(state: Pick<State, "text" | "messageCreatedAt">) {
  return extractKnowledge(state.text, state.messageCreatedAt);
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
 * For each entity with a pre-computed embedding, query ArcadeDB for similar
 * stored entities of the same kind. Entities with ≥2 matches above the
 * threshold are flagged as enrichment candidates for planNode.
 *
 * A single match is fine (upsertEntity handles dedup); 2+ means genuine
 * ambiguity that requires LLM judgment.
 */
async function searchNode(
  state: Pick<State, "entities" | "entityEmbeddings">,
) {
  const enrichmentCandidates: EnrichmentCandidate[] = [];

  // Cache per-kind queries so we don't re-fetch the same kind repeatedly
  const kindCache = new Map<string, Awaited<ReturnType<typeof queryStoredEntities>>>();

  for (const entity of state.entities) {
    const name = normalizeName(entity.name);
    const incomingEmbedding = state.entityEmbeddings[name];

    if (!incomingEmbedding) continue;

    if (!kindCache.has(entity.kind)) {
      kindCache.set(entity.kind, await queryStoredEntities(entity.kind));
    }

    const rows = kindCache.get(entity.kind)!;
    const matches: ExistingEntityMatch[] = [];

    for (const row of rows) {
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

  return { enrichmentCandidates };
}

/**
 * Ask the Groq LLM to produce a structured update plan for all enrichment
 * candidates. Only reached when enrichmentCandidates.length > 0.
 */
async function planNode(state: Pick<State, "enrichmentCandidates">) {
  const updatePlan = await generateUpdatePlan(state.enrichmentCandidates);
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

        // Re-route existing MENTIONS edges that point to incomingName → targetName
        await arcadeDb.command(
          `UPDATE EDGE MENTIONS SET @in = (SELECT FROM Entity WHERE name = ${sqlLiteral(action.targetName)} LIMIT 1) WHERE @in = (SELECT FROM Entity WHERE name = ${sqlLiteral(action.incomingName)} LIMIT 1)`,
        );

        // Delete the now-redundant incoming entity if it exists
        await arcadeDb.command(
          `DELETE FROM Entity WHERE name = ${sqlLiteral(action.incomingName)}`,
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

  // Create MENTIONS edges from the source message to each canonical entity
  for (const canonicalName of new Set(nameMap.values())) {
    if (!(await findEntity(canonicalName))) {
      continue;
    }

    await arcadeDb.command(
      `CREATE EDGE MENTIONS FROM (SELECT FROM Message WHERE name = ${sqlLiteral(state.sourceMessageName)} LIMIT 1) TO (SELECT FROM Entity WHERE name = ${sqlLiteral(canonicalName)} LIMIT 1) IF NOT EXISTS`,
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
  .addConditionalEdges("search", (state) =>
    state.enrichmentCandidates.length > 0 ? "plan" : "persist",
  )
  .addEdge("plan", "execute")
  .addEdge("execute", "persist")
  .addEdge("persist", END)
  .compile();
