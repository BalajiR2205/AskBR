/**
 * Ask Ambedkar — Ingestion Pipeline: Source Manifest Loader & Entity Builder
 * 
 * Reuses existing Segment 3 Source and Edition models.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  AttributionRole,
  AuthorAttribution,
  Edition,
  Source,
} from '../core/sources/types';
import { validateEdition, validateSource } from '../core/sources/validation';
import { SourceManifest } from './types';

/**
 * Loads and parses a source manifest JSON file.
 */
export async function loadManifest(manifestPath: string): Promise<SourceManifest> {
  const resolved = path.resolve(manifestPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Source manifest file not found: ${resolved}`);
  }

  const content = await fs.promises.readFile(resolved, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err: unknown) {
    throw new Error(`Invalid JSON in manifest ${resolved}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const manifest = parsed as SourceManifest;

  // Basic check of required fields
  if (!manifest.sourceId || !manifest.title || !manifest.sourceType || !manifest.sourceReference) {
    throw new Error(
      `Manifest ${resolved} missing required fields: sourceId, title, sourceType, and sourceReference are mandatory.`
    );
  }

  return manifest;
}

/**
 * Searches for a companion manifest file for an input source file.
 * E.g., for 'data/inbox/aoc.txt', checks:
 * 1. 'data/inbox/aoc.manifest.json'
 * 2. 'data/inbox/aoc.json' (if not an input source itself)
 * 3. 'data/inbox/manifest.json'
 */
export function findManifestForInputFile(inputFilePath: string): string | null {
  const dir = path.dirname(inputFilePath);
  const baseWithoutExt = path.basename(inputFilePath, path.extname(inputFilePath));

  const candidate1 = path.join(dir, `${baseWithoutExt}.manifest.json`);
  if (fs.existsSync(candidate1)) {
    return candidate1;
  }

  const candidate2 = path.join(dir, `${baseWithoutExt}.source.json`);
  if (fs.existsSync(candidate2)) {
    return candidate2;
  }

  const candidate3 = path.join(dir, 'manifest.json');
  if (fs.existsSync(candidate3)) {
    return candidate3;
  }

  return null;
}

/**
 * Constructs canonical Segment 3 Source and Edition entities from a SourceManifest.
 */
export function buildSourceEntitiesFromManifest(
  manifest: SourceManifest
): { source: Source; edition?: Edition } {
  // Determine appropriate attribution role based on source category
  let defaultRole: AttributionRole = 'AUTHOR';
  if (manifest.sourceType === 'SPEECH') defaultRole = 'SPEAKER';
  else if (manifest.sourceType === 'INTERVIEW') defaultRole = 'INTERVIEWEE';
  else if (manifest.sourceType === 'LETTER') defaultRole = 'CORRESPONDENT';

  const authorName = manifest.author || 'Dr. B. R. Ambedkar';
  const role = manifest.attribution?.role || defaultRole;

  const attribution: AuthorAttribution = {
    role,
    name: authorName,
    recipient: manifest.recipient || manifest.attribution?.recipient,
    interviewer: manifest.interviewer || manifest.attribution?.interviewer,
    roleDetails: manifest.attribution?.roleDetails,
  };

  const source: Source = {
    id: manifest.sourceId,
    title: manifest.title,
    subtitle: manifest.subtitle,
    attribution,
    sourceType: manifest.sourceType,
    classification: manifest.classification || 'PRIMARY',
    status: manifest.status || 'VERIFIED',
    date: manifest.date,
    year: manifest.year,
    originalLanguage: manifest.originalLanguage || 'en',
    languagesAvailable: manifest.languagesAvailable || [manifest.originalLanguage || 'en'],
    publisher: manifest.publisher,
    publication: manifest.publication,
    volume: manifest.volume,
    sourceReference: manifest.sourceReference,
    externalReference: manifest.externalReference,
    copyrightOrUsage: manifest.copyrightOrUsage,
    categoryMetadata: manifest.categoryMetadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Build Edition if edition details are specified
  let edition: Edition | undefined;
  if (manifest.edition || manifest.year || manifest.publisher) {
    const editionId = manifest.edition?.id || `edn_${manifest.sourceId}_ref`;
    const editionName = manifest.edition?.editionName || `${manifest.year || ''} Reference Edition`.trim();

    edition = {
      id: editionId,
      sourceId: manifest.sourceId,
      editionName,
      year: manifest.edition?.year || manifest.year || 1950,
      publisher: manifest.edition?.publisher || manifest.publisher,
      editor: manifest.edition?.editor,
      language: manifest.originalLanguage || 'en',
      isAuthoritative: manifest.edition?.isAuthoritative ?? true,
      notes: manifest.edition?.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Validate using existing Segment 3 validation functions
  const srcValidation = validateSource(source);
  if (!srcValidation.isValid) {
    throw new Error(`Source metadata validation failed:\n- ${srcValidation.errors.join('\n- ')}`);
  }

  if (edition) {
    const ednValidation = validateEdition(edition);
    if (!ednValidation.isValid) {
      throw new Error(`Edition metadata validation failed:\n- ${ednValidation.errors.join('\n- ')}`);
    }
  }

  return { source, edition };
}
