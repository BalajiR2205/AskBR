/**
 * Ask Ambedkar — Index Manifest & Freshness Validation
 * 
 * Tracks index metadata, corpus SHA-256 hash, and index structural consistency.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Bm25IndexData, IndexManifest, VectorIndexData } from './types';

export const INDEX_SCHEMA_VERSION = 1;

/**
 * Loads the index manifest from the index directory.
 */
export async function loadIndexManifest(indexDir: string): Promise<IndexManifest | null> {
  const manifestPath = path.join(indexDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = await fs.promises.readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as IndexManifest;
  } catch {
    return null;
  }
}

/**
 * Saves the index manifest to the index directory.
 */
export async function saveIndexManifest(indexDir: string, manifest: IndexManifest): Promise<void> {
  await fs.promises.mkdir(indexDir, { recursive: true });
  const manifestPath = path.join(indexDir, 'manifest.json');
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Checks if the persisted index is stale compared to the current corpus hash.
 */
export function isIndexStale(manifest: IndexManifest, currentCorpusHash: string): boolean {
  if (!manifest || !manifest.corpusHash) return true;
  return manifest.corpusHash !== currentCorpusHash;
}

/**
 * Validates index structural integrity.
 */
export function validateIndexIntegrity(
  manifest: IndexManifest,
  bm25Index: Bm25IndexData,
  vectorIndex?: VectorIndexData
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (manifest.schemaVersion !== INDEX_SCHEMA_VERSION) {
    errors.push(`Manifest schemaVersion mismatch (expected ${INDEX_SCHEMA_VERSION}, got ${manifest.schemaVersion})`);
  }

  if (manifest.passageCount !== bm25Index.totalDocs) {
    errors.push(
      `Passage count discrepancy: manifest reports ${manifest.passageCount}, but BM25 index has ${bm25Index.totalDocs}`
    );
  }

  if (vectorIndex && manifest.vectorIndex.enabled) {
    if (vectorIndex.dimensions !== manifest.vectorIndex.dimensions) {
      errors.push(
        `Vector dimension mismatch: manifest reports ${manifest.vectorIndex.dimensions}, but index data has ${vectorIndex.dimensions}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
