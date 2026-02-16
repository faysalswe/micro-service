/**
 * Theme Server Utilities
 * Server-side utilities for handling theme and language
 */

import { DESIGN_TOKENS } from '~/config/tokens';
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

/**
 * Generate CSS variables string for a given theme
 * @param {Theme} theme - Theme to generate variables for
 * @returns {string} CSS variables as string
 */
export function getCSSVariables(theme: Theme): string {
  const isDark = theme === 'dark';

  return `
    :root {
      /* Colors - Primary */
      --color-primary: ${isDark ? DESIGN_TOKENS.COLORS.PRIMARY_LIGHT : DESIGN_TOKENS.COLORS.PRIMARY};
      --color-primary-light: ${DESIGN_TOKENS.COLORS.PRIMARY_LIGHT};
      --color-primary-dark: ${DESIGN_TOKENS.COLORS.PRIMARY_DARK};

      /* Colors - Secondary */
      --color-secondary: ${isDark ? DESIGN_TOKENS.COLORS.SECONDARY_LIGHT : DESIGN_TOKENS.COLORS.SECONDARY};
      --color-secondary-light: ${DESIGN_TOKENS.COLORS.SECONDARY_LIGHT};
      --color-secondary-dark: ${DESIGN_TOKENS.COLORS.SECONDARY_DARK};

      /* Colors - Semantic */
      --color-success: ${isDark ? DESIGN_TOKENS.COLORS.SUCCESS_LIGHT : DESIGN_TOKENS.COLORS.SUCCESS};
      --color-error: ${isDark ? DESIGN_TOKENS.COLORS.ERROR_LIGHT : DESIGN_TOKENS.COLORS.ERROR};
      --color-warning: ${isDark ? DESIGN_TOKENS.COLORS.WARNING_LIGHT : DESIGN_TOKENS.COLORS.WARNING};
      --color-info: ${isDark ? DESIGN_TOKENS.COLORS.INFO_LIGHT : DESIGN_TOKENS.COLORS.INFO};

      /* Colors - Neutral */
      --color-text-primary: ${isDark ? DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY : DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY};
      --color-text-secondary: ${isDark ? DESIGN_TOKENS.COLORS.DARK_TEXT_SECONDARY : DESIGN_TOKENS.COLORS.LIGHT_TEXT_SECONDARY};
      --color-text-tertiary: ${isDark ? DESIGN_TOKENS.COLORS.DARK_TEXT_TERTIARY : DESIGN_TOKENS.COLORS.LIGHT_TEXT_TERTIARY};
      --color-background: ${isDark ? DESIGN_TOKENS.COLORS.DARK_BACKGROUND : DESIGN_TOKENS.COLORS.LIGHT_BACKGROUND};
      --color-surface: ${isDark ? DESIGN_TOKENS.COLORS.DARK_SURFACE : DESIGN_TOKENS.COLORS.LIGHT_SURFACE};
      --color-border: ${isDark ? DESIGN_TOKENS.COLORS.DARK_BORDER : DESIGN_TOKENS.COLORS.LIGHT_BORDER};
    }
  `;
}

/**
 * Parse cookies from cookie header string
 * @param {string} cookieHeader - Cookie header string
 * @returns {Record<string, string>} Parsed cookies
 */
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
