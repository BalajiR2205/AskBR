/**
 * Application Configuration Module
 * 
 * Provides centralized, typed access to application settings and environment
 * variables with safe defaults for local development.
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  appUrl: string;
  appName: string;
  tagline: string;
  api: {
    prefix: string;
    version: string;
  };
  limits: {
    maxQuestionLength: number;
    maxAnswerTokens: number;
    defaultSearchTopK: number;
  };
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  port: Number(process.env.PORT) || 3000,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Ask Ambedkar',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Ask anything. Discover what Ambedkar wrote.',
  api: {
    prefix: '/api',
    version: 'v0',
  },
  limits: {
    maxQuestionLength: 500,
    maxAnswerTokens: 1024,
    defaultSearchTopK: 5,
  },
};

export default config;
