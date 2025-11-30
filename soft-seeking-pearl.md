# Gallery/Album Components CSS/JS Refactoring Plan

## Overview

Refactor the Astro blog's gallery/album components to improve code organization by:
1. **CSS**: Convert scoped CSS to UnoCSS utility classes
2. **JavaScript**: Extract reusable utilities to TypeScript modules, keep component initialization in .astro files
3. **Image Viewer**: Replace custom ImageViewer component with GLightbox library
4. **Scope**: Optimize PhotoCard, ImageViewer (remove), gallery.astro, and ThemeToggle components

## Current State

### Components to Refactor

| Component | CSS Lines | JS Lines | Issues |
|-----------|-----------|----------|---------|
| PhotoCard.astro | 92 | 37 | Scoped CSS + inline script |
| ImageViewer.astro | 69 | 49 | Scoped CSS + inline script |
| gallery.astro | 18 | 0 | Minimal scoped CSS (timeline gradient) |
| ThemeToggle.astro | 14 | 59 | Minimal scoped CSS + inline script |

### Existing Infrastructure

- **UnoCSS**: Configured with gallery shortcuts (lines 77-97 in uno.config.js)
- **No scripts/ directory**: Need to create `src/scripts/`
- **Utils**: `src/utils/index.ts` has helper functions
- **TypeScript**: Strict mode enabled with path alias `~/*` → `src/*`

### Reusable Patterns Identified

1. **Swup re-initialization**: All components listen for `swup:page:view` or `swup:contentReplaced` events
2. **DOMContentLoaded check**: Components check `document.readyState` before initializing
3. **Theme management**: localStorage + system preference detection

### GLightbox Integration

**Why GLightbox?**
- Lightweight (~11KB gzipped) pure JavaScript lightbox
- Better features than custom viewer: zoom, slide gestures, keyboard navigation
- Mobile-first, touch-friendly design
- Supports galleries with previous/next navigation
- Built-in accessibility (ARIA labels, keyboard support)
- CSS animations (better performance than JS animations)
- Well-maintained library with active development

**Trade-offs:**
- ✅ Removes ~150 lines of custom viewer code
- ✅ Better UX with professional features (zoom, swipe, gallery navigation)
- ✅ Better accessibility out of the box
- ⚠️ Adds external dependency (~11KB)
- ⚠️ Need to customize styling to match theme

## Implementation Plan

### Step 1: Create TypeScript Module Infrastructure

Create `src/scripts/` directory with reusable utilities:

#### 1.1 `src/scripts/utils/ready-state.ts`

```typescript
/**
 * Execute callback when DOM is ready.
 * Handles both immediate execution and DOMContentLoaded event.
 */
export function onReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  } else {
    callback()
  }
}
```

**Purpose**: DRY principle - replaces repeated DOMContentLoaded pattern across 4+ components

#### 1.2 `src/scripts/dom/swup-lifecycle.ts`

```typescript
/**
 * Register callbacks for Swup page lifecycle events.
 * Simplifies component re-initialization after page transitions.
 */
export function onSwupPageView(callback: () => void): void {
  document.addEventListener('swup:page:view', callback)
}

export function onSwupContentReplaced(callback: () => void): void {
  document.addEventListener('swup:contentReplaced', callback)
}

/**
 * Initialize component both on page load and Swup transitions.
 * Combines onReady + onSwupPageView patterns.
 */
export function initWithSwup(callback: () => void): void {
  onReady(callback)
  onSwupPageView(callback)
}
```

**Purpose**: Standardizes Swup integration pattern used in all interactive components

#### 1.3 `src/scripts/dom/keyboard.ts`

```typescript
/**
 * Keyboard event utilities for accessibility.
 * Standardizes Enter/Space activation and Escape dismissal.
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' '
}

export function isDismissalKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape'
}

/**
 * Add keyboard activation handler (Enter/Space) to element.
 * Prevents default behavior to avoid page scrolling on Space.
 */
export function addActivationHandler(
  element: Element,
  handler: () => void
): void {
  element.addEventListener('keydown', (e) => {
    if (e instanceof KeyboardEvent && isActivationKey(e)) {
      e.preventDefault()
      handler()
    }
  })
}

/**
 * Add keyboard dismissal handler (Escape) to document.
 */
export function addDismissalHandler(
  handler: () => void,
  condition?: () => boolean
): void {
  document.addEventListener('keydown', (e) => {
    if (e instanceof KeyboardEvent && isDismissalKey(e)) {
      if (!condition || condition()) {
        handler()
      }
    }
  })
}
```

**Purpose**: WCAG 2.1 compliance - standardizes keyboard navigation patterns

#### 1.4 `src/scripts/ui/gallery-lightbox.ts`

```typescript
/**
 * GLightbox wrapper for gallery images.
 * Initializes and configures GLightbox with theme-aware styling.
 */
import GLightbox from 'glightbox'
import type { GlightboxInstance } from 'glightbox'

/**
 * Initialize GLightbox for gallery images.
 * Returns GLightbox instance for programmatic control.
 */
export function initGalleryLightbox(): GlightboxInstance {
  const lightbox = GLightbox({
    selector: '.glightbox',
    touchNavigation: true,
    loop: true,
    autoplayVideos: false,
    closeButton: true,
    closeOnOutsideClick: true,

    // Keyboard navigation
    keyboardNavigation: true,

    // Custom slide effects
    openEffect: 'zoom',
    closeEffect: 'zoom',
    slideEffect: 'slide',

    // Custom skin for dark mode support
    skin: 'glightbox-clean',

    // Mobile-friendly settings
    moreLength: 0,
  })

  return lightbox
}

/**
 * Refresh GLightbox after dynamic content changes.
 * Call this after Swup page transitions.
 */
export function refreshGalleryLightbox(lightbox: GlightboxInstance | null): void {
  if (lightbox) {
    lightbox.reload()
  }
}

/**
 * Destroy GLightbox instance (cleanup).
 */
export function destroyGalleryLightbox(lightbox: GlightboxInstance | null): void {
  if (lightbox) {
    lightbox.destroy()
  }
}
```

**Purpose**: Wrapper for GLightbox library with gallery-specific configuration and Swup integration

#### 1.5 `src/scripts/ui/theme-toggle.ts`

```typescript
/**
 * Theme toggle utilities for dark/light mode switching.
 * Manages localStorage persistence and system preference detection.
 */
export type Theme = 'light' | 'dark'

/**
 * Get current theme from localStorage or system preference.
 * Priority: localStorage > system preference > 'light' default
 */
export function getTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply theme to document and save to localStorage.
 * Updates both HTML class and icon visibility.
 */
export function applyTheme(
  theme: Theme,
  sunIcon?: Element | null,
  moonIcon?: Element | null
): void {
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)

  // Update icons if provided
  if (sunIcon && moonIcon) {
    sunIcon.classList.toggle('hidden', isDark)
    moonIcon.classList.toggle('hidden', !isDark)
  }

  localStorage.setItem('theme', theme)
}

/**
 * Toggle between light and dark themes.
 */
export function toggleTheme(
  sunIcon?: Element | null,
  moonIcon?: Element | null
): void {
  const currentTheme = getTheme()
  const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
  applyTheme(newTheme, sunIcon, moonIcon)
}

/**
 * Listen to system theme preference changes.
 * Only applies changes if user hasn't manually set a theme.
 */
export function watchSystemTheme(
  sunIcon?: Element | null,
  moonIcon?: Element | null
): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light', sunIcon, moonIcon)
    }
  })
}
```

**Purpose**: Complex theme logic extracted for reuse in ThemeScript and ThemeToggle components

**Validation Checkpoint**: Run `pnpm typecheck` - should pass with no errors

---

### Step 2: Install GLightbox

Install GLightbox via pnpm:

```bash
pnpm add glightbox
```

**Validation Checkpoint**: Verify package is added to `package.json` dependencies

---

### Step 3: Create GLightbox Theme Styles

Create custom CSS for GLightbox to match the blog theme (dark mode support).

#### 3.1 Create `src/styles/glightbox-theme.css`

```css
/* GLightbox theme customization for dark/light mode support */

/* Import GLightbox base styles */
@import 'glightbox/dist/css/glightbox.min.css';

/* Override GLightbox styles to match blog theme */
.glightbox-container {
  --glightbox-background: rgba(0, 0, 0, 0.95);
  --glightbox-text: #fff;
}

/* Dark mode adjustments */
.dark .glightbox-container {
  --glightbox-background: rgba(0, 0, 0, 0.98);
}

/* Close button styling */
.gclose {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  transition: background 0.2s ease;
}

.gclose:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Navigation arrows - match theme primary color */
.gnext,
.gprev {
  color: var(--c-primary, #2e405b);
  transition: opacity 0.2s ease;
}

.gnext:hover,
.gprev:hover {
  opacity: 0.8;
}

/* Image container */
.gslide-image img {
  border-radius: 8px;
}

/* Description text */
.gslide-description {
  color: var(--glightbox-text);
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 4px;
}
```

**Import in layout**: Add to `src/layouts/LayoutDefault.astro` head section:

```astro
<link rel="stylesheet" href="/src/styles/glightbox-theme.css" />
```

### Step 4: Refactor Components

#### 4.1 Refactor PhotoCard.astro - Add GLightbox Support

**CSS Changes**: Remove all scoped `<style>` (lines 31-123), apply UnoCSS shortcuts already defined in uno.config.js

**Markup Changes**: Add GLightbox attributes to image wrapper

```astro
---
interface Props {
  title: string
  date: Date
  image: string
  location?: string
  description: string
}

const { title, date, image, location, description } = Astro.props

import { formatDate } from '~/utils'
---

<article class="photo-card">
  <a
    href={image}
    class="photo-image glightbox cursor-pointer hover:op-90"
    data-gallery="gallery"
    data-title={title}
    data-description={description}
  >
    <img src={image} alt={title} loading="lazy" class="w-full h-full object-cover" />
  </a>
  <div class="photo-content">
    <h3 class="photo-title">{title}</h3>
    <div class="photo-meta">
      <time datetime={date.toISOString()}>{formatDate(date, 'YYYY-MM-DD')}</time>
      {location && <span class="op-80">· {location}</span>}
    </div>
    <div class="photo-description">
      {description}
    </div>
  </div>
</article>
```

**Key Changes:**
- Changed `<div>` to `<a>` with `href={image}` for GLightbox
- Added `glightbox` class for GLightbox selector
- Added `data-gallery="gallery"` to group all photos in one gallery
- Added `data-description={description}` to show description in lightbox
- Removed `role="button"` and `tabindex="0"` (semantic `<a>` tag handles this)
- Removed all custom JavaScript (GLightbox handles clicks automatically)

**Impact**:
- CSS: 92 lines → 0 lines (applied shortcuts)
- JS: 37 lines → 0 lines (GLightbox handles all interactions)
- Total: 161 lines → ~30 lines (81% reduction)

#### 4.2 Remove ImageViewer.astro

**Action**: Delete `src/components/ImageViewer.astro` entirely

**Reason**: GLightbox replaces all ImageViewer functionality:
- ✅ Full-screen image display
- ✅ Close button and overlay click
- ✅ Keyboard navigation (Escape to close, arrows for gallery)
- ✅ Body scroll lock
- ✅ Mobile touch gestures
- ✅ Zoom functionality (bonus feature)

**Impact**: 148 lines of code removed

#### 4.3 Update gallery.astro

**Remove ImageViewer import and component:**

```astro
---
import { getCollection } from 'astro:content'
import LayoutDefault from '~/layouts/LayoutDefault.astro'
import PhotoCard from '~/components/PhotoCard.astro'
// REMOVED: import ImageViewer from '~/components/ImageViewer.astro'

// ... rest of the code
---

<LayoutDefault>
  <div class="gallery-container">
    <!-- ... gallery content ... -->
  </div>

  <!-- REMOVED: <ImageViewer /> -->
</LayoutDefault>

<script>
  import { initWithSwup } from '~/scripts/dom/swup-lifecycle'
  import { initGalleryLightbox } from '~/scripts/ui/gallery-lightbox'
  import type { GlightboxInstance } from 'glightbox'

  let lightbox: GlightboxInstance | null = null

  function initGallery() {
    // Initialize GLightbox for all gallery images
    lightbox = initGalleryLightbox()
  }

  // Initialize on page load and after Swup transitions
  initWithSwup(initGallery)
</script>

<!-- Keep timeline gradient CSS as-is -->
<style>
  .timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(to bottom, var(--c-primary) 0%, var(--c-primary) 100%);
    opacity: 0.2;
  }

  @media (max-width: 768px) {
    .timeline::before {
      width: 2px;
    }
  }
</style>
```

**Impact**: Simplified gallery page, GLightbox auto-initializes on all `.glightbox` elements

#### 4.4 Refactor ThemeToggle.astro

**CSS Changes**: Remove scoped `<style>` (lines 75-90), replace with inline utilities

**Markup:**

```astro
<button
  id="theme-toggle"
  class="not-underline-hover inline-flex items-center cursor-pointer border-none bg-transparent p-0 transition-transform duration-200 hover:scale-110 active:scale-95"
  aria-label="切换深色/浅色模式"
  title="切换主题"
>
  <span class="sun-icon i-mdi-weather-sunny w-6 h-6"></span>
  <span class="moon-icon i-mdi-weather-night w-6 h-6 hidden"></span>
</button>
```

**Script Changes**: Import theme utilities

```astro
<script>
  import { initWithSwup } from '~/scripts/dom/swup-lifecycle'
  import { getTheme, applyTheme, toggleTheme, watchSystemTheme } from '~/scripts/ui/theme-toggle'

  function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle')
    const sunIcon = toggle?.querySelector('.sun-icon')
    const moonIcon = toggle?.querySelector('.moon-icon')

    if (!toggle || !sunIcon || !moonIcon) return

    // Apply current theme
    const currentTheme = getTheme()
    applyTheme(currentTheme, sunIcon, moonIcon)

    // Toggle on click
    toggle.addEventListener('click', () => {
      toggleTheme(sunIcon, moonIcon)
    })

    // Watch system theme changes
    watchSystemTheme(sunIcon, moonIcon)
  }

  initWithSwup(initThemeToggle)
</script>
```

**Note**: ThemeToggle currently uses `swup:contentReplaced` event. After refactoring, it will use `swup:page:view` via `initWithSwup` for consistency. Both events work, but `page:view` is more commonly used across the project.

**Impact**:
- CSS: 14 lines → 0 lines
- JS: 59 lines → ~25 lines (extracted logic)
- Total: 91 lines → ~45 lines (51% reduction)

#### 4.5 gallery.astro - Minimal Changes

**Decision**: Keep scoped CSS for timeline gradient as-is

**Reason**: The timeline gradient (lines 82-91) uses complex `linear-gradient` with CSS variable interpolation and `::before` pseudo-element. This is justified scoped CSS:
- Only 10 lines
- Complex gradient would be verbose as inline utilities
- Pseudo-element requires scoped CSS
- Not reusable elsewhere

**No changes needed for gallery.astro**

---

### Step 5: Validation & Testing

#### 4.1 TypeScript Validation

```bash
pnpm typecheck
```

**Expected**: No errors

#### 4.2 Build Validation

```bash
pnpm build
```

**Expected**: Build succeeds, no UnoCSS warnings

#### 4.3 Functional Testing

**Gallery Page (`/gallery`):**
- [ ] Photos display correctly with card layout
- [ ] Timeline gradient line appears
- [ ] Responsive layout works (desktop: 2-column, mobile: 1-column)

**GLightbox Image Viewer:**
- [ ] Clicking photo opens GLightbox in full-screen
- [ ] Close button closes lightbox
- [ ] Clicking overlay closes lightbox
- [ ] Escape key closes lightbox
- [ ] Arrow keys navigate between photos in gallery
- [ ] Body scroll locks when lightbox is open
- [ ] Zoom functionality works (pinch or double-click)
- [ ] Touch swipe gestures work on mobile
- [ ] Photo description displays in lightbox
- [ ] Gallery navigation (prev/next arrows) appears when multiple images

**Theme Toggle:**
- [ ] Clicking toggle switches dark/light mode
- [ ] Theme persists on page reload
- [ ] System preference is respected if no manual setting
- [ ] Icon changes correctly (sun/moon)

**Swup Integration:**
- [ ] Navigate between pages using Swup
- [ ] Gallery features continue working after navigation
- [ ] Theme toggle continues working after navigation
- [ ] No console errors related to event listeners

**Keyboard Accessibility:**
- [ ] Tab navigation works on all interactive elements
- [ ] Focus states are visible
- [ ] Enter/Space activate buttons and photos
- [ ] Escape closes modal

**Responsive Design:**
- [ ] Test at 320px (mobile), 768px (tablet), 1200px (desktop)
- [ ] PhotoCard layout switches correctly
- [ ] GLightbox displays correctly on all screen sizes
- [ ] Touch gestures work on mobile devices
- [ ] Year markers remain sticky on scroll

---

## Implementation Order

1. **Install GLightbox**:
   - Run `pnpm add glightbox`
   - Verify installation

2. **Create infrastructure** (no dependencies):
   - Create `src/scripts/` directory structure
   - Create 4 TypeScript modules (removed image-viewer.ts, added gallery-lightbox.ts)
   - Create `src/styles/glightbox-theme.css`
   - Run `pnpm typecheck`

3. **Refactor components** (handle dependencies):
   - PhotoCard.astro (convert to GLightbox links)
   - Remove ImageViewer.astro (delete file)
   - Update gallery.astro (remove ImageViewer, add GLightbox init)
   - ThemeToggle.astro (independent)
   - Test after each component

4. **Add GLightbox styles to layout**:
   - Import `glightbox-theme.css` in LayoutDefault.astro
   - Test dark/light mode switching

5. **Comprehensive validation**:
   - Run all tests from Step 5
   - Test GLightbox features (zoom, swipe, gallery navigation)
   - Fix any issues
   - Final build and preview

---

## Expected Outcomes

### Lines of Code Reduction

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| PhotoCard.astro | 161 | ~30 | 81% |
| ImageViewer.astro | 148 | 0 (deleted) | 100% |
| ThemeToggle.astro | 91 | ~45 | 51% |
| gallery.astro | 99 | ~110 (+GLightbox init) | -11% |
| **Total Components** | **499** | **~185** | **63%** |

### New Reusable Modules

- 4 TypeScript modules (~200 lines total)
  - `ready-state.ts` - DOM ready utilities
  - `swup-lifecycle.ts` - Swup integration helpers
  - `keyboard.ts` - Keyboard accessibility (Note: GLightbox handles this for images)
  - `gallery-lightbox.ts` - GLightbox wrapper
  - `theme-toggle.ts` - Theme management
- Well-documented, type-safe utilities
- Testable logic separated from components

### New External Dependencies

- **GLightbox** (~11KB gzipped)
  - Professional lightbox with better features than custom solution
  - Active maintenance and community support
  - Built-in accessibility and mobile optimization

### Maintainability Improvements

- ✅ All components < 100 lines (CLAUDE.md guideline)
- ✅ Zero scoped CSS in refactored components (except justified cases)
- ✅ Clear separation: UI logic in modules, initialization in components
- ✅ Consistent Swup integration pattern
- ✅ Standardized keyboard accessibility
- ✅ Replaced 148 lines of custom viewer code with battle-tested library
- ✅ Better UX: zoom, swipe gestures, gallery navigation

### Feature Improvements

- ✅ **Enhanced functionality** vs. custom viewer:
  - Gallery navigation (previous/next arrows)
  - Zoom in/out capability
  - Touch swipe gestures on mobile
  - Better keyboard navigation (arrow keys)
  - Smoother animations (CSS-based)
- ✅ Accessibility maintained (GLightbox has built-in ARIA support)
- ✅ Performance improved (professional optimized code)
- ✅ Visual appearance customizable via CSS

---

## Critical Files Reference

### Files to Create (5)

1. `src/scripts/utils/ready-state.ts`
2. `src/scripts/dom/swup-lifecycle.ts`
3. `src/scripts/dom/keyboard.ts`
4. `src/scripts/ui/gallery-lightbox.ts` (GLightbox wrapper)
5. `src/scripts/ui/theme-toggle.ts`
6. `src/styles/glightbox-theme.css` (GLightbox theme customization)

### Files to Delete (1)

1. `src/components/ImageViewer.astro` - Replaced by GLightbox

### Files to Modify (4)

1. `src/components/PhotoCard.astro` - Convert to GLightbox links, remove CSS and JS
2. `src/components/ThemeToggle.astro` - Remove CSS, refactor script
3. `src/pages/gallery.astro` - Remove ImageViewer import, add GLightbox init
4. `src/layouts/LayoutDefault.astro` - Import glightbox-theme.css

### Package Changes

1. Install: `pnpm add glightbox`

---

## Notes

- **GLightbox Integration**: Replaces custom `window.openImageViewer` global with standard GLightbox data attributes (`data-gallery`, `data-title`, etc.). This is cleaner and follows web standards.

- **Swup Event Consistency**: The project uses both `swup:page:view` and `swup:contentReplaced`. After refactoring, all components will use `swup:page:view` via `initWithSwup` utility for consistency. GLightbox needs to be reloaded after Swup transitions.

- **CSS Variable Preservation**: All `var(--c-primary)`, `var(--c-bg)`, etc. are preserved in UnoCSS utilities using bracket notation: `bg-[var(--c-bg)]`. GLightbox styles use CSS variables for theme support.

- **Justified Scoped CSS**: gallery.astro timeline gradient is kept as scoped CSS because it's a complex gradient with pseudo-element that doesn't benefit from utility conversion.

- **Type Safety**: All new modules have proper TypeScript types. GLightbox types are imported from the library package.

- **Bundle Size Impact**: Adding GLightbox (~11KB gzipped) is offset by removing custom ImageViewer code (~148 lines). Net result is smaller, more maintainable codebase with better features.

## References

- [GLightbox Official Documentation](https://biati-digital.github.io/glightbox/)
- [GLightbox GitHub Repository](https://github.com/biati-digital/glightbox)
- [GLightbox on NPM](https://www.npmjs.com/package/glightbox)
