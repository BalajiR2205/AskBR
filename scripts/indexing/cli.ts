#!/usr/bin/env node
/**
 * Ask Ambedkar — Offline Index Builder CLI
 * 
 * Builds and persists BM25 lexical index, vector index (if configured),
 * and index manifest from validated corpus records.
 * 
 * Usage:
 *   npm run index
 *   npx tsx scripts/indexing/cli.ts --corpus data/corpus --output data/index
 *   npx tsx scripts/indexing/cli.ts --rebuild
 *   npx tsx scripts/indexing/cli.ts --validate
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  buildBm25Index,
  computeCorpusHash,
  createEmptyVectorIndex,
  getEnvEmbeddingProvider,
  INDEX_SCHEMA_VERSION,
  isAuthoritativeSource,
  loadCorpusFromDirectory,
  loadIndexManifest,
  saveIndexManifest,
  upsertVectorRecord,
  validateIndexIntegrity,
  VectorIndexData,
  IndexManifest,
} from '../../src/core/retrieval';

interface IndexCliOptions {
  corpusDir: string;
  outputDir: string;
  rebuild: boolean;
  validateOnly: boolean;
  enableVector: boolean;
  showHelp: boolean;
}

function printHelp(): void {
  console.log(`
Ask Ambedkar — Search Index Builder CLI

Usage:
  npm run index -- [options]
  npx tsx scripts/indexing/cli.ts [options]

Options:
  --corpus, -c <dir>     Path to validated corpus directory (default: data/corpus)
  --output, -o <dir>     Target index directory (default: data/index)
  --rebuild              Force full rebuild bypassing incremental cache
  --vector               Build vector index using configured embedding provider
  --validate             Validate existing index integrity without rebuilding
  --help, -h             Show this help message

Principles:
  1. Indexes are derived artifacts; the canonical corpus is never modified.
  2. Incremental indexing avoids re-embedding unchanged passages.
  3. Authoritative source filters ensure non-primary data is not indexed.
`);
}

function parseCliArgs(args: string[]): IndexCliOptions {
  let corpusDir = 'data/corpus';
  let outputDir = 'data/index';
  let rebuild = false;
  let validateOnly = false;
  let enableVector = false;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--corpus' || arg === '-c') {
      corpusDir = args[++i];
    } else if (arg.startsWith('--corpus=')) {
      corpusDir = arg.split('=')[1];
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i];
    } else if (arg.startsWith('--output=')) {
      outputDir = arg.split('=')[1];
    } else if (arg === '--rebuild') {
      rebuild = true;
    } else if (arg === '--validate') {
      validateOnly = true;
    } else if (arg === '--vector') {
      enableVector = true;
    }
  }

  return { corpusDir, outputDir, rebuild, validateOnly, enableVector, showHelp };
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.showHelp) {
    printHelp();
    process.exit(0);
  }

  const startTime = Date.now();
  const corpusDir = path.resolve(options.corpusDir);
  const outputDir = path.resolve(options.outputDir);

  console.log('\n==================================================');
  console.log('Ask Ambedkar — Search Index Builder');
  console.log('==================================================');
  console.log(`Corpus Directory: ${corpusDir}`);
  console.log(`Index Directory:  ${outputDir}`);
  if (options.rebuild) console.log('Mode: FULL REBUILD');

  // 1. Load Corpus
  console.log('\n1. Loading primary source corpus records...');
  const dataset = await loadCorpusFromDirectory(corpusDir);
  console.log(`   - Sources loaded:  ${dataset.sources.size}`);
  console.log(`   - Editions loaded: ${dataset.editions.size}`);
  console.log(`   - Sections loaded: ${dataset.sections.size}`);
  console.log(`   - Passages loaded: ${dataset.passages.size}`);

  const corpusHash = await computeCorpusHash(corpusDir);
  console.log(`   - Corpus SHA-256:  ${corpusHash.slice(0, 16)}...`);

  // Handle validate-only mode
  if (options.validateOnly) {
    console.log('\nValidating existing index...');
    const manifest = await loadIndexManifest(outputDir);
    if (!manifest) {
      console.error(`✗ Error: No index manifest found at ${path.join(outputDir, 'manifest.json')}`);
      process.exit(1);
    }

    const bm25Path = path.join(outputDir, 'bm25', 'index.json');
    if (!fs.existsSync(bm25Path)) {
      console.error(`✗ Error: BM25 index missing at ${bm25Path}`);
      process.exit(1);
    }

    const bm25Data = JSON.parse(await fs.promises.readFile(bm25Path, 'utf-8'));
    const validation = validateIndexIntegrity(manifest, bm25Data);

    if (validation.isValid) {
      console.log('✔ Index integrity check passed.');
      process.exit(0);
    } else {
      console.error('✗ Index integrity errors:\n' + validation.errors.map((e) => `  - ${e}`).join('\n'));
      process.exit(1);
    }
  }

  // 2. Filter Authoritative Passages
  console.log('\n2. Applying authoritative source constraints...');
  const authoritativePassages = Array.from(dataset.passages.values()).filter((p) => {
    const src = dataset.sources.get(p.sourceId);
    return src ? isAuthoritativeSource(src) : false;
  });
  console.log(`   - Authoritative passages selected: ${authoritativePassages.length}`);

  // 3. Build BM25 Lexical Index
  console.log('\n3. Building BM25 inverted lexical index...');
  const bm25Index = buildBm25Index(authoritativePassages, dataset.sources, dataset.sections);
  const totalTerms = Object.keys(bm25Index.invertedIndex).length;
  console.log(`   - Unique terms indexed: ${totalTerms}`);
  console.log(`   - Average doc length:   ${bm25Index.avgDocLength.toFixed(1)} tokens`);

  // Persist BM25 Index
  const bm25Dir = path.join(outputDir, 'bm25');
  await fs.promises.mkdir(bm25Dir, { recursive: true });
  await fs.promises.writeFile(path.join(bm25Dir, 'index.json'), JSON.stringify(bm25Index, null, 2), 'utf-8');

  // 4. Vector Index (if requested / configured)
  const embeddingProvider = getEnvEmbeddingProvider();
  let vectorIndexData: VectorIndexData = createEmptyVectorIndex();
  let vectorIndexEnabled = false;

  if (options.enableVector || embeddingProvider.isAvailable()) {
    console.log('\n4. Vector Indexing: Checking embedding provider...');
    if (embeddingProvider.isAvailable()) {
      vectorIndexEnabled = true;
      console.log(`   - Provider: ${embeddingProvider.id}`);
      console.log(`   - Model:    ${embeddingProvider.modelName} (${embeddingProvider.dimensions}d)`);

      // Load existing vector index for incremental updates
      const vectorFile = path.join(outputDir, 'vectors', 'index.json');
      if (fs.existsSync(vectorFile) && !options.rebuild) {
        try {
          vectorIndexData = JSON.parse(await fs.promises.readFile(vectorFile, 'utf-8'));
        } catch {
          vectorIndexData = createEmptyVectorIndex(embeddingProvider.modelName, embeddingProvider.dimensions);
        }
      } else {
        vectorIndexData = createEmptyVectorIndex(embeddingProvider.modelName, embeddingProvider.dimensions);
      }

      // Identify incremental diff
      const existingMap = new Map(vectorIndexData.records.map((r) => [r.passageId, r]));
      const toEmbed: { passageId: string; text: string; hash: string }[] = [];
      let unchangedCount = 0;

      for (const p of authoritativePassages) {
        const text = p.normalizedText || p.originalText;
        const hash = p.id + ':' + text.length;
        const existing = existingMap.get(p.id);

        if (existing && existing.contentHash === hash && !options.rebuild) {
          unchangedCount++;
        } else {
          toEmbed.push({ passageId: p.id, text, hash });
        }
      }

      console.log(`   - Unchanged passages reused: ${unchangedCount}`);
      console.log(`   - New/modified to embed:     ${toEmbed.length}`);

      if (toEmbed.length > 0) {
        const batchTexts = toEmbed.map((item) => item.text);
        const vectors = await embeddingProvider.embedDocuments(batchTexts);

        for (let i = 0; i < toEmbed.length; i++) {
          upsertVectorRecord(vectorIndexData, {
            passageId: toEmbed[i].passageId,
            vector: vectors[i],
            contentHash: toEmbed[i].hash,
          });
        }
      }

      const vectorsDir = path.join(outputDir, 'vectors');
      await fs.promises.mkdir(vectorsDir, { recursive: true });
      await fs.promises.writeFile(path.join(vectorsDir, 'index.json'), JSON.stringify(vectorIndexData, null, 2), 'utf-8');
    } else {
      console.log('   - Notice: No external embedding provider configured (EMBEDDING_PROVIDER=none).');
      console.log('   - Vector indexing skipped; search operates in full-text lexical BM25 mode.');
    }
  } else {
    console.log('\n4. Vector Indexing: Disabled (full-text lexical BM25 mode active).');
  }

  // 5. Generate and Save Index Manifest
  console.log('\n5. Generating index manifest...');
  const manifest: IndexManifest = {
    schemaVersion: INDEX_SCHEMA_VERSION,
    corpusHash,
    passageCount: authoritativePassages.length,
    sourceCount: dataset.sources.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lexicalIndex: {
      type: 'bm25',
      version: '1.0',
      k1: bm25Index.k1,
      b: bm25Index.b,
      totalTerms,
      avgDocLength: Number(bm25Index.avgDocLength.toFixed(2)),
    },
    vectorIndex: {
      enabled: vectorIndexEnabled,
      provider: embeddingProvider.id,
      model: embeddingProvider.modelName,
      dimensions: embeddingProvider.dimensions,
      vectorCount: vectorIndexData.records.length,
    },
  };

  await saveIndexManifest(outputDir, manifest);

  const durationMs = Date.now() - startTime;
  console.log('\n--------------------------------------------------');
  console.log('Index Build Complete');
  console.log('--------------------------------------------------');
  console.log(`Passages Indexed: ${authoritativePassages.length}`);
  console.log(`Terms Indexed:    ${totalTerms}`);
  console.log(`Vectors Indexed:  ${vectorIndexData.records.length}`);
  console.log(`Manifest Path:    ${path.join(outputDir, 'manifest.json')}`);
  console.log(`Duration:         ${durationMs}ms`);
  console.log('--------------------------------------------------\n');
}

main().catch((err: unknown) => {
  console.error('\nFatal indexing error:', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
