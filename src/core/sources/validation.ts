/**
 * Ask Ambedkar — Primary Source Architecture: Source Validation
 * 
 * Enforces data integrity rules:
 * 1. Required identity and bibliographic attribution.
 * 2. Strict primary source attribution (Ambedkar only for PRIMARY classification).
 * 3. Conditional validation per controlled category (BOOK, SPEECH, LETTER, CAD, etc.).
 */

import { DocumentSection, Edition, Source, SourceCategory } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const VALID_SOURCE_CATEGORIES: SourceCategory[] = [
  'BOOK',
  'SPEECH',
  'INTERVIEW',
  'CONSTITUENT_ASSEMBLY',
  'LETTER',
  'ARTICLE',
  'EDITORIAL',
];

export const VALID_SOURCE_STATUSES = ['DRAFT', 'VERIFIED', 'PUBLISHED', 'ARCHIVED'];
export const VALID_CLASSIFICATIONS = ['PRIMARY', 'SECONDARY'];

/**
 * Validates a Source record against canonical schema rules and category constraints.
 */
export function validateSource(source: Partial<Source>): ValidationResult {
  const errors: string[] = [];

  // 1. Required ID
  if (!source.id || typeof source.id !== 'string' || source.id.trim().length === 0) {
    errors.push('Source must have a non-empty stable ID.');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(source.id)) {
    errors.push(`Source ID "${source.id}" contains invalid characters. Use alphanumeric, dashes, or underscores.`);
  }

  // 2. Required Title
  if (!source.title || typeof source.title !== 'string' || source.title.trim().length === 0) {
    errors.push('Source must have a non-empty title.');
  }

  // 3. Controlled Source Category
  if (!source.sourceType || !VALID_SOURCE_CATEGORIES.includes(source.sourceType as SourceCategory)) {
    errors.push(
      `Invalid source category: "${source.sourceType}". Must be one of: ${VALID_SOURCE_CATEGORIES.join(', ')}.`
    );
  }

  // 4. Source Classification
  if (!source.classification || !VALID_CLASSIFICATIONS.includes(source.classification)) {
    errors.push(`Invalid classification: "${source.classification}". Must be PRIMARY or SECONDARY.`);
  }

  // 5. Attribution Rules
  if (!source.attribution) {
    errors.push('Source must include structured attribution.');
  } else {
    if (!source.attribution.name || source.attribution.name.trim().length === 0) {
      errors.push('Attribution must specify a creator name.');
    }

    // Strict Primary Source Invariant: PRIMARY sources must be authored by Ambedkar
    if (source.classification === 'PRIMARY') {
      const name = source.attribution.name.toLowerCase();
      const isAmbedkar = name.includes('ambedkar') || name.includes('b. r. ambedkar');
      if (!isAmbedkar) {
        errors.push(
          `PRIMARY source attribution must be Dr. B. R. Ambedkar. Found: "${source.attribution.name}".`
        );
      }
    }
  }

  // 6. Original Language
  if (!source.originalLanguage || source.originalLanguage.trim().length === 0) {
    errors.push('Source must specify an originalLanguage code (e.g. "en", "mr").');
  }

  // 7. Canonical Bibliographic Reference
  if (!source.sourceReference || source.sourceReference.trim().length === 0) {
    errors.push('Source must provide a canonical sourceReference citation.');
  }

  // 8. Controlled Status
  if (source.status && !VALID_SOURCE_STATUSES.includes(source.status)) {
    errors.push(`Invalid source status: "${source.status}". Must be DRAFT, VERIFIED, PUBLISHED, or ARCHIVED.`);
  }

  // 9. Conditional Category Validation
  if (source.sourceType) {
    const meta = source.categoryMetadata || {};

    switch (source.sourceType) {
      case 'BOOK':
        // A book should ideally have publication year, publisher, or edition info
        if (!source.year && !source.date && !source.publisher && !('publisher' in meta)) {
          errors.push('A BOOK source requires at least one of: year, date, or publisher.');
        }
        break;

      case 'SPEECH':
        // A speech should have a date or location/event
        if (!source.date && !source.year && !('event' in meta) && !('location' in meta)) {
          errors.push('A SPEECH source requires delivery date, year, event, or location.');
        }
        break;

      case 'LETTER':
        // A letter must have a recipient
        if (!source.attribution?.recipient && !('recipient' in meta)) {
          errors.push('A LETTER source must specify a recipient.');
        }
        break;

      case 'INTERVIEW':
        // An interview should specify interviewer or publication/medium
        if (!source.attribution?.interviewer && !('interviewer' in meta) && !source.publication) {
          errors.push('An INTERVIEW source requires an interviewer or publication/medium.');
        }
        break;

      case 'CONSTITUENT_ASSEMBLY':
        // Constituent Assembly debates should specify CAD volume, session, or topic
        if (!source.volume && !('cadVolume' in meta) && !('debateTopic' in meta)) {
          errors.push('A CONSTITUENT_ASSEMBLY source requires CAD volume or debate topic.');
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an Edition record
 */
export function validateEdition(edition: Partial<Edition>): ValidationResult {
  const errors: string[] = [];

  if (!edition.id || edition.id.trim().length === 0) {
    errors.push('Edition must have a non-empty stable ID.');
  }

  if (!edition.sourceId || edition.sourceId.trim().length === 0) {
    errors.push('Edition must reference a valid sourceId.');
  }

  if (!edition.editionName || edition.editionName.trim().length === 0) {
    errors.push('Edition must have an editionName.');
  }

  if (typeof edition.year !== 'number' || edition.year < 1850 || edition.year > 2100) {
    errors.push('Edition must have a valid 4-digit year.');
  }

  if (!edition.language || edition.language.trim().length === 0) {
    errors.push('Edition must specify a language code.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a DocumentSection record
 */
export function validateSection(section: Partial<DocumentSection>): ValidationResult {
  const errors: string[] = [];

  if (!section.id || section.id.trim().length === 0) {
    errors.push('Section must have a non-empty stable ID.');
  }

  if (!section.sourceId || section.sourceId.trim().length === 0) {
    errors.push('Section must reference a valid sourceId.');
  }

  if (!section.title || section.title.trim().length === 0) {
    errors.push('Section must have a title.');
  }

  if (typeof section.sequence !== 'number' || section.sequence < 0) {
    errors.push('Section sequence must be a non-negative number.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
