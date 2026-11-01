/**
 * Search Tools — AI tool definitions for content search
 *
 * These tools allow the AI to search for pages, posts, and pictures
 * on the platform using the existing FTS search API.
 * 
 * Uses manual JSON schemas (not zodToJsonSchema) to guarantee
 * OpenAI-compatible `type: "object"` at the top level.
 */

import { z } from 'zod';
import { searchContent, type SearchOptions } from '@/modules/search/client-search';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
import { serverUrl } from '@/lib/db';

type LogFunction = (level: string, message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[${level}] ${message}`, data);

/** Production server base URL for constructing public links */
const SERVER_BASE = serverUrl;

/** Extract the best image URL from a FeedPost-shaped search result */
const extractImageUrl = (item: any): string | null => {
    // Direct image_url (rare at top level)
    if (item.image_url) return item.image_url;
    // From cover object
    if (item.cover?.image_url) return item.cover.image_url;
    // From pictures array
    if (item.pictures?.[0]?.image_url) return item.pictures[0].image_url;
    // From responsive img
    if (item.cover?.responsive?.img?.src) return item.cover.responsive.img.src;
    if (item.pictures?.[0]?.responsive?.img?.src) return item.pictures[0].responsive.img.src;
    return null;
};

/** Extract a small thumbnail URL (320w) if available */
const extractThumbnailUrl = (item: any): string | null => {
    const sources = item.cover?.responsive?.sources || item.pictures?.[0]?.responsive?.sources;
    if (sources?.[0]?.srcset) {
        // Pick the smallest srcset entry (320w)
        const match = sources[0].srcset.match(/^(\S+)\s+320w/);
        if (match) return match[1];
    }
    return item.thumbnail_url || null;
};

// ── Schema types ─────────────────────────────────────────────────────────

interface SearchContentArgs {
    query: string;
    limit?: number;
}

interface FindPagesArgs {
    query: string;
    limit?: number;
}

interface FindPicturesArgs {
    query: string;
    limit?: number;
}

interface FindFilesArgs {
    query: string;
    limit?: number;
}

// ── Zod schemas (for runtime parsing only) ───────────────────────────────

const searchContentSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(50).optional(),
});

const findPagesSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(20).optional(),
});

const findPicturesSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(20).optional(),
});

const findFilesSchema = z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(50).optional(),
});

// ── Multi-pass fallback search ───────────────────────────────────────────

/**
 * Searches with the full query first. If fewer than MIN_RESULTS are returned
 * and the query contains multiple words, re-runs a search per individual term
 * and merges the deduplicated results.
 *
 * This works around PostgreSQL FTS requiring ALL terms to match (AND behaviour)
 * when a product name only partially matches the user's query.
 * e.g. "elena injector" → first tries full phrase, then "elena" + "injector" independently.
 */
const MIN_RESULTS = 3;

async function searchWithFallback(options: SearchOptions, addLog: LogFunction): Promise<any[]> {
    const full = await searchContent(options);
    if (full.length >= MIN_RESULTS) return full;

    const words = options.q.trim().split(/\s+/).filter(w => w.length > 1);
    if (words.length < 2) return full;

    addLog('info', `[SEARCH-TOOLS] fallback: "${options.q}" returned ${full.length}, retrying per term: ${words.join(', ')}`);

    const scores = new Map<string, number>();
    const itemsMap = new Map<string, any>();

    // Add initial full results with high baseline score
    for (const item of full) {
        scores.set(item.id, 100);
        itemsMap.set(item.id, item);
    }

    await Promise.all(words.map(async word => {
        try {
            const partial = await searchContent({ ...options, q: word });
            for (const item of partial) {
                scores.set(item.id, (scores.get(item.id) || 0) + 1);
                if (!itemsMap.has(item.id)) itemsMap.set(item.id, item);
            }
        } catch { /* ignore per-term failures */ }
    }));

    const merged = Array.from(itemsMap.values()).sort((a, b) => {
        return (scores.get(b.id) || 0) - (scores.get(a.id) || 0);
    });

    addLog('info', `[SEARCH-TOOLS] fallback merged ${merged.length} total results for "${options.q}"`);
    return merged.slice(0, options.limit ?? 10);
}

// ── Tool: Search Content ─────────────────────────────────────────────────

export const searchContentTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<SearchContentArgs> => ({
    type: 'function',
    function: {
        name: 'search_content',
        description:
            'Search for pages on the platform matching the query. ' +
            'Use this to find product pages, articles, and documentation. ' +
            'Returns page titles, descriptions, URLs, and metadata.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query string. Supports natural language and keywords.' },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum number of results to return. Defaults to 10.',
                },
            },
            required: ['query'],
        } as any,
        parse(input: string): SearchContentArgs {
            return searchContentSchema.parse(JSON.parse(input));
        },
        function: async (args: SearchContentArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] search_content called', { query: args.query, limit: args.limit });

                const searchType = 'pages';
                const searchLimit = args.limit || 10;

                const options: SearchOptions = {
                    q: args.query,
                    limit: searchLimit,
                    type: 'pages',
                };

                const results = await searchWithFallback(options, addLog);

                // Log first raw result for debugging field names
                if (results.length > 0) {
                    const first = results[0];
                    addLog('debug', '[SEARCH-TOOLS] Raw result fields: ' + Object.keys(first).join(', '));
                    addLog('debug', `[SEARCH-TOOLS] First item: slug=${first.slug}, meta.slug=${first.meta?.slug}, user_id=${first.user_id}, owner=${first.owner}, _searchSource=${first._searchSource}`);
                    console.log('[SEARCH-TOOLS] First item: slug=', first.slug, 'meta.slug=', first.meta?.slug, 'user_id=', first.user_id, 'owner=', first.owner, '_searchSource=', first._searchSource);
                    console.log('[SEARCH All Results] ', results);
                }

                const buildUrl = (item: any): string | null => {
                    const userId = item.user_id || item.owner;
                    const slug = item.slug || item.meta?.slug;
                    const source = item._searchSource;

                    if (source === 'page' && slug && userId) {
                        return `${SERVER_BASE}/user/${userId}/pages/${slug}`;
                    }
                    if ((source === 'post' || source === 'picture') && item.id) {
                        return `${SERVER_BASE}/post/${item.id}`;
                    }
                    // Fallback: if we have a slug and userId, assume page
                    if (slug && userId) {
                        return `${SERVER_BASE}/user/${userId}/pages/${slug}`;
                    }
                    return null;
                };

                const summary = results.map((item: any) => ({
                    id: item.id,
                    title: item.title || 'Untitled',
                    type: item._searchSource || item.type || 'unknown',
                    description: item.description?.substring(0, 200) || '',
                    variables: item.meta?.typeValues,
                    image_url: extractImageUrl(item),
                    thumbnail_url: extractThumbnailUrl(item),
                    slug: item.slug || item.meta?.slug || null,
                    owner: item.user_id || item.owner || null,
                    created_at: item.created_at || null,
                    url: buildUrl(item),
                }));

                addLog('info', '[SEARCH-TOOLS] search_content returned', { count: summary.length });

                return {
                    success: true,
                    query: args.query,
                    type: searchType,
                    total: summary.length,
                    results: summary,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] search_content failed', { error: error.message });
                return { success: false, error: error.message, results: [] };
            }
        },
    },
});

// ── Tool: Find Pages ─────────────────────────────────────────────────────

export const findPagesTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<FindPagesArgs> => ({
    type: 'function',
    function: {
        name: 'find_pages',
        description:
            'Search specifically for pages/articles on the platform. ' +
            'Returns page titles, slugs, descriptions, and URLs. ' +
            'Use this when the user asks about existing articles, documentation, or pages.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query for finding pages.' },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    description: 'Maximum pages to return. Defaults to 5.',
                },
            },
            required: ['query'],
        } as any,
        parse(input: string): FindPagesArgs {
            return findPagesSchema.parse(JSON.parse(input));
        },
        function: async (args: FindPagesArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] find_pages called', { query: args.query });

                const results = await searchWithFallback({ q: args.query, limit: args.limit || 5, type: 'pages' }, addLog);

                const pages = results.map((item: any) => {
                    const slug = item.slug || item.meta?.slug;
                    const userId = item.user_id || item.owner;
                    return {
                        id: item.id,
                        title: item.title || 'Untitled',
                        slug,
                        description: item.description?.substring(0, 300) || '',
                        variables: item.meta?.typeValues,
                        owner: userId,
                        url: slug && userId
                            ? `${SERVER_BASE}/user/${userId}/pages/${slug}`
                            : null,
                        created_at: item.created_at,
                        image_url: item.image_url || item.cover?.image_url || null,
                    };
                });

                return {
                    success: true,
                    query: args.query,
                    total: pages.length,
                    pages,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] find_pages failed', { error: error.message });
                return { success: false, error: error.message, pages: [] };
            }
        },
    },
});

// ── Tool: Find Pictures ──────────────────────────────────────────────────

export const findPicturesTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<FindPicturesArgs> => ({
    type: 'function',
    function: {
        name: 'find_pictures',
        description:
            'Search specifically for pictures/images on the platform. ' +
            'Returns image titles, URLs, and metadata. ' +
            'Use this when the user asks to find or look up specific images.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query for finding pictures.' },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    description: 'Maximum pictures to return. Defaults to 8.',
                },
            },
            required: ['query'],
        } as any,
        parse(input: string): FindPicturesArgs {
            return findPicturesSchema.parse(JSON.parse(input));
        },
        function: async (args: FindPicturesArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] find_pictures called', { query: args.query });

                const results = await searchContent({ q: args.query, limit: args.limit || 8, type: 'pictures' });

                const pictures = results.map((item: any) => ({
                    id: item.id,
                    title: item.title || 'Untitled',
                    image_url: extractImageUrl(item),
                    thumbnail_url: extractThumbnailUrl(item),
                    description: item.description?.substring(0, 200) || '',
                    owner: item.user_id || item.owner,
                    url: `${SERVER_BASE}/post/${item.id}`,
                    created_at: item.created_at,
                    tags: item.tags || [],
                }));

                return {
                    success: true,
                    query: args.query,
                    total: pictures.length,
                    pictures,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] find_pictures failed', { error: error.message });
                return { success: false, error: error.message, pictures: [] };
            }
        },
    },
});

// ── Tool: Find Files ─────────────────────────────────────────────────────

export const findFilesTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<FindFilesArgs> => ({
    type: 'function',
    function: {
        name: 'find_files',
        description:
            'Search specifically for files and folders in the Virtual File System (VFS). ' +
            'Returns file names, paths, types (file/folder), and URLs. ' +
            'Use this when the user asks to find, list, or look up specific uploaded files or folders.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query for finding files.' },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum files to return. Defaults to 20.',
                },
            },
            required: ['query'],
        } as any,
        parse(input: string): FindFilesArgs {
            return findFilesSchema.parse(JSON.parse(input));
        },
        function: async (args: FindFilesArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] find_files called', { query: args.query });

                const results = await searchContent({ q: args.query, limit: args.limit || 20, type: 'files' });

                const files = results.map((item: any) => ({
                    id: item.id,
                    name: item.title || 'Untitled',
                    type: item.type === 'page-vfs-folder' ? 'folder' : 'file',
                    path: item.description || '',
                    url: item.meta?.url ? `${SERVER_BASE}${item.meta.url}` : null,
                    image_url: extractImageUrl(item),
                    thumbnail_url: extractThumbnailUrl(item),
                    owner: item.user_id || item.owner,
                    created_at: item.created_at,
                    size: item.meta?.size || null,
                }));

                return {
                    success: true,
                    query: args.query,
                    total: files.length,
                    files,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] find_files failed', { error: error.message });
                return { success: false, error: error.message, files: [] };
            }
        },
    },
});

// ── Tool: Get Page Content ───────────────────────────────────────────────

interface GetPageContentArgs {
    user_id: string;
    slug: string;
}

const getPageContentSchema = z.object({
    user_id: z.string(),
    slug: z.string(),
});

export const getPageContentTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<GetPageContentArgs> => ({
    type: 'function',
    function: {
        name: 'get_page_content',
        description:
            'Retrieves the full markdown content of a specific page. ' +
            'Use the user_id (owner) and slug from search results to fetch a page\'s details. ' +
            'This is useful when search results provide a title/slug but you need the actual content to answer a question. ' +
            'Workflow: first use find_pages or search_content to locate a page, then use this tool with the returned owner and slug.',
        parameters: {
            type: 'object',
            properties: {
                user_id: { type: 'string', description: 'The owner/user_id of the page (UUID from search results).' },
                slug: { type: 'string', description: 'The slug of the page (from search results).' },
            },
            required: ['user_id', 'slug'],
        } as any,
        parse(input: string): GetPageContentArgs {
            return getPageContentSchema.parse(JSON.parse(input));
        },
        function: async (args: GetPageContentArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] get_page_content called', { user_id: args.user_id, slug: args.slug });

                const mdUrl = `${SERVER_BASE}/user/${args.user_id}/pages/${args.slug}.md`;
                addLog('debug', `[SEARCH-TOOLS] Fetching: ${mdUrl}`);

                const res = await fetch(mdUrl);
                if (!res.ok) {
                    addLog('warn', `[SEARCH-TOOLS] get_page_content: ${res.status} for ${mdUrl}`);
                    return { success: false, error: `Page not found (${res.status})`, content: '' };
                }

                const markdown = await res.text();
                // Truncate to ~8000 chars to avoid token overload
                const truncated = markdown.length > 8000
                    ? markdown.substring(0, 8000) + '\n\n... (content truncated)'
                    : markdown;

                addLog('info', `[SEARCH-TOOLS] get_page_content returned ${markdown.length} chars (sent ${truncated.length})`);

                return {
                    success: true,
                    user_id: args.user_id,
                    slug: args.slug,
                    url: `${SERVER_BASE}/user/${args.user_id}/pages/${args.slug}`,
                    content_length: markdown.length,
                    content: truncated,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] get_page_content failed', { error: error.message });
                return { success: false, error: error.message, content: '' };
            }
        },
    },
});

// ── Tool: Markdown Scraper ───────────────────────────────────────────────

interface MarkdownScrapeArgs {
    url: string;
}

const markdownScrapeSchema = z.object({
    url: z.string().url(),
});

export const markdownScraperTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<MarkdownScrapeArgs> => ({
    type: 'function',
    function: {
        name: 'markdown_scraper',
        description:
            'Scrapes a specific URL and returns its main content formatted as Markdown. ' +
            'Use this when you have a specific URL (e.g. from web_search or find_pages) and need to read its external content. ' +
            'This tool connects to external sites, bypasses basic bot protections using Scrapeless, and extracts the primary readable content.',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'The fully qualified URL to scrape (must start with http:// or https://).' },
            },
            required: ['url'],
        } as any,
        parse(input: string): MarkdownScrapeArgs {
            return markdownScrapeSchema.parse(JSON.parse(input));
        },
        function: async (args: MarkdownScrapeArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] markdown_scraper called', { url: args.url });

                const { getAuthToken } = await import('@/lib/db');
                const token = await getAuthToken();

                const res = await fetch('/api/scrape/markdown', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ url: args.url })
                });

                if (!res.ok) {
                    const errText = await res.text().catch(() => '');
                    addLog('warn', `[SEARCH-TOOLS] markdown_scraper error ${res.status}: ${errText}`);
                    return { success: false, error: `Scrape error (${res.status}): ${errText}`, content: '' };
                }

                const data = await res.json();
                const markdown = data.markdown || '';
                const title = data.title || '';

                // Truncate to ~16000 chars to avoid token overload
                const truncated = markdown.length > 16000
                    ? markdown.substring(0, 16000) + '\n\n... (content truncated)'
                    : markdown;

                addLog('info', `[SEARCH-TOOLS] markdown_scraper returned ${markdown.length} chars for ${args.url}`);

                return {
                    success: true,
                    url: args.url,
                    title,
                    content_length: markdown.length,
                    content: truncated,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] markdown_scraper failed', { error: error.message });
                return { success: false, error: error.message, content: '' };
            }
        },
    },
});


// ── Tool: List Categories ────────────────────────────────────────────────

interface ListCategoriesArgs {
    // no required args
}

const listCategoriesSchema = z.object({});

export const listCategoriesTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<ListCategoriesArgs> => ({
    type: 'function',
    function: {
        name: 'list_categories',
        description:
            'List all content categories on the platform. Returns a tree of categories with names, slugs, and descriptions. ' +
            'Use this to discover what categories exist when the user asks about product lines, topics, or content groups. ' +
            'Use the returned slug with find_by_category to get items in that category.',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        } as any,
        parse(input: string): ListCategoriesArgs {
            return listCategoriesSchema.parse(input ? JSON.parse(input) : {});
        },
        function: async (_args: ListCategoriesArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] list_categories called');

                const res = await fetch(`${SERVER_BASE}/api/categories?includeChildren=true`);
                if (!res.ok) {
                    addLog('error', `[SEARCH-TOOLS] list_categories failed: ${res.status}`);
                    return { success: false, error: `Failed to fetch categories (${res.status})`, categories: [] };
                }

                const categories = await res.json();

                // Simplify tree for AI consumption
                const simplify = (cat: any): any => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description || null,
                    children: cat.children?.map((rel: any) => simplify(rel.child)).filter(Boolean) || [],
                });

                const simplified = categories.map(simplify);
                addLog('info', `[SEARCH-TOOLS] list_categories returned ${simplified.length} root categories`);

                return {
                    success: true,
                    total: simplified.length,
                    categories: simplified,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] list_categories failed', { error: error.message });
                return { success: false, error: error.message, categories: [] };
            }
        },
    },
});

// ── Tool: Find By Category ───────────────────────────────────────────────

interface FindByCategoryArgs {
    category_slug: string;
    limit?: number;
}

const findByCategorySchema = z.object({
    category_slug: z.string(),
    limit: z.number().int().min(1).max(50).optional(),
});

export const findByCategoryTool = (addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<FindByCategoryArgs> => ({
    type: 'function',
    function: {
        name: 'find_by_category',
        description:
            'Find all content items (pages) belonging to a specific category. ' +
            'Returns items with their fully resolved variables such as price, weight, model, specs, and other metadata. ' +
            'Use the category slug from list_categories. ' +
            'This is the primary tool for answering questions about product specifications, comparisons, and catalog data.',
        parameters: {
            type: 'object',
            properties: {
                category_slug: { type: 'string', description: 'Category slug (e.g. "sheetpress"). Use list_categories to discover available slugs.' },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum items to return. Defaults to 20.',
                },
            },
            required: ['category_slug'],
        } as any,
        parse(input: string): FindByCategoryArgs {
            return findByCategorySchema.parse(JSON.parse(input));
        },
        function: async (args: FindByCategoryArgs) => {
            try {
                addLog('info', '[SEARCH-TOOLS] find_by_category called', { slug: args.category_slug, limit: args.limit });

                const limit = args.limit || 20;
                const url = `${SERVER_BASE}/api/categories/${encodeURIComponent(args.category_slug)}/items?limit=${limit}`;
                const res = await fetch(url);

                if (!res.ok) {
                    if (res.status === 404) {
                        addLog('warn', `[SEARCH-TOOLS] find_by_category: category "${args.category_slug}" not found`);
                        return { success: false, error: `Category "${args.category_slug}" not found`, items: [] };
                    }
                    addLog('error', `[SEARCH-TOOLS] find_by_category failed: ${res.status}`);
                    return { success: false, error: `Failed (${res.status})`, items: [] };
                }

                const data = await res.json();
                addLog('info', `[SEARCH-TOOLS] find_by_category returned ${data.total} items for "${args.category_slug}"`);

                // Enrich URLs with full server base
                const items = (data.items || []).map((item: any) => ({
                    ...item,
                    url: `${SERVER_BASE}${item.url}`,
                }));

                return {
                    success: true,
                    category: data.category,
                    total: data.total,
                    items,
                };
            } catch (error: any) {
                addLog('error', '[SEARCH-TOOLS] find_by_category failed', { error: error.message });
                return { success: false, error: error.message, items: [] };
            }
        },
    },
});

// ── Preset ───────────────────────────────────────────────────────────────

/**
 * Create a preset of all search tools for use with runTools().
 */
export const createSearchToolPreset = (addLog: LogFunction = defaultLog) => ({
    tools: [
        searchContentTool(addLog),
        findPagesTool(addLog),
        findPicturesTool(addLog),
        findFilesTool(addLog),
        getPageContentTool(addLog),
        listCategoriesTool(addLog),
        findByCategoryTool(addLog),
        markdownScraperTool(addLog),
    ],
});

// ══════════════════════════════════════════════════════════════════════════
// Web Search Tools — external search via SerpAPI
// ══════════════════════════════════════════════════════════════════════════

interface WebSearchArgs {
    query: string;
    engine?: string;
    num?: number;
}

const webSearchSchema = z.object({
    query: z.string(),
    engine: z.enum(['google', 'google_news', 'google_scholar', 'google_local', 'google_maps', 'bing', 'duckduckgo']).optional(),
    num: z.number().int().min(1).max(20).optional(),
});

// ── Tool: Web Search (SerpAPI) ──────────────────────────────────────────

export const webSearchTool = (
    addLog: LogFunction = defaultLog
): RunnableToolFunctionWithParse<WebSearchArgs> => ({
    type: 'function',
    function: {
        name: 'web_search',
        description:
            'Search the web using Google (via SerpAPI). Returns organic search results with titles, links, and snippets. ' +
            'Use this to find information from the broader internet — news, documentation, competitive products, technical specs, etc. ' +
            'Supports multiple engines: google (default), google_news, google_scholar, google_local, google_maps, bing, duckduckgo.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query string.' },
                engine: {
                    type: 'string',
                    enum: ['google', 'google_news', 'google_scholar', 'google_local', 'google_maps', 'bing', 'duckduckgo'],
                    description: 'Search engine to use. Defaults to google.',
                },
                num: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 20,
                    description: 'Number of results to return. Defaults to 10.',
                },
            },
            required: ['query'],
        } as any,
        parse(input: string): WebSearchArgs {
            return webSearchSchema.parse(JSON.parse(input));
        },
        function: async (args: WebSearchArgs) => {
            try {
                addLog('info', '[WEB-SEARCH] web_search called', { query: args.query, engine: args.engine });

                const engine = args.engine || 'google';
                const num = args.num || 10;
                const params = new URLSearchParams({
                    q: args.query,
                    engine,
                    num: String(num),
                });

                const { getAuthToken } = await import('@/lib/db');
                const token = await getAuthToken();

                // Call server-side proxy (avoids CORS, hides API key)
                const res = await fetch(`/api/serpapi/search?${params.toString()}`, {
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : undefined
                });
                
                if (!res.ok) {
                    const errText = await res.text().catch(() => '');
                    addLog('error', `[WEB-SEARCH] SerpAPI proxy returned ${res.status}: ${errText}`);
                    return { success: false, error: `SerpAPI error (${res.status}): ${errText}`, results: [] };
                }

                const data = await res.json();

                // Extract results based on engine type
                let items = data.organic_results
                    || data.local_results
                    || data.news_results
                    || data.scholar_results
                    || data.place_results
                    || data.places
                    || data.maps_results
                    || [];

                if (items && !Array.isArray(items)) {
                    items = [items];
                }

                const results = items.slice(0, num).map((item: any) => ({
                    position: item.position || null,
                    title: item.title || '',
                    link: item.link || item.result_link || '',
                    snippet: item.snippet || item.description || '',
                    source: item.source || item.displayed_link || '',
                    date: item.date || null,
                    thumbnail: item.thumbnail || null,
                }));

                addLog('info', `[WEB-SEARCH] web_search returned ${results.length} results for "${args.query}"`);

                return {
                    success: true,
                    query: args.query,
                    engine,
                    total: results.length,
                    results,
                };
            } catch (error: any) {
                addLog('error', '[WEB-SEARCH] web_search failed', { error: error.message });
                return { success: false, error: error.message, results: [] };
            }
        },
    },
});

// ── Web Search Preset ────────────────────────────────────────────────────

/**
 * Create a preset of web search tools.
 * The server proxy handles API key injection from user_secrets.
 */
export const createWebSearchToolPreset = (
    addLog: LogFunction = defaultLog
) => ({
    tools: [
        webSearchTool(addLog),
        markdownScraperTool(addLog),
    ],
});

