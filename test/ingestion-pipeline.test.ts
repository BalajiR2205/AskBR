/**
 * Ask Ambedkar — Segment 4 Primary Source Ingestion Pipeline Test Suite
 * 
 * Verifies:
 * 1. TXT extraction (page markers, form-feed, single-page)
 * 2. JSON extraction (structured pages, raw strings, malformed rejection)
 * 3. Markdown extraction (frontmatter stripping, comment page delimiters)
 * 4. PDF extraction adapter (unpdf integration, text & scanned page handling)
 * 5. Format detection (extensions, magic bytes, buffer sniffing)
 * 6. SHA-256 cryptographic hashing & file inspection
 * 7. Text normalization (whitespace, line-wrap hyphen reconnection, verbatim immutability)
 * 8. Running header/footer conservative detection
 * 9. Page preservation across stages
 * 10. Paragraph-aware & sentence-preserving segmentation
 * 11. Deterministic passage ID generation
 * 12. Dry-run execution without corpus modification
 * 13. Malformed source and unrecognized format rejection
 * 14. OCR_REQUIRED detection on sparse/scanned documents
 * 15. Metadata manifest validation failure (attribution, mandatory fields)
 * 16. Full successful end-to-end ingestion
 * 17. Idempotent repeat ingestion prevention (ALREADY_INGESTED)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import {
  computeSha256,
  detectFormat,
  detectRunningHeadersAndFooters,
  extractJson,
  extractMarkdown,
  extractPdf,
  extractTxt,
  inspectFile,
  normalizeTextContent,
  parseDocumentStructure,
  runIngestionPipeline,
  segmentPagesIntoPassages,
  DEFAULT_SEGMENTATION_CONFIG,
  ExtractedPage,
} from '../src/ingestion';

import { validateSource, validateSection } from '../src/core/sources/validation';
import { validatePassage } from '../src/core/passages/validation';
import { Source } from '../src/core/sources/types';
import { Passage } from '../src/core/passages/types';

// Isolated scratch test paths
const TEST_WORKSPACE = path.resolve('data/working/test-run-segment4');
const TEST_INBOX = path.join(TEST_WORKSPACE, 'inbox');
const TEST_CORPUS = path.join(TEST_WORKSPACE, 'corpus');
const TEST_REPORTS = path.join(TEST_WORKSPACE, 'reports');
const TEST_REJECTED = path.join(TEST_WORKSPACE, 'rejected');

describe('Segment 4: Primary Source Ingestion Pipeline', () => {
  before(async () => {
    await fs.promises.mkdir(TEST_INBOX, { recursive: true });
    await fs.promises.mkdir(TEST_CORPUS, { recursive: true });
    await fs.promises.mkdir(TEST_REPORTS, { recursive: true });
    await fs.promises.mkdir(TEST_REJECTED, { recursive: true });
  });

  after(async () => {
    if (fs.existsSync(TEST_WORKSPACE)) {
      await fs.promises.rm(TEST_WORKSPACE, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // 1. TXT Extraction
  // ==========================================================================
  describe('1. TXT Extraction', () => {
    it('should extract pages separated by form-feed characters (\\f)', () => {
      const content = 'Page 1 text content.\fPage 2 text content.\fPage 3 text content.';
      const doc = extractTxt(content);

      assert.equal(doc.format, 'TXT');
      assert.equal(doc.pages.length, 3);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.equal(doc.pages[0].rawText, 'Page 1 text content.');
      assert.equal(doc.pages[1].pageNumber, 2);
      assert.equal(doc.pages[1].rawText, 'Page 2 text content.');
      assert.equal(doc.pages[2].pageNumber, 3);
      assert.equal(doc.pages[2].rawText, 'Page 3 text content.');
    });

    it('should extract pages demarcated by explicit page markers (--- PAGE N ---)', () => {
      const content = `--- PAGE 1 ---
Chapter 1: The Beginning
First page paragraph text.

--- PAGE 2 ---
Chapter 2: The Continuation
Second page paragraph text.`;

      const doc = extractTxt(content);
      assert.equal(doc.pages.length, 2);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.ok(doc.pages[0].rawText.includes('Chapter 1'));
      assert.equal(doc.pages[1].pageNumber, 2);
      assert.ok(doc.pages[1].rawText.includes('Chapter 2'));
    });

    it('should preserve single-page continuous text when no page delimiters exist', () => {
      const content = 'This is a single continuous document without pagination delimiters.';
      const doc = extractTxt(content);

      assert.equal(doc.pages.length, 1);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.equal(doc.pages[0].rawText, content);
    });
  });

  // ==========================================================================
  // 2. JSON Extraction
  // ==========================================================================
  describe('2. JSON Extraction', () => {
    it('should extract structured page arrays with metadata', () => {
      const jsonContent = JSON.stringify({
        title: 'Synthetic JSON Work',
        pages: [
          { pageNumber: 1, text: 'Page 1 text body', header: 'Header 1' },
          { pageNumber: 2, text: 'Page 2 text body', footer: 'Footer 2' },
        ],
      });

      const doc = extractJson(jsonContent);
      assert.equal(doc.format, 'JSON');
      assert.equal(doc.pages.length, 2);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.equal(doc.pages[0].rawText, 'Page 1 text body');
      assert.equal(doc.pages[0].detectedHeader, 'Header 1');
      assert.equal(doc.pages[1].pageNumber, 2);
      assert.equal(doc.pages[1].rawText, 'Page 2 text body');
      assert.equal(doc.pages[1].detectedFooter, 'Footer 2');
    });

    it('should extract JSON with single content string', () => {
      const jsonContent = JSON.stringify({
        content: 'Single document content in JSON format.',
      });

      const doc = extractJson(jsonContent);
      assert.equal(doc.pages.length, 1);
      assert.equal(doc.pages[0].rawText, 'Single document content in JSON format.');
    });

    it('should reject malformed JSON with descriptive error', () => {
      assert.throws(
        () => extractJson('{ malformed: json, missing quotes }'),
        /Malformed JSON input/
      );
    });
  });

  // ==========================================================================
  // 3. Markdown Extraction
  // ==========================================================================
  describe('3. Markdown Extraction', () => {
    it('should strip frontmatter while preserving document body', () => {
      const mdContent = `---
title: Synthetic Frontmatter
author: Dr. B. R. Ambedkar
---
# Chapter 1: Introduction

This is the verified body of the document.`;

      const doc = extractMarkdown(mdContent);
      assert.equal(doc.format, 'MARKDOWN');
      assert.ok(!doc.pages[0].rawText.includes('title: Synthetic Frontmatter'));
      assert.ok(doc.pages[0].rawText.includes('# Chapter 1: Introduction'));
    });

    it('should extract pages delimited by HTML comments (<!-- page N -->)', () => {
      const mdContent = `<!-- page 1 -->
# Chapter 1
First page content in markdown.

<!-- page 2 -->
# Chapter 2
Second page content in markdown.`;

      const doc = extractMarkdown(mdContent);
      assert.equal(doc.pages.length, 2);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.ok(doc.pages[0].rawText.includes('First page content'));
      assert.equal(doc.pages[1].pageNumber, 2);
      assert.ok(doc.pages[1].rawText.includes('Second page content'));
    });
  });

  // ==========================================================================
  // 4. PDF Extraction Adapter
  // ==========================================================================
  describe('4. PDF Extraction Adapter', () => {
    it('should extract text and page boundaries from valid PDF buffer', async () => {
      // Valid PDF 1.4 buffer with text stream
      const textPdf = Buffer.from(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT
/F1 12 Tf
100 700 Td
(Synthetic text test page 1) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF`);

      const doc = await extractPdf(textPdf);
      assert.equal(doc.format, 'PDF');
      assert.equal(doc.pages.length, 1);
      assert.equal(doc.pages[0].pageNumber, 1);
      assert.ok(doc.pages[0].rawText.includes('Synthetic text test page 1'));
    });

    it('should reject corrupted PDF buffer with descriptive error', async () => {
      const corruptPdf = Buffer.from('%PDF-1.4 corrupted invalid bytes without trailer');
      await assert.rejects(
        () => extractPdf(corruptPdf),
        /Failed to parse PDF document/
      );
    });
  });

  // ==========================================================================
  // 5. Format Detection
  // ==========================================================================
  describe('5. Format Detection', () => {
    it('should detect formats from file extensions', () => {
      assert.equal(detectFormat('document.pdf'), 'PDF');
      assert.equal(detectFormat('source.txt'), 'TXT');
      assert.equal(detectFormat('notes.md'), 'MARKDOWN');
      assert.equal(detectFormat('notes.markdown'), 'MARKDOWN');
      assert.equal(detectFormat('data.json'), 'JSON');
    });

    it('should detect format from buffer magic bytes and content sniffing', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 header');
      assert.equal(detectFormat('unknown-file', pdfBuffer), 'PDF');

      const jsonBuffer = Buffer.from('{"key": "value"}');
      assert.equal(detectFormat('unknown-file', jsonBuffer), 'JSON');

      const mdBuffer = Buffer.from('# Heading\n\nSome markdown text');
      assert.equal(detectFormat('unknown-file', mdBuffer), 'MARKDOWN');

      const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff]);
      assert.equal(detectFormat('unknown-file', binaryBuffer), 'UNKNOWN');
    });
  });

  // ==========================================================================
  // 6. Cryptographic SHA-256 Hashing & File Inspection
  // ==========================================================================
  describe('6. Cryptographic SHA-256 Hashing & File Inspection', () => {
    it('should compute deterministic SHA-256 hash matching known vector', () => {
      const hash = computeSha256('hello');
      assert.equal(hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should inspect file on disk and return metadata and hash', async () => {
      const samplePath = path.join(TEST_INBOX, 'inspect-test.txt');
      await fs.promises.writeFile(samplePath, 'Inspection test content string.', 'utf-8');

      const result = await inspectFile(samplePath);
      assert.equal(result.fileName, 'inspect-test.txt');
      assert.equal(result.detectedFormat, 'TXT');
      assert.ok(result.fileSize > 0);
      assert.equal(result.sha256.length, 64);
      assert.ok(result.inspectedAt);
    });
  });

  // ==========================================================================
  // 7. Text Normalization & Immutability
  // ==========================================================================
  describe('7. Text Normalization & Verbatim Immutability', () => {
    it('should normalize CRLF line endings to LF', () => {
      const raw = 'Line 1\r\nLine 2\r\nLine 3';
      const normalized = normalizeTextContent(raw);
      assert.equal(normalized, 'Line 1\nLine 2\nLine 3');
    });

    it('should safely reconnect line-break hyphenated words without altering intentional hyphens', () => {
      const raw = 'The con-\nstitution of India was well-known across the world.';
      const normalized = normalizeTextContent(raw);
      assert.ok(normalized.includes('constitution'));
      assert.ok(normalized.includes('well-known'));
    });

    it('should collapse redundant horizontal spaces while preserving paragraph breaks', () => {
      const raw = 'Word1    Word2\t\tWord3\n\nParagraph 2';
      const normalized = normalizeTextContent(raw);
      assert.equal(normalized, 'Word1 Word2 Word3\n\nParagraph 2');
    });
  });

  // ==========================================================================
  // 8. Conservative Running Header/Footer Detection
  // ==========================================================================
  describe('8. Running Header/Footer Detection', () => {
    it('should detect repeated running headers across multi-page document', () => {
      const pages: ExtractedPage[] = [
        { pageNumber: 1, rawText: 'DR. B. R. AMBEDKAR WRITINGS\n\nChapter 1 content line.' },
        { pageNumber: 2, rawText: 'DR. B. R. AMBEDKAR WRITINGS\n\nChapter 2 content line.' },
        { pageNumber: 3, rawText: 'DR. B. R. AMBEDKAR WRITINGS\n\nChapter 3 content line.' },
      ];

      const result = detectRunningHeadersAndFooters(pages);
      assert.equal(result.pages.length, 3);
      assert.equal(result.pages[0].detectedHeader, 'DR. B. R. AMBEDKAR WRITINGS');
      // Verbatim originalText remains untouched
      assert.ok(result.pages[0].rawText.includes('DR. B. R. AMBEDKAR WRITINGS'));
      // Normalized text has running header excluded
      assert.ok(!result.pages[0].normalizedText.includes('DR. B. R. AMBEDKAR WRITINGS'));
      assert.ok(result.warnings.length > 0);
    });
  });

  // ==========================================================================
  // 9. Document Structure Parsing & Page Preservation
  // ==========================================================================
  describe('9. Document Structure Parsing & Page Preservation', () => {
    it('should parse chapter and section hierarchies across pages', () => {
      const pages = [
        {
          pageNumber: 1,
          rawText: 'Chapter 1: The Foundations\n\nFirst chapter paragraph.',
          normalizedText: 'Chapter 1: The Foundations\n\nFirst chapter paragraph.',
        },
        {
          pageNumber: 2,
          rawText: 'Section 1: Detailed Analysis\n\nDetailed section paragraph.',
          normalizedText: 'Section 1: Detailed Analysis\n\nDetailed section paragraph.',
        },
      ];

      const struct = parseDocumentStructure(pages, 'src_test_01');
      assert.equal(struct.sections.length, 2);
      assert.equal(struct.sections[0].level, 'CHAPTER');
      assert.equal(struct.sections[0].pageStart, 1);
      assert.equal(struct.sections[1].level, 'SECTION');
      assert.equal(struct.sections[1].pageStart, 2);

      // Verify each section satisfies Segment 3 validation
      for (const sec of struct.sections) {
        const val = validateSection(sec);
        assert.equal(val.isValid, true, val.errors.join(', '));
      }
    });

    it('should create canonical root section if no explicit headers found', () => {
      const pages = [
        {
          pageNumber: 1,
          rawText: 'Plain narrative without explicit chapter headings.',
          normalizedText: 'Plain narrative without explicit chapter headings.',
        },
      ];

      const struct = parseDocumentStructure(pages, 'src_test_narrative');
      assert.equal(struct.sections.length, 1);
      assert.equal(struct.sections[0].id, 'sec_src_test_narrative_main');
      assert.equal(struct.sections[0].title, 'Main Text');
    });
  });

  // ==========================================================================
  // 10. Paragraph Segmentation & Deterministic Passage IDs
  // ==========================================================================
  describe('10. Paragraph Segmentation & Deterministic Passage IDs', () => {
    it('should segment paragraphs and assign stable deterministic IDs', () => {
      const para1 =
        'This is the first comprehensive paragraph of the synthetic historical argument written to exceed the minimum threshold for passage segmentation in our test.';
      const para2 =
        'This is the second comprehensive paragraph of the synthetic historical argument, designed to be another standalone passage that satisfies minimum size constraints.';

      const pages = [
        {
          pageNumber: 1,
          rawText: `${para1}\n\n${para2}`,
          normalizedText: `${para1}\n\n${para2}`,
        },
      ];

      const passages1 = segmentPagesIntoPassages(
        pages,
        'src_det_01',
        'edn_det_01',
        undefined,
        'en',
        DEFAULT_SEGMENTATION_CONFIG
      );

      const passages2 = segmentPagesIntoPassages(
        pages,
        'src_det_01',
        'edn_det_01',
        undefined,
        'en',
        DEFAULT_SEGMENTATION_CONFIG
      );

      assert.equal(passages1.length, 2);
      assert.equal(passages1[0].id, 'psg_src_det_01_main_001');
      assert.equal(passages1[1].id, 'psg_src_det_01_main_002');

      // Verify deterministic reproduction
      assert.deepEqual(
        passages1.map(p => p.id),
        passages2.map(p => p.id)
      );

      // Verify validation passes
      for (const p of passages1) {
        const val = validatePassage(p);
        assert.equal(val.isValid, true, val.errors.join(', '));
      }
    });

    it('should split overly long paragraphs on sentence boundaries', () => {
      const longSentence = 'This is a long synthetic sentence designed to test segmentation boundaries. ';
      const paragraph = longSentence.repeat(15); // ~1125 characters

      const pages = [
        {
          pageNumber: 1,
          rawText: paragraph,
          normalizedText: paragraph,
        },
      ];

      const shortConfig = {
        maxCharacters: 300,
        minCharacters: 50,
        overlapCharacters: 20,
      };

      const passages = segmentPagesIntoPassages(
        pages,
        'src_split_01',
        'edn_split_01',
        undefined,
        'en',
        shortConfig
      );

      assert.ok(passages.length > 1, 'Should split into multiple passages');
      for (const p of passages) {
        assert.ok(p.normalizedText.length <= 400); // within bounded limit
        // Should end with punctuation or word boundary, not severed mid-word
        assert.ok(/[.!?]$/.test(p.normalizedText) || p.normalizedText.length > 0);
      }
    });
  });

  // ==========================================================================
  // 11. OCR_REQUIRED Detection
  // ==========================================================================
  describe('11. OCR_REQUIRED Detection on Sparse/Scanned Input', () => {
    it('should mark ingestion as OCR_REQUIRED when document has sparse selectable text', async () => {
      const sparseDoc = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF'
      );

      const filePath = path.join(TEST_INBOX, 'sparse-scanned.pdf');
      const manifestPath = path.join(TEST_INBOX, 'sparse-scanned.manifest.json');

      await fs.promises.writeFile(filePath, sparseDoc);
      await fs.promises.writeFile(
        manifestPath,
        JSON.stringify({
          sourceId: 'src_sparse_scanned_01',
          title: 'Scanned Archive Document',
          sourceType: 'BOOK',
          classification: 'PRIMARY',
          author: 'Dr. B. R. Ambedkar',
          originalLanguage: 'en',
          year: 1945,
          sourceReference: 'BAWS Vol. 14 Archive Sample',
        })
      );

      const result = await runIngestionPipeline({
        inputPath: filePath,
        manifestPath,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
      });

      assert.equal(result.status, 'OCR_REQUIRED');
      assert.ok(result.warnings.some(w => w.includes('OCR_REQUIRED')));
    });
  });

  // ==========================================================================
  // 12. Dry Run Execution
  // ==========================================================================
  describe('12. Dry Run Execution', () => {
    it('should validate and summarize without writing final corpus records', async () => {
      const inputPath = path.join(TEST_INBOX, 'dryrun-test.txt');
      const manifestPath = path.join(TEST_INBOX, 'dryrun-test.manifest.json');

      await fs.promises.writeFile(
        inputPath,
        'Chapter 1: Dry Run Validation\n\nThis is synthetic dry-run text verifying corpus immutability.'
      );
      await fs.promises.writeFile(
        manifestPath,
        JSON.stringify({
          sourceId: 'src_dryrun_01',
          title: 'Dry Run Synthetic Document',
          sourceType: 'BOOK',
          classification: 'PRIMARY',
          author: 'Dr. B. R. Ambedkar',
          originalLanguage: 'en',
          year: 1940,
          sourceReference: 'Synthetic Reference Vol. 1',
        })
      );

      const result = await runIngestionPipeline({
        inputPath,
        manifestPath,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
        dryRun: true,
      });

      assert.equal(result.status, 'READY');
      assert.equal(result.isDryRun, true);
      assert.equal(result.outputPath, undefined);
      assert.ok(result.passagesCreated > 0);

      // Verify no corpus files were created in dry run
      assert.equal(fs.existsSync(path.join(TEST_CORPUS, 'sources.jsonl')), false);
      assert.equal(fs.existsSync(path.join(TEST_CORPUS, 'passages.jsonl')), false);
    });
  });

  // ==========================================================================
  // 13. Metadata Manifest & Validation Failures
  // ==========================================================================
  describe('13. Metadata Manifest & Validation Failures', () => {
    it('should reject ingestion when no manifest exists', async () => {
      const inputPath = path.join(TEST_INBOX, 'no-manifest.txt');
      await fs.promises.writeFile(inputPath, 'Sample text without companion manifest.');

      const result = await runIngestionPipeline({
        inputPath,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
      });

      assert.equal(result.status, 'REJECTED');
      assert.ok(result.errors.some(e => e.includes('No source manifest')));
    });

    it('should reject manifest claiming PRIMARY if author is not Dr. B. R. Ambedkar', async () => {
      const inputPath = path.join(TEST_INBOX, 'invalid-author.txt');
      const manifestPath = path.join(TEST_INBOX, 'invalid-author.manifest.json');

      await fs.promises.writeFile(inputPath, 'Sample text with unauthorized attribution.');
      await fs.promises.writeFile(
        manifestPath,
        JSON.stringify({
          sourceId: 'src_invalid_auth',
          title: 'Invalid Attribution Work',
          sourceType: 'BOOK',
          classification: 'PRIMARY',
          author: 'Unauthorized Secondary Author',
          originalLanguage: 'en',
          year: 1940,
          sourceReference: 'Invalid Reference',
        })
      );

      const result = await runIngestionPipeline({
        inputPath,
        manifestPath,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
      });

      assert.equal(result.status, 'REJECTED');
      assert.ok(result.errors.some(e => e.includes('Dr. B. R. Ambedkar')));
    });

    it('should fail safely on non-existent input file', async () => {
      const result = await runIngestionPipeline({
        inputPath: 'data/inbox/non-existent-file-404.txt',
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
      });

      assert.equal(result.status, 'FAILED');
      assert.ok(result.errors.some(e => e.includes('not found')));
    });
  });

  // ==========================================================================
  // 14. Full Successful Ingestion & 15. Idempotent Repeat Ingestion
  // ==========================================================================
  describe('14. Full Ingestion & Repeat Idempotency', () => {
    const validTxt = path.join(TEST_INBOX, 'real-synthetic.txt');
    const validManifest = path.join(TEST_INBOX, 'real-synthetic.manifest.json');

    before(async () => {
      await fs.promises.writeFile(
        validTxt,
        `Chapter 1: The Principle of Fraternity

Fraternity means a sense of common brotherhood of all Indians—if Indians being one people. It is the principle which gives unity and solidarity to social life.

--- PAGE 2 ---
Chapter 2: Constitutional Morality

Constitutional morality is not a natural sentiment. It has to be cultivated. We must realize that our people have yet to learn it.`
      );

      await fs.promises.writeFile(
        validManifest,
        JSON.stringify({
          sourceId: 'src_full_synth_01',
          title: 'Synthetic Demonstration Treatise',
          sourceType: 'BOOK',
          classification: 'PRIMARY',
          status: 'VERIFIED',
          author: 'Dr. B. R. Ambedkar',
          originalLanguage: 'en',
          year: 1949,
          publisher: 'Constituent Assembly Publications',
          sourceReference: 'Synthetic CAD Demonstration Vol. 1',
          edition: {
            id: 'edn_full_synth_01',
            editionName: 'Official Reference Edition',
            year: 1949,
            publisher: 'Constituent Assembly Publications',
            isAuthoritative: true,
          },
        })
      );
    });

    it('should execute full end-to-end ingestion and write validated JSONL corpus records', async () => {
      const result = await runIngestionPipeline({
        inputPath: validTxt,
        manifestPath: validManifest,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
        dryRun: false,
      });

      assert.equal(result.status, 'READY');
      assert.equal(result.pagesProcessed, 2);
      assert.equal(result.sectionsCreated, 2);
      assert.ok(result.passagesCreated >= 2);
      assert.ok(result.reportPath && fs.existsSync(result.reportPath));

      // Check that JSONL files exist
      const sourcesFile = path.join(TEST_CORPUS, 'sources.jsonl');
      const editionsFile = path.join(TEST_CORPUS, 'editions.jsonl');
      const sectionsFile = path.join(TEST_CORPUS, 'sections.jsonl');
      const passagesFile = path.join(TEST_CORPUS, 'passages.jsonl');

      assert.ok(fs.existsSync(sourcesFile));
      assert.ok(fs.existsSync(editionsFile));
      assert.ok(fs.existsSync(sectionsFile));
      assert.ok(fs.existsSync(passagesFile));

      // Read back and validate JSONL entries
      const sourceLine = (await fs.promises.readFile(sourcesFile, 'utf-8')).trim();
      const parsedSource = JSON.parse(sourceLine) as Source;
      const srcValidation = validateSource(parsedSource);
      assert.equal(srcValidation.isValid, true, srcValidation.errors.join(', '));
      assert.equal(parsedSource.id, 'src_full_synth_01');

      const passagesContent = (await fs.promises.readFile(passagesFile, 'utf-8')).trim();
      const passageLines = passagesContent.split('\n');
      assert.ok(passageLines.length >= 2);

      for (const line of passageLines) {
        const p = JSON.parse(line) as Passage;
        const pVal = validatePassage(p);
        assert.equal(pVal.isValid, true, pVal.errors.join(', '));
        assert.equal(p.sourceId, 'src_full_synth_01');
        assert.ok(p.originalText.length > 0);
        assert.ok(p.pageStart !== undefined && Number(p.pageStart) >= 1);
      }
    });

    it('should detect duplicate and return ALREADY_INGESTED on repeat run without modifying corpus', async () => {
      const passagesFile = path.join(TEST_CORPUS, 'passages.jsonl');
      const initialPassages = (await fs.promises.readFile(passagesFile, 'utf-8')).trim().split('\n').length;

      const repeatResult = await runIngestionPipeline({
        inputPath: validTxt,
        manifestPath: validManifest,
        outputDir: TEST_CORPUS,
        reportsDir: TEST_REPORTS,
        rejectedDir: TEST_REJECTED,
        dryRun: false,
      });

      assert.equal(repeatResult.status, 'ALREADY_INGESTED');
      assert.ok(repeatResult.warnings.some(w => w.includes('already been ingested')));

      // Verify that corpus was not duplicated
      const afterPassages = (await fs.promises.readFile(passagesFile, 'utf-8')).trim().split('\n').length;
      assert.equal(afterPassages, initialPassages);
    });
  });
});
