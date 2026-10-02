/**
 * Ask Ambedkar — Ingestion Pipeline: Format Detection
 * 
 * Safely identifies file format using file extension and magic byte / content analysis.
 */

import * as path from 'path';
import { SupportedFormat } from './types';

/**
 * Detects the input format from file path and optional buffer inspection.
 */
export function detectFormat(filePath: string, buffer?: Buffer): SupportedFormat | 'UNKNOWN' {
  const ext = path.extname(filePath).toLowerCase();

  // 1. Check by file extension
  if (ext === '.pdf') {
    return 'PDF';
  }
  if (ext === '.txt') {
    return 'TXT';
  }
  if (ext === '.md' || ext === '.markdown') {
    return 'MARKDOWN';
  }
  if (ext === '.json') {
    return 'JSON';
  }

  // 2. Fall back to buffer analysis if buffer is supplied
  if (buffer && buffer.length > 0) {
    // Check PDF magic bytes '%PDF-'
    if (buffer.length >= 5 && buffer.toString('utf-8', 0, 5) === '%PDF-') {
      return 'PDF';
    }

    // Try parsing as JSON
    const textSample = buffer.toString('utf-8', 0, Math.min(buffer.length, 2048)).trim();
    if ((textSample.startsWith('{') && textSample.endsWith('}')) || (textSample.startsWith('[') && textSample.endsWith(']'))) {
      try {
        JSON.parse(buffer.toString('utf-8'));
        return 'JSON';
      } catch {
        // Not valid JSON, continue checking
      }
    }

    // Check for Markdown patterns
    if (/^#{1,6}\s+.+/m.test(textSample) || /^[-*]\s+.+/m.test(textSample)) {
      return 'MARKDOWN';
    }

    // Check if valid text (no non-printable control characters except \r, \n, \t, \f)
    const isText = !/[\x00-\x08\x0B\x0E-\x1F]/.test(textSample);
    if (isText) {
      return 'TXT';
    }
  }

  return 'UNKNOWN';
}
