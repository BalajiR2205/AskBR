/**
 * Ask Ambedkar — Ingestion Pipeline: Unified Extractor Dispatcher
 */

import * as fs from 'fs';
import { ExtractedDocument, SupportedFormat } from '../types';
import { extractTxt } from './txt-extractor';
import { extractMarkdown } from './markdown-extractor';
import { extractJson } from './json-extractor';
import { extractPdf } from './pdf-extractor';

export * from './txt-extractor';
export * from './markdown-extractor';
export * from './json-extractor';
export * from './pdf-extractor';

/**
 * Extracts content page-by-page based on format type.
 */
export async function extractDocument(
  filePath: string,
  buffer: Buffer,
  format: SupportedFormat
): Promise<ExtractedDocument> {
  switch (format) {
    case 'PDF':
      return await extractPdf(buffer);

    case 'TXT': {
      const text = buffer.toString('utf-8');
      return extractTxt(text);
    }

    case 'MARKDOWN': {
      const text = buffer.toString('utf-8');
      return extractMarkdown(text);
    }

    case 'JSON': {
      const text = buffer.toString('utf-8');
      return extractJson(text);
    }

    default:
      throw new Error(`Unsupported extraction format: ${format}`);
  }
}

/**
 * Reads a file from disk and extracts its document pages.
 */
export async function extractFileFromPath(
  filePath: string,
  format: SupportedFormat
): Promise<ExtractedDocument> {
  const buffer = await fs.promises.readFile(filePath);
  return extractDocument(filePath, buffer, format);
}
