/**
 * Mantine Theme Configuration
 * Maps design tokens to Mantine's theme structure
 */

import { createTheme, MantineThemeOverride } from '@mantine/core';
import { DESIGN_TOKENS } from './tokens';

/**
 * Creates a Mantine theme object based on the current theme mode
 * @param isDark - Whether dark mode is enabled
 * @returns Mantine theme configuration
 */
export function createMantineTheme(isDark: boolean) {
  return createTheme({
    // Map design tokens to Mantine colors
    colors: {
      primary: [
        DESIGN_TOKENS.COLORS.PRIMARY_LIGHT,
        DESIGN_TOKENS.COLORS.PRIMARY_LIGHT,
        DESIGN_TOKENS.COLORS.PRIMARY_LIGHT,
        DESIGN_TOKENS.COLORS.PRIMARY,
        DESIGN_TOKENS.COLORS.PRIMARY,
        DESIGN_TOKENS.COLORS.PRIMARY,
        DESIGN_TOKENS.COLORS.PRIMARY_DARK,
        DESIGN_TOKENS.COLORS.PRIMARY_DARK,
        DESIGN_TOKENS.COLORS.PRIMARY_DARK,
        DESIGN_TOKENS.COLORS.PRIMARY_DARK,
      ],
      secondary: [
        DESIGN_TOKENS.COLORS.SECONDARY_LIGHT,
        DESIGN_TOKENS.COLORS.SECONDARY_LIGHT,
        DESIGN_TOKENS.COLORS.SECONDARY_LIGHT,
        DESIGN_TOKENS.COLORS.SECONDARY,
        DESIGN_TOKENS.COLORS.SECONDARY,
        DESIGN_TOKENS.COLORS.SECONDARY,
        DESIGN_TOKENS.COLORS.SECONDARY_DARK,
        DESIGN_TOKENS.COLORS.SECONDARY_DARK,
        DESIGN_TOKENS.COLORS.SECONDARY_DARK,
        DESIGN_TOKENS.COLORS.SECONDARY_DARK,
      ],
    },

    primaryColor: 'primary',

    // Spacing
    spacing: {
      xs: DESIGN_TOKENS.SPACING.XS,
      sm: DESIGN_TOKENS.SPACING.SM,
      md: DESIGN_TOKENS.SPACING.MD,
      lg: DESIGN_TOKENS.SPACING.LG,
      xl: DESIGN_TOKENS.SPACING.XL,
    },

    // Typography
    fontFamily: DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.SANS,
    fontFamilyMonospace: DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.MONO,

    fontSizes: {
      xs: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XS,
      sm: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.SM,
      md: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.BASE,
      lg: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.LG,
      xl: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XL,
    },

    // Border radius
    radius: {
      xs: DESIGN_TOKENS.RADIUS.SM,
      sm: DESIGN_TOKENS.RADIUS.SM,
      md: DESIGN_TOKENS.RADIUS.MD,
      lg: DESIGN_TOKENS.RADIUS.LG,
      xl: DESIGN_TOKENS.RADIUS.XL,
    },

    // Shadows
    shadows: {
      xs: DESIGN_TOKENS.SHADOWS.SM,
      sm: DESIGN_TOKENS.SHADOWS.SM,
      md: DESIGN_TOKENS.SHADOWS.MD,
      lg: DESIGN_TOKENS.SHADOWS.LG,
      xl: DESIGN_TOKENS.SHADOWS.XL,
    },

    // Breakpoints
    breakpoints: {
      xs: DESIGN_TOKENS.BREAKPOINTS.XS,
      sm: DESIGN_TOKENS.BREAKPOINTS.SM,
      md: DESIGN_TOKENS.BREAKPOINTS.MD,
      lg: DESIGN_TOKENS.BREAKPOINTS.LG,
      xl: DESIGN_TOKENS.BREAKPOINTS.XL,
    },

    // Component-specific overrides
    components: {
      Button: {
        styles: {
          root: {
            fontWeight: DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
            transition: `all ${DESIGN_TOKENS.TRANSITIONS.DURATION.NORMAL} ${DESIGN_TOKENS.TRANSITIONS.EASING.EASE_IN_OUT}`,
          },
        },
        defaultProps: {
          radius: 'md',
        },
      },

      Input: {
        styles: {
          input: {
            borderColor: isDark
              ? DESIGN_TOKENS.COLORS.DARK_BORDER
              : DESIGN_TOKENS.COLORS.LIGHT_BORDER,
            backgroundColor: isDark
              ? DESIGN_TOKENS.COLORS.DARK_SURFACE
              : DESIGN_TOKENS.COLORS.LIGHT_SURFACE,
            color: isDark
              ? DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY
              : DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY,
            '&:focus': {
              borderColor: DESIGN_TOKENS.COLORS.PRIMARY,
              outline: `2px solid ${DESIGN_TOKENS.COLORS.PRIMARY}33`,
            },
          },
        },
      },

      Modal: {
        styles: {
          modal: {
            backgroundColor: isDark
              ? DESIGN_TOKENS.COLORS.DARK_BACKGROUND
              : DESIGN_TOKENS.COLORS.LIGHT_BACKGROUND,
            borderRadius: DESIGN_TOKENS.RADIUS.LG,
            boxShadow: DESIGN_TOKENS.SHADOWS.XL,
          },
          overlay: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
          },
        },
      },

      Card: {
        styles: {
          root: {
            backgroundColor: isDark
              ? DESIGN_TOKENS.COLORS.DARK_SURFACE
              : DESIGN_TOKENS.COLORS.LIGHT_SURFACE,
            borderColor: isDark
              ? DESIGN_TOKENS.COLORS.DARK_BORDER
              : DESIGN_TOKENS.COLORS.LIGHT_BORDER,
            boxShadow: DESIGN_TOKENS.SHADOWS.MD,
            transition: `all ${DESIGN_TOKENS.TRANSITIONS.DURATION.NORMAL} ${DESIGN_TOKENS.TRANSITIONS.EASING.EASE_IN_OUT}`,
            '&:hover': {
              boxShadow: DESIGN_TOKENS.SHADOWS.LG,
              transform: 'translateY(-2px)',
            },
          },
        },
        defaultProps: {
          radius: 'md',
          withBorder: true,
        },
      },

      Badge: {
        styles: {
          root: {
            fontWeight: DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
            textTransform: 'uppercase',
            fontSize: DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE.XS,
          },
        },
      },

      Text: {
        styles: {
          root: {
            color: isDark
              ? DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY
              : DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY,
          },
        },
      },

      Title: {
        styles: {
          root: {
            color: isDark
              ? DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY
              : DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY,
            fontWeight: DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT.BOLD,
          },
        },
      },
    },
  });
}

export default createMantineTheme;
