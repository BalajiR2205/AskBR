/**
 * Ask Ambedkar — Ingestion Pipeline: Structure Parser
 * 
 * Detects hierarchical document structure (Chapters, Sections, Debate Topics, Speeches)
 * and generates canonical DocumentSection entities from Segment 3.
 */

import { DocumentSection, SectionLevel, SourceCategory } from '../core/sources/types';
import { NormalizedPage } from './normalizer';

export interface ParsedSectionLocation {
  section: DocumentSection;
  startPage: number;
  startCharIndex: number;
}

export interface DocumentStructureResult {
  sections: DocumentSection[];
  pageSectionMap: Map<number, DocumentSection>; // Maps page number to active section
}

/**
 * Common regex patterns for structural headings across primary materials
 */
const CHAPTER_REGEX = /^(?:CHAPTER|Chapter)\s+([0-9IVXLCDM]+)(?:\s*[:.\-–—]\s*(.*))?$/i;
const SECTION_REGEX = /^(?:SECTION|Section)\s+([0-9IVXLCDM]+)(?:\s*[:.\-–—]\s*(.*))?$/i;
const PART_REGEX = /^(?:PART|Part)\s+([0-9IVXLCDM]+)(?:\s*[:.\-–—]\s*(.*))?$/i;
const APPENDIX_REGEX = /^(?:APPENDIX|Appendix)\s+([0-9IVXLCDM]+|[A-Z])(?:\s*[:.\-–—]\s*(.*))?$/i;
const CAD_DEBATE_REGEX = /^(?:Debate on|Motion regarding|Discussion on|Draft Constitution Art|Constituent Assembly of India)\s*(.*)$/i;

/**
 * Detects structural sections across pages.
 */
export function parseDocumentStructure(
  pages: NormalizedPage[],
  sourceId: string,
  editionId?: string,
  sourceType: SourceCategory = 'BOOK'
): DocumentStructureResult {
  const sections: DocumentSection[] = [];
  const pageSectionMap = new Map<number, DocumentSection>();

  let sectionSequence = 0;

  for (const page of pages) {
    const lines = page.normalizedText.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx].trim();
      if (!line) continue;

      let detectedLevel: SectionLevel | null = null;
      let title = line;
      let sectionNumber: string | undefined;

      // Check Chapter
      const chMatch = line.match(CHAPTER_REGEX);
      if (chMatch) {
        detectedLevel = 'CHAPTER';
        sectionNumber = chMatch[1];
        title = chMatch[2] ? `Chapter ${sectionNumber}: ${chMatch[2].trim()}` : `Chapter ${sectionNumber}`;
      } else {
        // Check Part
        const partMatch = line.match(PART_REGEX);
        if (partMatch) {
          detectedLevel = 'PART';
          sectionNumber = partMatch[1];
          title = partMatch[2] ? `Part ${sectionNumber}: ${partMatch[2].trim()}` : `Part ${sectionNumber}`;
        } else {
          // Check Section
          const secMatch = line.match(SECTION_REGEX);
          if (secMatch) {
            detectedLevel = 'SECTION';
            sectionNumber = secMatch[1];
            title = secMatch[2] ? `Section ${sectionNumber}: ${secMatch[2].trim()}` : `Section ${sectionNumber}`;
          } else {
            // Check Appendix
            const appMatch = line.match(APPENDIX_REGEX);
            if (appMatch) {
              detectedLevel = 'APPENDIX';
              sectionNumber = appMatch[1];
              title = appMatch[2] ? `Appendix ${sectionNumber}: ${appMatch[2].trim()}` : `Appendix ${sectionNumber}`;
            } else if (sourceType === 'CONSTITUENT_ASSEMBLY') {
              const cadMatch = line.match(CAD_DEBATE_REGEX);
              if (cadMatch) {
                detectedLevel = 'DEBATE_TOPIC';
                title = line;
              }
            }
          }
        }
      }

      if (detectedLevel) {
        const slugNum = sectionNumber ? sectionNumber.toLowerCase().replace(/[^a-z0-9]/g, '') : `${sectionSequence + 1}`;
        const secId = `sec_${sourceId}_${detectedLevel.toLowerCase().slice(0, 3)}_${slugNum}`;

        const newSection: DocumentSection = {
          id: secId,
          sourceId,
          editionId,
          level: detectedLevel,
          sequence: sectionSequence++,
          title,
          sectionNumber,
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update previous section's pageEnd if applicable
        if (sections.length > 0) {
          const prev = sections[sections.length - 1];
          prev.pageEnd = page.pageNumber;
        }

        sections.push(newSection);
        break; // Max 1 major section header per page scan
      }
    }

    // Associate page with current active section
    if (sections.length > 0) {
      pageSectionMap.set(page.pageNumber, sections[sections.length - 1]);
    }
  }

  // If no explicit section headers were found, create a canonical root/main section
  if (sections.length === 0) {
    const defaultLevel: SectionLevel =
      sourceType === 'CONSTITUENT_ASSEMBLY'
        ? 'DEBATE_TOPIC'
        : sourceType === 'SPEECH'
        ? 'SECTION'
        : 'CHAPTER';

    const rootSection: DocumentSection = {
      id: `sec_${sourceId}_main`,
      sourceId,
      editionId,
      level: defaultLevel,
      sequence: 0,
      title: 'Main Text',
      pageStart: pages[0]?.pageNumber || 1,
      pageEnd: pages[pages.length - 1]?.pageNumber || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sections.push(rootSection);
    for (const page of pages) {
      pageSectionMap.set(page.pageNumber, rootSection);
    }
  } else {
    // Ensure final section covers up to the last page
    sections[sections.length - 1].pageEnd = pages[pages.length - 1]?.pageNumber || sections[sections.length - 1].pageStart;
  }

  return {
    sections,
    pageSectionMap,
  };
}
