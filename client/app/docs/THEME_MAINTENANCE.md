# Theme Maintenance Guide

Complete guide for managing the design system, tokens, and theming in WebApp.

---

## Table of Contents

1. [Overview](#overview)
2. [Token Management](#token-management)
3. [Component Styling](#component-styling)
4. [Dark Mode](#dark-mode)
5. [Translation Management](#translation-management)
6. [Adding New Tokens](#adding-new-tokens)
7. [Adding New Languages](#adding-new-languages)
8. [Accessibility](#accessibility)
9. [Performance](#performance)
10. [Common Mistakes](#common-mistakes)

---

## Overview

Our design system uses a **single source of truth** approach:

```
tokens.ts → feeds → Mantine Theme + Tailwind Config + CSS Variables
```

This ensures:
- ✅ Consistency across the app
- ✅ Easy theme updates
- ✅ No hardcoded values
- ✅ Automatic light/dark mode

---

## Token Management

### Structure

All design tokens are in `/app/config/tokens.ts`:

```typescript
export const DESIGN_TOKENS = {
  COLORS: { ... },
  SPACING: { ... },
  TYPOGRAPHY: { ... },
  SHADOWS: { ... },
  RADIUS: { ... },
  Z_INDEX: { ... },
  BREAKPOINTS: { ... },
  TRANSITIONS: { ... },
};
```

### DO's

✅ **DO** update tokens.ts as the single source
✅ **DO** use UPPER_SNAKE_CASE for token names
✅ **DO** provide light AND dark variants for colors
✅ **DO** follow the 4px spacing grid (4, 8, 16, 24, 32, 48, 64)
✅ **DO** document why you're adding new tokens

### DON'Ts

❌ **DON'T** hardcode values in components
❌ **DON'T** add tokens without updating all three systems
❌ **DON'T** break naming conventions
❌ **DON'T** add duplicate tokens

---

## Component Styling

### Hierarchy

1. **Mantine Components** - Use for interactive UI
2. **Tailwind Utilities** - Use for layout
3. **CSS Variables** - Use for dynamic theming
4. **Custom CSS** - Last resort only

### Examples

**GOOD: Combining Mantine + Tailwind**
```tsx
<Button className="flex-1 mt-md" size="lg">
  {t('common.submit')}
</Button>
```

**GOOD: Using CSS Variables**
```tsx
<Box sx={{
  padding: 'var(--spacing-md)',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-md)'
}}>
  Content
</Box>
```

**BAD: Hardcoded values**
```tsx
<div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
  Content
</div>
```

### When to Use What

| Use Case | Tool | Example |
|----------|------|---------|
| Buttons, Inputs, Modals | Mantine | `<Button>`, `<TextInput>`, `<Modal>` |
| Layout (flex, grid) | Tailwind | `className="flex gap-md"` |
| Custom spacing | Tailwind | `className="p-lg mt-md"` |
| Dynamic colors | CSS Variables | `color: var(--color-primary)` |
| Theme-aware styling | CSS Variables | `backgroundColor: var(--color-surface)` |

---

## Dark Mode

### How It Works

1. User toggles theme → `useTheme()` hook
2. Theme state stored in localStorage
3. `data-theme` attribute on `<html>`
4. CSS variables update automatically

### Implementation

**In Components:**
```tsx
import { useTheme } from '~/hooks';

function MyComponent() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current mode: {isDarkMode ? 'Dark' : 'Light'}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

**In CSS:**
```css
/* Light mode */
:root {
  --color-background: #ffffff;
}

/* Dark mode */
:root[data-theme="dark"] {
  --color-background: #111827;
}
```

### Requirements

✅ All colors must have dark mode variants
✅ Test all components in both modes
✅ Ensure sufficient contrast (WCAG AA)
✅ No flash of unstyled content (FOUC)

---

## Translation Management

### File Structure

```
app/i18n/locales/
├── en/
│   ├── common.json
│   ├── forms.json
│   ├── errors.json
│   └── navigation.json
├── es/
├── fr/
└── de/
```

### Key Hierarchy

Use dot notation: `namespace.section.key`

```json
{
  "forms": {
    "validation": {
      "email_required": "Email is required",
      "email_invalid": "Invalid email format"
    }
  }
}
```

### Usage

```tsx
import { useTranslation } from '~/hooks';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.hello', { name: 'John' })}</p>
    </div>
  );
}
```

### Rules

✅ **NEVER** hardcode strings
✅ Use interpolation for dynamic values: `{{variable}}`
✅ Add translations for ALL supported languages
✅ Keep keys descriptive and hierarchical

---

## Adding New Tokens

Follow this 5-step process:

### Step 1: Add to tokens.ts

```typescript
// app/config/tokens.ts
const COLORS = {
  // ... existing colors
  BRAND_NEW: '#FF5733',
  BRAND_NEW_LIGHT: '#FF7F66',
  BRAND_NEW_DARK: '#CC4629',
};
```

### Step 2: Update Mantine Theme

```typescript
// app/config/theme.ts
export function createMantineTheme(isDark: boolean) {
  return {
    colors: {
      // ... existing colors
      brandNew: [
        DESIGN_TOKENS.COLORS.BRAND_NEW_LIGHT,
        // ... fill 10 shades
        DESIGN_TOKENS.COLORS.BRAND_NEW_DARK,
      ],
    },
  };
}
```

### Step 3: Update Tailwind Config

```typescript
// app/styles/tailwind.config.ts
theme: {
  extend: {
    colors: {
      // ... existing colors
      'brand-new': {
        DEFAULT: DESIGN_TOKENS.COLORS.BRAND_NEW,
        light: DESIGN_TOKENS.COLORS.BRAND_NEW_LIGHT,
        dark: DESIGN_TOKENS.COLORS.BRAND_NEW_DARK,
      },
    },
  },
}
```

### Step 4: Update CSS Variables

```css
/* app/styles/globals.css */
:root {
  /* ... existing variables */
  --color-brand-new: #FF5733;
  --color-brand-new-light: #FF7F66;
  --color-brand-new-dark: #CC4629;
}

:root[data-theme="dark"] {
  --color-brand-new: #FF7F66; /* Use lighter variant in dark mode */
}
```

### Step 5: Document

Update this file and `STANDARDS.md` with the new token.

---

## Adding New Languages

Follow this 4-step process:

### Step 1: Add to Supported Languages

```typescript
// app/i18n/config.ts
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'] as const;
```

### Step 2: Create Translation Files

```bash
mkdir app/i18n/locales/pt
cp app/i18n/locales/en/*.json app/i18n/locales/pt/
```

Then translate each file to Portuguese.

### Step 3: Update Constants

```typescript
// app/constants/index.ts
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'] as const;
```

### Step 4: Add to Language Selector

Update your language selector component to include the new language.

---

## Accessibility

### Checklist

- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **Focus Indicators**: Visible focus states on all focusable elements
- [ ] **Color Contrast**: WCAG AA compliant (4.5:1 for text, 3:1 for UI)
- [ ] **Screen Readers**: Proper ARIA labels and semantic HTML
- [ ] **Reduced Motion**: Respect `prefers-reduced-motion`
- [ ] **Alt Text**: Images have descriptive alt text
- [ ] **Form Labels**: All inputs have associated labels

### Testing

```bash
# Use axe DevTools or Lighthouse
npm run test:a11y
```

### Example

```tsx
// ✅ GOOD
<button
  aria-label={t('common.close')}
  onClick={handleClose}
>
  <CloseIcon />
</button>

// ❌ BAD
<div onClick={handleClose}>
  <CloseIcon />
</div>
```

---

## Performance

### Checklist

- [ ] **Code Splitting**: Routes automatically split with Remix
- [ ] **Image Optimization**: Use `<img>` with proper sizing
- [ ] **Lazy Loading**: Use React.lazy() for heavy components
- [ ] **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- [ ] **Bundle Size**: Monitor with `npm run build`

### CSS Performance

✅ **DO** use Tailwind utilities (tree-shaken)
✅ **DO** use CSS variables (fast)
❌ **DON'T** import entire CSS libraries
❌ **DON'T** use inline styles excessively

---

## Common Mistakes

### ❌ Mistake 1: Hardcoding Colors

```tsx
// BAD
<div style={{ color: '#3B82F6' }}>Text</div>

// GOOD
<div style={{ color: 'var(--color-primary)' }}>Text</div>
```

### ❌ Mistake 2: Skipping Translations

```tsx
// BAD
<h1>Welcome to our app</h1>

// GOOD
<h1>{t('common.welcome')}</h1>
```

### ❌ Mistake 3: Breaking Token Sync

```tsx
// BAD: Only updating Tailwind config
// tokens.ts → not updated ❌
// theme.ts → not updated ❌
// globals.css → not updated ❌

// GOOD: Update all three
// tokens.ts → ✅
// theme.ts → ✅
// tailwind.config.ts → ✅
// globals.css → ✅
```

### ❌ Mistake 4: Ignoring Dark Mode

```tsx
// BAD: Only works in light mode
<div style={{ backgroundColor: '#ffffff' }}>Content</div>

// GOOD: Works in both modes
<div style={{ backgroundColor: 'var(--color-background)' }}>Content</div>
```

### ❌ Mistake 5: Not Using Hooks

```tsx
// BAD: Accessing localStorage directly
const theme = localStorage.getItem('theme');

// GOOD: Using the hook
const { theme } = useTheme();
```

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| Design Tokens | `/app/config/tokens.ts` |
| Mantine Theme | `/app/config/theme.ts` |
| Tailwind Config | `/app/styles/tailwind.config.ts` |
| Global CSS | `/app/styles/globals.css` |
| Translations | `/app/i18n/locales/` |
| Hooks | `/app/hooks/` |
| Providers | `/app/components/providers/` |

### Common Commands

```bash
# Development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run format
npm run format:check

# Validate everything
npm run validate
```

---

## Need Help?

1. Check `/app/STANDARDS.md`
2. Review component templates
3. Ask the team in #frontend channel
4. Refer to official docs:
   - [Remix](https://remix.run/docs)
   - [Mantine](https://mantine.dev)
   - [Tailwind](https://tailwindcss.com)
