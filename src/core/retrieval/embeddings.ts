/**
 * Ask Ambedkar — Embedding Provider Abstraction & Providers
 * 
 * Strict Data Integrity Principles:
 * 1. NO random, fabricated, or fake embeddings in production.
 * 2. If no embedding provider is configured via environment, vector retrieval
 *    is disabled and the system gracefully defaults to lexical BM25 retrieval.
 * 3. FakeEmbeddingProvider is strictly isolated for unit testing and marked test-only.
 */

import * as crypto from 'crypto';
import { EmbeddingProvider } from './types';

/**
 * Null provider representing unavailable / unconfigured vector retrieval.
 */
export class UnavailableEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'none';
  readonly modelName = 'none';
  readonly dimensions = 0;

  async embedQuery(): Promise<number[]> {
    throw new Error('Vector retrieval is unavailable: no embedding provider is configured.');
  }

  async embedDocuments(): Promise<number[][]> {
    throw new Error('Vector indexing is unavailable: no embedding provider is configured.');
  }

  isAvailable(): boolean {
    return false;
  }
}

/**
 * Deterministic test-only fake embedding provider.
 * Strictly forbidden in production environments.
 */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'test-fake';
  readonly modelName: string;
  readonly dimensions: number;

  constructor(modelName = 'test-deterministic-v1', dimensions = 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Security Violation: FakeEmbeddingProvider cannot be instantiated in production.');
    }
    this.modelName = modelName;
    this.dimensions = dimensions;
  }

  isAvailable(): boolean {
    return true;
  }

  /**
   * Deterministically generates a unit-normalized vector for a text string.
   */
  async embedQuery(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateDeterministicVector(t));
  }

  private generateDeterministicVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const normalized = (text || '').trim().toLowerCase();

    if (normalized.length === 0) {
      return vector;
    }

    // Hash tokens and distribute into vector dimensions deterministically
    const words = normalized.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = crypto.createHash('md5').update(word).digest();
      for (let d = 0; d < this.dimensions; d++) {
        const byte = hash[d % hash.length];
        const val = (byte - 128) / 128.0;
        vector[d] += val * (1.0 / Math.sqrt(i + 1));
      }
    }

    // L2 Normalize to unit vector
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let d = 0; d < this.dimensions; d++) {
        vector[d] = Number((vector[d] / norm).toFixed(6));
      }
    }

    return vector;
  }
}

/**
 * Inspects process environment variables and resolves the configured EmbeddingProvider.
 */
export function getEnvEmbeddingProvider(): EmbeddingProvider {
  const providerType = (process.env.EMBEDDING_PROVIDER || 'none').toLowerCase();
  const apiKey = process.env.EMBEDDING_API_KEY;

  if (providerType === 'none' || !apiKey) {
    return new UnavailableEmbeddingProvider();
  }

  // Future external provider connectors (e.g. OpenAI, Gemini) plug in here.
  // When active API keys and vendor packages are integrated in subsequent segments,
  // return the instantiated provider.
  return new UnavailableEmbeddingProvider();
}
