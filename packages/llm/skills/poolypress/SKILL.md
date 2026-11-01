---
name: poolypress
description: "PoolyPress CMS platform skill. Use when creating/editing pages, managing content, working with widgets/containers, generating images, translating content, searching site content, or using any poolypress MCP tool. Covers the full content authoring lifecycle."
---

# PoolyPress — Platform Content Skill

You are working with the **PoolyPress CMS** — a widget-based, API-first content management platform built for plastic recycling machinery (PolyMech). It powers product pages, knowledge bases, tutorials, and marketing content.

The AI assistant has full authoring power through **17 MCP tools** — search, create, update, translate, generate images, and compose layouts. All tools are served by the `poolypress` MCP server.

---

## MCP Tools — Complete Reference

### 1. `search_content`

Search all site content (pages, posts, pictures, files). Returns enriched results sorted by relevance. **Use for general content discovery.**

```
Required: query (string)
Optional: limit (number, default 20, max 50), type (enum: all|pages|posts|pictures|files)
Returns:  { id, title, description, type, rank, url, created_at }[]
```

### 2. `find_pages`

Search specifically for pages. Returns page results sorted by relevance.

```
Required: query (string)
Optional: limit (number, default 20)
Returns:  { id, title, slug, description, rank, created_at }[]
```

### 3. `find_pictures`

Search specifically for pictures/images. Returns picture results sorted by relevance.

```
Required: query (string)
Optional: limit (number, default 20)
Returns:  { id, title, description, image_url, rank, created_at }[]
```

### 4. `find_files`

Search for files and folders in the Virtual File System (VFS). Returns matching files/folders.

```
Required: query (string)
Optional: limit (number, default 20)
Returns:  { id, title, path, type, url, created_at }[]
```

### 5. `get_page_content`

Get the full content of a specific page by its slug or ID. Returns complete page data including extracted markdown from all text widgets, widget instance IDs (for targeted updates), and resolved variables.

```
Required: (one of) slug (string) OR id (string/UUID)
Returns:  { id, title, slug, description, markdown, widgets[], tags, is_public, variables, meta }
```

The `widgets` array returns `{ id, widgetId, containerId }` — use these IDs for `update_widget` and `remove_widget`.

### 6. `update_page_content`

Update the markdown content of a page. **Replaces the content of the first `markdown-text` widget.** Requires authentication (owner only).

```
Required: markdown (string)
Optional: id (UUID), slug (string), title (string), description (string)
Returns:  { success, id, slug, message }
Auth:     Owner only
```

### 7. `create_page`

Create a new page from scratch with a title and markdown content. Auto-generates slug from title. Formats content into the widget structure (single `markdown-text` widget inside a container). Requires authentication.

```
Required: title (string), markdown (string)
Optional: description (string), tags (string[]), is_public (boolean, default false),
          visible (boolean, default true), parent (UUID), type ("article"|"page"),
          categoryId (UUID — use list_categories to find correct ID)
Returns:  { success, pageId, slug, url, message }
Auth:     Required
```

### 8. `add_containers`

Add containers with widgets to a page. **Appends** new containers to the page layout. IDs are auto-generated. Persists directly to the database. Requires authentication.

```
Required: containers (array of container objects)
Optional: id (UUID), slug (string)
Auth:     Owner only
```

**Container schema:**
```json
{
  "columns": 1-4,          // CSS grid columns, default 1
  "gap": 16,               // Gap in px
  "order": 0,              // Sort position (auto-assigned if omitted)
  "widgets": [
    {
      "widgetId": "markdown-text",   // Widget type (required)
      "order": 0,
      "props": { "content": "..." } // Widget-specific props (required)
    }
  ],
  "children": [],           // Nested sub-containers
  "settings": {
    "title": "",
    "showTitle": false,
    "collapsible": false,
    "collapsed": false
  }
}
```

**Available widget types:**

| widgetId | Purpose | Key Props |
|----------|---------|-----------|
| `markdown-text` | Rich text content | `content` (markdown string) |
| `html-widget` | Raw HTML embed | `content` (HTML string) |
| `photo-card` | Image with caption/link | `src`, `caption`, `link`, `alt` |
| `photo-grid-widget` | Multi-image grid | `images[]`, `columns` |
| `gallery-widget` | Lightbox gallery | `images[]`, `autoplay` |
| `page-card` | Link to another page | `pageId`, `showDescription` |
| `tabs-widget` | Tabbed sub-layouts | `tabs[]` with nested layouts |
| `layout-container-widget` | Nested container | `layoutData` |

### 9. `update_widget`

Update the props of an existing widget by its instance ID. **Only supply the props that should change** — they will be merged with existing props. Use `get_page_content` first to discover widget instance IDs.

```
Required: widgetId (string — the widget instance ID, e.g. "widget-1740123456789-abc123"),
          props (object — partial props to merge)
Optional: id (UUID), slug (string)
Auth:     Owner only
```

### 10. `remove_widget`

Remove an existing widget from a page by its instance ID. Use `get_page_content` to discover widget instance IDs.

```
Required: widgetId (string — widget instance ID to remove)
Optional: id (UUID), slug (string)
Auth:     Owner only
```

### 11. `list_categories`

List all content categories with their hierarchy. Returns category tree with names, slugs, and nested children.

```
Optional: parentSlug (string), includeChildren (boolean, default true)
Returns:  { id, name, slug, description, children[] }[]
```

### 12. `find_by_category`

Get all pages belonging to a category (and optionally its descendants). Returns items with resolved variables.

```
Required: slug (string — category slug)
Optional: limit (number, default 50), includeDescendants (boolean, default true)
Returns:  { category: {...}, total, items: [{ id, title, slug, description, variables, created_at }] }
```

### 13. `markdown_scraper`

Scrape a URL and return its content as clean Markdown. Uses Readability + Turndown for extraction.

```
Required: url (string)
Returns:  { markdown, title }
```

### 14. `generate_image`

Generate an image using Google Gemini and upload it to Supabase storage. Returns a public URL and markdown snippet ready to embed in page content. Use **before** `create_page` to create images for articles.

```
Required: prompt (string — describe the image in detail)
Optional: aspect_ratio (enum: "1:1"|"3:4"|"4:3"|"9:16"|"16:9", default "16:9"),
          alt (string — alt text for markdown, defaults to shortened prompt)
Returns:  { success, url, markdown, alt, description, message }
Auth:     Requires user's Google API key in account settings
```

### 15. `get_page_translations`

Get existing translations for a page. Returns all widget translations and meta (title/description) for a specific target language. **Use this to review what is already translated before writing new translations.**

```
Required: target_lang (string — e.g. "de", "es", "fr")
Optional: slug (string), id (UUID), source_lang (string, default "en")
Returns:  { page_id, page_title, slug, target_lang, source_lang,
            translations: [{ widget_id, prop_path, source_text, translated_text, status, outdated }],
            summary: { total, translated, missing, outdated } }
```

Each translation entry includes:
- `source_text` — the current English source content
- `translated_text` — existing translation (or null if missing)
- `status` — `"missing"` | `"machine"` | `"draft"` | `"reviewed"` | `"published"`
- `outdated` — `true` if source text changed since translation was saved

### 16. `set_page_translations`

Save translations for a page. Batch-upserts widget translations for a specific target language. **The agent (LLM) performs the actual translation — this tool just persists the results.** Source text is auto-filled from the page.

```
Required: target_lang (string), translations (array)
Optional: slug (string), id (UUID), source_lang (string, default "en")
Auth:     Owner only
```

**Translation entry schema:**
```json
{
  "widget_id": "widget-1740123456789-abc123",  // or "__meta__" for title/description
  "translated_text": "Translated content here",
  "prop_path": "content",                       // default "content"; use "title" or "description" for __meta__
  "status": "machine"                            // default "machine"
}
```

### 17. `get_translation_gaps`

Find pages/entities with missing or outdated translations for a given language. **Use this to discover what needs translating.**

```
Required: target_lang (string — e.g. "de")
Optional: entity_type (enum: page|category|type, default "page"),
          mode (enum: missing|outdated|all, default "all"),
          source_lang (string, default "en")
Returns:  Array of entities with their untranslated/outdated source text
```

---

## Content Categories (Current)

| Category | Slug | Parent | Use For |
|----------|------|--------|---------|
| Knowledge Base | `knowledge-base` | — | Tutorials, guides, docs |
| Meta | `meta` | Knowledge Base | Platform/system docs |
| Machines | `machines` | Knowledge Base | Machine operation guides |
| Moulds | `moulds` | Knowledge Base | Mould design and usage |
| Software | `kb-software` | Knowledge Base | Software guides |
| Design | `design` | Knowledge Base | Design patterns, UI/UX |
| Products | `products` | — | Product pages |
| Injectors | `injectors` | Products | Injection machines |
| Shredders | `shredders` | Products | Plastic shredders |
| Extruder | `extruder` | Products | Extrusion machines |
| Sheetpress | `sheetpress` | Products | Sheet press machines |
| Components | `components` | Products | Parts and accessories |
| Software | `software` | Products | Software products |
| Layouts | `layouts` | — | Reusable templates |
| EMails | `emails` | Layouts | Email templates |

---

## Authoring Workflows

### Creating a New Article

```
1. search_content / find_pages  →  Check if similar content exists (avoid duplicates!)
2. list_categories              →  Find the right categoryId (UUID)
3. find_by_category             →  See what already exists in that category
4. find_pages / search_content  →  Find related content to cross-reference
5. generate_image               →  Create header/inline images (BEFORE create_page)
6. create_page                  →  Pass title, markdown (with embedded image URLs), categoryId
7. add_containers               →  (Optional) Add photo-cards, grids, tabs for richer layouts
```

### Adding Images to an Existing Article

```
1. get_page_content (by slug)   →  Read current content
2. generate_image (×N)          →  Generate images with detailed prompts
3. update_page_content          →  Embed images in markdown as ![alt](url)
   OR
   add_containers               →  Add photo-card widgets for standalone images
```

### Updating Existing Content

```
1. get_page_content             →  Read current content + widget instance IDs
2. update_page_content          →  Replace the first markdown-text widget content
   OR
   update_widget (by widgetId)  →  Update a specific widget's props (merge, not replace)
3. remove_widget                →  Remove unwanted widgets
```

### Translating Content

```
1. find_by_category             →  List all pages in a category (e.g. "products")
2. get_page_translations        →  Check what's already translated / missing / outdated
3. (LLM translates)             →  Read source_text, produce high-quality translation
4. set_page_translations        →  Save translations (widget_id + translated_text)
5. Repeat for each page
```

**Bulk translation pattern (e.g. "translate all products to German"):**

```
1. find_by_category(slug: "products")     →  Get all product slugs
2. FOR EACH slug:
   a. get_page_translations(slug, target_lang: "de")  →  Get source text + status
   b. Translate all missing/outdated widgets
   c. set_page_translations(slug, target_lang: "de", translations: [...])  →  Save
```

**Key rules for translations:**
- Use `widget_id: "__meta__"` with `prop_path: "title"` for page titles
- Use `widget_id: "__meta__"` with `prop_path: "description"` for page descriptions
- For widget content, use the widget instance ID with `prop_path: "content"`
- **Never translate slugs** — they are URL identifiers and stay in English
- Preserve all markdown formatting, links, image URLs, and HTML entities
- Use proper technical terminology for the target language
- Set `status: "machine"` for LLM-produced translations

### Building Rich Multi-Widget Layouts

Use `add_containers` for multi-column layouts:

```json
{
  "slug": "my-page",
  "containers": [
    {
      "columns": 2,
      "gap": 16,
      "widgets": [
        {
          "widgetId": "photo-card",
          "props": { "src": "https://...", "caption": "Machine overview" }
        },
        {
          "widgetId": "markdown-text",
          "props": { "content": "## Specifications\n\n- Weight: 45kg\n- ..." }
        }
      ]
    }
  ]
}
```

---

## Domain Context: Plastic Recycling Machinery

PoolyPress is the content platform for **PolyMech** — open-source plastic recycling machinery.

### Injection Moulding Machines
- **Elena** — Production-grade, 400g shots, shutoff valve, web interface (€3,200)
- **Katbot** — Prototyping, CNC precision, arbor injection (€1,800)
- **Myriad** — Educational, lightweight, safe (€2,600)

### Shredders
- **Mini Shredder AM 2018/200** — Small batch
- **Obelix-300** — Medium throughput
- **WSGP-230** — Industrial

### Extruders
- **Lydia SJ30/SJ25** — Pelletizing, filament, beam extrusion

### Common Plastic Types
HDPE, PP, PS, PET, ABS — always use correct abbreviations.

When writing product-related content:
- Search and link to real product pages
- Include pricing where available
- Reference related machines (e.g. shredders → material prep → injection)
- Use correct technical terminology

---

## Image Generation Guidelines

When using `generate_image`, write **detailed prompts**:

✅ "Professional product photo of a desktop plastic injection moulding machine, recycled HDPE pellets being loaded into the hopper, workshop environment, warm lighting, clean industrial aesthetic"

❌ "injection machine photo"

Always set descriptive `alt` text for accessibility and SEO.

---

## Key Technical Notes

- **Page identification**: Most write tools accept either `id` (UUID) or `slug` (string). Use slug for convenience, UUID for precision.
- **Widget instance IDs**: Format is `widget-{timestamp}-{randomId}`. Always call `get_page_content` first to discover them.
- **Container IDs**: Auto-generated by `add_containers` — format is `container-{timestamp}-{randomId}`.
- **Content structure**: Pages store content as `{ pages: { "page-{uuid}": { containers: [...] } } }`.
- **Cache flush**: All write tools automatically flush the server page cache after persisting.
- **Auth model**: Write tools require authentication and verify page ownership via `userId === page.owner`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `create_page` error | Verify `categoryId` is a valid UUID from `list_categories` |
| `update_widget` not found | Call `get_page_content` first — use the widget `id` field, not `widgetId` |
| Image generation fails | User needs a Google API key configured in account settings |
| Page not found by slug | Use `find_pages` to search by title, then use the returned slug |
| "No markdown-text widget found" | Page has no text widget — use `add_containers` to add one first |
| "Permission denied" | Only the page owner can update — check `userId` matches `page.owner` |
| Translation tool `map is not a function` | Translations array too large — split into smaller batches (3–4 widgets per call) |
| Outdated translations | Source text changed since last translation — re-translate using fresh `source_text` from `get_page_translations` |
| Missing vs. outdated | `missing` = never translated; `outdated` = source changed after translation was saved |
