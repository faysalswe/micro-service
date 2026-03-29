# WebApp Development Standards

## Table of Contents
1. [Naming Conventions](#naming-conventions)
2. [File Organization](#file-organization)
3. [Component Structure](#component-structure)
4. [Design Tokens](#design-tokens)
5. [CSS and Styling](#css-and-styling)
6. [Internationalization](#internationalization)
7. [TypeScript](#typescript)
8. [Error Handling](#error-handling)
9. [File Size Limits](#file-size-limits)
10. [Commit Messages](#commit-messages)
11. [DO's and DON'Ts](#dos-and-donts)

---

## Naming Conventions

### JavaScript/TypeScript

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `const userName = 'John';` |
| Functions | camelCase | `function getUserData() {}` |
| Constants | UPPER_SNAKE_CASE | `const API_BASE_URL = '...';` |
| React Components | PascalCase | `function UserProfile() {}` |
| Interfaces/Types | PascalCase | `interface UserData {}` |
| Enums | PascalCase | `enum UserRole {}` |
| Enum Members | UPPER_CASE | `UserRole.ADMIN` |
| Private members | _camelCase | `const _privateVar = 'x';` |

### Files and Folders

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `UserProfile.tsx` |
| Hooks | camelCase.ts | `useTheme.ts` |
| Utils | camelCase.ts | `formatDate.ts` |
| Routes | kebab-case | `user-profile.tsx` |
| CSS files | kebab-case.css | `global-styles.css` |
| Config files | kebab-case | `theme-config.ts` |

### CSS Classes

```css
/* Use design token names - GOOD */
.container {
  padding: var(--spacing-md);
  color: var(--color-primary);
}

/* Hardcoded values - BAD */
.container {
  padding: 16px;
  color: #3B82F6;
}
```

---

## File Organization

```
app/
├── components/
│   ├── providers/          # Context providers
│   ├── ui/                 # Reusable UI components
│   └── features/           # Feature-specific components
├── config/                 # Configuration files
│   ├── tokens.ts           # Design tokens
│   └── theme.ts            # Mantine theme
├── constants/              # App-wide constants
├── hooks/                  # Custom React hooks
├── i18n/                   # Internationalization
│   ├── config.ts
│   └── locales/
│       ├── en/
│       ├── es/
│       ├── fr/
│       └── de/
├── routes/                 # Remix routes
├── styles/                 # Global styles
│   ├── globals.css
│   └── tailwind.config.ts
├── types/                  # TypeScript types
├── utils/                  # Utility functions
│   ├── errors.ts
│   └── theme.server.ts
└── docs/                   # Documentation
```

---

## Component Structure

### Standard Component Template

```typescript
import { FC, ReactNode } from 'react';

/**
 * ComponentName - Brief description of what this component does
 * @param {string} prop1 - Description of prop1
 * @param {boolean} [prop2] - Optional description of prop2
 * @returns {JSX.Element} Rendered component
 */
interface ComponentNameProps {
  prop1: string;
  prop2?: boolean;
  children?: ReactNode;
}

/**
 * ComponentName component
 */
export const ComponentName: FC<ComponentNameProps> = ({
  prop1,
  prop2 = false,
  children,
}) => {
  // Hooks first
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  // Event handlers
  const handleClick = (): void => {
    // handler logic
  };

  // Early returns
  if (!prop1) {
    return null;
  }

  // Main render
  return (
    <div className="flex gap-md items-center">
      <h2 className="text-lg font-semibold">{t('common.title')}</h2>
      {children}
    </div>
  );
};

export default ComponentName;
```

### Component Rules

1. **Single Responsibility**: Each component does one thing well
2. **Props Interface**: Always define interface for props
3. **JSDoc Required**: Document all exported components
4. **Named + Default Export**: Export both ways for flexibility
5. **Hooks First**: Call hooks at the top, before any logic
6. **Early Returns**: Handle edge cases early
7. **Event Handlers**: Prefix with `handle` (e.g., `handleClick`)
8. **Max 300 Lines**: Extract to smaller components if larger

---

## Design Tokens

### Token Naming

All design tokens use `UPPER_SNAKE_CASE` in code, but are referenced via CSS variables or Tailwind classes.

```typescript
// tokens.ts
export const DESIGN_TOKENS = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#8B5CF6',
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
  },
  // ...
};
```

### Using Tokens

**CSS Variables (preferred for dynamic values):**
```css
.card {
  background: var(--color-surface);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

**Tailwind Classes (preferred for static layouts):**
```tsx
<div className="flex gap-md p-lg rounded-md bg-surface">
  <Button variant="primary">Submit</Button>
</div>
```

**JavaScript (when you need programmatic access):**
```typescript
import { useThemeTokens } from '~/hooks/useThemeTokens';

const { tokens } = useThemeTokens();
const primaryColor = tokens.COLORS.PRIMARY;
```

### Adding New Tokens

1. Add to `app/config/tokens.ts`
2. Update `app/config/theme.ts` (Mantine theme)
3. Update `app/styles/tailwind.config.ts`
4. Update `app/styles/globals.css` (CSS variables)
5. Document in `app/docs/THEME_MAINTENANCE.md`

---

## CSS and Styling

### Hierarchy

1. **Mantine Components**: Use for interactive UI (Button, Modal, Input, etc.)
2. **Tailwind Utilities**: Use for layout (flex, grid, gap, padding, etc.)
3. **CSS Variables**: Use for dynamic theming
4. **Custom CSS**: Only when the above don't suffice

### Examples

```tsx
// GOOD: Combining Mantine + Tailwind
<Button className="flex-1 mt-md">
  {t('common.button_submit')}
</Button>

// GOOD: Using design tokens
<div className="p-lg gap-md flex">
  <Text size="base" weight={600} color="var(--color-primary)">
    {title}
  </Text>
</div>

// BAD: Hardcoded values
<div style={{ padding: '24px', gap: '16px', display: 'flex' }}>
  <p style={{ fontSize: '16px', fontWeight: 600, color: '#3B82F6' }}>
    {title}
  </p>
</div>
```

### Never Hardcode

❌ **Don't:**
- `padding: 16px` → Use `padding: var(--spacing-md)` or `className="p-md"`
- `color: #3B82F6` → Use `color: var(--color-primary)`
- `font-size: 18px` → Use `className="text-lg"`
- `z-index: 999` → Use `z-index: var(--z-modal)`

---

## Internationalization

### Key Hierarchy

Use dot notation: `namespace.section.key`

```json
{
  "forms": {
    "validation": {
      "email_required": "Email is required",
      "email_invalid": "Invalid email format"
    },
    "labels": {
      "email": "Email Address",
      "password": "Password"
    }
  }
}
```

### Usage

```typescript
import { useTranslation } from '~/hooks/useTranslation';

const { t } = useTranslation();

// Basic
t('common.app_name') // "MyApp"

// Nested
t('forms.validation.email_required') // "Email is required"

// Interpolation
t('common.greeting', { name: 'John' }) // "Hello John"

// Pluralization
t('common.items_count', { count: 5 }) // "5 items"
```

### Adding Translations

1. Add key to `/app/i18n/locales/en/[namespace].json`
2. Add translations for all languages (en, es, fr, de)
3. Use via `t('namespace.key')`
4. Never hardcode strings in components

---

## TypeScript

### Strict Mode Rules

```typescript
// ✅ GOOD: Explicit types
interface User {
  id: string;
  name: string;
  role: UserRole;
}

function getUser(id: string): User | null {
  // ...
}

// ❌ BAD: 'any' type
function getUser(id: any): any {
  // ...
}

// ✅ GOOD: Handle nulls
const user = getUser('123');
if (user) {
  console.log(user.name);
}

// ❌ BAD: No null check
const user = getUser('123');
console.log(user.name); // Could crash
```

### Type Exports

All shared types go in `/app/types/`:

```typescript
// app/types/index.ts
export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es' | 'fr' | 'de';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

---

## Error Handling

### Custom Error Classes

```typescript
// app/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
```

### Usage in Routes

```typescript
// app/routes/users.$id.tsx
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const user = await getUser(params.id);

  if (!user) {
    throw new NotFoundError('User');
  }

  return json({ user });
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof NotFoundError) {
    return <NotFoundPage />;
  }

  return <GenericErrorPage />;
}
```

---

## File Size Limits

| File Type | Max Lines | Action if Exceeded |
|-----------|-----------|-------------------|
| Component | 300 | Extract child components |
| Route | 200 | Move logic to utils/services |
| Hook | 150 | Split into multiple hooks |
| Util | 200 | Split into focused modules |

**When to Extract:**

- Component > 300 lines → Create child components or hooks
- Repeated logic → Create utility function
- Complex state → Create custom hook
- API calls → Create service module

---

## Commit Messages

### Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding/updating tests
- `chore`: Build process, dependencies
- `perf`: Performance improvements

### Examples

```bash
feat: add user profile page with avatar upload

fix: resolve theme toggle hydration mismatch

docs: update STANDARDS.md with i18n guidelines

refactor: extract form validation to custom hook

perf: implement virtual scrolling for user list
```

---

## DO's and DON'Ts

### ✅ DO

- **DO** use design tokens for all colors, spacing, and sizes
- **DO** add JSDoc to all exported functions and components
- **DO** handle loading and error states in components
- **DO** use TypeScript strict mode (no `any` types)
- **DO** use `t()` for all user-facing strings
- **DO** write components under 300 lines
- **DO** test components for accessibility (WCAG AA)
- **DO** use semantic HTML (`<main>`, `<nav>`, `<article>`)
- **DO** handle null/undefined cases explicitly
- **DO** prefer composition over complex components
- **DO** use named exports + default export
- **DO** keep commits atomic (one feature/fix per commit)
- **DO** run `npm run lint` and `npm run type-check` before committing
- **DO** use Mantine for UI, Tailwind for layout

### ❌ DON'T

- **DON'T** hardcode colors (`#3B82F6` → use tokens)
- **DON'T** hardcode spacing (`16px` → use `var(--spacing-md)`)
- **DON'T** use `console.log` in production code
- **DON'T** use `any` type
- **DON'T** hardcode strings (use i18n keys)
- **DON'T** create files over size limits
- **DON'T** skip JSDoc on exports
- **DON'T** ignore TypeScript errors
- **DON'T** commit without linting
- **DON'T** mix styling approaches (pick Mantine/Tailwind/CSS deliberately)
- **DON'T** create abstractions prematurely
- **DON'T** add comments for obvious code
- **DON'T** use magic numbers (define constants)
- **DON'T** skip error handling

---

## Quick Checklist

Before committing code, verify:

- [ ] All exports have JSDoc
- [ ] No `any` types
- [ ] No hardcoded colors/spacing
- [ ] All strings use `t()` for i18n
- [ ] Components under 300 lines
- [ ] Routes under 200 lines
- [ ] Hooks under 150 lines
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript passes (`npm run type-check`)
- [ ] Prettier formatted (`npm run format`)
- [ ] Commit message follows format
- [ ] No `console.log` statements
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Null/undefined handled
- [ ] Semantic HTML used
- [ ] Accessible (keyboard navigation, ARIA labels)

---

**Remember**: These standards ensure consistency, maintainability, and scalability. When in doubt, refer to existing code that follows these patterns.
