# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based blog theme called "Typography" - a minimal, responsive, and SEO-friendly blog theme inspired by hexo-theme-Typography. The project uses Astro, TypeScript, UnoCSS, and focuses on providing an enhanced reading experience with Chinese typography conventions.

## Development Commands

```bash
# Development (runs type checking then dev server)
pnpm dev

# Build (runs type checking then builds)
pnpm build

# Preview built site
pnpm preview

# Linting
pnpm lint          # Check for lint errors
pnpm lint:fix      # Auto-fix lint errors

# Type checking
pnpm typecheck     # Run TypeScript type checker

# Theme utilities
pnpm theme:create  # Interactive post creation wizard
pnpm theme:release # Release a new theme version
pnpm theme:update  # Update theme files
```

## Architecture

### Configuration System

The theme uses a layered configuration approach:

- **Default config**: `src/.config/default.ts` - Never modify directly
- **User config**: `src/.config/user.ts` - Override default settings here
- **Config exports**: `src/.config/index.ts` - Merges configs and exports as `themeConfig`

Configuration is imported in multiple places:

- `astro.config.ts` for Astro site settings
- `uno.config.js` for UnoCSS theming
- Throughout components for site metadata

### Content Collections

Defined in `src/content.config.ts`:

- **posts**: Blog posts (`.md` or `.mdx` files in `src/content/posts/`)
  - Required frontmatter: `title`, `pubDate`, `categories`
  - Optional: `modDate`, `draft`, `description`, `banner`, `author`, `pin`, etc.
  - Draft posts are filtered in production builds

- **spec**: Special pages like About (in `src/content/spec/`)

### Path Aliasing

TypeScript path alias `~/*` maps to `src/*` (configured in `tsconfig.json`)

### Layouts

Three main layouts in `src/layouts/`:

- `LayoutDefault.astro` - Base layout with SEO, theme, analytics
- `LayoutPost.astro` - Individual post pages with comments
- `LayoutPostList.astro` - Archive and category list pages

### Routing

- `/` - Paginated post list (`src/pages/[...page].astro`)
- `/posts/[id]` - Individual posts
- `/archive` - Chronological archive
- `/categories` - Category index
- `/categories/[category]` - Category-specific posts
- `/about` - About page
- `/atom.xml` - RSS feed

### Styling & Theming

- **UnoCSS** for utility-first CSS (configured in `uno.config.js`)
- **Dark mode** support via `unocss-preset-theme`
- Theme colors configured in `src/.config/user.ts` under `appearance.colorsLight` and `appearance.colorsDark`
- Custom typography preset with Chinese font stacks
- Icons from Material Design Icons via `@iconify-json/mdi`

### Key Utilities (`src/utils/index.ts`)

- `getPosts(isArchivePage)` - Fetch and sort posts (by modDate or pubDate)
- `getCategories()` - Build category map from posts
- `getPostDescription(post)` - Extract description from frontmatter or body
- `formatDate(date, format)` - Format dates with dayjs
- `getPathFromCategory(category, category_map)` - Map category names to URL paths

### Internationalization

Supported locales in `src/i18n.ts`: `en-us`, `zh-cn`, `zh-tw`, `ja-jp`, `it-it`

Set locale in user config: `appearance.locale`

### Markdown Processing

- **remark-math** + **rehype-katex** for LaTeX math support
- Syntax highlighting via Shiki with Dracula theme
- MDX support via `@astrojs/mdx`

### Integrations

Configured in `astro.config.ts`:

- **Swup** - Page transitions
- **Sitemap** - Auto-generated sitemap
- **robots.txt** - Via `astro-robots-txt`

### Features

- **Comments**: Supports Disqus, Giscus, or Twikoo (configure in `comment` object)
- **Analytics**: Google Analytics or Umami (configure in `analytics` object)
- **RSS**: Full-text RSS feed at `/atom.xml`
- **SEO**: Open Graph and Twitter Cards via `astro-seo`

## Common Development Patterns

### Adding a New Post

Use the CLI tool for consistency:

```bash
pnpm theme:create
```

Or manually create in `src/content/posts/` with required frontmatter:

```yaml
---
title: Post Title
pubDate: 2024-01-01
categories: ["category-name"]
description: "Optional description"
draft: false
---
```

### Modifying Theme Appearance

Edit `src/.config/user.ts` to override defaults. Common customizations:

- Site metadata (`site.title`, `site.author`, etc.)
- Navigation links (`site.navLinks`)
- Social links (`site.socialLinks` - uses MDI icon names)
- Theme colors (`appearance.colorsLight/Dark`)
- Locale (`appearance.locale`)

### Adding Navigation Links

Add to `site.navLinks` in user config, then create corresponding page in `src/pages/`

### Custom Category URL Mapping

Use `site.categoryMap` to map category display names to URL-friendly paths:

```ts
categoryMap: [{ name: '胡适', path: 'hu-shi' }]
```

## Important Notes

- Always run type checking before builds (`astro check` is built into dev and build commands)
- Git hooks run lint-staged on pre-commit (auto-fixes with ESLint)
- The theme uses pnpm as package manager (configured in `package.json`)
- Uses @antfu/eslint-config with Astro, UnoCSS, and formatter support
- Default theme color is Chinese calligraphy-inspired (#2e405b)

### Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.

### Documentation & Explainability

- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Security** You are prohibited from accessing the contents of any .env files within the project.
