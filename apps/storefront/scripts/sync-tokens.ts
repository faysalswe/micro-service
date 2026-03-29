import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DESIGN_TOKENS } from '../app/config/tokens.js';

/**
 * Transparency Script: Sync Tokens to CSS
 * Reads tokens from tokens.ts and writes them into globals.css
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBALS_CSS_PATH = path.resolve(__dirname, '../app/styles/globals.css');

function generateCSSContent() {
  const toVarName = (cat: string, key: string) => 
    `--${cat.toLowerCase()}-${key.toLowerCase().replace(/_/g, '-')}`;

  let css = '/* --- BEGIN GENERATED TOKENS --- */\n';
  css += '/* This section is automatically generated. Do not edit manually. */\n';
  css += ':root {\n';

  // Helper to append tokens
  const appendTokens = (obj: any, cat: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object') return;
      css += `  ${toVarName(cat, key)}: ${value};\n`;
    });
  };

  appendTokens(DESIGN_TOKENS.SPACING, 'spacing');
  appendTokens(DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE, 'font-size');
  appendTokens(DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT, 'font-weight');
  appendTokens(DESIGN_TOKENS.TYPOGRAPHY.LINE_HEIGHT, 'line-height');
  appendTokens(DESIGN_TOKENS.SHADOWS, 'shadow');
  appendTokens(DESIGN_TOKENS.RADIUS, 'radius');
  appendTokens(DESIGN_TOKENS.Z_INDEX, 'z');

  css += `  --font-family-sans: ${DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.SANS};\n`;
  css += `  --font-family-mono: ${DESIGN_TOKENS.TYPOGRAPHY.FONT_FAMILY.MONO};\n`;
  css += `  --transition-fast: ${DESIGN_TOKENS.TRANSITIONS.DURATION.FAST};\n`;
  css += `  --transition-normal: ${DESIGN_TOKENS.TRANSITIONS.DURATION.NORMAL};\n`;
  css += `  --transition-slow: ${DESIGN_TOKENS.TRANSITIONS.DURATION.SLOW};\n`;

  // Default colors (Light Mode)
  css += '\n  /* Colors - Light Theme */\n';
  css += `  --color-primary: ${DESIGN_TOKENS.COLORS.PRIMARY};\n`;
  css += `  --color-primary-light: ${DESIGN_TOKENS.COLORS.PRIMARY_LIGHT};\n`;
  css += `  --color-primary-dark: ${DESIGN_TOKENS.COLORS.PRIMARY_DARK};\n`;
  css += `  --color-secondary: ${DESIGN_TOKENS.COLORS.SECONDARY};\n`;
  css += `  --color-secondary-light: ${DESIGN_TOKENS.COLORS.SECONDARY_LIGHT};\n`;
  css += `  --color-secondary-dark: ${DESIGN_TOKENS.COLORS.SECONDARY_DARK};\n`;
  css += `  --color-success: ${DESIGN_TOKENS.COLORS.SUCCESS};\n`;
  css += `  --color-error: ${DESIGN_TOKENS.COLORS.ERROR};\n`;
  css += `  --color-warning: ${DESIGN_TOKENS.COLORS.WARNING};\n`;
  css += `  --color-info: ${DESIGN_TOKENS.COLORS.INFO};\n`;
  css += `  --color-text-primary: ${DESIGN_TOKENS.COLORS.LIGHT_TEXT_PRIMARY};\n`;
  css += `  --color-text-secondary: ${DESIGN_TOKENS.COLORS.LIGHT_TEXT_SECONDARY};\n`;
  css += `  --color-text-tertiary: ${DESIGN_TOKENS.COLORS.LIGHT_TEXT_TERTIARY};\n`;
  css += `  --color-background: ${DESIGN_TOKENS.COLORS.LIGHT_BACKGROUND};\n`;
  css += `  --color-surface: ${DESIGN_TOKENS.COLORS.LIGHT_SURFACE};\n`;
  css += `  --color-border: ${DESIGN_TOKENS.COLORS.LIGHT_BORDER};\n`;
  css += '}\n\n';

  // Dark Mode
  css += ':root[data-theme="dark"] {\n';
  css += '  /* Colors - Dark Theme Override */\n';
  css += `  --color-primary: ${DESIGN_TOKENS.COLORS.PRIMARY_LIGHT};\n`;
  css += `  --color-secondary: ${DESIGN_TOKENS.COLORS.SECONDARY_LIGHT};\n`;
  css += `  --color-success: ${DESIGN_TOKENS.COLORS.SUCCESS_LIGHT};\n`;
  css += `  --color-error: ${DESIGN_TOKENS.COLORS.ERROR_LIGHT};\n`;
  css += `  --color-warning: ${DESIGN_TOKENS.COLORS.WARNING_LIGHT};\n`;
  css += `  --color-info: ${DESIGN_TOKENS.COLORS.INFO_LIGHT};\n`;
  css += `  --color-text-primary: ${DESIGN_TOKENS.COLORS.DARK_TEXT_PRIMARY};\n`;
  css += `  --color-text-secondary: ${DESIGN_TOKENS.COLORS.DARK_TEXT_SECONDARY};\n`;
  css += `  --color-text-tertiary: ${DESIGN_TOKENS.COLORS.DARK_TEXT_TERTIARY};\n`;
  css += `  --color-background: ${DESIGN_TOKENS.COLORS.DARK_BACKGROUND};\n`;
  css += `  --color-surface: ${DESIGN_TOKENS.COLORS.DARK_SURFACE};\n`;
  css += `  --color-border: ${DESIGN_TOKENS.COLORS.DARK_BORDER};\n`;
  css += '}\n';
  css += '/* --- END GENERATED TOKENS --- */';

  return css;
}

function sync() {
  const currentContent = fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');
  const newTokensContent = generateCSSContent();

  const regex = /\/\* --- BEGIN GENERATED TOKENS --- \*\/[\s\S]*\/\* --- END GENERATED TOKENS --- \*\//;
  
  let updatedContent;
  if (regex.test(currentContent)) {
    updatedContent = currentContent.replace(regex, newTokensContent);
  } else {
    // Add it after the tailwind imports
    updatedContent = currentContent.replace(
      /@tailwind utilities;/,
      `@tailwind utilities;\n\n${newTokensContent}`
    );
  }

  fs.writeFileSync(GLOBALS_CSS_PATH, updatedContent);
  console.log('✅ globals.css has been synchronized with tokens.ts');
}

sync();
