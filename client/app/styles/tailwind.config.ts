/**
 * Tailwind CSS Configuration
 * Extends Tailwind with design tokens from tokens.ts
 */

import type { Config } from 'tailwindcss';
import { DESIGN_TOKENS } from '../config/tokens';

const config: Config = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],

  // Dark mode uses data-theme attribute
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // Colors - mapped to CSS variables for transparency
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          light: 'var(--color-secondary-light)',
          dark: 'var(--color-secondary-dark)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          dark: 'var(--color-success-dark)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
          dark: 'var(--color-error-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
          dark: 'var(--color-warning-dark)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          dark: 'var(--color-info-dark)',
        },
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        background: 'var(--color-background)',
      },

      // Spacing - mapped to CSS variables
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-xxl)',
        '3xl': 'var(--spacing-xxxl)',
      },

      // Font family
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },

      // Font size
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-xxl)',
        '3xl': 'var(--font-size-xxxl)',
        '4xl': 'var(--font-size-xxxxl)',
      },

      // Font weight
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },

      // Box shadow
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-xxl)',
      },

      // Border radius
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      // Z-index
      zIndex: {
        base: 'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },

      // Transitions
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      },

      transitionTimingFunction: {
        'ease-in': DESIGN_TOKENS.TRANSITIONS.EASING.EASE_IN,
        'ease-out': DESIGN_TOKENS.TRANSITIONS.EASING.EASE_OUT,
        'ease-in-out': DESIGN_TOKENS.TRANSITIONS.EASING.EASE_IN_OUT,
      },
    },
  },

  plugins: [
    // Custom utility plugin
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.flex-center': {
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.flex-between': {
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        },
        '.grid-auto': {
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
        },
        '.container-fixed': {
          width: '100%',
          'max-width': '1280px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': 'var(--spacing-md)',
          'padding-right': 'var(--spacing-md)',
        },
        '.text-truncate': {
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap',
        },
        '.text-clamp': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      };

      addUtilities(newUtilities);
    },
  ],

  // Disable conflicting Tailwind defaults
  corePlugins: {
    preflight: false, // Mantine has its own CSS reset
  },
};

export default config;
