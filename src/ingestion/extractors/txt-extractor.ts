/**
 * Ask Ambedkar — Ingestion Pipeline: Plain Text Extractor
 * 
 * Preserves page boundaries demarcated by form-feed characters (\f)
 * or explicit page marker tokens (e.g. --- PAGE 1 ---, [Page 1]).
 */

import { ExtractedDocument, ExtractedPage } from '../types';

export function extractTxt(content: string): ExtractedDocument {
  const pages: ExtractedPage[] = [];

  // Check for form feed character \f
  if (content.includes('\f')) {
    const rawPages = content.split('\f');
    for (let i = 0; i < rawPages.length; i++) {
      pages.push({
        pageNumber: i + 1,
        rawText: rawPages[i],
      });
    }
  } else {
    // Check for standard page marker patterns like "--- PAGE 1 ---" or "[Page 1]"
    const pageMarkerRegex = /(?:^|\n)(?:[-=]{3,}\s*(?:PAGE|Page)\s*(\d+)\s*[-=]{3,}|\[(?:PAGE|Page)\s*(\d+)\]|<!--\s*(?:PAGE|page)\s*(\d+)\s*-->)(?:\n|$)/g;

    let match: RegExpExecArray | null;
    const markerIndices: { index: number; pageNumber: number; length: number }[] = [];

    while ((match = pageMarkerRegex.exec(content)) !== null) {
      const pageNumStr = match[1] || match[2] || match[3];
      const pageNum = parseInt(pageNumStr, 10);
      markerIndices.push({
        index: match.index,
        pageNumber: isNaN(pageNum) ? markerIndices.length + 1 : pageNum,
        length: match[0].length,
      });
    }

    if (markerIndices.length > 0) {
      let lastIndex = 0;
      let currentPageNumber = 1;

      for (let i = 0; i < markerIndices.length; i++) {
        const marker = markerIndices[i];
        const pageText = content.slice(lastIndex, marker.index);
        if (i > 0 || pageText.trim().length > 0) {
          pages.push({
            pageNumber: currentPageNumber,
            rawText: pageText,
          });
        }
        currentPageNumber = marker.pageNumber;
        lastIndex = marker.index + marker.length;
      }

      // Add trailing text after final marker
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim().length > 0 || pages.length === 0) {
        pages.push({
          pageNumber: currentPageNumber,
          rawText: remainingText,
        });
      }
    } else {
      // Single continuous document without explicit page markers
      pages.push({
        pageNumber: 1,
        rawText: content,
      });
    }
  }

  const totalCharacters = pages.reduce((acc, p) => acc + p.rawText.length, 0);

  return {
    format: 'TXT',
    pages,
    totalCharacters,
    extractedAt: new Date().toISOString(),
    ocrStatus: totalCharacters > 50 ? 'TEXT_EXTRACTED' : 'OCR_REQUIRED',
    warnings: [],
  };
}
