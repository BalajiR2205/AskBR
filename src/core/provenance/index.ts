/**
 * Ask Ambedkar — Provenance Builder & Citation Utilities
 */

export * from './types';

import { ProvenanceRecord } from './types';
import { DocumentSection, Edition, Source } from '../sources/types';
import { Passage } from '../passages/types';

/**
 * Constructs an immutable ProvenanceRecord linking a passage to its authoritative source and edition.
 */
export function buildProvenance(
  passage: Passage,
  source: Source,
  edition?: Edition,
  section?: DocumentSection
): ProvenanceRecord {
  // Compute page range string
  let pageRange: string | undefined;
  if (passage.pageStart && passage.pageEnd && passage.pageStart !== passage.pageEnd) {
    pageRange = `pp. ${passage.pageStart}–${passage.pageEnd}`;
  } else if (passage.pageStart) {
    pageRange = `p. ${passage.pageStart}`;
  } else if (section?.pageStart) {
    pageRange = section.pageEnd ? `pp. ${section.pageStart}–${section.pageEnd}` : `p. ${section.pageStart}`;
  }

  const isTranslation = !passage.translationMetadata.isOriginal;

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    sourceType: source.sourceType,
    classification: source.classification,
    author: source.attribution.name,
    attributionRole: source.attribution.role,
    recipient: source.attribution.recipient,
    editionId: edition?.id || passage.editionId,
    editionName: edition?.editionName,
    year: edition?.year || source.year,
    date: source.date,
    volume: source.volume,
    chapter: passage.chapter || (section?.level === 'CHAPTER' ? section.title : undefined),
    sectionTitle: passage.section || section?.title,
    pageRange,
    originalLanguage: source.originalLanguage,
    verbatimText: passage.originalText,
    bibliographicReference: source.sourceReference,
    isTranslation,
    translator: passage.translationMetadata.translator,
  };
}

/**
 * Formats a clean, academic citation string from a ProvenanceRecord.
 */
export function formatCitation(prov: ProvenanceRecord): string {
  const parts: string[] = [];

  // 1. Author
  parts.push(prov.author);

  // 2. Title & Year
  const yearPart = prov.year ? ` (${prov.year})` : '';
  if (prov.sourceType === 'BOOK') {
    parts.push(`*${prov.sourceTitle}*${yearPart}`);
  } else {
    parts.push(`"${prov.sourceTitle}"${yearPart}`);
  }

  // 3. Chapter or Section
  if (prov.chapter) {
    parts.push(prov.chapter);
  } else if (prov.sectionTitle) {
    parts.push(prov.sectionTitle);
  }

  // 4. Page Range
  if (prov.pageRange) {
    parts.push(prov.pageRange);
  }

  // 5. Bibliographic reference
  if (prov.bibliographicReference) {
    parts.push(`Ref: ${prov.bibliographicReference}`);
  }

  // 6. Translation note
  if (prov.isTranslation && prov.translator) {
    parts.push(`[Translated by ${prov.translator}]`);
  }

  return parts.join(', ');
}
