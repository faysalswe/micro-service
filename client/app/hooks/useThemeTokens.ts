/**
 * useThemeTokens Hook
 * Provides access to design tokens in JavaScript
 */

import { useMemo } from 'react';
import { DESIGN_TOKENS, DesignTokens } from '~/config/tokens';
import { useTheme } from './useTheme';

/**
 * Merged tokens with theme-specific values
 */
export interface MergedTokens extends DesignTokens {
  CURRENT_COLORS: {
    TEXT_PRIMARY: string;
    TEXT_SECONDARY: string;
    TEXT_TERTIARY: string;
    BACKGROUND: string;
    SURFACE: string;
    BORDER: string;
  };
}

/**
 * Return type for useThemeTokens hook
 */
export interface UseThemeTokensReturn {
  tokens: DesignTokens;
  isDark: boolean;
  current: MergedTokens;
}

/**
 * Hook to access design tokens in JavaScript
 * @returns {UseThemeTokensReturn} Design tokens and current theme values
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { tokens, isDark, current } = useThemeTokens();
 *
 *   return (
 *     <div
 *       style={{
 *         padding: tokens.SPACING.MD,
 *         backgroundColor: current.CURRENT_COLORS.SURFACE,
 *         color: current.CURRENT_COLORS.TEXT_PRIMARY,
 *         borderRadius: tokens.RADIUS.MD,
 *       }}
 *     >
 *       <p>Current theme: {isDark ? 'Dark' : 'Light'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemeTokens(): UseThemeTokensReturn {
  const { isDark } = useTheme();

  // Merge theme-specific color values
  const current = useMemo<MergedTokens>(() => {
    const currentColors = {
      TEXT_PRIMARY: isDark
        ? DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY
        : DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY,
      TEXT_SECONDARY: isDark
        ? DESIGN_TOKENS.COLORS.DARK_TEXT_SECONDARY
        : DESIGN_TOKENS.COLORS.LIGHT_TEXT_SECONDARY,
      TEXT_TERTIARY: isDark
        ? DESIGN_TOKENS.COLORS.DARK_TEXT_TERTIARY
        : DESIGN_TOKENS.COLORS.LIGHT_TEXT_TERTIARY,
      BACKGROUND: isDark
        ? DESIGN_TOKENS.COLORS.DARK_BACKGROUND
        : DESIGN_TOKENS.COLORS.LIGHT_BACKGROUND,
      SURFACE: isDark ? DESIGN_TOKENS.COLORS.DARK_SURFACE : DESIGN_TOKENS.COLORS.LIGHT_SURFACE,
      BORDER: isDark ? DESIGN_TOKENS.COLORS.DARK_BORDER : DESIGN_TOKENS.COLORS.LIGHT_BORDER,
    };

    return {
      ...DESIGN_TOKENS,
      CURRENT_COLORS: currentColors,
    };
  }, [isDark]);

  return {
    tokens: DESIGN_TOKENS,
    isDark,
    current,
  };
}

export default useThemeTokens;
