/**
 * Ask Ambedkar — Primary Source Architecture: Provenance Domain Types
 * 
 * Provenance Principle:
 * Every retrieved passage that serves as evidence must retain complete,
 * unbroken traceability back to its authoritative primary source.
 */

import { AttributionRole, SourceCategory, SourceClassification } from '../sources/types';

export interface ProvenanceRecord {
  /** Stable identifier of the parent Source */
  sourceId: string;

  /** Authoritative title of the work */
  sourceTitle: string;

  /** Controlled source category */
  sourceType: SourceCategory;

  /** Source classification (PRIMARY only for answer generation) */
  classification: SourceClassification;

  /** Creator name (Dr. B. R. Ambedkar) */
  author: string;

  /** Attribution role (AUTHOR, SPEAKER, INTERVIEWEE, CORRESPONDENT) */
  attributionRole: AttributionRole;

  /** Recipient if the source is a letter/correspondence */
  recipient?: string;

  /** Referenced edition ID */
  editionId?: string;

  /** Name of the referenced edition */
  editionName?: string;

  /** Publication or delivery year */
  year?: number | string;

  /** Exact historical date if recorded */
  date?: string;

  /** Collection volume number (e.g. 'BAWS Vol. 1') */
  volume?: string | number;

  /** Chapter title or number */
  chapter?: string;

  /** Section title or topic */
  sectionTitle?: string;

  /** Formatted page range in cited edition */
  pageRange?: string;

  /** Original language of the source */
  originalLanguage: string;

  /** Immutable verbatim text passage */
  verbatimText: string;

  /** Complete canonical citation reference */
  bibliographicReference: string;

  /** True if the passage represents a translation */
  isTranslation: boolean;

  /** Name of translator if applicable */
  translator?: string;
}
