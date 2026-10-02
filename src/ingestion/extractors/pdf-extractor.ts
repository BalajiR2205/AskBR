/**
 * Ask Ambedkar — Ingestion Pipeline: PDF Extractor Adapter
 * 
 * Preserves page boundaries and numbers by extracting PDF content
 * page-by-page using unpdf (pdfjs-based runtime).
 * Evaluates whether text is sufficient or if OCR_REQUIRED.
 */

import { extractText } from 'unpdf';
import { ExtractedDocument, ExtractedPage, OcrDetectionStatus } from '../types';

export async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const warnings: string[] = [];
  const pages: ExtractedPage[] = [];

  let result: { totalPages: number; text: string | string[] };
  try {
    result = await extractText(new Uint8Array(buffer), { mergePages: false });
  } catch (err: unknown) {
    throw new Error(`Failed to parse PDF document: ${err instanceof Error ? err.message : String(err)}`);
  }

  const rawTexts = Array.isArray(result.text) ? result.text : [result.text];
  const totalPages = result.totalPages || rawTexts.length;

  for (let i = 0; i < rawTexts.length; i++) {
    pages.push({
      pageNumber: i + 1,
      rawText: rawTexts[i] || '',
    });
  }

  const totalCharacters = pages.reduce((acc, p) => acc + p.rawText.trim().length, 0);
  const avgCharsPerPage = totalPages > 0 ? totalCharacters / totalPages : 0;
  const emptyPagesCount = pages.filter((p) => p.rawText.trim().length < 20).length;
  const emptyRatio = totalPages > 0 ? emptyPagesCount / totalPages : 0;

  let ocrStatus: OcrDetectionStatus = 'TEXT_EXTRACTED';
  let ocrConfidence = 1.0;

  // OCR detection heuristic:
  // If PDF has pages but very little selectable text, it is likely a scanned PDF.
  if (totalPages > 0 && (avgCharsPerPage < 50 || emptyRatio >= 0.8)) {
    ocrStatus = 'OCR_REQUIRED';
    ocrConfidence = Math.max(0.0, avgCharsPerPage / 500);
    warnings.push(
      `PDF contains insufficient selectable text (avg ${Math.round(avgCharsPerPage)} chars/page, ${emptyPagesCount}/${totalPages} sparse pages). Scanned pages detected: marked as OCR_REQUIRED.`
    );
  }

  return {
    format: 'PDF',
    pages,
    totalCharacters,
    extractedAt: new Date().toISOString(),
    ocrStatus,
    ocrConfidence,
    warnings,
  };
}
