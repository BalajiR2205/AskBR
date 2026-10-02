/**
 * Anonymous Sessions Domain Module
 * 
 * Segment 0 Foundation: Ephemeral session generator and non-intrusive rate limit contract.
 */

export * from './types';

import { AnonymousSession, RateLimitStatus, SessionManager } from './types';

export class EphemeralSessionManager implements SessionManager {
  private sessions = new Map<string, AnonymousSession>();
  private readonly defaultMaxRequests = 30;

  async getOrCreateSession(existingId?: string): Promise<AnonymousSession> {
    if (existingId && this.sessions.has(existingId)) {
      const session = this.sessions.get(existingId)!;
      session.lastActiveAt = Date.now();
      return session;
    }

    const newId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSession: AnonymousSession = {
      sessionId: newId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      questionCount: 0,
    };

    this.sessions.set(newId, newSession);
    return newSession;
  }

  async checkRateLimit(sessionId: string): Promise<RateLimitStatus> {
    const session = this.sessions.get(sessionId);
    const count = session ? session.questionCount : 0;
    const remaining = Math.max(0, this.defaultMaxRequests - count);

    return {
      isAllowed: remaining > 0,
      remainingRequests: remaining,
      resetTimeMs: 60 * 1000,
    };
  }
}

export const defaultSessionManager = new EphemeralSessionManager();
