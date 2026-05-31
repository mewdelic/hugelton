# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HÜGELTON INSTRUMENTS is a corporate site for a Eurorack module and software instrument manufacturer based in Kobe, Japan. This is a static marketing site with product pages generated from Markdown.

## Build & Development

```bash
npm run dev      # Start dev server on 0.0.0.0 (uses source index.html)
npm run build    # Production build - generates HTML from MD products
npm run preview  # Preview production build on 0.0.0.0
```

**Build outputs**:
- `dist/index.html` - Main site (showcase + catalog from Markdown)
- `dist/products/{slug}.html` - Individual product pages
- `dist/docs/` - Documentation pages

## Product Management (Markdown)

Products are managed as Markdown files in `products/*.md`:

```markdown
---
slug: k112e
name: K112E
tagline: Digital compound oscillator
status: new              # new | available | discontinued | kit
type: Hardware           # Hardware | Software
category: Eurorack        # Eurorack | Playdate | Utility
link: "#catalog"         # or external URL
image: K112E.png         # optional (for showcase image)
order: 1                 # showcase order (lower = first)
---

Product description goes here. Supports basic Markdown.

## Features

- Feature one
- Feature two
```

**Frontmatter fields**:
- `slug` - URL-safe identifier (used for product page filename)
- `name` - Display name
- `tagline` - Short description
- `status` - `new`, `available`, `discontinued`, or `kit`
- `type` - `Hardware` or `Software`
- `category` - Product category
- `link` - Card link target (e.g., `#catalog` or external URL)
- `image` - Filename in `/public/showcase-transparent/` (optional)
- `order` - Showcase display order (lower numbers first)

After adding/modifying product files, run `npm run build`.

## Architecture

### Build System (`scripts/`)
- `build-products.js` - Reads MD files, generates product pages + HTML snippets
- `build.js` - Main build: runs product build, copies assets, updates index.html

The build replaces placeholders in `index.html`:
- `<!-- SHOWCASE_CARDS_START -->` ... `<!-- SHOWCASE_CARDS_END -->`
- `<!-- CATALOG_CARDS_START -->` ... `<!-- CATALOG_CARDS_END -->`

### Entry Points
- `index.html` - Main landing page (template with placeholders)
- `docs/index.html` - Documentation index
- `docs/cli-reference.html` - CLI reference page

### JavaScript (src/js/site.js)
All interactivity is vanilla JS with no frameworks:
- **Fixed shell scrolling**: `.main-shell` handles scrolling, not `window`
- **Topbar state**: Condenses on scroll (`syncTopbar()`)
- **Scroll-linked animations**: `--scroll-progress` and `--hero-shift` CSS variables driven by `syncScrollMotion()`
- **Reveal animations**: Elements fade in when entering viewport (`syncRevealState()`)
- **Custom cursor**: `.cursor-dot` follows pointer with scale changes on interactive elements (fine pointer devices only)
- **Mobile menu**: Toggle + accordion groups (Products has submenu, others are direct links)
- **Hash navigation**: Intercepts anchor links to scroll within `.main-shell`
- **Card 3D tilt**: `.catalog-card` and `.contact-card` respond to mouse movement

### Styles (src/styles/)
SCSS modules organized by section:
- `_variables.scss` - Colors, spacing, tokens
- `_base.scss` - Resets, typography, base element styles
- `_layout.scss` - Shell layout, grid structures
- `_topbar.scss` - Navigation header + mobile menu
- `_hero.scss` - Hero section
- `_showcase.scss` - Product showcase cards
- `_details.scss` - Catalog, contact, footer sections

### Static Assets
- Product images: `/public/showcase-transparent/*.png`
- Icons: Ionicons web components (`ionicons/loader`)
