/**
 * Ask Ambedkar — Primary Source Architecture: Passages Domain Types
 * 
 * Data Integrity Principles:
 * 1. Original source text is immutable.
 * 2. Processed/search text must NEVER overwrite original text.
 * 3. Translations must NEVER replace original text; they are related representations.
 * 4. Generated AI content must NEVER be stored as source text.
 */

import { LanguageCode } from '../sources/types';

// ============================================================================
// 1. Translation Classification
// ============================================================================

export type TranslationType =
  | 'ORIGINAL'
  | 'PUBLISHED_TRANSLATION'
  | 'GENERATED_TRANSLATION';

export interface TranslationMetadata {
  /** True if this passage represents the original historical text as authored/recorded */
  isOriginal: boolean;

  /** Stable ID of the original source passage if this passage is a translation */
  originalPassageId?: string;

  /** Controlled classification of translation provenance */
  translationType: TranslationType;

  /** Name of the published translator if known */
  translator?: string;

  /** Bibliographic citation of the translated edition */
  publicationInfo?: string;
}

// ============================================================================
// 2. OCR & Extraction Metadata
// ============================================================================

export interface OcrMetadata {
  /** Raw uncorrected OCR output from scanning historical print */
  ocrRawText?: string;

  /** OCR confidence metric (0.0 to 1.0) */
  ocrConfidence?: number;

  /** Extraction engine identifier (e.g., 'tesseract-v5', 'google-vision') */
  engine?: string;

  /** Flag indicating whether historical text has been human-verified */
  isHumanVerified?: boolean;
}

// ============================================================================
// 3. Canonical Passage Entity (Atomic Unit of Retrieval)
// ============================================================================

export interface Passage {
  /** Stable unique identifier (e.g., 'psg_aoc_s14_001') */
  id: string;

  /** Foreign key pointing to parent Source */
  sourceId: string;

  /** Foreign key pointing to specific Edition cited */
  editionId?: string;

  /** Foreign key pointing to parent DocumentSection */
  parentSectionId?: string;

  /** Sequential position within the source/section */
  sequence: number;

  /**
   * IMMUTABLE: The verbatim original primary text as printed/recorded.
   * This field must NEVER be modified, summarized, or translated.
   */
  originalText: string;

  /**
   * Normalized text for search and embedding generation
   * (e.g. standard unicode normalization, collapsed whitespace).
   * Does NOT replace originalText.
   */
  normalizedText: string;

  /**
   * Optional pre-tokenized or keyword-expanded search representation.
   */
  searchText?: string;

  /** Language of this passage */
  language: LanguageCode;

  /** Starting page number in the cited edition */
  pageStart?: number | string;

  /** Ending page number in the cited edition */
  pageEnd?: number | string;

  /** Starting paragraph number within section or page */
  paragraphStart?: number;

  /** Ending paragraph number within section or page */
  paragraphEnd?: number;

  /** Chapter title or number cache for rapid display */
  chapter?: string;

  /** Section title or topic cache for rapid display */
  section?: string;

  /** Preceding context snippet for contextual answer generation */
  contextBefore?: string;

  /** Succeeding context snippet for contextual answer generation */
  contextAfter?: string;

  /** Translation tracking metadata */
  translationMetadata: TranslationMetadata;

  /** Optional OCR extraction metadata */
  ocrMetadata?: OcrMetadata;

  createdAt: string;
  updatedAt: string;
}
