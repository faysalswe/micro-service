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
      // Colors
      colors: {
        primary: {
          DEFAULT: DESIGN_TOKENS.COLORS.PRIMARY,
          light: DESIGN_TOKENS.COLORS.PRIMARY_LIGHT,
          dark: DESIGN_TOKENS.COLORS.PRIMARY_DARK,
        },
        secondary: {
          DEFAULT: DESIGN_TOKENS.COLORS.SECONDARY,
          light: DESIGN_TOKENS.COLORS.SECONDARY_LIGHT,
          dark: DESIGN_TOKENS.COLORS.SECONDARY_DARK,
        },
        success: {
          DEFAULT: DESIGN_TOKENS.COLORS.SUCCESS,
          light: DESIGN_TOKENS.COLORS.SUCCESS_LIGHT,
          dark: DESIGN_TOKENS.COLORS.SUCCESS_DARK,
        },
        error: {
          DEFAULT: DESIGN_TOKENS.COLORS.ERROR,
          light: DESIGN_TOKENS.COLORS.ERROR_LIGHT,
          dark: DESIGN_TOKENS.COLORS.ERROR_DARK,
        },
        warning: {
          DEFAULT: DESIGN_TOKENS.COLORS.WARNING,
          light: DESIGN_TOKENS.COLORS.WARNING_LIGHT,
          dark: DESIGN_TOKENS.COLORS.WARNING_DARK,
        },
        info: {
          DEFAULT: DESIGN_TOKENS.COLORS.INFO,
          light: DESIGN_TOKENS.COLORS.INFO_LIGHT,
          dark: DESIGN_TOKENS.COLORS.INFO_DARK,
        },
      },

      // Spacing
      spacing: {
        xs: DESIGN_TOKENS.SPACING.XS,
        sm: DESIGN_TOKENS.SPACING.SM,
        md: DESIGN_TOKENS.SPACING.MD,
        lg: DESIGN_TOKENS.SPACING.LG,
        xl: DESIGN_TOKENS.SPACING.XL,
        '2xl': DESIGN_TOKENS.SPACING.XXL,
        '3xl': DESIGN_TOKENS.SPACING.XXXL,
      },

      // Font family
      fontFamily: {
        sans: DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.SANS.split(', '),
        mono: DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.MONO.split(', '),
      },

      // Font size
      fontSize: {
        xs: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XS,
        sm: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.SM,
        base: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.BASE,
        lg: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.LG,
        xl: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XL,
        '2xl': DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XXL,
        '3xl': DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XXXL,
        '4xl': DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XXXXL,
      },

      // Font weight
      fontWeight: {
        normal: String(DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.NORMAL),
        medium: String(DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.MEDIUM),
        semibold: String(DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD),
        bold: String(DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.BOLD),
      },

      // Box shadow
      boxShadow: {
        sm: DESIGN_TOKENS.SHADOWS.SM,
        DEFAULT: DESIGN_TOKENS.SHADOWS.MD,
        md: DESIGN_TOKENS.SHADOWS.MD,
        lg: DESIGN_TOKENS.SHADOWS.LG,
        xl: DESIGN_TOKENS.SHADOWS.XL,
        '2xl': DESIGN_TOKENS.SHADOWS.XXL,
      },

      // Border radius
      borderRadius: {
        sm: DESIGN_TOKENS.RADIUS.SM,
        DEFAULT: DESIGN_TOKENS.RADIUS.MD,
        md: DESIGN_TOKENS.RADIUS.MD,
        lg: DESIGN_TOKENS.RADIUS.LG,
        xl: DESIGN_TOKENS.RADIUS.XL,
        full: DESIGN_TOKENS.RADIUS.FULL,
      },

      // Z-index
      zIndex: {
        base: String(DESIGN_TOKENS.Z_INDEX.BASE),
        dropdown: String(DESIGN_TOKENS.Z_INDEX.DROPDOWN),
        sticky: String(DESIGN_TOKENS.Z_INDEX.STICKY),
        fixed: String(DESIGN_TOKENS.Z_INDEX.FIXED),
        'modal-backdrop': String(DESIGN_TOKENS.Z_INDEX.MODAL_BACKDROP),
        modal: String(DESIGN_TOKENS.Z_INDEX.MODAL),
        popover: String(DESIGN_TOKENS.Z_INDEX.POPOVER),
        tooltip: String(DESIGN_TOKENS.Z_INDEX.TOOLTIP),
      },

      // Transitions
      transitionDuration: {
        fast: DESIGN_TOKENS.TRANSITIONS.DURATION.FAST,
        normal: DESIGN_TOKENS.TRANSITIONS.DURATION.NORMAL,
        slow: DESIGN_TOKENS.TRANSITIONS.DURATION.SLOW,
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
    function ({ addUtilities }) {
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
          gap: DESIGN_TOKENS.SPACING.MD,
        },
        '.container-fixed': {
          width: '100%',
          'max-width': '1280px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': DESIGN_TOKENS.SPACING.MD,
          'padding-right': DESIGN_TOKENS.SPACING.MD,
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
