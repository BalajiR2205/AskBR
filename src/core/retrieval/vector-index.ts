/**
 * Ask Ambedkar — Vector Index Storage & Cosine Similarity Search
 * 
 * Manages dense vector representations, unit normalization,
 * and nearest-neighbor search.
 */

import { VectorIndexData, VectorRecord } from './types';

export interface ScoredVectorResult {
  passageId: string;
  cosineSimilarity: number;
  normalizedScore: number;
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  return dot / denom;
}

/**
 * Searches a VectorIndexData for nearest neighbors to a query vector.
 */
export function searchVectorIndex(
  index: VectorIndexData,
  queryVector: number[],
  filterDocIds?: Set<string>,
  topK = 20
): ScoredVectorResult[] {
  if (!index.records || index.records.length === 0) {
    return [];
  }

  const results: ScoredVectorResult[] = [];

  for (const record of index.records) {
    if (filterDocIds && !filterDocIds.has(record.passageId)) {
      continue;
    }

    const similarity = cosineSimilarity(queryVector, record.vector);

    // Normalize cosine similarity from [-1, 1] to [0, 1]
    const normalized = Math.max(0, (similarity + 1) / 2);

    results.push({
      passageId: record.passageId,
      cosineSimilarity: Number(similarity.toFixed(4)),
      normalizedScore: Number(normalized.toFixed(4)),
    });
  }

  // Sort descending by similarity
  results.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);

  return results.slice(0, topK);
}

/**
 * Creates an empty VectorIndexData container.
 */
export function createEmptyVectorIndex(modelName = 'none', dimensions = 0): VectorIndexData {
  return {
    schemaVersion: 1,
    embeddingModel: modelName,
    dimensions,
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Upserts a passage vector into the index.
 */
export function upsertVectorRecord(
  index: VectorIndexData,
  record: VectorRecord
): void {
  const existingIdx = index.records.findIndex((r) => r.passageId === record.passageId);
  if (existingIdx !== -1) {
    index.records[existingIdx] = record;
  } else {
    index.records.push(record);
  }
  index.updatedAt = new Date().toISOString();
}
