/**
 * Multilingual Domain Module
 * 
 * Segment 0 Foundation: Supported languages registry and context helper.
 */

export * from './types';

import { MultilingualContext, SupportedLanguage } from './types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
];

export function getLanguageByCode(code: string): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code.toLowerCase());
}

export function buildMultilingualContext(
  queryLanguage = 'en',
  targetResponseLanguage = 'en'
): MultilingualContext {
  return {
    queryLanguage,
    targetResponseLanguage,
    requiresTranslation: queryLanguage !== targetResponseLanguage,
  };
}
