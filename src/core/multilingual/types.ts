/**
 * Multilingual Domain Module — Types
 * 
 * Multilingual Architecture Principle:
 * The architecture must not assume English-only input or output.
 * Users may ask in Hindi, Marathi, English, etc.
 * The system retrieves primary sources (which may be in English or Marathi),
 * while preserving the original passage verbatim as the absolute source of truth.
 */

export interface SupportedLanguage {
  code: string;       // ISO 639-1 code (e.g., 'en', 'mr', 'hi')
  name: string;       // English display name
  nativeName: string; // Native script name
  direction: 'ltr' | 'rtl';
}

export interface MultilingualContext {
  queryLanguage: string;
  sourceLanguage?: string;
  targetResponseLanguage: string;
  requiresTranslation: boolean;
}

export interface MultilingualTranslator {
  translateQuery?(text: string, fromLang: string, toLang: string): Promise<string>;
  translateResponse?(text: string, fromLang: string, toLang: string): Promise<string>;
}
