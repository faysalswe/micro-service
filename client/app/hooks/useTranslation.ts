/**
 * useTranslation Hook
 * Wrapper around react-i18next useTranslation with additional functionality
 */

import {
  useTranslation as useI18nextTranslation,
  UseTranslationOptions,
} from 'node_modules/react-i18next';
import { useLanguage, useSetLanguage } from '~/components/providers';
import type { SupportedLanguage } from '~/i18n/config';

/**
 * Translation function type
 */
export type TranslationFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Return type for useTranslation hook
 */
export interface UseTranslationReturn {
  t: TranslationFunction;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  ready: boolean;
}

/**
 * Hook to manage translations
 * @param {string} [ns] - Optional namespace to use
 * @param {UseTranslationOptions} [options] - Additional i18next options
 * @returns {UseTranslationReturn} Translation function and language utilities
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, language, setLanguage } = useTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t('common.welcome')}</h1>
 *       <p>{t('common.hello', { name: 'John' })}</p>
 *       <button onClick={() => setLanguage('bn')}>
 *         Switch to Bangla
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation(
  ns?: string,
  options?: UseTranslationOptions
): UseTranslationReturn {
  // Get language utilities from provider
  const language = useLanguage();
  const setLanguage = useSetLanguage();

  // Use react-i18next's useTranslation hook
  const { t, ready } = useI18nextTranslation(ns, {
    ...options,
    useSuspense: false, // Disable suspense for SSR
  });

  return {
    t: t as TranslationFunction,
    language,
    setLanguage,
    ready,
  };
}

export default useTranslation;
