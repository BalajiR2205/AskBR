/**
 * Ask Ambedkar — Ingestion Pipeline: Passage Segmenter
 * 
 * Implements deterministic, paragraph-aware, sentence-preserving segmentation.
 * Preserves exact verbatim originalText separately from normalizedText,
 * maintains page and section boundaries, and assigns deterministic stable IDs.
 */

import { DocumentSection, LanguageCode } from '../core/sources/types';
import { Passage } from '../core/passages/types';
import { NormalizedPage } from './normalizer';
import { DEFAULT_SEGMENTATION_CONFIG, SegmentationConfig } from './types';

export interface RawTextBlock {
  rawText: string;
  normalizedText: string;
  pageNumber: number;
}

/**
 * Splits text into sentence units preserving punctuation.
 */
function splitIntoSentences(text: string): string[] {
  // Use regex that splits on sentence end punctuation followed by whitespace and capital letter or end of string
  const sentenceRegex = /([^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$)/g;
  const matches = text.match(sentenceRegex);
  if (!matches) {
    return [text];
  }
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Deterministically segments normalized pages into canonical Passage entities.
 */
export function segmentPagesIntoPassages(
  pages: NormalizedPage[],
  sourceId: string,
  editionId?: string,
  pageSectionMap?: Map<number, DocumentSection>,
  language: LanguageCode = 'en',
  config: SegmentationConfig = DEFAULT_SEGMENTATION_CONFIG
): Passage[] {
  const passages: Passage[] = [];
  let globalSequence = 1;

  for (const page of pages) {
    const activeSection = pageSectionMap?.get(page.pageNumber);
    const sectionId = activeSection?.id;
    const chapterTitle = activeSection?.level === 'CHAPTER' ? activeSection.title : undefined;
    const sectionTitle = activeSection?.title;

    // Split page into paragraphs using double newlines on both raw and normalized text
    const rawParagraphs = page.rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const normalizedParagraphs = page.normalizedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    let paragraphIndex = 1;

    for (let i = 0; i < normalizedParagraphs.length; i++) {
      const normPara = normalizedParagraphs[i].trim();
      const rawPara = (rawParagraphs[i] || normPara).trim();

      if (normPara.length === 0) continue;

      // If paragraph is within bounds, emit directly
      if (normPara.length <= config.maxCharacters) {
        // If paragraph is too small (< minCharacters) and we can combine with previous pending text within the same page/section
        if (normPara.length < config.minCharacters && passages.length > 0) {
          const lastPassage = passages[passages.length - 1];
          // Check if same page and same section, and combined size won't exceed maxCharacters
          if (
            lastPassage.pageEnd === page.pageNumber &&
            lastPassage.parentSectionId === sectionId &&
            lastPassage.normalizedText.length + normPara.length + 1 <= config.maxCharacters
          ) {
            lastPassage.originalText = `${lastPassage.originalText}\n\n${rawPara}`;
            lastPassage.normalizedText = `${lastPassage.normalizedText} ${normPara}`;
            lastPassage.paragraphEnd = paragraphIndex;
            paragraphIndex++;
            continue;
          }
        }

        const seqStr = String(globalSequence).padStart(3, '0');
        const sectionSlug = sectionId ? sectionId.replace(/^sec_/, '') : 'main';
        const passageId = `psg_${sourceId}_${sectionSlug}_${seqStr}`;

        passages.push({
          id: passageId,
          sourceId,
          editionId,
          parentSectionId: sectionId,
          sequence: globalSequence++,
          originalText: rawPara, // VERBATIM IMMUTABLE
          normalizedText: normPara,
          language,
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
          paragraphStart: paragraphIndex,
          paragraphEnd: paragraphIndex,
          chapter: chapterTitle,
          section: sectionTitle,
          translationMetadata: {
            isOriginal: true,
            translationType: 'ORIGINAL',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        paragraphIndex++;
      } else {
        // Paragraph exceeds maxCharacters -> split on sentence boundaries
        const sentences = splitIntoSentences(normPara);
        let chunkNorm = '';
        let chunkRaw = '';
        let startParaIdx = paragraphIndex;

        for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
          const sentence = sentences[sIdx];

          if (chunkNorm.length > 0 && chunkNorm.length + sentence.length > config.maxCharacters) {
            const seqStr = String(globalSequence).padStart(3, '0');
            const sectionSlug = sectionId ? sectionId.replace(/^sec_/, '') : 'main';
            const passageId = `psg_${sourceId}_${sectionSlug}_${seqStr}`;

            passages.push({
              id: passageId,
              sourceId,
              editionId,
              parentSectionId: sectionId,
              sequence: globalSequence++,
              originalText: chunkRaw.trim(),
              normalizedText: chunkNorm.trim(),
              language,
              pageStart: page.pageNumber,
              pageEnd: page.pageNumber,
              paragraphStart: startParaIdx,
              paragraphEnd: paragraphIndex,
              chapter: chapterTitle,
              section: sectionTitle,
              translationMetadata: {
                isOriginal: true,
                translationType: 'ORIGINAL',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Apply modest overlap if configured
            if (config.overlapCharacters > 0 && chunkNorm.length > config.overlapCharacters) {
              const overlapSlice = chunkNorm.slice(-config.overlapCharacters).trim();
              chunkNorm = `${overlapSlice} ${sentence}`;
              chunkRaw = `${overlapSlice} ${sentence}`;
            } else {
              chunkNorm = sentence;
              chunkRaw = sentence;
            }
            startParaIdx = paragraphIndex;
          } else {
            chunkNorm = chunkNorm.length === 0 ? sentence : `${chunkNorm} ${sentence}`;
            chunkRaw = chunkRaw.length === 0 ? sentence : `${chunkRaw} ${sentence}`;
          }
        }

        // Trailing chunk
        if (chunkNorm.trim().length > 0) {
          const seqStr = String(globalSequence).padStart(3, '0');
          const sectionSlug = sectionId ? sectionId.replace(/^sec_/, '') : 'main';
          const passageId = `psg_${sourceId}_${sectionSlug}_${seqStr}`;

          passages.push({
            id: passageId,
            sourceId,
            editionId,
            parentSectionId: sectionId,
            sequence: globalSequence++,
            originalText: chunkRaw.trim(),
            normalizedText: chunkNorm.trim(),
            language,
            pageStart: page.pageNumber,
            pageEnd: page.pageNumber,
            paragraphStart: startParaIdx,
            paragraphEnd: paragraphIndex,
            chapter: chapterTitle,
            section: sectionTitle,
            translationMetadata: {
              isOriginal: true,
              translationType: 'ORIGINAL',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        paragraphIndex++;
      }
    }
  }

  // Populate contextual contextBefore and contextAfter snippets
  for (let i = 0; i < passages.length; i++) {
    if (i > 0) {
      const prev = passages[i - 1];
      // Only attach if same section
      if (prev.parentSectionId === passages[i].parentSectionId) {
        passages[i].contextBefore = prev.normalizedText.slice(-200);
      }
    }
    if (i < passages.length - 1) {
      const next = passages[i + 1];
      if (next.parentSectionId === passages[i].parentSectionId) {
        passages[i].contextAfter = next.normalizedText.slice(0, 200);
      }
    }
  }

  return passages;
}
