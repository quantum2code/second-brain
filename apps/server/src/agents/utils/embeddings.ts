import { env } from "@second-brain/env/server";

/**
 * Cosine similarity threshold above which two entities are considered the same.
 * 0.88 is intentionally conservative — lower values risk false merges.
 */
export const SIMILARITY_THRESHOLD = 0.88;

/**
 * Google gemini-embedding-2 with 768-dimensional truncation.
 * This is the dimension of every embedding stored on Entity vertices.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate a 768-dim embedding for the given text.
 * Returns null if GOOGLE_API_KEY is not configured or the call fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!env.GOOGLE_API_KEY) {
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${env.GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: text.replace(/\n/g, " ") }]
        },
        outputDimensionality: EMBEDDING_DIMENSIONS
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Generative AI API returned status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      embedding?: {
        values?: number[];
      };
    };

    const values = data.embedding?.values;
    if (!values || !Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid or empty embedding values received from API: ${JSON.stringify(data)}`);
    }

    return values;
  } catch (error) {
    console.error("[embeddings] failed to generate embedding:", error);
    return null;
  }
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] — higher means more similar.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
