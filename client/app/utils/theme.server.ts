/**
 * Theme Server Utilities
 * Server-side utilities for handling theme and language
 */

import type { Theme } from '~/types';
import type { SupportedLanguage } from '~/i18n/config';

/**
 * Get theme from request cookies
 * @param {Request} request - Remix request object
 * @returns {Theme} Theme from cookie or default
 */
export function getThemeFromRequest(request: Request): Theme {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return 'light';

  const cookies = parseCookies(cookieHeader);
  const theme = cookies['theme'];

  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Get language from request cookies or Accept-Language header
 * @param {Request} request - Remix request object
 * @returns {SupportedLanguage} Language from cookie/header or default
 */
export function getLanguageFromRequest(request: Request): SupportedLanguage {
  const cookieHeader = request.headers.get('Cookie');

  // Try cookie first
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const language = cookies['language'] || cookies['i18next'];

    if (
      language &&
      ['en', 'bn', 'de'].includes(language)
    ) {
      return language as SupportedLanguage;
    }
  }

  // Try Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const primaryLanguage = acceptLanguage.split(',')[0]?.split('-')[0];
    if (
      primaryLanguage &&
      ['en', 'bn', 'de'].includes(primaryLanguage)
    ) {
      return primaryLanguage as SupportedLanguage;
    }
  }

  return 'en';
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Create a Set-Cookie header for theme
 * @param {Theme} theme - Theme to set
 * @returns {string} Set-Cookie header value
 */
export function createThemeCookie(theme: Theme): string {
  return `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Create a Set-Cookie header for language
 * @param {SupportedLanguage} language - Language to set
 * @returns {string} Set-Cookie header value
 */
export function createLanguageCookie(language: SupportedLanguage): string {
  return `language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
