/**
 * Ask Ambedkar — Ingestion Pipeline: Markdown Extractor
 * 
 * Preserves page markers, frontmatter, and headings from Markdown documents.
 */

import { ExtractedDocument, ExtractedPage } from '../types';

export function extractMarkdown(content: string): ExtractedDocument {
  const pages: ExtractedPage[] = [];

  // Strip YAML frontmatter if present, preserving raw text
  let bodyContent = content;
  if (content.startsWith('---')) {
    const endMatch = content.indexOf('\n---', 3);
    if (endMatch !== -1) {
      bodyContent = content.slice(endMatch + 4).trimStart();
    }
  }

  // Check for page markers
  if (bodyContent.includes('\f')) {
    const rawPages = bodyContent.split('\f');
    for (let i = 0; i < rawPages.length; i++) {
      pages.push({
        pageNumber: i + 1,
        rawText: rawPages[i],
      });
    }
  } else {
    // Check for comment page markers or thematic break page markers
    const pageMarkerRegex = /(?:^|\n)(?:<!--\s*(?:PAGE|page)\s*(\d+)\s*-->|[-=]{3,}\s*(?:PAGE|Page)\s*(\d+)\s*[-=]{3,})(?:\n|$)/g;
    let match: RegExpExecArray | null;
    const markers: { index: number; pageNumber: number; length: number }[] = [];

    while ((match = pageMarkerRegex.exec(bodyContent)) !== null) {
      const pageNumStr = match[1] || match[2];
      const pageNum = parseInt(pageNumStr, 10);
      markers.push({
        index: match.index,
        pageNumber: isNaN(pageNum) ? markers.length + 1 : pageNum,
        length: match[0].length,
      });
    }

    if (markers.length > 0) {
      let lastIndex = 0;
      let currentPageNumber = 1;

      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        const pageText = bodyContent.slice(lastIndex, marker.index);
        if (i > 0 || pageText.trim().length > 0) {
          pages.push({
            pageNumber: currentPageNumber,
            rawText: pageText,
          });
        }
        currentPageNumber = marker.pageNumber;
        lastIndex = marker.index + marker.length;
      }

      const remainingText = bodyContent.slice(lastIndex);
      if (remainingText.trim().length > 0 || pages.length === 0) {
        pages.push({
          pageNumber: currentPageNumber,
          rawText: remainingText,
        });
      }
    } else {
      pages.push({
        pageNumber: 1,
        rawText: bodyContent,
      });
    }
  }

  const totalCharacters = pages.reduce((acc, p) => acc + p.rawText.length, 0);

  return {
    format: 'MARKDOWN',
    pages,
    totalCharacters,
    extractedAt: new Date().toISOString(),
    ocrStatus: totalCharacters > 50 ? 'TEXT_EXTRACTED' : 'OCR_REQUIRED',
    warnings: [],
  };
}
