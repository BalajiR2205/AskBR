/**
 * Ask Ambedkar — Ingestion Pipeline: Storage, JSONL Serialization & Ingestion Reports
 * 
 * Manages appending validated records to the corpus JSONL files,
 * tracking content hashes for idempotency, and generating ingestion reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentSection, Edition, Source } from '../core/sources/types';
import { Passage } from '../core/passages/types';
import { IngestionJobResult } from './types';

export interface IngestionRegistryEntry {
  sourceId: string;
  editionId?: string;
  fileHash: string;
  fileName: string;
  passageCount: number;
  sectionCount: number;
  ingestedAt: string;
}

export type IngestionRegistry = Record<string, IngestionRegistryEntry>;

/**
 * Loads the ingestion registry tracking file content hashes and source IDs.
 */
export function loadIngestionRegistry(outputDir: string): IngestionRegistry {
  const registryPath = path.join(outputDir, '.ingestion-registry.json');
  if (!fs.existsSync(registryPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(raw) as IngestionRegistry;
  } catch {
    return {};
  }
}

/**
 * Saves the updated ingestion registry.
 */
export async function saveIngestionRegistry(
  outputDir: string,
  registry: IngestionRegistry
): Promise<void> {
  const registryPath = path.join(outputDir, '.ingestion-registry.json');
  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Checks if a source file with this hash or source ID has already been ingested.
 */
export function checkAlreadyIngested(
  outputDir: string,
  sourceId: string,
  fileHash: string
): { isAlreadyIngested: boolean; existingEntry?: IngestionRegistryEntry } {
  const registry = loadIngestionRegistry(outputDir);
  const entry = registry[sourceId];

  if (entry && entry.fileHash === fileHash) {
    return { isAlreadyIngested: true, existingEntry: entry };
  }

  return { isAlreadyIngested: false };
}

/**
 * Appends records to a JSONL file.
 */
async function appendToJsonl<T>(filePath: string, records: T[]): Promise<void> {
  if (records.length === 0) return;
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  const lines = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  await fs.promises.appendFile(filePath, lines, 'utf-8');
}

/**
 * Writes validated corpus records to JSONL storage and updates the registry.
 */
export async function writeCorpusRecords(
  outputDir: string,
  source: Source,
  edition: Edition | undefined,
  sections: DocumentSection[],
  passages: Passage[],
  fileHash: string,
  fileName: string
): Promise<void> {
  await fs.promises.mkdir(outputDir, { recursive: true });

  const sourcesFile = path.join(outputDir, 'sources.jsonl');
  const editionsFile = path.join(outputDir, 'editions.jsonl');
  const sectionsFile = path.join(outputDir, 'sections.jsonl');
  const passagesFile = path.join(outputDir, 'passages.jsonl');

  // 1. Write Source record
  await appendToJsonl(sourcesFile, [source]);

  // 2. Write Edition record if present
  if (edition) {
    await appendToJsonl(editionsFile, [edition]);
  }

  // 3. Write DocumentSection records
  if (sections.length > 0) {
    await appendToJsonl(sectionsFile, sections);
  }

  // 4. Write Passage records
  if (passages.length > 0) {
    await appendToJsonl(passagesFile, passages);
  }

  // 5. Update registry
  const registry = loadIngestionRegistry(outputDir);
  registry[source.id] = {
    sourceId: source.id,
    editionId: edition?.id,
    fileHash,
    fileName,
    passageCount: passages.length,
    sectionCount: sections.length,
    ingestedAt: new Date().toISOString(),
  };

  await saveIngestionRegistry(outputDir, registry);
}

/**
 * Writes a structured ingestion report to disk.
 */
export async function writeIngestionReport(
  reportsDir: string,
  rejectedDir: string,
  result: IngestionJobResult
): Promise<string> {
  const isRejected = result.status === 'REJECTED' || result.status === 'FAILED' || result.status === 'OCR_REQUIRED';
  const targetDir = isRejected ? rejectedDir : reportsDir;
  await fs.promises.mkdir(targetDir, { recursive: true });

  const fileName = `${result.sourceId || 'unidentified'}-${result.fileHash.slice(0, 8)}-report.json`;
  const reportPath = path.join(targetDir, fileName);

  const reportPayload = {
    ...result,
    source: result.source ? { id: result.source.id, title: result.source.title } : undefined,
    edition: result.edition ? { id: result.edition.id, name: result.edition.editionName } : undefined,
    sections: undefined, // Omit raw section objects from summary report
    passages: undefined, // Omit raw passage objects from summary report
  };

  await fs.promises.writeFile(reportPath, JSON.stringify(reportPayload, null, 2), 'utf-8');
  return reportPath;
}
