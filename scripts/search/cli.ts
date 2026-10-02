#!/usr/bin/env node
/**
 * Ask Ambedkar — Developer Search CLI
 * 
 * Command-line search interface for evaluating retrieval ranking,
 * BM25 lexical scores, vector similarity, and provenance resolution.
 * 
 * Usage:
 *   npm run search -- "caste equality"
 *   npm run search -- "annihilation of caste" --topK 5
 *   npx tsx scripts/search/cli.ts --query "democracy" --category BOOK
 */

import * as fs from 'fs';
import * as path from 'path';
import { formatCitation } from '../../src/core/provenance';
import { SourceCategory } from '../../src/core/sources/types';
import {
  loadCorpusFromDirectory,
  loadIndexManifest,
  HybridRetrievalEngine,
  Bm25IndexData,
  VectorIndexData,
  SearchQuery,
} from '../../src/core/retrieval';

function printHelp(): void {
  console.log(`
Ask Ambedkar — Developer Search CLI

Usage:
  npm run search -- "<query>" [options]
  npx tsx scripts/search/cli.ts --query "<query>" [options]

Options:
  --query, -q <string>     Search question or keywords (or pass as first positional argument)
  --topK, -k <number>      Maximum passages to retrieve (default: 5)
  --corpus, -c <dir>       Corpus directory path (default: data/corpus)
  --index, -i <dir>        Index directory path (default: data/index)
  --category <type>        Filter by source type (BOOK | SPEECH | CAD | LETTER | etc.)
  --help, -h               Show this help message
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let queryString = '';
  let topK = 5;
  let corpusDir = 'data/corpus';
  let indexDir = 'data/index';
  let categoryFilter: SourceCategory | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--query' || arg === '-q') {
      queryString = args[++i];
    } else if (arg.startsWith('--query=')) {
      queryString = arg.split('=')[1];
    } else if (arg === '--topK' || arg === '-k') {
      topK = parseInt(args[++i], 10) || 5;
    } else if (arg.startsWith('--topK=')) {
      topK = parseInt(arg.split('=')[1], 10) || 5;
    } else if (arg === '--corpus' || arg === '-c') {
      corpusDir = args[++i];
    } else if (arg === '--index' || arg === '-i') {
      indexDir = args[++i];
    } else if (arg === '--category') {
      categoryFilter = args[++i]?.toUpperCase() as SourceCategory;
    } else if (!arg.startsWith('-') && !queryString) {
      queryString = arg;
    }
  }

  if (!queryString || queryString.trim().length === 0) {
    console.error('Error: Please provide a search query.');
    printHelp();
    process.exit(1);
  }

  const resolvedIndexDir = path.resolve(indexDir);
  const bm25Path = path.join(resolvedIndexDir, 'bm25', 'index.json');

  if (!fs.existsSync(bm25Path)) {
    console.error(`\nError: Index not found at ${resolvedIndexDir}.`);
    console.error('Please build the index first by running:');
    console.error('  npm run index\n');
    process.exit(1);
  }

  // Load index data
  const bm25Index: Bm25IndexData = JSON.parse(await fs.promises.readFile(bm25Path, 'utf-8'));
  const manifest = await loadIndexManifest(resolvedIndexDir);

  let vectorIndex: VectorIndexData | undefined;
  const vectorPath = path.join(resolvedIndexDir, 'vectors', 'index.json');
  if (fs.existsSync(vectorPath)) {
    try {
      vectorIndex = JSON.parse(await fs.promises.readFile(vectorPath, 'utf-8'));
    } catch {
      // Ignore if unavailable
    }
  }

  // Load corpus dataset
  const dataset = await loadCorpusFromDirectory(corpusDir);

  const engine = new HybridRetrievalEngine(bm25Index, dataset, vectorIndex);

  const query: SearchQuery = {
    query: queryString,
    topK,
    filters: categoryFilter ? { sourceTypes: [categoryFilter] } : undefined,
  };

  const result = await engine.search(query);

  console.log('\n------------------------------------------------');
  console.log('Ask Ambedkar Search');
  console.log('------------------------------------------------');
  console.log(`Query:     "${result.query}"`);
  console.log(`Retrieved: ${result.items.length} passages (found ${result.totalFound})`);
  console.log(`Duration:  ${result.executionTimeMs}ms`);
  console.log(`Method:    ${result.retrievalMethod || 'full_text'}`);
  if (manifest) {
    console.log(`Index:     v${manifest.schemaVersion} (Corpus SHA: ${manifest.corpusHash.slice(0, 10)}...)`);
  }
  console.log('------------------------------------------------\n');

  if (result.items.length === 0) {
    console.log('No matching primary source passages found.');
    console.log('Note: Only primary verified works authored by Dr. B. R. Ambedkar are indexed.\n');
    process.exit(0);
  }

  for (let idx = 0; idx < result.items.length; idx++) {
    const item = result.items[idx];
    const rank = idx + 1;
    const prov = item.provenance;
    const citation = formatCitation(prov);

    console.log(`${rank}. [${item.source.sourceType}] ${prov.sourceTitle}`);
    if (prov.chapter) console.log(`   ${prov.chapter}`);
    if (prov.pageRange) console.log(`   Location: ${prov.pageRange}`);
    console.log(`   Score:    ${item.relevanceScore.toFixed(4)} (Method: ${item.retrievalMethod})`);
    if (item.scoreBreakdown?.lexicalScore !== undefined) {
      console.log(`   Lexical:  ${item.scoreBreakdown.lexicalScore.toFixed(2)} (normalized: ${item.scoreBreakdown.normalizedLexicalScore?.toFixed(2)})`);
    }
    if (item.scoreBreakdown?.vectorScore !== undefined) {
      console.log(`   Vector:   ${item.scoreBreakdown.vectorScore.toFixed(4)} (normalized: ${item.scoreBreakdown.normalizedVectorScore?.toFixed(2)})`);
    }

    console.log('\n   Excerpt:');
    const displaySnippet = item.matchHighlights && item.matchHighlights.length > 0
      ? item.matchHighlights[0]
      : item.passage.originalText.slice(0, 240) + '...';
    console.log(`   "${displaySnippet}"`);

    console.log(`\n   Citation: ${citation}`);
    console.log('------------------------------------------------');
  }
  console.log();
}

main().catch((err: unknown) => {
  console.error('\nSearch execution error:', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
