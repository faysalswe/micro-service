# WebApp - Modern Frontend for Microservices

A production-ready web application built with **Remix**, **Mantine**, and **Tailwind CSS**, featuring a complete design system, internationalization, and strict development standards.

---

## 🚀 Features

- ⚡ **Remix** - Full-stack React framework with server-side rendering
- 🎨 **Mantine** - Professional UI component library
- 🎯 **Tailwind CSS** - Utility-first CSS framework
- 🌍 **i18next** - Internationalization (English, Spanish, French, German)
- 🌓 **Dark Mode** - Automatic theme switching with system preference detection
- 📱 **Responsive** - Mobile-first design
- ♿ **Accessible** - WCAG AA compliant
- 🔧 **TypeScript** - Strict mode enabled
- 📏 **ESLint & Prettier** - Code quality enforcement
- 🎭 **Design System** - Centralized design tokens
- 🔒 **Type-Safe** - Full TypeScript coverage

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Development](#development)
5. [Design System](#design-system)
6. [Internationalization](#internationalization)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Documentation](#documentation)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Remix](https://remix.run) |
| **UI Library** | [Mantine](https://mantine.dev) |
| **CSS Framework** | [Tailwind CSS](https://tailwindcss.com) |
| **Language** | TypeScript (Strict Mode) |
| **i18n** | [i18next](https://www.i18next.com) |
| **Linting** | ESLint + Prettier |
| **Package Manager** | npm |
| **Node Version** | ≥20.0.0 |

---

## 📁 Project Structure

```
WebApp/
├── app/
│   ├── components/          # Reusable components
│   │   ├── providers/       # Context providers (Theme, i18n)
│   │   ├── ui/              # UI components
│   │   └── features/        # Feature-specific components
│   ├── config/              # Configuration files
│   │   ├── tokens.ts        # Design tokens (single source of truth)
│   │   └── theme.ts         # Mantine theme configuration
│   ├── constants/           # App-wide constants
│   ├── hooks/               # Custom React hooks
│   │   ├── useTheme.ts      # Theme management
│   │   ├── useTranslation.ts # i18n wrapper
│   │   └── useThemeTokens.ts # Token access
│   ├── i18n/                # Internationalization
│   │   ├── config.ts        # i18next configuration
│   │   └── locales/         # Translation files (en, es, fr, de)
│   ├── routes/              # Remix routes
│   ├── styles/              # Global styles
│   │   ├── globals.css      # Global CSS + variables
│   │   └── tailwind.config.ts # Tailwind configuration
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   └── theme.server.ts  # Server-side theme utilities
│   ├── docs/                # Documentation
│   │   └── THEME_MAINTENANCE.md # Theme guide
│   ├── STANDARDS.md         # Development standards
│   ├── COMPONENT_TEMPLATE.tsx # Component template
│   ├── ROUTE_TEMPLATE.tsx   # Route template
│   └── root.tsx             # Root layout
├── public/                  # Static assets
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── prettier.config.cjs      # Prettier configuration
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind entry point
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** (comes with Node.js)

### Installation

1. **Navigate to WebApp directory:**
   ```bash
   cd WebApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

---

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run validate` | Run all checks (lint + format + types) |

### Development Workflow

1. **Before starting work:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **During development:**
   ```bash
   npm run dev         # Run dev server
   npm run lint:fix    # Fix lint issues
   npm run type-check  # Check types
   ```

3. **Before committing:**
   ```bash
   npm run validate    # Run all checks
   git add .
   git commit -m "feat: add my feature"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   ```

### Code Quality Standards

✅ **Enforced by ESLint:**
- No `any` types
- No hardcoded colors/spacing
- JSDoc on all exports
- No `console.log` in production
- Strict naming conventions

✅ **Enforced by Prettier:**
- 100 character line width
- 2-space indentation
- Single quotes
- Trailing commas

✅ **Enforced by TypeScript:**
- Strict mode
- No implicit any
- Strict null checks

---

## 🎨 Design System

### Design Tokens

All design values are centralized in `/app/config/tokens.ts`:

```typescript
export const DESIGN_TOKENS = {
  COLORS: { PRIMARY: '#3B82F6', ... },
  SPACING: { MD: '16px', ... },
  TYPOGRAPHY: { FONT_SIZE: { BASE: '16px' } },
  SHADOWS: { MD: '0 4px 6px...' },
  RADIUS: { MD: '8px' },
  // ... more tokens
};
```

### Usage

**CSS Variables (recommended for dynamic values):**
```css
.card {
  padding: var(--spacing-md);
  background: var(--color-surface);
}
```

**Tailwind Classes (recommended for static layouts):**
```tsx
<div className="flex gap-md p-lg rounded-md bg-surface">
  <Button>Submit</Button>
</div>
```

**JavaScript (for programmatic access):**
```tsx
import { useThemeTokens } from '~/hooks';

const { tokens } = useThemeTokens();
const primaryColor = tokens.COLORS.PRIMARY;
```

### Theme Management

```tsx
import { useTheme } from '~/hooks';

function MyComponent() {
  const { isDarkMode, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {isDarkMode ? '🌙' : '☀️'}
    </button>
  );
}
```

📖 **See `/app/docs/THEME_MAINTENANCE.md` for complete guide**

---

## 🌍 Internationalization

### Supported Languages

- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)

### Translation Files

Located in `/app/i18n/locales/{lang}/`:
- `common.json` - Common strings
- `forms.json` - Form labels and validation
- `errors.json` - Error messages
- `navigation.json` - Navigation and menus

### Usage

```tsx
import { useTranslation } from '~/hooks';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.hello', { name: 'John' })}</p>
      <button onClick={() => setLanguage('es')}>
        Español
      </button>
    </div>
  );
}
```

### Adding Translations

1. Add key to `/app/i18n/locales/en/[namespace].json`
2. Translate to all supported languages
3. Use via `t('namespace.key')`

---

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR:

- [ ] Component renders in light and dark mode
- [ ] All text uses translations (no hardcoded strings)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Works on mobile viewport
- [ ] No console errors or warnings
- [ ] Types check (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] Formatted (`npm run format:check`)

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in `/build`.

### Start Production Server

```bash
npm start
```

### Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=production
API_URL=https://api.yourdomain.com
SESSION_SECRET=your-secret-key
```

### Docker Deployment

```bash
# Build image
docker build -t webapp:latest .

# Run container
docker run -p 3000:3000 \
  -e API_URL=https://api.yourdomain.com \
  -e SESSION_SECRET=your-secret \
  webapp:latest
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `/app/STANDARDS.md` | Development standards and conventions |
| `/app/docs/THEME_MAINTENANCE.md` | Theme and design system guide |
| `/app/COMPONENT_TEMPLATE.tsx` | Template for new components |
| `/app/ROUTE_TEMPLATE.tsx` | Template for new routes |
| `README.md` (this file) | Project overview and setup |

---

## 🤝 Contributing

### Commit Message Format

```
<type>: <description>

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Build process, dependencies

**Examples:**
```
feat: add user profile page
fix: resolve theme toggle hydration issue
docs: update README with deployment steps
```

### Pull Request Process

1. Create feature branch
2. Make changes following standards
3. Run `npm run validate`
4. Commit with conventional commit message
5. Push and create PR
6. Request review

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

- 📖 Check documentation in `/app/docs/`
- 📋 Review `/app/STANDARDS.md`
- 🐛 Report issues in project tracker
- 💬 Ask team in #frontend channel

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Start development server
3. ✅ Review `/app/STANDARDS.md`
4. ✅ Read `/app/docs/THEME_MAINTENANCE.md`
5. ✅ Create your first component using the template
6. ✅ Add translations for your component
7. ✅ Test in light and dark mode
8. ✅ Submit your first PR!

---

**Happy coding! 🚀**
