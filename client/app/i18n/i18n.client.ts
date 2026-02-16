/**
 * Client-side i18n utilities
 * Dynamic translation loading for language switching
 */

import type { SupportedLanguage } from './config';

/**
 * Load translations for a specific language (client-side)
 * @param language - Language to load
 * @returns Flattened translation object
 */
export async function loadClientTranslations(
  language: SupportedLanguage
): Promise<Record<string, string>> {
  const namespaces = ['common', 'forms', 'errors', 'navigation'];
  const translations: Record<string, string> = {};

  for (const ns of namespaces) {
    try {
      // Dynamic import of translation files
      const module = await import(`./locales/${language}/${ns}.json`);
      const nsTranslations = module.default || module;

      // Flatten with namespace prefix (e.g., "common.welcome")
      for (const [key, value] of Object.entries(nsTranslations)) {
        translations[`${ns}.${key}`] = value as string;
      }
    } catch (error) {
      console.error(`Failed to load translations for ${language}/${ns}:`, error);
    }
  }

  return translations;
}
