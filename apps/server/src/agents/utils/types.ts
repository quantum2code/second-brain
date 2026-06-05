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
  /** All stored entities of the same kind with similarity ≥ SIMILARITY_THRESHOLD. */
  matches: ExistingEntityMatch[];
};
