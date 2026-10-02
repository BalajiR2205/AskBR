/**
 * Ask Ambedkar — Ingestion Pipeline: Core Orchestration Engine
 * 
 * Executes the complete offline ingestion lifecycle:
 * INSPECT -> EXTRACT -> ASSESS_OCR -> NORMALIZE -> PARSE_STRUCTURE -> SEGMENT -> VALIDATE -> PERSIST
 */

import * as fs from 'fs';
import * as path from 'path';
import { validatePassage } from '../core/passages/validation';
import { validateSection, validateSource } from '../core/sources/validation';
import { inspectFile } from './hashing';
import { extractDocument } from './extractors';
import { buildSourceEntitiesFromManifest, findManifestForInputFile, loadManifest } from './manifest';
import { detectRunningHeadersAndFooters } from './normalizer';
import { parseDocumentStructure } from './structure-parser';
import { segmentPagesIntoPassages } from './segmenter';
import {
  checkAlreadyIngested,
  writeCorpusRecords,
  writeIngestionReport,
} from './storage';
import {
  DEFAULT_SEGMENTATION_CONFIG,
  IngestionJobResult,
  IngestionOptions,
  IngestionStatus,
  SupportedFormat,
} from './types';

export async function runIngestionPipeline(options: IngestionOptions): Promise<IngestionJobResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  const outputDir = path.resolve(options.outputDir || 'data/corpus');
  const reportsDir = path.resolve(options.reportsDir || 'data/working/reports');
  const rejectedDir = path.resolve(options.rejectedDir || 'data/rejected');
  const isDryRun = options.dryRun ?? false;

  let currentStatus: IngestionStatus = 'DISCOVERED';

  // --------------------------------------------------------------------------
  // STAGE 1: File Inspection & Hashing
  // --------------------------------------------------------------------------
  let inspection;
  try {
    inspection = await inspectFile(options.inputPath);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(errorMsg);
    const failedResult: IngestionJobResult = {
      sourceId: 'unidentified',
      inputFile: options.inputPath,
      fileHash: '',
      fileSize: 0,
      format: (options.formatOverride || 'TXT') as SupportedFormat,
      status: 'FAILED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
    };
    await writeIngestionReport(reportsDir, rejectedDir, failedResult);
    return failedResult;
  }

  const format: SupportedFormat =
    options.formatOverride ||
    (inspection.detectedFormat !== 'UNKNOWN' ? (inspection.detectedFormat as SupportedFormat) : 'TXT');

  if (inspection.detectedFormat === 'UNKNOWN' && !options.formatOverride) {
    errors.push(`Could not determine supported file format for ${options.inputPath}. Provide explicit format.`);
    const failedResult: IngestionJobResult = {
      sourceId: 'unidentified',
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format: 'TXT',
      status: 'FAILED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
    };
    await writeIngestionReport(reportsDir, rejectedDir, failedResult);
    return failedResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 2: Source Manifest Resolution & Validation
  // --------------------------------------------------------------------------
  const manifestPath = options.manifestPath || findManifestForInputFile(options.inputPath);
  if (!manifestPath) {
    errors.push(
      `No source manifest provided or found for input file: "${options.inputPath}". Ingestion requires explicit bibliographic metadata.`
    );
    const rejectedResult: IngestionJobResult = {
      sourceId: 'unidentified',
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'REJECTED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
    };
    await writeIngestionReport(reportsDir, rejectedDir, rejectedResult);
    return rejectedResult;
  }

  let source;
  let edition;
  try {
    const rawManifest = await loadManifest(manifestPath);
    const built = buildSourceEntitiesFromManifest(rawManifest);
    source = built.source;
    edition = built.edition;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(errorMsg);
    const rejectedResult: IngestionJobResult = {
      sourceId: 'unidentified',
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'REJECTED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
    };
    await writeIngestionReport(reportsDir, rejectedDir, rejectedResult);
    return rejectedResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 3: Idempotency & Duplicate Check
  // --------------------------------------------------------------------------
  const { isAlreadyIngested } = checkAlreadyIngested(outputDir, source.id, inspection.sha256);
  if (isAlreadyIngested && !isDryRun) {
    warnings.push(`Source "${source.id}" with file hash ${inspection.sha256} has already been ingested.`);
    const unchangedResult: IngestionJobResult = {
      sourceId: source.id,
      editionId: edition?.id,
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'ALREADY_INGESTED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      outputPath: outputDir,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
      source,
      edition,
    };
    await writeIngestionReport(reportsDir, rejectedDir, unchangedResult);
    return unchangedResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 4: Text Extraction & OCR Evaluation
  // --------------------------------------------------------------------------
  currentStatus = 'EXTRACTING';
  let extractedDoc;
  try {
    const buffer = await fs.promises.readFile(options.inputPath);
    extractedDoc = await extractDocument(options.inputPath, buffer, format);
    warnings.push(...extractedDoc.warnings);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Extraction failed: ${errorMsg}`);
    const failedResult: IngestionJobResult = {
      sourceId: source.id,
      editionId: edition?.id,
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'FAILED',
      pagesProcessed: 0,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
      source,
      edition,
    };
    await writeIngestionReport(reportsDir, rejectedDir, failedResult);
    return failedResult;
  }

  // Handle OCR Required status
  if (extractedDoc.ocrStatus === 'OCR_REQUIRED') {
    warnings.push('Document contains sparse or non-selectable text. Marked as OCR_REQUIRED.');
    const ocrResult: IngestionJobResult = {
      sourceId: source.id,
      editionId: edition?.id,
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'OCR_REQUIRED',
      pagesProcessed: extractedDoc.pages.length,
      sectionsCreated: 0,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
      source,
      edition,
    };
    await writeIngestionReport(reportsDir, rejectedDir, ocrResult);
    return ocrResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 5: Text Normalization & Header/Footer Detection
  // --------------------------------------------------------------------------
  currentStatus = 'NORMALIZING';
  const normalizerResult = detectRunningHeadersAndFooters(extractedDoc.pages);
  warnings.push(...normalizerResult.warnings);

  // --------------------------------------------------------------------------
  // STAGE 6: Structural Parsing
  // --------------------------------------------------------------------------
  const structureResult = parseDocumentStructure(
    normalizerResult.pages,
    source.id,
    edition?.id,
    source.sourceType
  );

  // Validate sections
  for (const section of structureResult.sections) {
    const secValidation = validateSection(section);
    if (!secValidation.isValid) {
      errors.push(`Section ${section.id} validation failed: ${secValidation.errors.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    const rejectedResult: IngestionJobResult = {
      sourceId: source.id,
      editionId: edition?.id,
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'REJECTED',
      pagesProcessed: normalizerResult.pages.length,
      sectionsCreated: structureResult.sections.length,
      passagesCreated: 0,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
      source,
      edition,
      sections: structureResult.sections,
    };
    await writeIngestionReport(reportsDir, rejectedDir, rejectedResult);
    return rejectedResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 7: Passage Segmentation
  // --------------------------------------------------------------------------
  currentStatus = 'SEGMENTING';
  const segConfig = {
    ...DEFAULT_SEGMENTATION_CONFIG,
    ...options.segmentationConfig,
  };

  const passages = segmentPagesIntoPassages(
    normalizerResult.pages,
    source.id,
    edition?.id,
    structureResult.pageSectionMap,
    source.originalLanguage,
    segConfig
  );

  // --------------------------------------------------------------------------
  // STAGE 8: Passage Validation
  // --------------------------------------------------------------------------
  currentStatus = 'VALIDATING';
  for (const passage of passages) {
    const passageVal = validatePassage(passage);
    if (!passageVal.isValid) {
      errors.push(`Passage ${passage.id} failed validation: ${passageVal.errors.join(', ')}`);
    }
  }

  // Double check Source validity
  const srcVal = validateSource(source);
  if (!srcVal.isValid) {
    errors.push(`Source ${source.id} failed validation: ${srcVal.errors.join(', ')}`);
  }

  if (errors.length > 0) {
    const rejectedResult: IngestionJobResult = {
      sourceId: source.id,
      editionId: edition?.id,
      inputFile: options.inputPath,
      fileHash: inspection.sha256,
      fileSize: inspection.fileSize,
      format,
      status: 'REJECTED',
      pagesProcessed: normalizerResult.pages.length,
      sectionsCreated: structureResult.sections.length,
      passagesCreated: passages.length,
      warnings,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      isDryRun,
      source,
      edition,
      sections: structureResult.sections,
      passages,
    };
    await writeIngestionReport(reportsDir, rejectedDir, rejectedResult);
    return rejectedResult;
  }

  // --------------------------------------------------------------------------
  // STAGE 9: Storage & Report Generation
  // --------------------------------------------------------------------------
  currentStatus = 'READY';

  if (!isDryRun) {
    await writeCorpusRecords(
      outputDir,
      source,
      edition,
      structureResult.sections,
      passages,
      inspection.sha256,
      inspection.fileName
    );
  }

  const successResult: IngestionJobResult = {
    sourceId: source.id,
    editionId: edition?.id,
    inputFile: options.inputPath,
    fileHash: inspection.sha256,
    fileSize: inspection.fileSize,
    format,
    status: currentStatus,
    pagesProcessed: normalizerResult.pages.length,
    sectionsCreated: structureResult.sections.length,
    passagesCreated: passages.length,
    warnings,
    errors,
    outputPath: isDryRun ? undefined : outputDir,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    isDryRun,
    source,
    edition,
    sections: structureResult.sections,
    passages,
  };

  const reportPath = await writeIngestionReport(reportsDir, rejectedDir, successResult);
  successResult.reportPath = reportPath;

  return successResult;
}
