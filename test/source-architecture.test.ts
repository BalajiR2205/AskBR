/**
 * Ask Ambedkar — Segment 3 Primary Source Architecture Test Suite
 * 
 * Verifies:
 * 1. Canonical Source Validation (BOOK, SPEECH, CAD, LETTER, etc.)
 * 2. Strict Primary Source Classification (Attribution Invariants)
 * 3. Edition & Document Section Models
 * 4. Passage Validation & Immutable Original Text
 * 5. Translation Distinction & Provenance Traceability
 * 6. Repository Layer (CRUD, In-Memory Storage, Filtering)
 * 7. Future Retrieval & Evidence Contracts
 * 8. Existing Chat UI Mock Data Integrity
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateSource,
  validateEdition,
  validateSection,
  InMemorySourceRepository,
  InMemoryEditionRepository,
  InMemorySectionRepository,
  FIXTURE_SOURCES,
  FIXTURE_EDITIONS,
  FIXTURE_SECTIONS,
  FIXTURE_PASSAGES,
  Source,
} from '../src/core/sources';

import {
  validatePassage,
  InMemoryPassageRepository,
  Passage,
} from '../src/core/passages';

import { buildProvenance, formatCitation } from '../src/core/provenance';
import { SearchQuery } from '../src/core/retrieval';
import { EvidencePackage } from '../src/core/evidence';
import { getMockChatResponse, MOCK_EVIDENCE_STORE } from '../src/mock/chatData';

describe('1. Source Validation & Attribution Rules', () => {
  it('should validate all structural fixture sources successfully', () => {
    for (const fixture of FIXTURE_SOURCES) {
      const result = validateSource(fixture);
      assert.equal(
        result.isValid,
        true,
        `Fixture "${fixture.id}" should be valid, but got: ${result.errors.join(', ')}`
      );
    }
  });

  it('should reject a source with a missing or empty title', () => {
    const invalid = { ...FIXTURE_SOURCES[0], title: '' };
    const result = validateSource(invalid);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('non-empty title')));
  });

  it('should reject a source with an invalid source type', () => {
    const invalid = { ...FIXTURE_SOURCES[0], sourceType: 'BLOG_POST' as unknown as Source['sourceType'] };
    const result = validateSource(invalid);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid source category')));
  });

  it('should reject a PRIMARY source if author is not Dr. B. R. Ambedkar', () => {
    const invalid: Source = {
      ...FIXTURE_SOURCES[0],
      id: 'src_sec_commentary_001',
      classification: 'PRIMARY',
      attribution: {
        role: 'AUTHOR',
        name: 'Third Party Historian',
      },
    };
    const result = validateSource(invalid);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('PRIMARY source attribution must be Dr. B. R. Ambedkar')));
  });

  it('should allow SECONDARY source with non-Ambedkar author for future cataloguing', () => {
    const secondarySource: Source = {
      ...FIXTURE_SOURCES[0],
      id: 'src_sec_academic_001',
      classification: 'SECONDARY',
      attribution: {
        role: 'AUTHOR',
        name: 'Eleanor Zelliot',
      },
    };
    const result = validateSource(secondarySource);
    assert.equal(result.isValid, true);
  });

  it('should reject a LETTER source if recipient is missing', () => {
    const invalidLetter: Partial<Source> = {
      id: 'src_let_invalid_001',
      title: 'Letter without recipient',
      sourceType: 'LETTER',
      classification: 'PRIMARY',
      status: 'VERIFIED',
      originalLanguage: 'en',
      sourceReference: 'Ref 1',
      attribution: {
        role: 'CORRESPONDENT',
        name: 'Dr. B. R. Ambedkar',
      },
      categoryMetadata: {},
    };
    const result = validateSource(invalidLetter);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('LETTER source must specify a recipient')));
  });

  it('should reject a BOOK source missing year, date, and publisher', () => {
    const invalidBook: Partial<Source> = {
      id: 'src_book_invalid_001',
      title: 'Book without year or publisher',
      sourceType: 'BOOK',
      classification: 'PRIMARY',
      status: 'DRAFT',
      originalLanguage: 'en',
      sourceReference: 'Ref 1',
      attribution: {
        role: 'AUTHOR',
        name: 'Dr. B. R. Ambedkar',
      },
      categoryMetadata: {},
    };
    const result = validateSource(invalidBook);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('requires at least one of: year, date, or publisher')));
  });
});

describe('2. Editions & Document Section Hierarchies', () => {
  it('should validate all structural fixture editions', () => {
    for (const edn of FIXTURE_EDITIONS) {
      const res = validateEdition(edn);
      assert.equal(res.isValid, true, `Edition "${edn.id}" failed: ${res.errors.join('; ')}`);
    }
  });

  it('should reject an edition with an invalid year', () => {
    const invalid = { ...FIXTURE_EDITIONS[0], year: 1750 };
    const res = validateEdition(invalid);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('valid 4-digit year')));
  });

  it('should validate all structural document sections', () => {
    for (const sec of FIXTURE_SECTIONS) {
      const res = validateSection(sec);
      assert.equal(res.isValid, true, `Section "${sec.id}" failed: ${res.errors.join('; ')}`);
    }
  });
});

describe('3. Passage Entity & Data Integrity Principles', () => {
  it('should validate all structural fixture passages', () => {
    for (const psg of FIXTURE_PASSAGES) {
      const res = validatePassage(psg);
      assert.equal(res.isValid, true, `Passage "${psg.id}" failed: ${res.errors.join('; ')}`);
    }
  });

  it('Rule 1: should reject a passage with missing or empty originalText', () => {
    const invalid = { ...FIXTURE_PASSAGES[0], originalText: '   ' };
    const res = validatePassage(invalid);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('non-empty originalText')));
  });

  it('Rule 3: should enforce translation distinction and require originalPassageId for translations', () => {
    // Valid translated passage
    const translatedPassage = FIXTURE_PASSAGES[1];
    assert.equal(translatedPassage.translationMetadata.isOriginal, false);
    assert.equal(translatedPassage.translationMetadata.translationType, 'PUBLISHED_TRANSLATION');
    assert.equal(translatedPassage.translationMetadata.originalPassageId, 'psg_aoc_14_01');

    // Invalid: translated passage marked isOriginal: true
    const invalid: Passage = {
      ...translatedPassage,
      translationMetadata: {
        isOriginal: true,
        translationType: 'PUBLISHED_TRANSLATION',
      },
    };
    const res = validatePassage(invalid);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('must have translationType: "ORIGINAL"')));
  });

  it('Rule 8: should verify stable ID structure for passages', () => {
    const psg = FIXTURE_PASSAGES[0];
    assert.ok(psg.id.startsWith('psg_'));
    assert.notEqual(psg.id, psg.originalText);
  });
});

describe('4. Provenance & Citation Formatter', () => {
  it('should build a comprehensive ProvenanceRecord linking passage, source, and edition', () => {
    const passage = FIXTURE_PASSAGES[0];
    const source = FIXTURE_SOURCES[0];
    const edition = FIXTURE_EDITIONS[1];
    const section = FIXTURE_SECTIONS[0];

    const provenance = buildProvenance(passage, source, edition, section);

    assert.equal(provenance.sourceId, 'src_book_aoc_1936');
    assert.equal(provenance.sourceTitle, 'Annihilation of Caste');
    assert.equal(provenance.author, 'Dr. B. R. Ambedkar');
    assert.equal(provenance.editionName, 'BAWS Vol. 1 Edition');
    assert.equal(provenance.year, 1979);
    assert.equal(provenance.pageRange, 'p. 57');
    assert.equal(provenance.isTranslation, false);
    assert.equal(provenance.verbatimText, passage.originalText);
  });

  it('should format a clean academic citation from provenance', () => {
    const passage = FIXTURE_PASSAGES[0];
    const source = FIXTURE_SOURCES[0];
    const edition = FIXTURE_EDITIONS[1];
    const section = FIXTURE_SECTIONS[0];

    const provenance = buildProvenance(passage, source, edition, section);
    const citation = formatCitation(provenance);

    assert.ok(citation.includes('Dr. B. R. Ambedkar'));
    assert.ok(citation.includes('*Annihilation of Caste* (1979)'));
    assert.ok(citation.includes('p. 57'));
    assert.ok(citation.includes('Ref: Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS)'));
  });
});

describe('5. Repository Layer (Storage-Independent Abstraction)', () => {
  it('should support CRUD and filtering on InMemorySourceRepository', async () => {
    const repo = new InMemorySourceRepository(FIXTURE_SOURCES);

    // Find by ID
    const book = await repo.findById('src_book_aoc_1936');
    assert.ok(book !== null);
    assert.equal(book.title, 'Annihilation of Caste');

    // Filter by PRIMARY
    const primarySources = await repo.findMany({ classification: 'PRIMARY' });
    assert.equal(primarySources.length, FIXTURE_SOURCES.length);

    // Filter by source category
    const speeches = await repo.findMany({ sourceTypes: ['SPEECH'] });
    assert.equal(speeches.length, 1);
    assert.equal(speeches[0].id, 'src_speech_nagpur_1942');

    // Count
    const count = await repo.count();
    assert.equal(count, FIXTURE_SOURCES.length);

    // Prevent duplicate ID creation
    await assert.rejects(async () => {
      await repo.create(FIXTURE_SOURCES[0]);
    });
  });

  it('should support CRUD on InMemoryPassageRepository and enforce originalText immutability', async () => {
    const repo = new InMemoryPassageRepository(FIXTURE_PASSAGES);

    // Find by sourceId
    const passages = await repo.findBySourceId('src_book_aoc_1936');
    assert.equal(passages.length, 2);

    // Filter by original vs translation
    const originals = await repo.findMany({ isOriginal: true });
    assert.equal(originals.length, 1);
    assert.equal(originals[0].id, 'psg_aoc_14_01');

    // Prevent updating originalText to empty string
    await assert.rejects(async () => {
      await repo.update('psg_aoc_14_01', { originalText: '   ' });
    }, /Original text is immutable/);
  });

  it('should support Edition and Section repository lookups', async () => {
    const ednRepo = new InMemoryEditionRepository(FIXTURE_EDITIONS);
    const secRepo = new InMemorySectionRepository(FIXTURE_SECTIONS);

    const editions = await ednRepo.findBySourceId('src_book_aoc_1936');
    assert.equal(editions.length, 2);

    const sections = await secRepo.findBySourceId('src_book_aoc_1936');
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, 'Chapter XIV: The Ideal Society Based on Liberty, Equality, and Fraternity');
  });
});

describe('6. Future Retrieval & Evidence Contracts', () => {
  it('should construct a valid SearchQuery enforcing PRIMARY classification filter', () => {
    const query: SearchQuery = {
      query: 'What did Ambedkar write regarding democracy and social equality?',
      language: 'en',
      filters: {
        classifications: ['PRIMARY'],
        sourceTypes: ['BOOK', 'CONSTITUENT_ASSEMBLY'],
        statuses: ['VERIFIED', 'PUBLISHED'],
      },
      topK: 5,
    };

    assert.equal(query.topK, 5);
    assert.deepEqual(query.filters?.classifications, ['PRIMARY']);
  });

  it('should construct a valid EvidencePackage for answer synthesis', () => {
    const passage = FIXTURE_PASSAGES[0];
    const source = FIXTURE_SOURCES[0];
    const edition = FIXTURE_EDITIONS[1];
    const section = FIXTURE_SECTIONS[0];
    const provenance = buildProvenance(passage, source, edition, section);

    const evidencePackage: EvidencePackage = {
      query: 'democracy',
      category: 'directly_documented',
      hasSufficientEvidence: true,
      confidenceScore: 0.95,
      evidenceItems: [
        {
          passage,
          source,
          provenance,
          citation: formatCitation(provenance),
          relevanceScore: 0.95,
          verbatimExcerpt: passage.originalText,
        },
      ],
    };

    assert.equal(evidencePackage.hasSufficientEvidence, true);
    assert.equal(evidencePackage.evidenceItems.length, 1);
    assert.equal(evidencePackage.evidenceItems[0].passage.id, 'psg_aoc_14_01');
  });
});

describe('7. Existing Chat UI Mock Data Integrity (Segment 2 Compatibility)', () => {
  it('should preserve all mock evidence entries with authentic citations', () => {
    const keys = Object.keys(MOCK_EVIDENCE_STORE);
    assert.ok(keys.includes('ev-aoc-democracy'));
    assert.ok(keys.includes('ev-cad-social-democracy'));
    assert.ok(keys.includes('ev-aoc-division-labour'));
    assert.ok(keys.includes('ev-cad-const-morality'));
    assert.ok(keys.includes('ev-speech-nagpur-education'));

    for (const key of keys) {
      const item = MOCK_EVIDENCE_STORE[key];
      assert.ok(item.workTitle.length > 0);
      assert.equal(item.metadata.author, 'Dr. B. R. Ambedkar');
      assert.ok(item.verbatimPassage.length > 0);
    }
  });

  it('should return valid simulated responses for predefined queries', async () => {
    const resDemocracy = await getMockChatResponse('What did Ambedkar say about democracy?');
    assert.equal(resDemocracy.status, 'sufficient_evidence');
    assert.ok(resDemocracy.sources.length >= 2);

    const resAI = await getMockChatResponse('What did Ambedkar think about artificial intelligence?');
    assert.equal(resAI.status, 'insufficient_evidence');
    assert.ok(resAI.answer.includes('does not speculate'));
  });
});
