/**
 * Design Tokens
 * Single source of truth for all design values (colors, spacing, typography, etc.)
 * These tokens are used across Mantine theme, Tailwind config, and CSS variables
 */

/**
 * Color tokens for light and dark themes
 */
const COLORS = {
  // Primary brand colors
  PRIMARY: '#3B82F6',
  PRIMARY_LIGHT: '#60A5FA',
  PRIMARY_DARK: '#1E40AF',

  // Secondary brand colors
  SECONDARY: '#8B5CF6',
  SECONDARY_LIGHT: '#A78BFA',
  SECONDARY_DARK: '#6D28D9',

  // Semantic colors
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#34D399',
  SUCCESS_DARK: '#059669',

  ERROR: '#EF4444',
  ERROR_LIGHT: '#F87171',
  ERROR_DARK: '#DC2626',

  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FBBF24',
  WARNING_DARK: '#D97706',

  INFO: '#06B6D4',
  INFO_LIGHT: '#22D3EE',
  INFO_DARK: '#0891B2',

  // Neutral colors (light theme)
  LIGHT_TEXT_PRIMARY: '#1F2937',
  LIGHT_TEXT_SECONDARY: '#6B7280',
  LIGHT_TEXT_TERTIARY: '#9CA3AF',
  LIGHT_BACKGROUND: '#FFFFFF',
  LIGHT_SURFACE: '#F9FAFB',
  LIGHT_BORDER: '#E5E7EB',

  // Neutral colors (dark theme)
  DARK_TEXT_PRIMARY: '#F9FAFB',
  DARK_TEXT_SECONDARY: '#D1D5DB',
  DARK_TEXT_TERTIARY: '#9CA3AF',
  DARK_BACKGROUND: '#111827',
  DARK_SURFACE: '#1F2937',
  DARK_BORDER: '#374151',
} as const;

/**
 * Spacing tokens (based on 4px grid system)
 */
const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
  XXXL: '64px',
} as const;

/**
 * Typography tokens
 */
const TYPOGRAPHY = {
  FONT_FAMILY: {
    SANS: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    MONO: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Droid Sans Mono", "Source Code Pro", monospace',
  },
  FONT_SIZE: {
    XS: '12px',
    SM: '14px',
    BASE: '16px',
    LG: '18px',
    XL: '20px',
    XXL: '24px',
    XXXL: '32px',
    XXXXL: '48px',
  },
  FONT_WEIGHT: {
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75,
  },
} as const;

/**
 * Shadow tokens for depth and elevation
 */
const SHADOWS = {
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  XXL: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

/**
 * Border radius tokens
 */
const RADIUS = {
  SM: '4px',
  MD: '8px',
  LG: '12px',
  XL: '16px',
  FULL: '9999px',
} as const;

/**
 * Z-index tokens for stacking context
 */
const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
} as const;

/**
 * Breakpoint tokens for responsive design
 */
const BREAKPOINTS = {
  XS: '480px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  XXL: '1536px',
} as const;

/**
 * Animation/Transition tokens
 */
const TRANSITIONS = {
  DURATION: {
    FAST: '150ms',
    NORMAL: '250ms',
    SLOW: '350ms',
  },
  EASING: {
    LINEAR: 'linear',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Combined design tokens object
 * Export this as the single source of truth
 */
export const DESIGN_TOKENS = {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  RADIUS,
  Z_INDEX,
  BREAKPOINTS,
  TRANSITIONS,
} as const;

/**
 * Type exports for TypeScript
 */
export type DesignTokens = typeof DESIGN_TOKENS;
export type ColorToken = keyof typeof COLORS;
export type SpacingToken = keyof typeof SPACING;
export type FontSizeToken = keyof typeof TYPOGRAPHY.FONT_SIZE;
export type FontWeightToken = keyof typeof TYPOGRAPHY.FONT_WEIGHT;

/**
 * Helper function to get CSS variable name from token
 * @param category - Token category (e.g., 'color', 'spacing')
 * @param key - Token key (e.g., 'PRIMARY', 'MD')
 * @returns CSS variable name (e.g., '--color-primary')
 */
export function getCSSVarName(category: string, key: string): string {
  return `--${category.toLowerCase()}-${key.toLowerCase().replace(/_/g, '-')}`;
}
