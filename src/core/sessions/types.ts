/**
 * Anonymous Sessions Domain Module — Types
 * 
 * Anonymous Usage Principle:
 * No sign-in, no registration, no passwords, no mandatory email, no user profile.
 * Sessions are strictly ephemeral and client-initiated to support rate limiting
 * and contextual follow-up turns without tracking user identities.
 */

export interface AnonymousSession {
  sessionId: string;
  createdAt: number;
  lastActiveAt: number;
  questionCount: number;
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remainingRequests: number;
  resetTimeMs: number;
}

export interface SessionManager {
  getOrCreateSession(sessionId?: string): Promise<AnonymousSession>;
  checkRateLimit(sessionId: string): Promise<RateLimitStatus>;
}
