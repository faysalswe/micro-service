/**
 * i18next Configuration
 * Internationalization setup for SSR-compatible translations
 */

import i18next, { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'node_modules/react-i18next';

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['en', 'bn', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Translation namespaces
 */
export const NAMESPACES = ['common', 'forms', 'errors', 'navigation'] as const;
export type Namespace = (typeof NAMESPACES)[number];

/**
 * Default language and namespace
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const DEFAULT_NAMESPACE: Namespace = 'common';

/**
 * Load translation resources for a specific language (server-side only)
 * Flattens namespaces with dot notation (e.g., "common.welcome", "forms.submit")
 * @param language - Language to load
 * @returns Translation resources
 */
export async function loadTranslations(
  language: SupportedLanguage
): Promise<Record<string, unknown>> {
  const flattenedTranslations: Record<string, unknown> = {};

  for (const ns of NAMESPACES) {
    try {
      const translations = await import(`./locales/${language}/${ns}.json`);
      const nsTranslations = translations.default || translations;

      // Flatten with namespace prefix (e.g., "common.welcome")
      for (const [key, value] of Object.entries(nsTranslations)) {
        flattenedTranslations[`${ns}.${key}`] = value;
      }
    } catch (error) {
      console.error(`Failed to load translations for ${language}/${ns}:`, error);
    }
  }

  // Return in i18next format with 'translation' as the default namespace
  return {
    [language]: {
      translation: flattenedTranslations
    }
  };
}

export default loadTranslations;
