/**
 * Ask Ambedkar — Ingestion Pipeline: JSON Document Extractor
 * 
 * Supports structured JSON representations with explicit page arrays
 * or raw document content fields.
 */

import { ExtractedDocument, ExtractedPage } from '../types';

export function extractJson(content: string): ExtractedDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err: unknown) {
    throw new Error(`Malformed JSON input: ${err instanceof Error ? err.message : String(err)}`);
  }

  const pages: ExtractedPage[] = [];

  if (typeof parsed === 'object' && parsed !== null) {
    const record = parsed as Record<string, unknown>;

    // Case 1: Structured pages array
    if (Array.isArray(record.pages)) {
      for (let i = 0; i < record.pages.length; i++) {
        const item = record.pages[i];
        if (typeof item === 'string') {
          pages.push({
            pageNumber: i + 1,
            rawText: item,
          });
        } else if (typeof item === 'object' && item !== null) {
          const pageObj = item as Record<string, unknown>;
          const pageNum = typeof pageObj.pageNumber === 'number' ? pageObj.pageNumber : i + 1;
          const text = typeof pageObj.text === 'string' ? pageObj.text : (typeof pageObj.content === 'string' ? pageObj.content : '');
          pages.push({
            pageNumber: pageNum,
            rawText: text,
            detectedHeader: typeof pageObj.header === 'string' ? pageObj.header : undefined,
            detectedFooter: typeof pageObj.footer === 'string' ? pageObj.footer : undefined,
          });
        }
      }
    } else if (typeof record.content === 'string') {
      // Case 2: Document with raw content string
      pages.push({
        pageNumber: 1,
        rawText: record.content,
      });
    } else if (typeof record.text === 'string') {
      // Case 3: Document with raw text string
      pages.push({
        pageNumber: 1,
        rawText: record.text,
      });
    } else {
      // Fallback: Serialize JSON values
      pages.push({
        pageNumber: 1,
        rawText: JSON.stringify(record, null, 2),
      });
    }
  } else if (Array.isArray(parsed)) {
    // Array of strings or page objects
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (typeof item === 'string') {
        pages.push({
          pageNumber: i + 1,
          rawText: item,
        });
      }
    }
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      rawText: '',
    });
  }

  const totalCharacters = pages.reduce((acc, p) => acc + p.rawText.length, 0);

  return {
    format: 'JSON',
    pages,
    totalCharacters,
    extractedAt: new Date().toISOString(),
    ocrStatus: totalCharacters > 50 ? 'TEXT_EXTRACTED' : 'OCR_REQUIRED',
    warnings: [],
  };
}
