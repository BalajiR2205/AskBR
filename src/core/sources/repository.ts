/**
 * Ask Ambedkar — Primary Source Architecture: Source Repository Abstraction
 * 
 * Provides storage-agnostic contracts and in-memory reference implementations
 * for Sources, Editions, and Document Sections.
 */

import {
  DocumentSection,
  Edition,
  Source,
  SourceCategory,
  SourceClassification,
  SourceStatus,
} from './types';
import { validateEdition, validateSection, validateSource } from './validation';

export interface SourceFilters {
  sourceTypes?: SourceCategory[];
  classification?: SourceClassification;
  status?: SourceStatus;
  yearStart?: number;
  yearEnd?: number;
  language?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface SourceRepository {
  findById(id: string): Promise<Source | null>;
  findMany(filters?: SourceFilters): Promise<Source[]>;
  create(source: Source): Promise<Source>;
  update(id: string, updates: Partial<Source>): Promise<Source | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: SourceFilters): Promise<number>;
}

export interface EditionRepository {
  findById(id: string): Promise<Edition | null>;
  findBySourceId(sourceId: string): Promise<Edition[]>;
  create(edition: Edition): Promise<Edition>;
  delete(id: string): Promise<boolean>;
}

export interface SectionRepository {
  findById(id: string): Promise<DocumentSection | null>;
  findBySourceId(sourceId: string): Promise<DocumentSection[]>;
  findChildren(parentSectionId: string): Promise<DocumentSection[]>;
  create(section: DocumentSection): Promise<DocumentSection>;
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// In-Memory Reference Implementation
// ============================================================================

export class InMemorySourceRepository implements SourceRepository {
  private sources = new Map<string, Source>();

  constructor(initialSources: Source[] = []) {
    for (const src of initialSources) {
      this.sources.set(src.id, src);
    }
  }

  async findById(id: string): Promise<Source | null> {
    return this.sources.get(id) || null;
  }

  async findMany(filters?: SourceFilters): Promise<Source[]> {
    let result = Array.from(this.sources.values());

    if (filters?.sourceTypes && filters.sourceTypes.length > 0) {
      result = result.filter(s => filters.sourceTypes!.includes(s.sourceType));
    }

    if (filters?.classification) {
      result = result.filter(s => s.classification === filters.classification);
    }

    if (filters?.status) {
      result = result.filter(s => s.status === filters.status);
    }

    if (filters?.yearStart) {
      result = result.filter(s => s.year !== undefined && s.year >= filters.yearStart!);
    }

    if (filters?.yearEnd) {
      result = result.filter(s => s.year !== undefined && s.year <= filters.yearEnd!);
    }

    if (filters?.language) {
      result = result.filter(
        s => s.originalLanguage === filters.language || s.languagesAvailable.includes(filters.language!)
      );
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }

    if (filters?.offset) {
      result = result.slice(filters.offset);
    }

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async create(source: Source): Promise<Source> {
    const val = validateSource(source);
    if (!val.isValid) {
      throw new Error(`Cannot create source: ${val.errors.join('; ')}`);
    }

    if (this.sources.has(source.id)) {
      throw new Error(`Source with ID "${source.id}" already exists.`);
    }

    this.sources.set(source.id, { ...source });
    return source;
  }

  async update(id: string, updates: Partial<Source>): Promise<Source | null> {
    const existing = this.sources.get(id);
    if (!existing) return null;

    const merged: Source = {
      ...existing,
      ...updates,
      id, // Preserve immutable ID
      updatedAt: new Date().toISOString(),
    };

    const val = validateSource(merged);
    if (!val.isValid) {
      throw new Error(`Cannot update source: ${val.errors.join('; ')}`);
    }

    this.sources.set(id, merged);
    return merged;
  }

  async delete(id: string): Promise<boolean> {
    return this.sources.delete(id);
  }

  async count(filters?: SourceFilters): Promise<number> {
    const matches = await this.findMany(filters);
    return matches.length;
  }
}

export class InMemoryEditionRepository implements EditionRepository {
  private editions = new Map<string, Edition>();

  constructor(initialEditions: Edition[] = []) {
    for (const edn of initialEditions) {
      this.editions.set(edn.id, edn);
    }
  }

  async findById(id: string): Promise<Edition | null> {
    return this.editions.get(id) || null;
  }

  async findBySourceId(sourceId: string): Promise<Edition[]> {
    return Array.from(this.editions.values()).filter(e => e.sourceId === sourceId);
  }

  async create(edition: Edition): Promise<Edition> {
    const val = validateEdition(edition);
    if (!val.isValid) {
      throw new Error(`Cannot create edition: ${val.errors.join('; ')}`);
    }

    if (this.editions.has(edition.id)) {
      throw new Error(`Edition with ID "${edition.id}" already exists.`);
    }

    this.editions.set(edition.id, { ...edition });
    return edition;
  }

  async delete(id: string): Promise<boolean> {
    return this.editions.delete(id);
  }
}

export class InMemorySectionRepository implements SectionRepository {
  private sections = new Map<string, DocumentSection>();

  constructor(initialSections: DocumentSection[] = []) {
    for (const sec of initialSections) {
      this.sections.set(sec.id, sec);
    }
  }

  async findById(id: string): Promise<DocumentSection | null> {
    return this.sections.get(id) || null;
  }

  async findBySourceId(sourceId: string): Promise<DocumentSection[]> {
    return Array.from(this.sections.values())
      .filter(s => s.sourceId === sourceId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async findChildren(parentSectionId: string): Promise<DocumentSection[]> {
    return Array.from(this.sections.values())
      .filter(s => s.parentSectionId === parentSectionId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async create(section: DocumentSection): Promise<DocumentSection> {
    const val = validateSection(section);
    if (!val.isValid) {
      throw new Error(`Cannot create section: ${val.errors.join('; ')}`);
    }

    if (this.sections.has(section.id)) {
      throw new Error(`Section with ID "${section.id}" already exists.`);
    }

    this.sections.set(section.id, { ...section });
    return section;
  }

  async delete(id: string): Promise<boolean> {
    return this.sections.delete(id);
  }
}
