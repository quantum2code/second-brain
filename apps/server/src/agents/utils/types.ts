/**
 * Types shared between agents/index.ts and agents/utils/groq.ts.
 * Kept in a separate file to break the circular dependency.
 */

import type { ExtractedEntity } from "./schema";

export type ExistingEntityMatch = {
  name: string;
  similarity: number;
  kind: string;
  firstSeenAt?: string;
  scheduledAt?: string;
  rawTemporal?: string;
};

export type EnrichmentCandidate = {
  incomingEntity: ExtractedEntity;
  incomingEmbedding: number[];
  /** All stored entities with similarity ≥ SIMILARITY_THRESHOLD. */
  matches: ExistingEntityMatch[];
};

/**
 * An existing entity already stored in the graph that belongs to the
 * matched Topic. Passed to planNode so the LLM can decide whether
 * incoming temporal updates should propagate to these stale entities.
 */
export type TopicContextEntity = {
  name: string;
  kind: string;
  scheduledAt?: string;
  rawTemporal?: string;
  todoDescription?: string;
};
