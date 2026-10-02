/**
 * Primary Sources Domain Module — Types
 * 
 * Strict Primary Source Philosophy:
 * The knowledge base will strictly contain ONLY primary sources directly
 * attributable to Dr. B. R. Ambedkar.
 * 
 * Permitted Source Categories:
 * 1. Books and authored works
 * 2. Speeches
 * 3. Interviews
 * 4. Constituent Assembly debates and recorded statements
 * 5. Letters and correspondence
 * 6. Articles and editorials written by Ambedkar
 */

export type PrimarySourceType =
  | 'book'
  | 'speech'
  | 'interview'
  | 'constituent_assembly_debate'
  | 'letter'
  | 'article_editorial';

export type LanguageCode = 'en' | 'mr' | 'hi' | string;

/**
 * Complete provenance tracking for every primary source passage.
 * Answers must eventually point users back to the exact supporting source.
 */
export interface SourceProvenance {
  /** Title of the overarching work or collection (e.g., 'Annihilation of Caste', 'BAWS Vol. 1') */
  workTitle: string;

  /** Author (must be B. R. Ambedkar) */
  author: 'B. R. Ambedkar';

  /** Date or approximate year of the statement or publication */
  dateOrYear?: string;

  /** Category of primary source */
  sourceType: PrimarySourceType;

  /** Chapter title or number, if applicable */
  chapter?: string;

  /** Section title or number, if applicable */
  section?: string;

  /** Page number or page range in referenced edition */
  page?: string | number;

  /** Original language in which the source was authored or recorded */
  originalLanguage: LanguageCode;

  /** Original text passage verbatim */
  originalText: string;

  /** Complete bibliographic or archival citation reference */
  referenceInfo: string;

  /** Volume number if part of a multi-volume collected works (e.g., BAWS) */
  volume?: number | string;

  /** Public archive or permanent URL if available */
  archiveUrl?: string;
}

/**
 * Individual indexed passage representing an atomic unit of primary source text.
 */
export interface SourcePassage {
  id: string;
  provenance: SourceProvenance;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Contract for querying primary sources (to be implemented in subsequent segments).
 */
export interface SourceRepository {
  findById(id: string): Promise<SourcePassage | null>;
  searchByWork(workTitle: string): Promise<SourcePassage[]>;
  searchByType(sourceType: PrimarySourceType): Promise<SourcePassage[]>;
  count(): Promise<number>;
}
