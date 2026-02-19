# 📦 WebApp Installation Guide

Complete step-by-step installation instructions for the WebApp frontend.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** ≥ 20.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (for version control)
- **VS Code** (recommended editor)

Check your versions:
```bash
node --version    # Should be ≥ 20.0.0
npm --version     # Should be ≥ 10.0.0
```

---

## 🚀 Installation Steps

### Step 1: Navigate to WebApp Directory

```bash
cd /Users/faysal/SourceCode/micro-service/WebApp
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Remix (framework)
- Mantine (UI library)
- Tailwind CSS (styling)
- i18next (internationalization)
- TypeScript (type system)
- ESLint & Prettier (code quality)
- And all other dependencies

**Expected time:** 2-3 minutes

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env
```

Then edit `.env` and configure your backend services:

```env
# Node Environment
NODE_ENV=development

# API Configuration
API_URL=http://localhost:8080
IDENTITY_SERVICE_URL=http://localhost:5050
ORDER_SERVICE_URL=http://localhost:8080
PAYMENT_SERVICE_URL=http://localhost:50051

# Session Configuration (change this!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Application Configuration
APP_NAME=WebApp
APP_URL=http://localhost:3000
```

### Step 4: Set Up Git Hooks

```bash
npm run prepare
```

This installs Husky git hooks that will:
- Run ESLint before commits
- Check code formatting
- Run TypeScript type checks

### Step 5: Make Pre-commit Hook Executable (macOS/Linux)

```bash
chmod +x .husky/pre-commit
```

### Step 6: Start Development Server

```bash
npm run dev
```

You should see:
```
REMIX DEV SERVER ready
  ➜ Local:   http://localhost:3000
```

### Step 7: Open in Browser

Visit: **http://localhost:3000**

You should see the home page with:
- ✅ Welcome message
- ✅ Feature cards
- ✅ Theme toggle (light/dark)
- ✅ Language selector (EN, ES, FR, DE)

---

## ✅ Verify Installation

Run these commands to verify everything is working:

### 1. Linting

```bash
npm run lint
```

Expected output: `✨ All files passed linting!`

### 2. Type Checking

```bash
npm run type-check
```

Expected output: No errors

### 3. Formatting

```bash
npm run format:check
```

Expected output: `All matched files use Prettier code style!`

### 4. Full Validation

```bash
npm run validate
```

This runs all checks. Expected output: All checks pass ✅

---

## 🎨 VS Code Setup (Recommended)

### Install Recommended Extensions

When you open the project in VS Code, you'll see a prompt to install recommended extensions:

1. ESLint
2. Prettier
3. Tailwind CSS IntelliSense
4. Material Icon Theme
5. Error Lens
6. Code Spell Checker

Click "Install All" or install manually:

```
Cmd+Shift+P → "Extensions: Show Recommended Extensions"
```

### VS Code Settings

The project includes `.vscode/settings.json` which configures:
- ✅ Auto-format on save
- ✅ Auto-fix ESLint errors
- ✅ Tailwind IntelliSense
- ✅ TypeScript path resolution

---

## 🔧 Common Issues & Solutions

### Issue 1: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
npm run dev -- --port 3001
```

### Issue 2: Module Not Found Errors

**Error:**
```
Cannot find module '@remix-run/node'
```

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: Husky Hook Not Running

**Error:**
```
.husky/pre-commit: Permission denied
```

**Solution:**
```bash
chmod +x .husky/pre-commit
```

### Issue 4: TypeScript Errors in VS Code

**Error:**
```
Cannot find type definitions for 'node'
```

**Solution:**
```
1. Restart VS Code
2. Cmd+Shift+P → "TypeScript: Restart TS Server"
3. If still failing: npm install --save-dev @types/node
```

### Issue 5: Prettier Not Formatting on Save

**Solution:**
```
1. Install Prettier extension in VS Code
2. Cmd+Shift+P → "Format Document With..." → "Prettier"
3. Set as default formatter in VS Code settings
```

---

## 📁 Verify File Structure

After installation, your directory should look like this:

```
WebApp/
├── node_modules/           ← Created by npm install
├── app/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── docs/
│   ├── hooks/
│   ├── i18n/
│   ├── routes/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── COMPONENT_TEMPLATE.tsx
│   ├── ROUTE_TEMPLATE.tsx
│   ├── STANDARDS.md
│   └── root.tsx
├── public/
├── .husky/
├── .vscode/
├── .env                    ← Created from .env.example
├── .env.example
├── .eslintrc.json
├── .gitignore
├── package.json
├── package-lock.json       ← Created by npm install
├── postcss.config.js
├── prettier.config.cjs
├── README.md
├── INSTALLATION.md         ← This file
├── SETUP_COMPLETE.md
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🧪 Test the Installation

### 1. Test Theme Switching

1. Visit http://localhost:3000
2. Click "🌙 Dark Mode" button
3. Page should switch to dark theme
4. Refresh page - theme should persist

### 2. Test Language Switching

1. Click "ES" button
2. Page text should change to Spanish
3. Try FR (French) and DE (German)
4. Click "EN" to return to English

### 3. Test Hot Reload

1. Edit `app/routes/_index.tsx`
2. Change line 30: `{t('common.welcome')}` to `{t('common.welcome')} 🎉`
3. Save file
4. Page should auto-reload with changes

### 4. Test Linting

1. Edit `app/routes/_index.tsx`
2. Add a line: `const x: any = 5;`
3. Save file
4. You should see an ESLint error (no 'any' types allowed)
5. Remove the line

---

## 🎯 Next Steps

Now that installation is complete:

1. **Read Documentation**
   - `README.md` - Project overview
   - `app/STANDARDS.md` - Development standards
   - `app/docs/THEME_MAINTENANCE.md` - Theme guide

2. **Explore Code**
   - `app/routes/_index.tsx` - Example route
   - `app/config/tokens.ts` - Design tokens
   - `app/hooks/` - Custom hooks

3. **Create Your First Component**
   ```bash
   cp app/COMPONENT_TEMPLATE.tsx app/components/ui/MyComponent.tsx
   ```

4. **Create Your First Route**
   ```bash
   cp app/ROUTE_TEMPLATE.tsx app/routes/about.tsx
   ```

---

## 📊 Installation Summary

After successful installation, you have:

✅ **80+ Files Created**
  - Configuration files (ESLint, Prettier, TypeScript, etc.)
  - Design system (tokens, theme, Tailwind)
  - i18n setup (4 languages × 4 namespaces = 16 translation files)
  - Providers and hooks
  - Utilities and types
  - Templates and documentation
  - Example route

✅ **4 Languages Supported**
  - English (en)
  - Spanish (es)
  - French (fr)
  - German (de)

✅ **200+ Translation Keys**
  - common.json: 40+ keys
  - forms.json: 50+ keys
  - errors.json: 20+ keys
  - navigation.json: 25+ keys

✅ **Complete Documentation**
  - README.md (project guide)
  - STANDARDS.md (30+ pages of standards)
  - THEME_MAINTENANCE.md (300+ lines)
  - SETUP_COMPLETE.md (quick reference)
  - INSTALLATION.md (this file)

---

## 🆘 Need Help?

### Quick Links

- [README.md](./README.md) - Full documentation
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Quick start guide
- [app/STANDARDS.md](./app/STANDARDS.md) - Development standards

### Common Commands

```bash
npm run dev          # Start development server
npm run lint         # Check code quality
npm run type-check   # Check TypeScript
npm run validate     # Run all checks
```

### Resources

- [Remix Documentation](https://remix.run/docs)
- [Mantine Documentation](https://mantine.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## ✅ Installation Checklist

Before you start coding, ensure:

- [ ] Node.js ≥ 20.0.0 installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Git hooks installed (`npm run prepare`)
- [ ] Dev server running (`npm run dev`)
- [ ] Home page loads at http://localhost:3000
- [ ] Theme toggle works
- [ ] Language selector works
- [ ] VS Code extensions installed
- [ ] All checks pass (`npm run validate`)

---

**Installation complete! Happy coding! 🚀**
