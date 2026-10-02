/**
 * Ask Ambedkar — Ingestion Pipeline: File Hashing & Inspection
 * 
 * Provides deterministic cryptographic SHA-256 content hashing
 * and metadata inspection for source files.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { FileInspectionResult, SupportedFormat } from './types';
import { detectFormat } from './detect';

/**
 * Computes the SHA-256 hash of a buffer or string.
 */
export function computeSha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Inspects a physical file on disk, computing its cryptographic hash,
 * file size, and detected format.
 */
export async function inspectFile(filePath: string): Promise<FileInspectionResult> {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file not found at path: ${resolvedPath}`);
  }

  const stat = await fs.promises.stat(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`Target path is not a regular file: ${resolvedPath}`);
  }

  const buffer = await fs.promises.readFile(resolvedPath);
  const sha256 = computeSha256(buffer);
  const fileName = path.basename(resolvedPath);
  const detectedFormat = detectFormat(resolvedPath, buffer);

  return {
    filePath: resolvedPath,
    fileName,
    fileSize: stat.size,
    sha256,
    detectedFormat: detectedFormat as SupportedFormat | 'UNKNOWN',
    inspectedAt: new Date().toISOString(),
  };
}
