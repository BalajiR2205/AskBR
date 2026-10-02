/**
 * Ask Ambedkar — Primary Source Architecture: Passage Repository Abstraction
 * 
 * Provides storage-independent contracts and in-memory reference implementation
 * for atomic Passage entities.
 */

import { Passage } from './types';
import { validatePassage } from './validation';

export interface PassageFilters {
  sourceId?: string;
  editionId?: string;
  sectionId?: string;
  language?: string;
  isOriginal?: boolean;
  limit?: number;
  offset?: number;
}

export interface PassageRepository {
  findById(id: string): Promise<Passage | null>;
  findBySourceId(sourceId: string): Promise<Passage[]>;
  findBySectionId(sectionId: string): Promise<Passage[]>;
  findMany(filters?: PassageFilters): Promise<Passage[]>;
  create(passage: Passage): Promise<Passage>;
  createMany(passages: Passage[]): Promise<Passage[]>;
  update(id: string, updates: Partial<Passage>): Promise<Passage | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: PassageFilters): Promise<number>;
}

export class InMemoryPassageRepository implements PassageRepository {
  private passages = new Map<string, Passage>();

  constructor(initialPassages: Passage[] = []) {
    for (const p of initialPassages) {
      this.passages.set(p.id, p);
    }
  }

  async findById(id: string): Promise<Passage | null> {
    return this.passages.get(id) || null;
  }

  async findBySourceId(sourceId: string): Promise<Passage[]> {
    return Array.from(this.passages.values())
      .filter(p => p.sourceId === sourceId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async findBySectionId(sectionId: string): Promise<Passage[]> {
    return Array.from(this.passages.values())
      .filter(p => p.parentSectionId === sectionId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async findMany(filters?: PassageFilters): Promise<Passage[]> {
    let result = Array.from(this.passages.values());

    if (filters?.sourceId) {
      result = result.filter(p => p.sourceId === filters.sourceId);
    }

    if (filters?.editionId) {
      result = result.filter(p => p.editionId === filters.editionId);
    }

    if (filters?.sectionId) {
      result = result.filter(p => p.parentSectionId === filters.sectionId);
    }

    if (filters?.language) {
      result = result.filter(p => p.language === filters.language);
    }

    if (filters?.isOriginal !== undefined) {
      result = result.filter(p => p.translationMetadata.isOriginal === filters.isOriginal);
    }

    // Sort by sequence
    result.sort((a, b) => a.sequence - b.sequence);

    if (filters?.offset) {
      result = result.slice(filters.offset);
    }

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async create(passage: Passage): Promise<Passage> {
    const val = validatePassage(passage);
    if (!val.isValid) {
      throw new Error(`Cannot create passage: ${val.errors.join('; ')}`);
    }

    if (this.passages.has(passage.id)) {
      throw new Error(`Passage with ID "${passage.id}" already exists.`);
    }

    this.passages.set(passage.id, { ...passage });
    return passage;
  }

  async createMany(passages: Passage[]): Promise<Passage[]> {
    const created: Passage[] = [];
    for (const p of passages) {
      created.push(await this.create(p));
    }
    return created;
  }

  async update(id: string, updates: Partial<Passage>): Promise<Passage | null> {
    const existing = this.passages.get(id);
    if (!existing) return null;

    // Rule 1: originalText must NEVER be wiped or made empty
    if (updates.originalText !== undefined && updates.originalText.trim().length === 0) {
      throw new Error('Original text is immutable and cannot be wiped.');
    }

    const merged: Passage = {
      ...existing,
      ...updates,
      id, // Preserve immutable ID
      updatedAt: new Date().toISOString(),
    };

    const val = validatePassage(merged);
    if (!val.isValid) {
      throw new Error(`Cannot update passage: ${val.errors.join('; ')}`);
    }

    this.passages.set(id, merged);
    return merged;
  }

  async delete(id: string): Promise<boolean> {
    return this.passages.delete(id);
  }

  async count(filters?: PassageFilters): Promise<number> {
    const matches = await this.findMany(filters);
    return matches.length;
  }
}
