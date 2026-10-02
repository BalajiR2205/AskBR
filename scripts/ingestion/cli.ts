#!/usr/bin/env node
/**
 * Ask Ambedkar — Ingestion Pipeline CLI
 * 
 * Command-line interface for offline source ingestion into the Ask Ambedkar primary corpus.
 * 
 * Usage:
 *   npx tsx scripts/ingestion/cli.ts --input data/inbox/example.txt
 *   npx tsx scripts/ingestion/cli.ts --input data/inbox/example.pdf --dry-run
 *   npx tsx scripts/ingestion/cli.ts --input data/inbox/example.md --source-manifest data/inbox/example.manifest.json
 */

import * as path from 'path';
import { runIngestionPipeline } from '../../src/ingestion/pipeline';
import { IngestionOptions, SupportedFormat } from '../../src/ingestion/types';

function printHelp(): void {
  console.log(`
Ask Ambedkar — Primary Source Ingestion CLI

Usage:
  npm run ingest -- --input <path> [options]
  npx tsx scripts/ingestion/cli.ts --input <path> [options]

Required Options:
  --input, -i <path>             Path to the raw source file to ingest (PDF, TXT, MD, JSON)

Options:
  --source-manifest, -m <path>   Explicit path to companion source manifest JSON file
  --output, -o <dir>             Corpus output directory (default: data/corpus)
  --dry-run                      Run extraction, segmentation & validation without saving corpus records
  --format, -f <format>          Override detected format (PDF | TXT | MARKDOWN | JSON)
  --help, -h                     Show this help message

Data Integrity Principles:
  1. Primary sources only (Dr. B. R. Ambedkar authored or recorded).
  2. Original source text is immutable and never overwritten.
  3. No AI-generated or secondary interpretation content.
`);
}

function parseCliArgs(args: string[]): IngestionOptions & { showHelp: boolean } {
  let inputPath = '';
  let manifestPath: string | undefined;
  let outputDir = 'data/corpus';
  let dryRun = false;
  let formatOverride: SupportedFormat | undefined;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--input' || arg === '-i') {
      inputPath = args[++i];
    } else if (arg.startsWith('--input=')) {
      inputPath = arg.split('=')[1];
    } else if (arg === '--source-manifest' || arg === '-m') {
      manifestPath = args[++i];
    } else if (arg.startsWith('--source-manifest=')) {
      manifestPath = arg.split('=')[1];
    } else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i];
    } else if (arg.startsWith('--output=')) {
      outputDir = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--format' || arg === '-f') {
      const f = args[++i]?.toUpperCase();
      if (f === 'PDF' || f === 'TXT' || f === 'MARKDOWN' || f === 'JSON') {
        formatOverride = f as SupportedFormat;
      }
    }
  }

  return {
    inputPath,
    manifestPath,
    outputDir,
    dryRun,
    formatOverride,
    showHelp,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  if (options.showHelp || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  if (!options.inputPath) {
    console.error('Error: Missing required option: --input <path>');
    printHelp();
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('Ask Ambedkar — Primary Source Ingestion Pipeline');
  console.log('==================================================');
  console.log(`Starting ingestion job for: ${options.inputPath}`);
  if (options.dryRun) {
    console.log('Mode: DRY-RUN (Validation only, corpus will not be modified)');
  }

  try {
    const result = await runIngestionPipeline({
      inputPath: options.inputPath,
      manifestPath: options.manifestPath,
      outputDir: options.outputDir,
      dryRun: options.dryRun,
      formatOverride: options.formatOverride,
    });

    console.log('\n--------------------------------------------------');
    console.log('Ingestion Job Summary');
    console.log('--------------------------------------------------');
    console.log(`Input File:      ${path.basename(result.inputFile)}`);
    console.log(`Source ID:       ${result.sourceId}`);
    if (result.source?.title) {
      console.log(`Title:           ${result.source.title}`);
    }
    console.log(`Format:          ${result.format}`);
    console.log(`SHA-256 Hash:    ${result.fileHash ? result.fileHash.slice(0, 16) + '...' : 'N/A'}`);
    console.log(`Status:          ${result.status}`);
    console.log(`Pages Extracted: ${result.pagesProcessed}`);
    console.log(`Sections:        ${result.sectionsCreated}`);
    console.log(`Passages:        ${result.passagesCreated}`);
    console.log(`Warnings:        ${result.warnings.length}`);
    console.log(`Errors:          ${result.errors.length}`);
    console.log(`Duration:        ${result.durationMs}ms`);
    if (result.outputPath) {
      console.log(`Corpus Path:     ${result.outputPath}`);
    }
    if (result.reportPath) {
      console.log(`Report Path:     ${result.reportPath}`);
    }
    console.log('--------------------------------------------------');

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of result.warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      for (const e of result.errors) {
        console.log(`  ✗ ${e}`);
      }
    }

    if (result.status === 'READY' || result.status === 'ALREADY_INGESTED') {
      console.log(`\n✔ Ingestion finished with status: ${result.status}\n`);
      process.exit(0);
    } else {
      console.log(`\n✗ Ingestion halted with status: ${result.status}\n`);
      process.exit(1);
    }
  } catch (err: unknown) {
    console.error('\nFatal unhandled pipeline error:');
    console.error(err instanceof Error ? err.stack : String(err));
    process.exit(1);
  }
}

main();
