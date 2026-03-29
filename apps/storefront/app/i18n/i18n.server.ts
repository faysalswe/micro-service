/**
 * Server-side translation helper
 * Simple translation function for SSR
 */

import type { SupportedLanguage } from './config';

// Import all translations
import enCommon from './locales/en/common.json';
import enForms from './locales/en/forms.json';
import enErrors from './locales/en/errors.json';
import enNavigation from './locales/en/navigation.json';

import bnCommon from './locales/bn/common.json';
import bnForms from './locales/bn/forms.json';
import bnErrors from './locales/bn/errors.json';
import bnNavigation from './locales/bn/navigation.json';

import deCommon from './locales/de/common.json';
import deForms from './locales/de/forms.json';
import deErrors from './locales/de/errors.json';
import deNavigation from './locales/de/navigation.json';

// Combine all translations
const translations = {
  en: {
    common: enCommon,
    forms: enForms,
    errors: enErrors,
    navigation: enNavigation,
  },
  bn: {
    common: bnCommon,
    forms: bnForms,
    errors: bnErrors,
    navigation: bnNavigation,
  },
  de: {
    common: deCommon,
    forms: deForms,
    errors: deErrors,
    navigation: deNavigation,
  },
};

/**
 * Server-side translation function
 * @param key - Translation key (e.g., "common.welcome")
 * @param language - Language code
 * @param options - Interpolation options
 * @returns Translated string
 */
export function translateServer(
  key: string,
  language: SupportedLanguage,
  options?: Record<string, unknown>
): string {
  // Split the key into namespace and actual key (e.g., "common.welcome" -> ["common", "welcome"])
  const [namespace, ...keyParts] = key.split('.');
  const translationKey = keyParts.join('.');

  // Get the namespace data
  const namespaceData = translations[language]?.[namespace as keyof typeof translations.en];
  let translation = namespaceData?.[translationKey as keyof typeof namespaceData] as
    | string
    | undefined;

  if (!translation) {
    // Fallback to English
    const enNamespace = translations.en[namespace as keyof typeof translations.en];
    translation = enNamespace?.[translationKey as keyof typeof enNamespace] as string | undefined;
  }

  if (!translation) {
    return key; // Return key if no translation found
  }

  // Simple interpolation for {{variable}} syntax
  if (options) {
    Object.entries(options).forEach(([optionKey, value]) => {
      translation = translation!.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(value));
    });
  }

  return translation;
}

/**
 * Create a translation function for a specific language
 * @param language - Language code
 * @returns Translation function
 */
export function createServerTranslator(language: SupportedLanguage) {
  return (key: string, options?: Record<string, unknown>): string => {
    return translateServer(key, language, options);
  };
}
