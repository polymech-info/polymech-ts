# SEO & Discoverability on Polymech

Polymech is built as an SEO-first platform. Every piece of content — whether it's a media post, a CMS page, or a product listing — is automatically discoverable by search engines, social platforms, AI agents, and feed readers. No plugins, no external services, no config files. It's all baked in.

This document covers every SEO-related feature the platform offers.

---

## Table of Contents

- [Multi-Format Content Export](#multi-format-content-export)
- [Discovery Endpoints](#discovery-endpoints)
- [Open Graph & Social Meta](#open-graph--social-meta)
- [JSON-LD Structured Data](#json-ld-structured-data)
- [Server-Side Rendering & Initial State Injection](#server-side-rendering--initial-state-injection)
- [Responsive Image Optimization](#responsive-image-optimization)
- [Internationalization (i18n)](#internationalization-i18n)
- [Embeddable Content](#embeddable-content)
- [API-First Architecture](#api-first-architecture)
- [Developer Experience](#developer-experience)
- [Client-Side SEO & Performance](#client-side-seo--performance)
- [Route Reference](#route-reference)

---

## Multi-Format Content Export

Every content entity on Polymech (posts and pages) can be exported in multiple formats by simply changing the file extension in the URL. No API keys, no special headers — just append the extension.

> **Source:** Page exports → [pages-routes.ts](../server/src/products/serving/pages/pages-routes.ts), Post exports → [db-post-exports.ts](../server/src/products/serving/db/db-post-exports.ts)

### Pages

Pages are rich, widget-based documents built with a visual editor. They export to:

> [pages-rich-html.ts](../server/src/products/serving/pages/pages-rich-html.ts) · [pages-html.ts](../server/src/products/serving/pages/pages-html.ts) · [pages-pdf.ts](../server/src/products/serving/pages/pages-pdf.ts) · [pages-markdown.ts](../server/src/products/serving/pages/pages-markdown.ts) · [pages-email.ts](../server/src/products/serving/pages/pages-email.ts) · [pages-data.ts](../server/src/products/serving/pages/pages-data.ts)

| Format | URL Pattern | Content-Type | Description |
|--------|-------------|--------------|-------------|
| **XHTML** | `/user/:id/pages/:slug.xhtml` | `text/html` | Standalone rich HTML with Tailwind CSS styling, full meta tags, JSON-LD, and responsive layout. Ready to share or archive. |
| **HTML** | `/user/:id/pages/:slug.html` | `text/html` | SPA shell with injected Open Graph metadata for crawlers and social previews. |
| **PDF** | `/user/:id/pages/:slug.pdf` | `application/pdf` | Print-ready PDF export. Great for invoices, reports, or offline sharing. |
| **Markdown** | `/user/:id/pages/:slug.md` | `text/markdown` | Clean Markdown export of the page content. Useful for migration, backups, or feeding to other systems. |
| **JSON** | `/user/:id/pages/:slug.json` | `application/json` | Raw page data including content tree, metadata, and author profile. Perfect for headless CMS integrations. |
| **Email HTML** | `/user/:id/pages/:slug.email.html` | `text/html` | Email-client-optimized HTML with inlined styles and table-based layout. Compatible with Outlook, Gmail, Apple Mail, and others. |

### Posts

Posts are media-centric entries (photos, videos, link cards). They export to:

> [db-post-exports.ts](../server/src/products/serving/db/db-post-exports.ts) · [db-posts.ts](../server/src/products/serving/db/db-posts.ts)

| Format | URL Pattern | Content-Type | Description |
|--------|-------------|--------------|-------------|
| **XHTML** | `/post/:id.xhtml` | `text/html` | Standalone rich HTML with Tailwind CSS, responsive image gallery, OG meta, and JSON-LD structured data. |
| **PDF** | `/post/:id.pdf` | `application/pdf` | PDF export of the post with embedded images. |
| **Markdown** | `/post/:id.md` | `text/markdown` | Markdown with title, description, and linked images. |
| **JSON** | `/post/:id.json` | `application/json` | Full post data with pictures array and author profile. |

### How it works

The export system doesn't use templates or pre-rendered files. Each format is generated server-side on-the-fly from the same canonical content tree, which means:

- Exports are always up-to-date — no build step needed
- All formats share the same data pipeline — update once, export everywhere
- The widget-based content system is format-agnostic — markdown text, photo cards, galleries, tabs, and nested layouts all render correctly in every format

---

## Discovery Endpoints

> **Source:** [content.ts](../server/src/products/serving/content.ts) · [routes.ts](../server/src/products/serving/routes.ts)

### RSS Feed — `/feed.xml`

Standard RSS 2.0 feed of the latest posts and pages. Supports filtering by category via query parameters: → [content.ts](../server/src/products/serving/content.ts) `handleGetFeedXml`

```
/feed.xml?categorySlugs=tutorials&limit=50&sortBy=latest
```

- Image enclosures with optimized proxy URLs
- Per-item author attribution
- Category filtering (by ID or slug, including descendants)
- Configurable sort order (`latest` or `top`)

### Google Merchant Feed — `/products.xml`

A Google Merchant Center compatible XML feed for products. Automatically includes only items with pricing data set through the type system: → [content.ts](../server/src/products/serving/content.ts) `handleGetMerchantFeed`

```xml
<g:id>product-uuid</g:id>
<g:title>Product Name</g:title>
<g:price>29.99 EUR</g:price>
<g:product_type>Category > Subcategory</g:product_type>
<g:image_link>https://service.polymech.info/api/images/cache/optimized.jpg</g:image_link>
```

- Automatically resolves price, currency, and condition from the type system & page variables
- Full category path hierarchy
- Optimized product images via the image proxy
- All items link to their canonical page/post URL

### Sitemap — `/sitemap-en.xml`

Auto-generated XML sitemap of all public, visible pages: → [content.ts](../server/src/products/serving/content.ts) `handleGetSitemap`

```xml
<url>
  <loc>https://polymech.info/user/username/pages/my-page</loc>
  <lastmod>2025-03-01T12:00:00.000Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

- Only includes public + visible pages (respects content visibility settings)
- Uses `updated_at` for accurate `<lastmod>` timestamps
- Ready to submit to Google Search Console, Bing Webmaster Tools, etc.

### LLM-Readable Content — `/llms.txt` & `/llms.md`

Following the emerging [llms.txt standard](https://llmstxt.org/), Polymech generates a machine-readable summary of the entire site at `/llms.txt` (and `/llms.md` for Markdown content-type): → [content.ts](../server/src/products/serving/content.ts) `handleGetLLMText`

```markdown
# Polymech

> A full-stack media platform...

## Pages

- [Getting Started](https://polymech.info/user/admin/pages/getting-started): Introduction to...
- [Product Catalog](https://polymech.info/user/admin/pages/catalog): Browse our...

## Posts

- [New Release](https://polymech.info/post/abc123) by admin: Announcing...

## Public API

- Post Details JSON: /api/posts/{id}
- Page XHTML Export: /user/{username}/pages/{slug}.xhtml
- RSS Feed: /feed.xml
- Sitemap: /sitemap-en.xml
```

This endpoint is designed for AI agents (ChatGPT, Claude, Perplexity, etc.) to quickly understand what the site contains and how to access it. It includes:

- Site description from `app-config.json`
- Top 20 public pages with links and descriptions
- Top 20 recent posts with author attribution
- Full public API reference with URL patterns

### OpenAPI / Scalar API Reference — `/api/reference`

Every API endpoint is documented via OpenAPI 3.0 and served through a Scalar interactive UI. This isn't just documentation — it's a live, testable interface for every route in the system.

---

## Open Graph & Social Meta

Every content URL automatically injects proper Open Graph and Twitter Card metadata into the HTML `<head>`. This happens at the server level before the SPA loads, so crawlers and social platforms always get the right preview.

> **Source:** SPA injection → [renderer.ts](../server/src/products/serving/renderer.ts), Posts → [db-post-exports.ts](../server/src/products/serving/db/db-post-exports.ts), Pages XHTML → [pages-rich-html.ts](../server/src/products/serving/pages/pages-rich-html.ts), Pages HTML → [pages-html.ts](../server/src/products/serving/pages/pages-html.ts)

### What gets injected

| Meta Tag | Source |
|----------|--------|
| `og:title` | Page title or post title with author attribution |
| `og:description` | Page description, extracted from content, or auto-generated fallback |
| `og:image` | First photo card, gallery image, or markdown image — resolved through the image optimization proxy |
| `og:type` | `article` for pages/posts, `product` for product pages |
| `og:url` | Canonical URL |
| `twitter:card` | `summary_large_image` (when image is available) |
| `twitter:title` | Same as `og:title` |
| `twitter:image` | Same as `og:image` |

### Image resolution priority

The system walks the content tree to find the best display image:

1. **Photo Card widget** — highest priority, uses picture ID for resolution
2. **Gallery widget** — uses first image from the gallery
3. **Explicit image widget** — direct image URL
4. **Markdown image** — extracted from inline markdown `![](url)`
5. **Page meta thumbnail** — fallback from page metadata

All images are proxied through the image optimization service (see below) to ensure optimal dimensions and format for social previews.

### Home Page

The home page (`/`) gets its own meta injection using site config from `app-config.json`, with optional override from the `_site/home` system page. This includes full JSON-LD with `WebSite` and `Organization` schemas, plus a `SearchAction` for sitelinks search box.

---

## JSON-LD Structured Data

Polymech generates context-appropriate JSON-LD structured data for every content type:

### Posts → `SocialMediaPosting`

```json
{
  "@context": "https://schema.org",
  "@type": "SocialMediaPosting",
  "headline": "Post Title",
  "image": ["https://...optimized.jpg"],
  "datePublished": "2025-03-01T12:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  }
}
```

### Pages → `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page Title by Author | PolyMech",
  "author": { "@type": "Person", "name": "Author" },
  "description": "...",
  "image": "https://..."
}
```

### Product Pages → `Product` with `Offer`

When a page belongs to a `products` category, the structured data automatically switches to the `Product` schema with pricing:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "...",
  "image": "https://...",
  "category": "Products > Subcategory",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

Price, currency, condition, and availability are resolved from the type system / page variables — no manual JSON-LD editing needed.

### Home Page → `WebSite` + `Organization`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "PolyMech",
      "url": "https://polymech.info",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://polymech.info/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "name": "Polymech",
      "url": "https://polymech.info",
      "logo": "https://..."
    }
  ]
}
```

---

## Server-Side Rendering & Initial State Injection

Polymech is a React SPA, but it doesn't sacrifice SEO for interactivity. The server pre-fetches data and injects it into the HTML before sending it to the client:

> **Source:** Home/post/embed injection → [index.ts](../server/src/products/serving/index.ts), Embed pages → [content.ts](../server/src/products/serving/content.ts), Profile injection → [db-user.ts](../server/src/products/serving/db/db-user.ts)

- **Home page** (`/`): Feed data and site home page content are fetched in parallel and injected as `window.__INITIAL_STATE__`
- **Post pages** (`/post/:id`): Post metadata is resolved and injected as OG/Twitter/JSON-LD meta tags
- **User pages** (`/user/:id/pages/:slug`): Page content, author profile, category paths, and meta image are all resolved server-side

This means:

- **Google** sees a fully populated `<head>` with title, description, image, and structured data
- **Social platforms** (Facebook, Twitter, LinkedIn, Discord, Slack) render rich link previews immediately
- **The React app** hydrates instantly without a loading spinner — the data is already there

---

## Responsive Image Optimization

Every image served through Polymech's SEO routes is automatically optimized:

> **Source:** [db-pictures.ts](../server/src/products/serving/db/db-pictures.ts) · [html-generator.ts](../server/src/products/serving/pages/html-generator.ts)

- **Format negotiation**: Images are served in modern formats (AVIF, WebP) with JPEG fallback
- **Responsive srcsets**: Multiple size variants (320w, 640w, 1024w) are pre-generated and cached on disk
- **Aspect-ratio preservation**: Height is calculated from source metadata to prevent layout shift
- **LCP optimization**: The first image in any export gets `fetchpriority="high"`, subsequent images get `loading="lazy"`
- **Edge caching**: Optimized variants are served from `/api/images/cache/` after first generation

The XHTML exports use `<img>` tags with proper `loading` and `fetchpriority` attributes. The RSS and Merchant feeds use the image proxy URLs for optimized product images at 1200px width.

---

## Internationalization (i18n)

Polymech's SEO features are fully i18n-aware, all the way down to the widget level.

> **Source:** [pages-i18n.ts](../server/src/products/serving/pages/pages-i18n.ts) · [db-i18n.ts](../server/src/products/serving/db/db-i18n.ts)

### How it works

1. **Widget-level translations** — Each widget in a page (markdown text, photo cards, tabs, etc.) can have its content translated to any language. Translations are stored per `widget_id` + `prop_path` + `target_lang`.

2. **Page meta translations** — Title and description can be translated using a special `__meta__` sentinel in the translations table.

3. **Feed translations** — The home feed widget in XHTML exports translates page titles and descriptions when a `?lang=xx` parameter is provided.

### Where i18n applies

| Feature | i18n Support |
|---------|-------------|
| XHTML page export | ✅ `?lang=de` translates all widget content, title, and description |
| XHTML rich HTML export | ✅ Feed items within home widgets are translated |
| HTML meta injection | ✅ Translated title/description used for OG tags |
| Markdown export | ✅ Widget content translated before Markdown conversion |
| Email export | ✅ Full widget translation applied before email rendering |
| RSS feed | Pages in feed use translated descriptions |
| Sitemap | URLs point to canonical (untranslated) versions |
| llms.txt | Currently English only (descriptions from source content) |

### Usage

Append `?lang=xx` to any page export URL:

```
/user/admin/pages/about.xhtml?lang=de     → German rich HTML
/user/admin/pages/about.md?lang=fr         → French Markdown
/user/admin/pages/about.email.html?lang=es → Spanish email
```

Translation management is handled through the platform's built-in glossary system and widget translation API, with AI-assisted translation support.

---

## Embeddable Content

Posts and pages can be embedded in external sites via iframe using the embed routes: → [content.ts](../server/src/products/serving/content.ts)

```
/embed/:postId     → Embeddable post viewer
/embed/page/:pageId → Embeddable page viewer
```

Embed pages are served with injected initial state (no API call needed on load) and include proper meta for social previews when the embed URL itself is shared.

---

## API-First Architecture

All SEO endpoints are part of the OpenAPI 3.0 spec and documented at `/api/reference`. This means:

> **Source:** Route definitions → [routes.ts](../server/src/products/serving/routes.ts), Product registration → [index.ts](../server/src/products/serving/index.ts)

- Every route has proper request/response schemas
- Rate limiting and caching headers are standardized
- Third-party tools (Zapier, n8n, custom scripts) can programmatically access all content
- The API is browsable and testable through the interactive Scalar UI

### Relevant data endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/posts/:id` | Full post data with pictures, responsive variants, and video job status |
| `GET /api/user-page/:identifier/:slug` | Full page data with content tree, profile, and metadata |
| `GET /api/feed` | Paginated feed with category filtering, sorting, and user-specific likes |
| `GET /api/profiles?ids=...` | Batch user profile lookup |
| `GET /api/media-items?ids=...` | Batch media item lookup with responsive image generation |
| `GET /api/serving/site-info?url=...` | Extract OG/JSON-LD metadata from any external URL → [site-info.ts](../server/src/products/serving/site-info.ts) |
| `GET /api/search?q=...` | Full-text search across posts and pages → [db-search.ts](../server/src/products/serving/db/db-search.ts) |

---

## Route Reference

### Content Exports

| Route | Method | Description |
|-------|--------|-------------|
| `/post/:id.xhtml` | GET | Post as standalone rich HTML |
| `/post/:id.pdf` | GET | Post as PDF |
| `/post/:id.md` | GET | Post as Markdown |
| `/post/:id.json` | GET | Post as JSON |
| `/user/:id/pages/:slug.xhtml` | GET | Page as standalone rich HTML |
| `/user/:id/pages/:slug.html` | GET | Page with OG meta injection |
| `/user/:id/pages/:slug.pdf` | GET | Page as PDF |
| `/user/:id/pages/:slug.md` | GET | Page as Markdown |
| `/user/:id/pages/:slug.json` | GET | Page as JSON |
| `/user/:id/pages/:slug.email.html` | GET | Page as email-optimized HTML |

### Discovery & Feeds

| Route | Method | Description |
|-------|--------|-------------|
| `/feed.xml` | GET | RSS 2.0 feed |
| `/products.xml` | GET | Google Merchant XML feed |
| `/sitemap-en.xml` | GET | XML Sitemap |
| `/llms.txt` | GET | LLM-readable site summary |
| `/llms.md` | GET | LLM summary (Markdown content-type) |
| `/api/reference` | GET | Interactive OpenAPI documentation |

### Meta Injection

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home page with feed injection + WebSite/Organization JSON-LD |
| `/post/:id` | GET | Post page with OG/Twitter/JSON-LD injection |
| `/user/:id/pages/:slug` | GET | Page with OG/Twitter meta injection |
| `/embed/:id` | GET | Embeddable post with initial state |
| `/embed/page/:id` | GET | Embeddable page with initial state |

---

## Developer Experience

Polymech isn't just SEO-friendly for end users — it's built to be a joy for developers integrating with or extending the platform.

> **Source:** Server entry point → [index.ts](../server/src/products/serving/index.ts) · [routes.ts](../server/src/products/serving/routes.ts)

### OpenAPI 3.1 Specification — `/doc`

The entire API is described by a machine-readable OpenAPI 3.1 spec served at `/doc`. Every route — from feed endpoints to image uploads to page CRUD — is fully typed with Zod schemas that auto-generate the spec. No hand-written YAML, no drift between code and docs.

```
GET /doc → OpenAPI 3.1 JSON spec
```

This spec can be imported directly into Postman, Insomnia, or any OpenAPI-compatible tool for instant client generation.

### Swagger UI — `/ui`

Classic Swagger UI is available at `/ui` for developers who prefer the traditional interactive API explorer. It connects to the same live OpenAPI spec:

- Try-it-out for every endpoint
- Request/response schema visualization
- Bearer token authentication built in
- Auto-generated curl commands

### Scalar API Reference — `/reference` & `/api/reference`

[Scalar](https://scalar.com/) provides a modern, polished alternative to Swagger UI. Polymech serves it at both `/reference` and `/api/reference`:

- **Beautiful, searchable interface** — grouped by tag (Serving, Posts, Media, Storage, etc.)
- **Pre-authenticated** — Bearer token auto-filled from `SCALAR_AUTH_TOKEN` env var
- **Live request testing** — send requests directly from the browser with real responses
- **Code generation** — copy-paste ready snippets in curl, JavaScript, Python, Go, and more
- **Dark mode** — because of course

### Modular Product Architecture

The server is organized as a registry of **Products** — self-contained modules that each own their routes, handlers, workers, and lifecycle:

| Product | Description |
|---------|-------------|
| **Serving** | Content delivery, SEO, feeds, exports, meta injection |
| **Images** | Upload, optimization, proxy, responsive variant generation |
| **Videos** | Upload, transcoding (HLS), thumbnail extraction |
| **Email** | Page-to-email rendering, SMTP delivery, template management |
| **Storage** | Virtual file system with ACL, mounts, and glob queries |
| **OpenAI** | AI chat, image generation, markdown tools |
| **Analytics** | Request tracking, geo-lookup, real-time streaming |
| **Ecommerce** | Cart, checkout, payment integration |

Each product registers its own OpenAPI routes via `app.openapi(route, handler)`, so the spec always reflects exactly what's deployed. Adding a new product automatically exposes it in Swagger, Scalar, and `/doc`.

### Zod-Powered Schema Validation

All request and response schemas are defined with [Zod](https://zod.dev/) using `@hono/zod-openapi`. This gives you:

- **Runtime validation** — invalid requests are rejected with structured error messages before hitting business logic
- **Type safety** — TypeScript types are inferred from schemas, zero manual type definitions
- **Auto-docs** — Zod schemas feed directly into the OpenAPI spec with examples and descriptions
- **Composability** — shared schemas (e.g., pagination, media items) are reused across products

### Background Job Queue (PgBoss)

Long-running tasks (video transcoding, email sending, cache warming) are managed through [PgBoss](https://github.com/timgit/pg-boss), a PostgreSQL-backed job queue:

- Jobs are submittable via API: `POST /api/boss/job`
- Job status is queryable: `GET /api/boss/job/:id`
- Jobs can be cancelled, resumed, completed, or failed via dedicated endpoints
- Workers auto-register on startup and process jobs in the background

### Real-Time Log Streaming

System logs and analytics are streamable in real-time via SSE (Server-Sent Events):

```
GET /api/logs/system/stream   → Live system logs
GET /api/analytics/stream     → Live request analytics
```

This makes debugging in staging or production trivial — just open the stream in a browser tab or curl.

### WebSocket Support

When `ENABLE_WEBSOCKETS=true`, the server initializes a WebSocket manager for real-time features like live feed updates and collaborative editing notifications.

### Security & Middleware Stack

The server applies a layered middleware stack to all routes: → see [security.md](./security.md)

> **Source:** [auth.ts](../server/src/middleware/auth.ts) · [analytics.ts](../server/src/middleware/analytics.ts) · [rateLimiter.ts](../server/src/middleware/rateLimiter.ts) · [blocklist.ts](../server/src/middleware/blocklist.ts)

| Layer | Description |
|-------|-------------|
| **CORS** | Fully permissive for API consumption from any origin |
| **Analytics** | Request tracking with IP resolution and geo-lookup |
| **Auth** | Optional JWT-based authentication via `Authorization: Bearer` header |
| **Admin** | Role-based access control for admin-only endpoints |
| **Compression** | Brotli/gzip compression on all responses |
| **Secure Headers** | CSP, X-Frame-Options (permissive for embeds), CORP disabled for cross-origin media |
| **Rate Limiting** | Configurable per-route rate limiting (disabled by default) |

---

## Client-Side SEO & Performance

The React SPA contributes to SEO through smart hydration, code splitting, and i18n support.

> **Source:** [App.tsx](../src/App.tsx) · [i18n.tsx](../src/i18n.tsx) · [formatDetection.ts](../src/utils/formatDetection.ts)

### HelmetProvider — Dynamic `<head>` Management

The app is wrapped in `react-helmet-async`'s `<HelmetProvider>`, enabling any component to dynamically inject `<title>`, `<meta>`, and `<link>` tags into the document head. This complements the server-side meta injection — the server provides OG/Twitter tags for crawlers, while Helmet handles client-side navigation.

### Route-Based Code Splitting

25+ routes use `React.lazy()` for on-demand loading, keeping the initial bundle small for faster First Contentful Paint:

- **Eagerly loaded** (in initial bundle): `Index`, `Auth`, `Profile`, `UserProfile`, `TagPage`, `SearchResults` — the high-traffic, SEO-critical pages
- **Lazy loaded**: `Post`, `UserPage`, `Wizard`, `AdminPage`, all playground routes, `FileBrowser`, `Tetris`, ecommerce routes

This split ensures that unauthenticated, view-only visitors (including crawlers) get the fastest possible load time.

### Initial State Hydration

The client reads `window.__INITIAL_STATE__` injected by the server (see [Server-Side Rendering](#server-side-rendering--initial-state-injection)) to avoid waterfall API calls on first load. This covers:

- `feed` — Home page feed data
- `siteHomePage` — Home page CMS content
- `profile` — User profile on `/user/:id` pages

### Client-Side i18n — Language Detection & `<T>` Component

> **Source:** [i18n.tsx](../src/i18n.tsx) · JSON translations in [src/i18n/*.json](../src/i18n/)

The `<T>` component wraps translatable strings and resolves them against per-language JSON dictionaries. Language is determined via a cascading priority chain:

1. **URL parameter** (`?lang=de`) — highest priority, enables shareable translated links
2. **Cookie** (`lang=de`) — persists across navigation, set when URL param is used
3. **Browser language** (`navigator.languages`) — automatic fallback

**13 supported languages:** English, Français, Kiswahili, Deutsch, Español, Nederlands, 日本語, 한국어, Português, Русский, Türkçe, 中文

Translation dictionaries are loaded eagerly via Vite's `import.meta.glob` for instant availability. Missing keys auto-collect into localStorage for dictionary building (`downloadTranslations()` exports them as JSON).

### Format Detection

On app boot, `initFormatDetection()` probes browser support for modern image formats (AVIF, WebP). This informs the responsive image system which `<source>` elements to include in `<picture>` tags, ensuring optimal Core Web Vitals scores.

---

## Summary

Polymech treats SEO as a core platform feature, not an afterthought. Every content entity is automatically:

- **Discoverable** — via sitemap, RSS, merchant feed, and LLM endpoints
- **Previewable** — with Open Graph, Twitter Cards, and JSON-LD for rich social sharing
- **Exportable** — in 6+ formats (XHTML, HTML, PDF, Markdown, JSON, Email)
- **Translatable** — with widget-level i18n that flows through all export formats
- **Optimized** — with responsive images, lazy loading, LCP prioritization, and edge caching
- **Programmable** — with a full OpenAPI spec and interactive documentation

All of this works out of the box. No configuration needed.

---

## TODO — Pending Improvements

### Critical

- [x] **Canonical URLs** — Add `<link rel="canonical">` to all XHTML/HTML exports and SPA pages to prevent duplicate content penalties across `.xhtml`, `.html`, and SPA routes
- [ ] **robots.txt** — Serve a dynamic `robots.txt` at the root with sitemap references and crawl-delay directives. Currently missing entirely
- [x] **Hreflang tags** — Add `<link rel="alternate" hreflang="...">` tags to multi-language pages so search engines serve the correct language variant per region
- [x] **Meta description per page** — Pages and posts currently inherit a generic description. Wire the post `description` / page `meta.description` field into the `<meta name="description">` tag

### High Priority

- [x] **Structured data expansion** — Add `BreadcrumbList` schema for page navigation paths and `WebSite` schema with `SearchAction` for sitelinks search box
- [-] **Sitemap pagination** — Current sitemap is a single XML file. For large catalogs (1000+ products), split into sitemap index + per-entity sitemaps (`sitemap-posts.xml`, `sitemap-pages.xml`, `sitemap-products.xml`)
- [x] **Last-modified headers** — Set `Last-Modified` and `ETag` on all content routes (posts, pages, feeds) to support conditional requests and improve crawler efficiency
- [ ] **Dynamic OG images** — Auto-generate Open Graph images for pages/posts that don't have a cover image, using title + brand overlay
- [x] **JSON-LD for products** — Add `Product` schema with `offers`, `aggregateRating`, and `brand` to product pages for rich shopping results

### Medium Priority

- [-] **AMP pages** — Generate AMP-compliant HTML exports for posts to enable AMP carousel in Google mobile search
- [ ] **RSS per-user feeds** — Currently only a global `/feed.xml`. Add per-user feeds at `/user/:id/feed.xml` so individual creators can be subscribed to
- [ ] **Merchant feed i18n** — Product feed currently exports in the default language. Generate per-locale feeds (`/products-de.xml`, `/products-fr.xml`) using the i18n translation system
- [ ] **Preconnect / DNS-prefetch hints** — Add `<link rel="preconnect">` for known external domains (CDN, image proxy, analytics) in the SPA shell
- [ ] **llms.txt expansion** — Current `llms.txt` covers posts. Extend to include pages, products, and user profiles for broader AI agent discovery → [content.ts](../server/src/products/serving/content.ts)
- [ ] **WebSub / PubSubHubbub** — Add `<link rel="hub">` to RSS feeds and implement WebSub pings on content publish for real-time feed reader updates

### Low Priority / Nice-to-Have

- [ ] **Core Web Vitals monitoring** — Integrate CrUX API or web-vitals library to track LCP, FID, CLS and surface in analytics dashboard
- [ ] **Schema.org FAQ / HowTo** — Auto-detect FAQ-style and tutorial page content and inject corresponding structured data
- [ ] **Twitter Cards validation** — Add `twitter:site` and `twitter:creator` meta tags from user profiles for proper attribution
- [ ] **Video schema** — Add `VideoObject` JSON-LD for posts containing video media items
- [ ] **IndexNow** — Implement IndexNow API pings to Bing/Yandex on content publish for near-instant indexing

---

### AEO — Answer Engine Optimization

Optimize content to be **cited as direct answers** by AI answer engines (Google AI Overviews, Bing Copilot, Perplexity, ChatGPT).

- [ ] **Answer-first content blocks** — In XHTML/HTML exports, structure pages with concise 40-60 word answer summaries at the top of each section, before the detailed explanation. AI engines pull individual passages — clarity wins
- [ ] **FAQPage schema injection** — Auto-detect Q&A patterns in page widgets (heading + paragraph pairs) and inject `FAQPage` JSON-LD. This is the #1 schema type cited by answer engines
- [ ] **QAPage schema for posts** — When a post title is phrased as a question, wrap the body in `QAPage` structured data with `acceptedAnswer`
- [ ] **Text fragment identifiers** — Add `#:~:text=` fragment links in sitemaps and llms.txt to guide AI engines to the most relevant passage in long-form pages
- [ ] **Featured snippet optimization** — Ensure XHTML exports use `<table>`, `<ol>`, and `<dl>` for comparison content, definitions, and step-by-step guides — these are the formats Google AI Overview pulls from
- [ ] **Concise `<meta name="description">` per section** — For long pages with multiple sections, consider generating per-section meta descriptions via anchor-targeted structured data

### GEO — Generative Engine Optimization

Optimize content to be **referenced and summarized** by generative AI systems (ChatGPT, Gemini, Claude, Perplexity).

- [ ] **Entity authority via JSON-LD** — Add `Organization`, `Person`, and `WebSite` schema with consistent `@id` URIs across all pages. AI models use entity graphs to determine source authority
- [ ] **E-E-A-T signals** — Inject `author` schema with credentials, link to author profile pages, and add `datePublished` / `dateModified` to all content. Generative engines weight experience and freshness
- [ ] **Comparison and "X vs Y" pages** — Create comparison page templates that AI systems frequently pull from when users ask evaluative questions
- [ ] **Fact-dense content markers** — Add `ClaimReview` or `Dataset` schema where applicable. AI models prioritize statistically-backed and verifiable claims
- [ ] **Citation-optimized exports** — In Markdown and JSON exports, include `source_url`, `author`, `published_date`, and `license` fields so AI systems can properly attribute when citing
- [ ] **AI Share of Voice tracking** — Track brand mentions across ChatGPT, Perplexity, and Google AI Overviews to measure GEO effectiveness. Consider building an internal monitoring endpoint or integrating third-party tools

### AI Crawler Management

Control and optimize how AI training bots and inference crawlers interact with the platform.

- [ ] **Dynamic `robots.txt` with AI directives** — Serve a `robots.txt` that explicitly manages AI crawlers: allow `GPTBot`, `ClaudeBot`, `PerplexityBot` on content routes, but disallow on admin/API routes. Consider `Google-Extended` for training opt-in/out
- [ ] **`llms.txt` v2** — Expand current `llms.txt` beyond posts to include: pages with summaries, product catalog overview, author profiles, and a structured capability description. Follow the emerging llms.txt spec with Markdown formatting
- [ ] **`llms-full.txt`** — Generate a comprehensive full-content version at `/llms-full.txt` with all page content flattened into Markdown for deep AI ingestion
- [ ] **AI crawler rate limiting** — Apply custom rate limits for known AI user agents (`GPTBot`, `ClaudeBot`, `CCBot`, `PerplexityBot`) to prevent content scraping from overloading the server while still allowing indexing
- [ ] **AI access analytics** — Track and surface AI bot traffic separately in the analytics dashboard: which bots, how often, which routes, and bandwidth consumed. Use the existing user-agent parsing in [analytics.ts](../server/src/middleware/analytics.ts)
- [ ] **Structured content API for AI** — Create a dedicated `/api/content` endpoint that returns semantically structured content (title, sections, facts, entities) optimized for LLM consumption, distinct from the user-facing API
- [ ] **IETF AI Preferences compliance** — Monitor the IETF "AI Preferences Working Group" (launched 2025) for the standardized machine-readable AI access rules spec. Implement when finalized — will likely supersede or extend `robots.txt` for AI

### AI-Native Content Formats

- [ ] **Markdown-first content pipeline** — Ensure all page widgets can export clean, semantic Markdown. This is the preferred format for LLM ingestion and is used by `llms.txt`, `llms-full.txt`, and AI-friendly feeds
- [ ] **Structured knowledge base export** — Generate a `/knowledge.json` endpoint that exports the entire content catalog as a structured knowledge graph (entities, relationships, facts) for RAG pipelines and enterprise AI integrations
- [ ] **MCP (Model Context Protocol) server** — Expose platform content as an MCP resource so AI assistants (Claude, Cursor, etc.) can directly query posts, pages, and products as context — leveraging the existing REST API as the backend
- [ ] **AI-friendly RSS** — Extend RSS feed items with full content (not just excerpts), structured metadata, and `<media:content>` tags so AI feed consumers get complete context without needing to crawl
