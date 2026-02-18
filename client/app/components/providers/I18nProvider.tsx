/**
 * I18nProvider - Manages internationalization state
 */

import { createContext, FC, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'node_modules/react-i18next';
import i18next, { type i18n as I18nInstance, Resource, InitOptions } from 'i18next';
import type { SupportedLanguage } from '~/i18n/config';
import { loadClientTranslations } from '~/i18n/i18n.client';

/**
 * I18n context interface
 */
interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

/**
 * I18n context
 */
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * I18nProvider props
 */
interface I18nProviderProps {
  children: ReactNode;
  initialLanguage: SupportedLanguage;
  initialResources: Record<string, unknown>;
}

const LANGUAGE_STORAGE_KEY = 'app_language';

/**
 * Create and initialize i18n instance
 */
function createI18nInstance(language: SupportedLanguage, resources: Record<string, unknown>): I18nInstance {
  const instance = i18next.createInstance();

  // Initialize synchronously (important for SSR)
  instance.use(initReactI18next);

  // Initialize with resources - this is synchronous when initImmediate is false
  const initOptions: InitOptions = {
    lng: language,
    fallbackLng: 'en',
    resources: resources as Resource,
    ns: ['translation'],
    defaultNS: 'translation',
    // Disable separators since we use dots in the keys themselves
    nsSeparator: false,
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Force synchronous initialization
    initImmediate: false,
  };
  instance.init(initOptions);

  return instance;
}

// Global i18n instance
let globalI18nInstance: I18nInstance | null = null;
let globalInitialLanguage: SupportedLanguage | null = null;

/**
 * I18nProvider component
 */
export const I18nProvider: FC<I18nProviderProps> = ({
  children,
  initialLanguage,
  initialResources,
}) => {
  const i18nRef = useRef<I18nInstance | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize i18n instance only once
  if (!i18nRef.current) {
    if (!globalI18nInstance || globalInitialLanguage !== initialLanguage) {
      globalI18nInstance = createI18nInstance(initialLanguage, initialResources);
      globalInitialLanguage = initialLanguage;
    }
    i18nRef.current = globalI18nInstance;
  }

  const i18n = i18nRef.current;

  // Mark as hydrated on client-side mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update DOM language attribute when language changes (client-side only)
  useEffect(() => {
    if (!isHydrated) return;

    document.documentElement.lang = currentLanguage;

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch {
      // localStorage not available
    }
  }, [currentLanguage, isHydrated]);

  /**
   * Change language - dynamically loads translations and switches
   */
  const setLanguage = async (lang: SupportedLanguage): Promise<void> => {
    if (lang === currentLanguage) return;

    try {
      // Load translations for the new language
      const translations = await loadClientTranslations(lang);

      // Add translations to i18n instance
      i18n.addResourceBundle(lang, 'translation', translations, true, true);

      // Change language
      await i18n.changeLanguage(lang);

      // Update state
      setCurrentLanguage(lang);
    } catch (error) {
      console.error(`Failed to switch language to ${lang}:`, error);
    }
  };

  const contextValue: I18nContextValue = {
    language: currentLanguage,
    setLanguage,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
};

/**
 * Hook to access i18n context
 */
export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to get current language
 */
export function useLanguage(): SupportedLanguage {
  const context = useContext(I18nContext);
  return context?.language ?? 'en';
}

/**
 * Hook to get setLanguage function
 */
export function useSetLanguage(): (lang: SupportedLanguage) => Promise<void> {
  const context = useContext(I18nContext);
  return context?.setLanguage ?? (async () => {});
}

export default I18nProvider;
