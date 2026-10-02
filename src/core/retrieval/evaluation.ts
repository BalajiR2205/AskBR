/**
 * Ask Ambedkar — Retrieval Quality Evaluation & Synthetic Benchmarks
 * 
 * Provides standard IR evaluation metrics (Precision@K, Recall@K, MRR)
 * on synthetic evaluation query datasets to evaluate retrieval configurations.
 */

import { FutureRetrievalEngine, SearchQuery } from './types';

export interface RetrievalEvaluationTestCase {
  query: string;
  relevantPassageIds: string[];
  description?: string;
}

export interface RetrievalMetrics {
  precisionAtK: number;
  recallAtK: number;
  mrr: number; // Mean Reciprocal Rank
  evaluatedQueries: number;
}

/**
 * Computes Precision@K, Recall@K, and Mean Reciprocal Rank (MRR) for a retrieval engine.
 */
export async function evaluateRetrieval(
  engine: FutureRetrievalEngine,
  testCases: RetrievalEvaluationTestCase[],
  k = 5
): Promise<RetrievalMetrics> {
  if (testCases.length === 0) {
    return { precisionAtK: 0, recallAtK: 0, mrr: 0, evaluatedQueries: 0 };
  }

  let totalPrecision = 0;
  let totalRecall = 0;
  let totalReciprocalRank = 0;

  for (const testCase of testCases) {
    const relevantSet = new Set(testCase.relevantPassageIds);
    const searchQuery: SearchQuery = {
      query: testCase.query,
      topK: k,
    };

    const result = await engine.search(searchQuery);
    const retrievedIds = result.items.map((item) => item.passage.id);

    // Compute Precision@K & Recall@K
    let relevantRetrieved = 0;
    let firstRelevantRank = 0;

    for (let rank = 0; rank < retrievedIds.length; rank++) {
      const id = retrievedIds[rank];
      if (relevantSet.has(id)) {
        relevantRetrieved++;
        if (firstRelevantRank === 0) {
          firstRelevantRank = rank + 1; // 1-based rank
        }
      }
    }

    const precision = retrievedIds.length > 0 ? relevantRetrieved / retrievedIds.length : 0;
    const recall = relevantSet.size > 0 ? relevantRetrieved / relevantSet.size : 0;
    const reciprocalRank = firstRelevantRank > 0 ? 1.0 / firstRelevantRank : 0;

    totalPrecision += precision;
    totalRecall += recall;
    totalReciprocalRank += reciprocalRank;
  }

  const n = testCases.length;
  return {
    precisionAtK: Number((totalPrecision / n).toFixed(4)),
    recallAtK: Number((totalRecall / n).toFixed(4)),
    mrr: Number((totalReciprocalRank / n).toFixed(4)),
    evaluatedQueries: n,
  };
}

/**
 * Small synthetic benchmark dataset for offline test verification.
 * Contains explicitly marked synthetic test queries.
 */
export const SYNTHETIC_EVALUATION_DATASET: RetrievalEvaluationTestCase[] = [
  {
    query: 'principle of fraternity and common brotherhood',
    relevantPassageIds: ['psg_fixture_synth_01_main_001'],
    description: 'Fraternity and social unity keyword and concept lookup',
  },
  {
    query: 'constitutional morality',
    relevantPassageIds: ['psg_fixture_synth_01_main_002'],
    description: 'Constitutional morality concept lookup',
  },
  {
    query: 'democracy and social equality',
    relevantPassageIds: ['psg_fixture_synth_01_main_001'],
    description: 'Democracy and equality topic inquiry',
  },
];
