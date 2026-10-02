/**
 * Ask Ambedkar — Ingestion Pipeline: Text Normalizer & Header/Footer Detection
 * 
 * Strict Data Integrity Principles:
 * 1. The original raw text is NEVER mutated or destroyed.
 * 2. Normalization only produces a secondary `normalizedText` representation for search/indexing.
 * 3. Never paraphrase, summarize, modernize spelling, or alter historical language.
 * 4. Header/footer removal is conservative; if uncertain, text is preserved and a warning is logged.
 */

import { ExtractedPage } from './types';

export interface NormalizationResult {
  pages: NormalizedPage[];
  warnings: string[];
}

export interface NormalizedPage {
  pageNumber: number;
  rawText: string;
  normalizedText: string;
  detectedHeader?: string;
  detectedFooter?: string;
}

/**
 * Normalizes text deterministically:
 * - Converts \r\n to \n
 * - Reconnects hyphenated line-wrapped words (e.g., "demo-\ncracy" -> "democracy")
 * - Collapses redundant horizontal spacing (tabs/spaces) without deleting paragraph line breaks
 * - Normalizes excessive consecutive newlines to \n\n
 */
export function normalizeTextContent(raw: string): string {
  if (!raw) return '';

  return raw
    // 1. Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 2. Safely reconnect line-break hyphenated words: lower-hyphen-newline-lower
    // Example: "con-\nstitution" -> "constitution"
    .replace(/([a-z])-(\n|\r\n)([a-z])/g, '$1$3')
    // 3. Collapse redundant horizontal spaces (spaces and tabs)
    .replace(/[ \t]+/g, ' ')
    // 4. Collapse 3+ newlines to standard double newline (paragraph boundary)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detects repeated running headers and footers across pages conservatively.
 */
export function detectRunningHeadersAndFooters(pages: ExtractedPage[]): {
  pages: NormalizedPage[];
  warnings: string[];
} {
  const warnings: string[] = [];

  if (pages.length < 3) {
    // Too few pages for reliable pattern frequency detection; preserve verbatim
    const normalizedPages = pages.map((p) => ({
      pageNumber: p.pageNumber,
      rawText: p.rawText,
      normalizedText: normalizeTextContent(p.rawText),
      detectedHeader: p.detectedHeader,
      detectedFooter: p.detectedFooter,
    }));
    return { pages: normalizedPages, warnings };
  }

  // Count occurrences of candidate first lines and last lines
  const topLinesCount = new Map<string, number>();
  const bottomLinesCount = new Map<string, number>();

  for (const page of pages) {
    const lines = page.rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      const firstLine = lines[0];
      // Only consider if short enough to be a header (< 100 chars)
      if (firstLine.length < 100 && !/^\d+\.$/.test(firstLine)) {
        topLinesCount.set(firstLine, (topLinesCount.get(firstLine) || 0) + 1);
      }

      const lastLine = lines[lines.length - 1];
      if (lastLine.length < 100) {
        bottomLinesCount.set(lastLine, (bottomLinesCount.get(lastLine) || 0) + 1);
      }
    }
  }

  // Threshold: appears on >= 60% of pages
  const threshold = Math.ceil(pages.length * 0.6);
  const repeatedHeaders = new Set<string>();
  const repeatedFooters = new Set<string>();

  for (const [line, count] of topLinesCount.entries()) {
    if (count >= threshold) {
      repeatedHeaders.add(line);
      warnings.push(`Detected repeated running header: "${line}" (frequency: ${count}/${pages.length})`);
    }
  }

  for (const [line, count] of bottomLinesCount.entries()) {
    if (count >= threshold) {
      repeatedFooters.add(line);
      warnings.push(`Detected repeated running footer: "${line}" (frequency: ${count}/${pages.length})`);
    }
  }

  const normalizedPages: NormalizedPage[] = pages.map((page) => {
    const raw = page.rawText;
    let detectedHeader = page.detectedHeader;
    let detectedFooter = page.detectedFooter;

    const lines = raw.split('\n');

    // Filter repeated header from normalized text if confidently detected
    if (lines.length > 0 && repeatedHeaders.has(lines[0].trim())) {
      detectedHeader = lines[0].trim();
      lines.shift();
    }

    // Filter repeated footer from normalized text if confidently detected
    if (lines.length > 0 && repeatedFooters.has(lines[lines.length - 1].trim())) {
      detectedFooter = lines[lines.length - 1].trim();
      lines.pop();
    }

    const filteredText = lines.join('\n');
    const normalizedText = normalizeTextContent(filteredText);

    return {
      pageNumber: page.pageNumber,
      rawText: raw, // Verbatim original is untouched
      normalizedText,
      detectedHeader,
      detectedFooter,
    };
  });

  return {
    pages: normalizedPages,
    warnings,
  };
}
