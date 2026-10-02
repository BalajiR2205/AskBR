/**
 * Ask Ambedkar — Corpus Loader & Provenance Graph
 * 
 * Loads primary corpus records from JSONL storage and constructs entity lookup maps.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DocumentSection, Edition, Source } from '../sources/types';
import { Passage } from '../passages/types';
import { buildProvenance } from '../provenance';
import { ProvenanceRecord } from '../provenance/types';

export interface CorpusDataset {
  sources: Map<string, Source>;
  editions: Map<string, Edition>;
  sections: Map<string, DocumentSection>;
  passages: Map<string, Passage>;
}

/**
 * Computes a deterministic SHA-256 hash of all corpus JSONL files in a directory.
 */
export async function computeCorpusHash(corpusDir: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  const files = ['sources.jsonl', 'editions.jsonl', 'sections.jsonl', 'passages.jsonl'];

  for (const file of files) {
    const filePath = path.join(/*turbopackIgnore: true*/ corpusDir, file);
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      const content = await fs.promises.readFile(/*turbopackIgnore: true*/ filePath);
      hash.update(`${file}:`);
      hash.update(content);
    }
  }

  return hash.digest('hex');
}

/**
 * Helper to read records from a JSONL file.
 */
async function readJsonlFile<T>(filePath: string): Promise<T[]> {
  if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
    return [];
  }

  const raw = await fs.promises.readFile(/*turbopackIgnore: true*/ filePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const items: T[] = [];

  for (const line of lines) {
    try {
      items.push(JSON.parse(line) as T);
    } catch {
      // Skip corrupted line or log warning
    }
  }

  return items;
}

/**
 * Loads the complete corpus dataset from disk.
 */
export async function loadCorpusFromDirectory(corpusDir: string): Promise<CorpusDataset> {
  const resolvedDir = path.resolve(corpusDir);

  const sourcesList = await readJsonlFile<Source>(path.join(resolvedDir, 'sources.jsonl'));
  const editionsList = await readJsonlFile<Edition>(path.join(resolvedDir, 'editions.jsonl'));
  const sectionsList = await readJsonlFile<DocumentSection>(path.join(resolvedDir, 'sections.jsonl'));
  const passagesList = await readJsonlFile<Passage>(path.join(resolvedDir, 'passages.jsonl'));

  const dataset: CorpusDataset = {
    sources: new Map(sourcesList.map((s) => [s.id, s])),
    editions: new Map(editionsList.map((e) => [e.id, e])),
    sections: new Map(sectionsList.map((s) => [s.id, s])),
    passages: new Map(passagesList.map((p) => [p.id, p])),
  };

  return dataset;
}

/**
 * Creates an in-memory CorpusDataset from entity lists.
 */
export function createCorpusDataset(
  sources: Source[],
  passages: Passage[],
  editions: Edition[] = [],
  sections: DocumentSection[] = []
): CorpusDataset {
  return {
    sources: new Map(sources.map((s) => [s.id, s])),
    editions: new Map(editions.map((e) => [e.id, e])),
    sections: new Map(sections.map((s) => [s.id, s])),
    passages: new Map(passages.map((p) => [p.id, p])),
  };
}

/**
 * Constructs complete provenance for a passage using the loaded corpus graph.
 */
export function resolveProvenanceForPassage(
  passage: Passage,
  dataset: CorpusDataset
): ProvenanceRecord | null {
  const source = dataset.sources.get(passage.sourceId);
  if (!source) return null;

  const edition = passage.editionId ? dataset.editions.get(passage.editionId) : undefined;
  const section = passage.parentSectionId ? dataset.sections.get(passage.parentSectionId) : undefined;

  return buildProvenance(passage, source, edition, section);
}
