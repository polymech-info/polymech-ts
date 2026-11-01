# PoolyPress MCP Server

> Model Context Protocol (MCP) server that lets any LLM search, browse, and read content on a PoolyPress instance.

---

## Architecture

```
┌──────────────────────────────┐
│  MCP Client (Claude, etc.)   │
└──────────┬───────────────────┘
           │  POST /api/mcp
           │  JSON-RPC 2.0
┌──────────▼───────────────────┐
│   McpProduct (Hono handler)  │
│       handlers.ts            │
│   ─────────────────────────  │
│   initialize · tools/list    │
│   tools/call → tools.ts      │
└──────────┬───────────────────┘
           │  direct function calls
┌──────────▼───────────────────┐
│   Server-side logic          │
│   searchDirect · categories  │
│   pages-data · site-scrape   │
└──────────────────────────────┘
```

### Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| **SDK** | None — raw JSON-RPC 2.0 | Zero deps; MCP spec is just JSON-RPC over HTTP |
| **Transport** | `POST /api/mcp` (HTTP) | Single endpoint; works with any HTTP client |
| **Auth** | `Bearer <supabase-token>` | Reuses existing `getUserCached()` — no new auth layer |
| **Code reuse** | Direct imports from `products/serving/` | No REST-over-HTTP round-trips; zero duplication |

---

## Source Files

```
server/src/products/mcp/
├── index.ts       # McpProduct class (extends AbstractProduct)
├── routes.ts      # POST /api/mcp route definition
├── handlers.ts    # JSON-RPC 2.0 dispatcher
├── tools.ts       # 17 tool definitions + handlers
└── __tests__/
    └── mcp.e2e.test.ts  # E2E tests
```

| File | Source | Purpose |
|---|---|---|
| [index.ts](../server/src/products/mcp/index.ts) | Product entry | Registers with platform product system |
| [routes.ts](../server/src/products/mcp/routes.ts) | Route | `POST /api/mcp` — private (auth required) |
| [handlers.ts](../server/src/products/mcp/handlers.ts) | Handler | Dispatches `initialize`, `tools/list`, `tools/call` |
| [tools.ts](../server/src/products/mcp/tools.ts) | Tools | All tool schemas + handler functions |
| [registry.ts](../server/src/products/registry.ts) | Registration | `'mcp': McpProduct` entry |
| [products.json](../server/config/products.json) | Config | `mcp` enabled, depends on `serving` |

### Upstream dependencies

| Import | Source file | Used by |
|---|---|---|
| `searchDirect()` | [db-search.ts](../server/src/products/serving/db/db-search.ts) | `search_content`, `find_pages`, `find_pictures`, `find_files` |
| `fetchCategoriesServer()` | [db-categories.ts](../server/src/products/serving/db/db-categories.ts) | `list_categories` |
| `getCategoryState()` | [db-categories.ts](../server/src/products/serving/db/db-categories.ts) | `find_by_category` |
| `filterVisibleCategories()` | [db-categories.ts](../server/src/products/serving/db/db-categories.ts) | `list_categories` |
| `getPagesState()` | [pages-data.ts](../server/src/products/serving/pages/pages-data.ts) | `get_page_content`, `find_by_category` |
| `enrichPageData()` | [pages-data.ts](../server/src/products/serving/pages/pages-data.ts) | `get_page_content` |
| `JSDOM` + `Readability` | [jsdom](https://www.npmjs.com/package/jsdom), [@mozilla/readability](https://www.npmjs.com/package/@mozilla/readability) | `markdown_scraper` |
| `getPageTranslations()` | [pages-i18n.ts](../server/src/products/serving/pages/pages-i18n.ts) | `get_page_translations`, `set_page_translations` |
| `getTranslationGaps()` | [db-i18n.ts](../server/src/products/serving/db/db-i18n.ts) | `get_translation_gaps` |

---

## Tools

### `search_content`

Full-text search across pages, posts, pictures, and VFS files.

```jsonc
{
  "name": "search_content",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query (full-text)" },
      "limit": { "type": "number", "description": "Max results (default 20, max 50)" },
      "type":  { "type": "string", "enum": ["all","pages","posts","pictures","files"] }
    },
    "required": ["query"]
  }
}
```

**Returns:** `[{ id, title, description, type, rank, url, created_at }]`

**Backend:** `searchDirect({ q, limit, type, userId })`

---

### `find_pages`

Search specifically for pages.

```jsonc
{ "name": "find_pages", "inputSchema": { "properties": { "query": {}, "limit": {} }, "required": ["query"] } }
```

**Returns:** `[{ id, title, slug, description, rank, created_at }]`

---

### `find_pictures`

Search specifically for pictures/images.

```jsonc
{ "name": "find_pictures", "inputSchema": { "properties": { "query": {}, "limit": {} }, "required": ["query"] } }
```

**Returns:** `[{ id, title, description, image_url, rank, created_at }]`

---

### `find_files`

Search for files and folders in the Virtual File System (VFS).

```jsonc
{ "name": "find_files", "inputSchema": { "properties": { "query": {}, "limit": {} }, "required": ["query"] } }
```

**Returns:** `[{ id, title, path, type, url, created_at }]`

---

### `get_page_content`

Get the full content of a specific page by slug or ID.

```jsonc
{
  "name": "get_page_content",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "Page slug (e.g. \"about-us\")" },
      "id":   { "type": "string", "description": "Page UUID (alternative to slug)" }
    }
  }
}
```

**Returns:** `{ id, title, slug, description, content, tags, is_public, created_at, updated_at, meta }`

---

### `list_categories`

List all content categories with hierarchy.

```jsonc
{
  "name": "list_categories",
  "inputSchema": {
    "type": "object",
    "properties": {
      "parentSlug":      { "type": "string", "description": "Filter children of parent" },
      "includeChildren": { "type": "boolean", "description": "Include nested children (default true)" }
    }
  }
}
```

**Returns:** `[{ id, name, slug, description, children: [{ id, name, slug }] }]`

---

### `find_by_category`

Get all pages belonging to a category (and descendants).

```jsonc
{
  "name": "find_by_category",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug":               { "type": "string" },
      "limit":              { "type": "number", "description": "Max items (default 50)" },
      "includeDescendants": { "type": "boolean", "description": "Include child categories (default true)" }
    },
    "required": ["slug"]
  }
}
```

**Returns:** `{ category: { id, name, slug, description }, total, items: [{ id, title, slug, description, variables, created_at }] }`

---

### `markdown_scraper`

Scrape a URL and return clean Markdown.

```jsonc
{
  "name": "markdown_scraper",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "URL to scrape" }
    },
    "required": ["url"]
  }
}
```

**Returns:** `{ markdown, title }` or `{ error }`

> Uses lightweight `fetch` + `Readability` + `Turndown`. For JavaScript-heavy pages, the full Scrapeless-powered endpoint at `POST /api/scrape/markdown` ([site-scrape.ts](../server/src/products/serving/site-scrape.ts)) is available separately.

---

### `get_page_translations`

Get existing translations for a page. Returns all widget translations and meta (title/description) for a specific target language.

```jsonc
{
  "name": "get_page_translations",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug":        { "type": "string", "description": "Page slug" },
      "id":          { "type": "string", "description": "Page UUID (alternative to slug)" },
      "target_lang": { "type": "string", "description": "Target language code (e.g. \"es\", \"de\")" },
      "source_lang": { "type": "string", "description": "Source language code (default \"en\")" }
    },
    "required": ["target_lang"]
  }
}
```

**Returns:** `{ page_id, page_title, slug, target_lang, source_lang, translations: [{ widget_id, prop_path, source_text, translated_text, status, outdated }], summary: { total, translated, missing, outdated } }`

---

### `set_page_translations`

Save translations for a page. Batch-upserts widget translations for a target language. The LLM performs the translation — this tool persists the results.

```jsonc
{
  "name": "set_page_translations",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug":        { "type": "string" },
      "id":          { "type": "string" },
      "target_lang": { "type": "string" },
      "source_lang": { "type": "string", "description": "default \"en\"" },
      "translations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "widget_id":       { "type": "string", "description": "Widget instance ID or \"__meta__\"" },
            "translated_text": { "type": "string" },
            "prop_path":       { "type": "string", "description": "default \"content\"" },
            "status":          { "type": "string", "enum": ["draft","machine","reviewed","published"] }
          },
          "required": ["widget_id", "translated_text"]
        }
      }
    },
    "required": ["target_lang", "translations"]
  }
}
```

**Returns:** `{ success, page_id, slug, target_lang, count, message }`

**Auth:** Owner only

---

### `get_translation_gaps`

Find pages/entities with missing or outdated translations for a given language.

```jsonc
{
  "name": "get_translation_gaps",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_lang":  { "type": "string", "description": "Target language code (e.g. \"de\")" },
      "entity_type":  { "type": "string", "enum": ["page","category","type"], "description": "default \"page\"" },
      "mode":         { "type": "string", "enum": ["missing","outdated","all"], "description": "default \"all\"" },
      "source_lang":  { "type": "string", "description": "default \"en\"" }
    },
    "required": ["target_lang"]
  }
}
```

**Returns:** Array of entities with their untranslated/outdated source text

---

## Protocol

The endpoint speaks **JSON-RPC 2.0** — no MCP SDK required on either side.

### Methods

| Method | Purpose |
|---|---|
| `initialize` | Handshake — returns server info and capabilities |
| `tools/list` | Lists all 17 tools with schemas |
| `tools/call` | Execute a tool by name with arguments |

### Request format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_content",
    "arguments": { "query": "plastic", "limit": 5 }
  }
}
```

### Response format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "[{\"id\":\"...\",\"title\":\"...\"}]"
    }]
  }
}
```

### Error codes

| Code | Meaning |
|---|---|
| `-32700` | Parse error (malformed JSON) |
| `-32600` | Invalid request (missing jsonrpc/method) |
| `-32601` | Method/tool not found |
| `-32603` | Internal error |

---

## Usage

### curl

```bash
# Initialize
curl -X POST http://localhost:3333/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List tools
curl -X POST http://localhost:3333/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Search
curl -X POST http://localhost:3333/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_content","arguments":{"query":"plastic","limit":3}}}'
```

### Claude Desktop / Cursor / Windsurf

These clients expect an stdio transport or an SSE endpoint. To use the HTTP endpoint, you can wrap it with a thin stdio ↔ HTTP bridge:

```json
{
  "mcpServers": {
    "poolypress": {
      "url": "http://localhost:3333/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

> **Note:** Claude Desktop 2025+ supports HTTP MCP servers natively via the `url` field.

---

## Configuration

The MCP product is enabled in [`server/config/products.json`](../server/config/products.json):

```json
{
  "name": "mcp",
  "enabled": true,
  "workers": 0,
  "deps": ["serving"]
}
```

To disable the MCP endpoint, set `"enabled": false`.

---

## Testing

```bash
cd server
npm run test:mcp
```

Runs 13 E2E tests covering all tools, error handling, and protocol compliance.

Test file: [`server/src/products/mcp/__tests__/mcp.e2e.test.ts`](../server/src/products/mcp/__tests__/mcp.e2e.test.ts)

---

## How to Add a New Tool

1. **Define the tool** in [`tools.ts`](../server/src/products/mcp/tools.ts):

```typescript
const myNewTool: McpTool = {
    name: 'my_tool',
    description: 'What this tool does — shown to the LLM.',
    inputSchema: {
        type: 'object',
        properties: {
            param1: { type: 'string', description: '...' }
        },
        required: ['param1']
    },
    handler: async (args, userId) => {
        // Call server-side logic directly
        const result = await someServerFunction(args.param1);
        return result;
    }
};
```

2. **Register it** — add to the `MCP_TOOLS` array at the bottom of `tools.ts`:

```typescript
export const MCP_TOOLS: McpTool[] = [
    // … existing tools …
    myNewTool
];
```

That's it. The handler in `handlers.ts` auto-discovers tools via the `MCP_TOOLS_MAP`. No route changes needed.

3. **Add tests** — add a test case in [`mcp.e2e.test.ts`](../server/src/products/mcp/__tests__/mcp.e2e.test.ts) and update the tool count assertion.

### Tool design guidelines

- **Call server-side functions directly** — never make HTTP requests to your own server
- **Accept `userId`** as second argument — pass it through for visibility/ACL filtering
- **Return structured data** — the handler serializes it to JSON automatically
- **Use existing caches** — `getPagesState()`, `getCategoryState()`, etc. are all cached
- **Keep schemas minimal** — LLMs work better with fewer, well-described parameters

---

## Security

- **Auth gating**: Every tool call resolves the user from the Bearer token. Anonymous requests get limited visibility (public content only).
- **VFS ACL**: File searches respect the existing ACL layer.
- **Visibility filtering**: `searchDirect()` applies owner/public/private filtering based on `userId`.
- **Rate limiting**: Inherits the platform's `apiRateLimiter` middleware.
- **Write operations**: Content creation, editing, and translation tools require authentication and verify page ownership (`userId === page.owner`). Admin-only actions are **not** available.
