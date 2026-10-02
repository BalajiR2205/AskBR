/**
 * Ask Ambedkar — Primary Source Architecture: Structural Test Fixtures
 * 
 * IMPORTANT:
 * These fixtures are structural tests for schemas and repository layers.
 * All test passages are explicitly tagged: [MOCK PASSAGE — NOT AN AMBEDKAR QUOTATION].
 * Authentic historical evidence is ingested in dedicated data pipelines in subsequent segments.
 */

import { DocumentSection, Edition, Source } from './types';
import { Passage } from '../passages/types';

export const FIXTURE_SOURCES: Source[] = [
  // 1. BOOK fixture
  {
    id: 'src_book_aoc_1936',
    title: 'Annihilation of Caste',
    subtitle: 'With a Reply to Mahatma Gandhi',
    attribution: {
      role: 'AUTHOR',
      name: 'Dr. B. R. Ambedkar',
    },
    sourceType: 'BOOK',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1936,
    date: '1936-05-15',
    originalLanguage: 'en',
    languagesAvailable: ['en', 'mr', 'hi'],
    publisher: 'B. R. Ambedkar / Bharat Bhushan Press',
    volume: 'Vol. 1',
    description: 'Undelivered presidential address prepared for the 1936 annual conference of the Jat-Pat-Todak Mandal of Lahore.',
    sourceReference: 'Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS), Vol. 1, Education Dept., Govt. of Maharashtra',
    copyrightOrUsage: 'Public Domain / Official Government Edition',
    categoryMetadata: {
      publisher: 'Bharat Bhushan Press',
      publicationCity: 'Bombay',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },

  // 2. SPEECH fixture
  {
    id: 'src_speech_nagpur_1942',
    title: 'Speech at the All-India Depressed Classes Conference',
    attribution: {
      role: 'SPEAKER',
      name: 'Dr. B. R. Ambedkar',
    },
    sourceType: 'SPEECH',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1942,
    date: '1942-07-20',
    originalLanguage: 'en',
    languagesAvailable: ['en', 'mr'],
    sourceReference: 'BAWS Vol. 17 (Part 3), pp. 501–515',
    categoryMetadata: {
      location: 'Nagpur',
      event: 'All-India Depressed Classes Conference (Third Session)',
      audience: 'Delegates and attendees from across India',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },

  // 3. CONSTITUENT_ASSEMBLY fixture
  {
    id: 'src_cad_1948_nov4',
    title: 'Constituent Assembly Debate: Motion to Introduce the Draft Constitution',
    attribution: {
      role: 'SPEAKER',
      name: 'Dr. B. R. Ambedkar',
    },
    sourceType: 'CONSTITUENT_ASSEMBLY',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1948,
    date: '1948-11-04',
    originalLanguage: 'en',
    languagesAvailable: ['en', 'hi'],
    volume: 'CAD Vol. VII',
    sourceReference: 'Constituent Assembly Debates (Official Report), Vol. VII, pp. 31–44',
    categoryMetadata: {
      cadVolume: 'Vol. VII',
      sessionNumber: 1,
      debateTopic: 'Motion to take Draft Constitution into consideration',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },

  // 4. LETTER fixture
  {
    id: 'src_letter_to_thakkar_1932',
    title: 'Letter to A. V. Thakkar regarding Depressed Classes Education',
    attribution: {
      role: 'CORRESPONDENT',
      name: 'Dr. B. R. Ambedkar',
      recipient: 'A. V. Thakkar (Thakkar Bapa)',
    },
    sourceType: 'LETTER',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1932,
    date: '1932-11-14',
    originalLanguage: 'en',
    languagesAvailable: ['en'],
    sourceReference: 'BAWS Vol. 17 (Part 1), pp. 112–118',
    categoryMetadata: {
      recipient: 'A. V. Thakkar',
      senderLocation: 'Bombay',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },

  // 5. ARTICLE fixture
  {
    id: 'src_art_bahishkrit_1927',
    title: 'Article on Social Equality and Temple Entry',
    attribution: {
      role: 'AUTHOR',
      name: 'Dr. B. R. Ambedkar',
    },
    sourceType: 'ARTICLE',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1927,
    date: '1927-04-03',
    originalLanguage: 'mr',
    languagesAvailable: ['mr', 'en'],
    publication: 'Bahishkrit Bharat',
    sourceReference: 'Bahishkrit Bharat, Issue 1, 3 April 1927 / BAWS Marathi Vol. 2',
    categoryMetadata: {
      periodicalName: 'Bahishkrit Bharat',
      issueNumber: 1,
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },

  // 6. EDITORIAL fixture
  {
    id: 'src_ed_mooknayak_1920',
    title: 'Inaugural Editorial of Mooknayak',
    attribution: {
      role: 'AUTHOR',
      name: 'Dr. B. R. Ambedkar',
    },
    sourceType: 'EDITORIAL',
    classification: 'PRIMARY',
    status: 'VERIFIED',
    year: 1920,
    date: '1920-01-31',
    originalLanguage: 'mr',
    languagesAvailable: ['mr', 'en'],
    publication: 'Mooknayak',
    sourceReference: 'Mooknayak, Vol. 1, No. 1, 31 January 1920',
    categoryMetadata: {
      newspaperName: 'Mooknayak',
      issueNumber: 1,
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];

export const FIXTURE_EDITIONS: Edition[] = [
  {
    id: 'edn_aoc_1st_1936',
    sourceId: 'src_book_aoc_1936',
    editionName: 'First Edition',
    editionNumber: 1,
    year: 1936,
    publisher: 'Bharat Bhushan Press',
    language: 'en',
    isAuthoritative: false,
    pageCount: 88,
    notes: 'Privately printed by Dr. Ambedkar in May 1936.',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
  {
    id: 'edn_aoc_baws_1979',
    sourceId: 'src_book_aoc_1936',
    editionName: 'BAWS Vol. 1 Edition',
    editionNumber: 4,
    year: 1979,
    publisher: 'Government of Maharashtra',
    editor: 'Vasant Moon',
    language: 'en',
    isAuthoritative: true,
    pageCount: 120,
    notes: 'Reference edition for BAWS citations.',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];

export const FIXTURE_SECTIONS: DocumentSection[] = [
  {
    id: 'sec_aoc_ch14',
    sourceId: 'src_book_aoc_1936',
    editionId: 'edn_aoc_baws_1979',
    level: 'CHAPTER',
    sequence: 14,
    title: 'Chapter XIV: The Ideal Society Based on Liberty, Equality, and Fraternity',
    sectionNumber: 'XIV',
    pageStart: 56,
    pageEnd: 60,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];

export const FIXTURE_PASSAGES: Passage[] = [
  // Original passage
  {
    id: 'psg_aoc_14_01',
    sourceId: 'src_book_aoc_1936',
    editionId: 'edn_aoc_baws_1979',
    parentSectionId: 'sec_aoc_ch14',
    sequence: 1,
    originalText:
      '[MOCK PASSAGE — NOT AN AMBEDKAR QUOTATION] Democracy is primarily a mode of associated living and conjoint communicated experience.',
    normalizedText:
      'democracy is primarily a mode of associated living and conjoint communicated experience.',
    language: 'en',
    pageStart: 57,
    pageEnd: 57,
    paragraphStart: 2,
    paragraphEnd: 2,
    chapter: 'Chapter XIV',
    section: 'Section XIV',
    translationMetadata: {
      isOriginal: true,
      translationType: 'ORIGINAL',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
  // Published Marathi translation linked to original passage
  {
    id: 'psg_aoc_14_01_mr',
    sourceId: 'src_book_aoc_1936',
    editionId: 'edn_aoc_baws_1979',
    parentSectionId: 'sec_aoc_ch14',
    sequence: 2,
    originalText:
      '[MOCK PASSAGE — NOT AN AMBEDKAR QUOTATION] लोकशाही हे प्रामुख्याने सहजीवनाचे एक रूप आहे.',
    normalizedText:
      'लोकशाही हे प्रामुख्याने सहजीवनाचे एक रूप आहे.',
    language: 'mr',
    pageStart: 72,
    pageEnd: 72,
    translationMetadata: {
      isOriginal: false,
      originalPassageId: 'psg_aoc_14_01',
      translationType: 'PUBLISHED_TRANSLATION',
      translator: 'Official Translation Committee',
      publicationInfo: 'BAWS Marathi Vol. 1',
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];
