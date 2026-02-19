# admin-tool Style Guideline

This document defines the standards for UI development in the `admin-tool` to ensure consistency across all modules.

## 1. Design Tokens (CSS Variables)
Always use these variables instead of hardcoded hex codes or pixel values. Defined in `src/styles.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#3B82F6` | Primary buttons, active states, links |
| `--bg-main` | `#f8fafc` | Global background color |
| `--bg-card` | `#ffffff` | Dashboard cards, form containers |
| `--text-main` | `#1e293b` | Primary body text |
| `--text-muted`| `#64748b` | Subtitles, labels, disabled text |
| `--border-color`| `#e2e8f0` | Dividers and card borders |
| `--radius-md` | `12px` | Standard corner rounding |

## 2. Shared Global Classes
Use these semantic classes to build layouts quickly.

- **`.admin-card`**: The standard container for any content block.
- **`.stat-grid`**: CSS Grid for dashboard statistic cards.
- **`.page-title`**: `<h1>` styling for main view headers.
- **`.section-title`**: Sub-headers with a primary color accent.
- **`.flex / .items-center / .justify-between`**: Standard flexbox utilities.

## 3. Layout Principles
- **Sidebar**: Fixed at `280px`. Use the `nav-link` class for all navigation items.
- **Spacing**: Use standard gaps: `gap-2` (8px), `gap-3` (16px).
- **Responsive**: 
  - Desktop (>1024px): Sidebar visible.
  - Mobile/Tablet: Sidebar hidden, accessible via hamburger menu.

## 4. Component Refactoring Policy
**NEVER** use inline `style="..."` attributes.
**AVOID** component-level `styles: []` unless it is a unique, one-off layout logic. 
**PREFER** adding a reusable utility class to `styles.css` if the pattern appears in more than one component.

---
*Maintained by InventoryCore Engineering Team*
