/**
 * Ask Ambedkar — Primary Source Architecture: Sources Domain Types
 * 
 * Strict Primary Source Philosophy:
 * The knowledge base is founded upon authoritative primary materials
 * directly attributable to Dr. B. R. Ambedkar.
 * 
 * Source-First Architecture:
 * The source remains an independent, immutable, and authoritative entity.
 * Answers and retrieval systems consume source data but never own it.
 */

// ============================================================================
// 1. Controlled Enums & Union Types
// ============================================================================

/**
 * Controlled Primary Source Categories
 */
export type SourceCategory =
  | 'BOOK'
  | 'SPEECH'
  | 'INTERVIEW'
  | 'CONSTITUENT_ASSEMBLY'
  | 'LETTER'
  | 'ARTICLE'
  | 'EDITORIAL';

/**
 * Backward compatibility union for lowercase representation
 */
export type PrimarySourceType =
  | SourceCategory
  | 'book'
  | 'speech'
  | 'interview'
  | 'constituent_assembly_debate'
  | 'letter'
  | 'article'
  | 'article_editorial'
  | 'editorial';

/**
 * Primary vs Secondary Source Classification
 * For the initial Ask Ambedkar corpus, answers are strictly PRIMARY only.
 */
export type SourceClassification = 'PRIMARY' | 'SECONDARY';

/**
 * Source verification lifecycle status
 */
export type SourceStatus = 'DRAFT' | 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Authorship and Attribution Roles
 */
export type AttributionRole =
  | 'AUTHOR'
  | 'SPEAKER'
  | 'INTERVIEWEE'
  | 'CORRESPONDENT';

/**
 * Document Hierarchy Levels
 */
export type SectionLevel =
  | 'VOLUME'
  | 'PART'
  | 'CHAPTER'
  | 'SECTION'
  | 'SUBSECTION'
  | 'DEBATE_TOPIC'
  | 'APPENDIX';

export type LanguageCode = 'en' | 'mr' | 'hi' | 'ta' | 'te' | 'bn' | 'gu' | string;

// ============================================================================
// 2. Attribution Model
// ============================================================================

/**
 * Structured authorship/attribution representation
 */
export interface AuthorAttribution {
  /** Role in relation to the source (AUTHOR, SPEAKER, INTERVIEWEE, CORRESPONDENT) */
  role: AttributionRole;

  /** Canonical name of the creator (strictly Dr. B. R. Ambedkar for primary corpus) */
  name: 'Dr. B. R. Ambedkar' | 'B. R. Ambedkar' | string;

  /** Recipient of the correspondence (applicable for LETTERS) */
  recipient?: string;

  /** Person conducting the interview (applicable for INTERVIEWS) */
  interviewer?: string;

  /** Additional role or historical notes */
  roleDetails?: string;
}

// ============================================================================
// 3. Category-Specific Metadata
// ============================================================================

export interface BookMetadata {
  publisher?: string;
  publicationCity?: string;
  totalVolumes?: number;
  originalPublisher?: string;
  isbn?: string;
}

export interface SpeechMetadata {
  location?: string;
  event?: string;
  audience?: string;
  presidingOfficer?: string;
  deliveryDate?: string;
}

export interface InterviewMetadata {
  interviewer?: string;
  publicationOrMedium?: string;
  interviewDate?: string;
  location?: string;
}

export interface ConstituentAssemblyMetadata {
  cadVolume?: string | number;
  sessionNumber?: string | number;
  debateTopic?: string;
  motionTitle?: string;
  debateDate?: string;
}

export interface LetterMetadata {
  recipient: string;
  senderLocation?: string;
  recipientLocation?: string;
  letterDate?: string;
}

export interface ArticleMetadata {
  periodicalName?: string;
  volumeNumber?: string | number;
  issueNumber?: string | number;
  publicationDate?: string;
}

export interface EditorialMetadata {
  newspaperName?: string;
  issueNumber?: string | number;
  headline?: string;
  publicationDate?: string;
}

export type CategorySpecificMetadata =
  | BookMetadata
  | SpeechMetadata
  | InterviewMetadata
  | ConstituentAssemblyMetadata
  | LetterMetadata
  | ArticleMetadata
  | EditorialMetadata
  | Record<string, unknown>;

// ============================================================================
// 4. Core Source Entity
// ============================================================================

/**
 * Canonical Source Entity
 * The authoritative parent record representing an intellectual work or recorded act.
 */
export interface Source {
  /** Stable unique identifier (e.g., 'src_book_aoc_1936') */
  id: string;

  /** Full authoritative title of the work */
  title: string;

  /** Optional subtitle or secondary descriptor */
  subtitle?: string;

  /** Structured attribution details */
  attribution: AuthorAttribution;

  /** Controlled category of primary source */
  sourceType: SourceCategory;

  /** Source classification (strictly PRIMARY for initial answer corpus) */
  classification: SourceClassification;

  /** Verification and publication lifecycle status */
  status: SourceStatus;

  /** ISO 8601 date string or historical date (e.g., '1936-05-15', '1949-11-25') */
  date?: string;

  /** Approximate or verified publication / delivery year */
  year?: number;

  /** Primary original language in which the source was delivered or authored */
  originalLanguage: LanguageCode;

  /** Array of languages currently available in the system */
  languagesAvailable: LanguageCode[];

  /** Primary publisher or publishing authority */
  publisher?: string;

  /** Publication or periodical title if published serially */
  publication?: string;

  /** Volume identifier in collected editions (e.g., 'BAWS Vol. 1') */
  volume?: string | number;

  /** Short historical description or editorial abstract */
  description?: string;

  /** Complete canonical reference citation (e.g. 'BAWS Vol. 1, Government of Maharashtra') */
  sourceReference: string;

  /** Permanent archive URL, digital library handle, or catalog link */
  externalReference?: string;

  /** Usage, archival copyright status, or public domain note */
  copyrightOrUsage?: string;

  /** Category-specific metadata (books, speeches, CAD, letters) */
  categoryMetadata?: CategorySpecificMetadata;

  /** Record audit timestamps */
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Edition Entity (Edition-Aware Architecture)
// ============================================================================

/**
 * Represents a specific published edition of a source work.
 * Page numbers and specific wording are strictly tied to an edition.
 */
export interface Edition {
  /** Stable unique identifier (e.g., 'edn_aoc_baws_v1') */
  id: string;

  /** Foreign key pointing to the overarching Source */
  sourceId: string;

  /** Edition title or name (e.g., 'First Edition (1936)', 'BAWS Edition (1979)') */
  editionName: string;

  /** Edition sequence number if known */
  editionNumber?: number;

  /** Year of this specific edition */
  year: number;

  /** Publisher of this edition */
  publisher?: string;

  /** Editor or compiler of this edition (e.g., 'Vasant Moon') */
  editor?: string;

  /** Language of this edition */
  language: LanguageCode;

  /** Whether this edition serves as the authoritative reference edition for page citations */
  isAuthoritative: boolean;

  /** Total pages in this edition if catalogued */
  pageCount?: number;

  /** Archival or edition notes */
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 6. Document Section Entity (Hierarchical Structure)
// ============================================================================

/**
 * Represents hierarchical document components:
 * Source -> Volume -> Chapter -> Section -> Subsection -> Passage
 */
export interface DocumentSection {
  /** Stable unique identifier (e.g., 'sec_aoc_ch14') */
  id: string;

  /** Foreign key referencing the parent Source */
  sourceId: string;

  /** Optional foreign key referencing a specific Edition */
  editionId?: string;

  /** Optional recursive parent section ID for nested hierarchies */
  parentSectionId?: string;

  /** Structural level within the document */
  level: SectionLevel;

  /** Sequential order within the parent container */
  sequence: number;

  /** Section title or heading (e.g., 'Chapter XIV', 'Speech on Adoption') */
  title: string;

  /** Official numbering if present (e.g., 'XIV', 'Part III') */
  sectionNumber?: string;

  /** Starting page in reference edition */
  pageStart?: number | string;

  /** Ending page in reference edition */
  pageEnd?: number | string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 7. Backward Compatibility Provenance & Passage Types
// ============================================================================

export interface SourceProvenance {
  workTitle: string;
  author: 'B. R. Ambedkar' | 'Dr. B. R. Ambedkar' | string;
  dateOrYear?: string;
  sourceType: PrimarySourceType;
  chapter?: string;
  section?: string;
  page?: string | number;
  originalLanguage: LanguageCode;
  originalText: string;
  referenceInfo: string;
  volume?: number | string;
  archiveUrl?: string;
}

export interface SourcePassage {
  id: string;
  provenance: SourceProvenance;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
