/**
 * Ask Ambedkar — Ingestion Pipeline: Core Types & Interfaces
 * 
 * Reuses canonical domain entities from src/core/sources, src/core/passages,
 * and src/core/provenance without creating competing schemas.
 */

import {
  AuthorAttribution,
  CategorySpecificMetadata,
  DocumentSection,
  Edition,
  LanguageCode,
  Source,
  SourceCategory,
  SourceClassification,
  SourceStatus,
} from '../core/sources/types';
import { Passage } from '../core/passages/types';

// ============================================================================
// 1. Supported Input Formats & Statuses
// ============================================================================

export type SupportedFormat = 'PDF' | 'TXT' | 'MARKDOWN' | 'JSON';

export type IngestionStatus =
  | 'DISCOVERED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'NORMALIZING'
  | 'SEGMENTING'
  | 'VALIDATING'
  | 'READY'
  | 'ALREADY_INGESTED'
  | 'OCR_REQUIRED'
  | 'REJECTED'
  | 'FAILED';

export type OcrDetectionStatus = 'TEXT_EXTRACTED' | 'OCR_REQUIRED';

// ============================================================================
// 2. Inspection & Extraction Contracts
// ============================================================================

export interface FileInspectionResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  detectedFormat: SupportedFormat | 'UNKNOWN';
  inspectedAt: string;
}

export interface ExtractedPage {
  pageNumber: number;
  rawText: string;
  detectedHeader?: string;
  detectedFooter?: string;
}

export interface ExtractedDocument {
  format: SupportedFormat;
  pages: ExtractedPage[];
  totalCharacters: number;
  extractedAt: string;
  ocrStatus: OcrDetectionStatus;
  ocrConfidence?: number;
  warnings: string[];
}

// ============================================================================
// 3. Source Manifest (Pre-Ingestion Metadata)
// ============================================================================

export interface SourceManifest {
  /** Stable unique identifier (e.g., 'src_book_aoc_1936') */
  sourceId: string;

  /** Full authoritative title of the work */
  title: string;

  /** Optional subtitle or descriptor */
  subtitle?: string;

  /** Controlled category of primary source */
  sourceType: SourceCategory;

  /** Source classification (strictly PRIMARY for answer corpus) */
  classification?: SourceClassification;

  /** Lifecycle status (defaults to VERIFIED upon ingestion) */
  status?: SourceStatus;

  /** Primary author or speaker name (defaults to 'Dr. B. R. Ambedkar') */
  author?: string;

  /** Structured attribution details or role override */
  attribution?: Partial<AuthorAttribution>;

  /** Recipient if the source is a LETTER */
  recipient?: string;

  /** Interviewer if the source is an INTERVIEW */
  interviewer?: string;

  /** Original language of the source (e.g. 'en', 'mr') */
  originalLanguage: LanguageCode;

  /** Languages available in this ingest */
  languagesAvailable?: LanguageCode[];

  /** Year of publication or delivery */
  year?: number;

  /** Exact historical date if known (YYYY-MM-DD) */
  date?: string;

  /** Collection volume number (e.g., 'BAWS Vol. 1') */
  volume?: string | number;

  /** Publisher or publishing body */
  publisher?: string;

  /** Publication or periodical name */
  publication?: string;

  /** Canonical bibliographic citation reference */
  sourceReference: string;

  /** Permanent archive URL, digital library handle, or catalog link */
  externalReference?: string;

  /** Copyright or usage status declaration */
  copyrightOrUsage?: string;

  /** Optional edition information */
  edition?: {
    id?: string;
    editionName: string;
    year?: number;
    publisher?: string;
    editor?: string;
    isAuthoritative?: boolean;
    notes?: string;
  };

  /** Specific metadata depending on category */
  categoryMetadata?: CategorySpecificMetadata;

  /** Associated input file basename or relative path */
  inputFile?: string;
}

// ============================================================================
// 4. Segmentation & Normalization Configuration
// ============================================================================

export interface SegmentationConfig {
  /** Maximum character length per passage (default: 1200 chars ~ 200-250 words) */
  maxCharacters: number;

  /** Minimum character length per passage to avoid fragmenting (default: 150 chars) */
  minCharacters: number;

  /** Modest overlap character count between adjacent passages (default: 100 chars) */
  overlapCharacters: number;
}

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = {
  maxCharacters: 1200,
  minCharacters: 150,
  overlapCharacters: 100,
};

// ============================================================================
// 5. Ingestion Pipeline Execution Contracts
// ============================================================================

export interface IngestionOptions {
  /** Path to input source file */
  inputPath: string;

  /** Optional explicit path to manifest JSON */
  manifestPath?: string;

  /** Output directory for corpus (default: data/corpus) */
  outputDir?: string;

  /** Output directory for working reports (default: data/working/reports) */
  reportsDir?: string;

  /** Output directory for rejected or failed reports (default: data/rejected) */
  rejectedDir?: string;

  /** If true, executes full extraction & validation without writing final corpus records */
  dryRun?: boolean;

  /** Format override if auto-detection should be bypassed */
  formatOverride?: SupportedFormat;

  /** Custom passage segmentation parameters */
  segmentationConfig?: Partial<SegmentationConfig>;
}

export interface IngestionJobResult {
  sourceId: string;
  editionId?: string;
  inputFile: string;
  fileHash: string;
  fileSize: number;
  format: SupportedFormat;
  status: IngestionStatus;
  pagesProcessed: number;
  sectionsCreated: number;
  passagesCreated: number;
  warnings: string[];
  errors: string[];
  outputPath?: string;
  reportPath?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  isDryRun: boolean;

  // Structured records generated (in-memory)
  source?: Source;
  edition?: Edition;
  sections?: DocumentSection[];
  passages?: Passage[];
}
