import { SupabaseClient } from '@supabase/supabase-js';
import { createRouteBody } from '../routes.js';
import { z } from '@hono/zod-openapi';
import { logger } from '../logger.js';
import { extractDisplayImage, loadTemplate, inject } from '../renderer.js';
import { Context } from 'hono';
import { generateMarkdownFromPage } from '../markdown-generator.js';

import { appCache } from '../../../cache.js';

export interface UserPageDetails {
    page: any;
    userProfile: any;
    childPages: any[];
}

export interface EnrichPageOptions {
    includeThumbnail?: boolean;
    includeUser?: boolean;
    includeCategories?: boolean;
    includeChildren?: boolean;
}

// --- Pages Cache ---

interface PagesCacheState {
    pages: any[];
    pagesMap: Map<string, any>;
    pagesBySlug: Map<string, any>; // identifier:slug -> page
    loaded: boolean;
    timestamp: number;
}

const CACHE_KEY = 'pages';
const PAGES_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const getPagesState = async (supabase: SupabaseClient): Promise<{ state: PagesCacheState, fromCache: boolean }> => {
    let state = await appCache.get<PagesCacheState>(CACHE_KEY);

    const now = Date.now();
    if (state && state.loaded && (now - state.timestamp < PAGES_CACHE_TTL)) {
        return { state, fromCache: true };
    }

    // Load from DB
    const { data: pages, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const pagesList = pages || [];
    const pagesMap = new Map();
    const pagesBySlug = new Map();

    pagesList.forEach(page => {
        pagesMap.set(page.id, page);
        // We need a way to look up by user+slug or just slug?
        // identifiers are unique per user usually.
        // But for global lookup, ID is best.
        // Slugs are not unique globally unless scoped by user/owner.
        // Let's index by ID for now, and maybe composite key if needed.
    });

    state = {
        pages: pagesList,
        pagesMap,
        pagesBySlug, // Empty for now if we don't need it or complex logic
        loaded: true,
        timestamp: now
    };

    await appCache.set(CACHE_KEY, state, PAGES_CACHE_TTL);
    return { state, fromCache: false };
};

export const flushPagesCache = async () => {
    await appCache.invalidate(CACHE_KEY);
};

/**
 * Enriches a page object with additional data based on options
 */
export const enrichPageData = async (
    supabase: SupabaseClient,
    page: any,
    options: EnrichPageOptions = {}
): Promise<any> => {
    const {
        includeThumbnail = true,
        includeUser = false,
        includeCategories = false,
        includeChildren = false
    } = options;

    const enrichedPage = { ...page };

    // Extract and enrich thumbnail
    if (includeThumbnail) {
        let content = page.content;
        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch (e) {
                // Keep as string if parse fails
            }
        }

        const imageCandidate = extractDisplayImage(content);
        if (imageCandidate) {
            if (imageCandidate.pictureId) {
                // Fetch the actual image URL from the pictures table
                const { data: picture } = await supabase
                    .from('pictures')
                    .select('image_url')
                    .eq('id', imageCandidate.pictureId)
                    .single();

                if (picture?.image_url) {
                    enrichedPage.meta = {
                        ...enrichedPage.meta,
                        thumbnail: picture.image_url
                    };
                }
            } else if (imageCandidate.imageUrl) {
                // Direct URL from image widget or markdown
                enrichedPage.meta = {
                    ...enrichedPage.meta,
                    thumbnail: imageCandidate.imageUrl
                };
            }
        }
    }

    // Enrich with user profile
    if (includeUser) {
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', page.owner)
            .single();

        if (userProfile) {
            enrichedPage.user_profile = userProfile;
        }
    }

    // Enrich with category paths
    if (includeCategories) {
        const categoryIds: string[] = [];
        if (page.meta?.categoryIds && Array.isArray(page.meta.categoryIds)) {
            categoryIds.push(...page.meta.categoryIds);
        } else if (page.meta?.categoryId) {
            categoryIds.push(page.meta.categoryId);
        }

        if (categoryIds.length > 0) {
            // Reuse the fetchCategoryAncestry logic from fetchUserPageDetailsServer
            // For now, just store the IDs - can be expanded later
            enrichedPage.category_ids = categoryIds;
        }
    }

    // Enrich with child pages
    if (includeChildren) {
        const { data: childPages } = await supabase
            .from('pages')
            .select('id, title, slug')
            .eq('parent', page.id)
            .order('title');

        if (childPages) {
            enrichedPage.child_pages = childPages;
        }
    }

    return enrichedPage;
};

export const fetchUserPageDetailsServer = async (
    supabase: SupabaseClient,
    identifier: string, // userId, username, or pageId
    slug: string,
    requesterUserId?: string
): Promise<UserPageDetails | null> => {
    let userId = identifier;
    let resolvedProfile: any = null;
    let page: any = null;

    // 1. Check if we're looking up by page ID (slug is a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isSlugUuid = uuidRegex.test(slug);

    if (isSlugUuid) {
        // Lookup by page ID directly
        const pageId = slug;
        const { state: pagesState } = await getPagesState(supabase);
        page = pagesState.pagesMap.get(pageId);

        if (!page) return null;

        userId = page.owner;
        const isOwner = requesterUserId === userId;

        // Check visibility
        if (!isOwner && (!page.is_public || !page.visible)) {
            return null;
        }
    } else {
        // Traditional lookup by userId/username + slug
        // Resolve User ID if identifier is a username
        if (!uuidRegex.test(identifier)) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_id, username, display_name, avatar_url')
                .eq('username', identifier)
                .single();

            if (profile) {
                userId = profile.user_id;
                resolvedProfile = profile;
            } else {
                return null; // User not found
            }
        }

        const isOwner = requesterUserId === userId;

        // 2. Fetch Page by slug
        let pageCandidate: any = null;

        // Try to find in cache
        // We need to search the cache because `pagesBySlug` isn't fully reliable if slugs aren't unique globally
        // But we iterate `pages` list in memory which is fast enough for <10k pages
        const { state: pagesState } = await getPagesState(supabase);

        if (pagesState.pages.length > 0) {
            // Find in cache
            pageCandidate = pagesState.pages.find(p => p.slug === slug && p.owner === userId);

            // Check visibility
            if (pageCandidate && !isOwner) {
                if (!pageCandidate.is_public || !pageCandidate.visible) {
                    pageCandidate = null;
                }
            }
        }

        if (pageCandidate) {
            page = pageCandidate;
        } else {
            // Fallback (should have been in cache if loaded, but maybe stale or missing)
            // Or if cache is empty / cleared. 
            // Actually `getPagesState` loads if empty. 
            // So if not in cache, likely doesn't exist.
            return null;
        }
    }

    const isOwner = requesterUserId === userId;

    // 3. Fetch Additional Data in Parallel
    const categoryIds: string[] = [];
    if (page.meta?.categoryIds && Array.isArray(page.meta.categoryIds)) {
        categoryIds.push(...page.meta.categoryIds);
    } else if (page.meta?.categoryId) {
        categoryIds.push(page.meta.categoryId);
    }

    const fetchCategoryAncestry = async (baseCategoryIds: string[]) => {
        if (baseCategoryIds.length === 0) return [];
        const { fetchCategoryAncestry } = await import('./db-categories.js');
        return fetchCategoryAncestry(supabase, baseCategoryIds);
    };

    const [parentPageRes, childPagesRes, profileRes, categoryPaths] = await Promise.all([
        // Parent Page
        page.parent
            ? supabase.from('pages').select('title, slug').eq('id', page.parent).single()
            : Promise.resolve({ data: null, error: null }),

        // Child Pages
        (() => {
            let childQuery = supabase
                .from('pages')
                .select('id, title, slug, visible, is_public')
                .eq('parent', page.id)
                .order('title');

            if (!isOwner) {
                childQuery = childQuery.eq('visible', true).eq('is_public', true);
            }
            return childQuery;
        })(),

        // User Profile
        (() => {
            if (resolvedProfile) return Promise.resolve({ data: resolvedProfile, error: null });

            return (async () => {
                const { fetchUserProfilesCached } = await import('./db-user.js');
                const profiles = await fetchUserProfilesCached(supabase, [userId]);
                const profile = profiles[userId] || null;
                return { data: profile, error: null };
            })();
        })(),

        // Category Paths
        fetchCategoryAncestry(categoryIds)
    ]);

    // Construct Result
    const result: UserPageDetails = {
        page: {
            ...page,
            parent_page: parentPageRes.data || null,
            category_paths: categoryPaths
        },
        userProfile: profileRes.data || null,
        childPages: childPagesRes.data || []
    };

    // Enrich page with thumbnail using helper function
    result.page = await enrichPageData(supabase, result.page, {
        includeThumbnail: true,
        includeUser: false, // Already fetched above
        includeCategories: false, // Already fetched above
        includeChildren: false // Already fetched above
    });

    // Ensure page content has valid structure for GenericCanvas if it's not a markdown string
    if (result.page.content !== null && typeof result.page.content !== 'string') {
        if (!result.page.content.containers) {
            result.page.content.containers = [];
        }
    } else if (result.page.content === null) {
        // Default to empty canvas layout if content is null
        result.page.content = { containers: [] };
    }

    return result;
};

export async function renderPageContent(content: any): Promise<{ markdown: string, images: string[] }> {
    let markdown = '';
    const images: string[] = [];
    const pictureIds: string[] = [];

    try {
        let targetContent = content;

        // Handle Redux-style normalized state if present
        if (content && content.pages && typeof content.pages === 'object') {
            const pageKeys = Object.keys(content.pages);
            if (pageKeys.length > 0) {
                targetContent = content.pages[pageKeys[0]];
            }
        }

        // 1. Pass 1: Collect Picture IDs
        if (targetContent && targetContent.containers && Array.isArray(targetContent.containers)) {
            for (const container of targetContent.containers) {
                if (container.widgets && Array.isArray(container.widgets)) {
                    for (const widget of container.widgets) {
                        if (widget.widgetId === 'photo-card' && widget.props && widget.props.pictureId) {
                            pictureIds.push(widget.props.pictureId);
                        }
                    }
                }
            }
        }

        // 2. Resolve Images
        const imageMap: Record<string, string> = {};
        if (pictureIds.length > 0) {
            const { supabase } = await import('../../../commons/supabase.js');
            const { ensureCachedImageFromUrl } = await import('../../images/index.js');

            const { data: pictures } = await supabase
                .from('pictures')
                .select('id, image_url, meta')
                .in('id', pictureIds);

            if (pictures) {
                const baseUrl = process.env.SERVER_IMAGE_API_URL || 'http://localhost:3000';

                await Promise.all(pictures.map(async (p) => {
                    try {
                        // Logic similar to augmentPosts
                        const meta = p.meta || {};
                        const aspect = (meta.width && meta.height) ? meta.height / meta.width : 0;
                        // For meta tags, we want a good cover size, say 1200w
                        const width = 1200;
                        const height = aspect ? Math.round(width * aspect) : 630; // fallback height

                        const filename = await ensureCachedImageFromUrl(p.image_url, width, height, 'jpeg');
                        imageMap[p.id] = `${baseUrl}/api/images/cache/${filename}`;
                    } catch (err) {
                        logger.warn({ err, pictureId: p.id }, 'Failed to cache image for page meta');
                    }
                }));
            }
        }

        // 3. Pass 2: Render
        if (targetContent && targetContent.containers && Array.isArray(targetContent.containers)) {
            for (const container of targetContent.containers) {
                if (container.widgets && Array.isArray(container.widgets)) {
                    for (const widget of container.widgets) {
                        if (widget.widgetId === 'markdown-text' && widget.props && widget.props.content) {
                            markdown += widget.props.content + '\n\n';
                        } else if (widget.widgetId === 'photo-card' && widget.props && widget.props.pictureId) {
                            const imageUrl = imageMap[widget.props.pictureId];
                            if (imageUrl) {
                                images.push(imageUrl);
                                markdown += `![Image](${imageUrl})\n\n`;
                            }
                        }
                    }
                }
            }
        }

    } catch (e) {
        logger.error({ e }, 'Error rendering page content');
    }

    return { markdown: markdown.trim(), images };
}

// Route Definitions
export const getUserPageRoute = createRouteBody(
    'get',
    '/user/:userId/pages/:slug',
    ['Pages'],
    'Get User Page Meta',
    'Serves the user page with injected Open Graph metadata.',
    {
        params: z.object({
            userId: z.string(),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getOrgUserPageRoute = createRouteBody(
    'get',
    '/org/:orgSlug/user/:userId/pages/:slug',
    ['Pages'],
    'Get Org User Page Meta',
    'Serves the org user page with injected Open Graph metadata.',
    {
        params: z.object({
            orgSlug: z.string(),
            userId: z.string(),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        }
    }
);

export const getApiUserPageRoute = createRouteBody(
    'get',
    '/api/user-page/:identifier/:slug',
    ['Pages'],
    'Get User Page Details',
    'Get User Page Details',
    {
        params: z.object({
            identifier: z.string().openapi({ description: 'User ID or Username' }),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'User Page Details',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        404: {
            description: 'Page not found'
        }
    },
    true // public (pages are public usually)
);

export const getUserPageContentRoute = createRouteBody(
    'get',
    '/user/:userId/pages/:slug/content',
    ['Pages'],
    'Get User Page Content',
    'Dehydrates the user page content to Markdown.',
    {
        params: z.object({
            userId: z.string(),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'Markdown Content',
            content: {
                'text/markdown': {
                    schema: z.string()
                }
            }
        }
    },
    false // private? Assuming need auth or ownership or token extraction, better safe than sorry
);

export const getOrgUserPageContentRoute = createRouteBody(
    'get',
    '/org/:orgSlug/user/:userId/pages/:slug/content',
    ['Pages'],
    'Get Org User Page Content',
    'Dehydrates the org user page content to Markdown.',
    {
        params: z.object({
            orgSlug: z.string(),
            userId: z.string(),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'Markdown Content',
            content: {
                'text/markdown': {
                    schema: z.string()
                }
            }
        }
    },
    false
);

export const getEmbedPageRoute = createRouteBody(
    'get',
    '/embed/page/:id',
    ['Pages'],
    'Get Embed Page (User Page)',
    'Serves the embed page for a User Page.',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'HTML Page',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        },
        404: { description: 'Page not found' }
    }
);

export const getUserPageMarkdownRoute = createRouteBody(
    'get',
    '/user/:identifier/pages/:slug{.+\\.md$}',
    ['Pages'],
    'Get User Page Markdown',
    'Returns the user page content as Markdown.',
    {
        params: z.object({
            identifier: z.string().openapi({ description: 'User ID or Username' }),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'Markdown Content',
            content: {
                'text/markdown': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Page not found'
        }
    },
    true // public
);

export const getUserPageHtmlRoute = createRouteBody(
    'get',
    '/user/:identifier/pages/:slug{.+\\.html$}',
    ['Pages'],
    'Get User Page HTML',
    'Returns the user page content as static HTML with proper meta tags.',
    {
        params: z.object({
            identifier: z.string().openapi({ description: 'User ID or Username' }),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'HTML Content',
            content: {
                'text/html': {
                    schema: z.string()
                }
            }
        },
        404: {
            description: 'Page not found'
        }
    },
    true // public
);

export const getUserPagePdfRoute = createRouteBody(
    'get',
    '/user/:identifier/pages/:slug{.+\\.pdf$}',
    ['Pages'],
    'Get User Page PDF',
    'Returns the user page content as a PDF document.',
    {
        params: z.object({
            identifier: z.string().openapi({ description: 'User ID or Username' }),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'PDF Document',
            content: {
                'application/pdf': {
                    schema: z.string().openapi({ format: 'binary' })
                }
            }
        },
        404: {
            description: 'Page not found'
        }
    },
    true // public
);

export const getUserPageJsonRoute = createRouteBody(
    'get',
    '/user/:identifier/pages/:slug{.+\\.json$}',
    ['Pages'],
    'Get User Page JSON',
    'Returns the user page data as JSON.',
    {
        params: z.object({
            identifier: z.string().openapi({ description: 'User ID or Username' }),
            slug: z.string()
        })
    },
    {
        200: {
            description: 'Page data as JSON',
            content: {
                'application/json': {
                    schema: z.object({
                        page: z.any(),
                        userProfile: z.any()
                    })
                }
            }
        },
        404: {
            description: 'Page not found'
        }
    },
    true // public
);

// --- Handlers ---

export async function handleGetApiUserPage(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const identifier = c.req.param('identifier');
        const slug = c.req.param('slug');

        // Extract user ID from Auth Token (if present)
        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const result = await fetchUserPageDetailsServer(supabase, identifier, slug, requesterUserId);

        if (!result) {
            return c.json({ error: 'Page not found' }, 404);
        }

        // We can't reliable detect cache hit/miss with simple null return
        // So we emit HIT if we found it (since it's always cached/memoized in getPagesState)
        // OR we just omit the header for simplicity as requested.
        // But since getPagesState matches internal memory, it is effectively a HIT.
        c.header('X-Cache', 'HIT');

        return c.json(result);
    } catch (err: any) {
        logger.error({ err }, 'API User Page fetch failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetUserPageMarkdown(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const identifier = c.req.param('identifier');
        let slug = c.req.param('slug');

        // Strip .md extension if present (due to regex match)
        if (slug && slug.endsWith('.md')) {
            slug = slug.slice(0, -3);
        }

        // No auth required for public pages (implied by fetch logic handling privileges)
        // But we can check token if we want to allow private page export for owner
        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const result = await fetchUserPageDetailsServer(supabase, identifier, slug, requesterUserId);

        if (!result || !result.page) {
            return c.text('Page not found', 404);
        }

        const authorName = result.userProfile?.display_name || result.userProfile?.username || result.page.owner;
        const markdown = generateMarkdownFromPage(result.page, authorName);

        c.header('Content-Type', 'text/markdown; charset=utf-8');
        // Suggest filename
        const filename = `${slug}.md`;
        c.header('Content-Disposition', `inline; filename="${filename}"`);

        return c.body(markdown);
    } catch (err: any) {
        logger.error({ err }, 'User Page Markdown export failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetUserPageHtml(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const identifier = c.req.param('identifier');
        let slug = c.req.param('slug');

        // Strip .html extension if present (due to regex match)
        if (slug && slug.endsWith('.html')) {
            slug = slug.slice(0, -5);
        }

        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const result = await fetchUserPageDetailsServer(supabase, identifier, slug, requesterUserId);

        if (!result || !result.page) {
            return c.text('Page not found', 404);
        }

        const { page, userProfile } = result;
        const authorName = userProfile?.display_name || userProfile?.username || page.owner;

        // Render markdown content
        const { markdown, images } = await renderPageContent(page.content);

        // Convert markdown to HTML (simple conversion)
        // For a more robust solution, you could use a markdown parser like 'marked'
        // For now, we'll use a basic conversion
        const { marked } = await import('marked');
        const htmlContent = await marked(markdown);

        // Extract description from markdown
        const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max - 1) + '…' : str;
        let rawDescription = markdown
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/[#*\[\]()]/g, '')      // Remove markdown chars
            .replace(/\n+/g, ' ')            // Collapse formatting
            .trim();

        const description = rawDescription.length > 50 ? truncate(rawDescription, 200) : (page.description || `Check out this page by ${authorName}.`);

        // Get image using the same logic as handleGetPageMeta
        const metaImage = images.length > 0 ? images[0] : undefined;
        let finalMetaImage = metaImage;

        if (!finalMetaImage) {
            // Fallback: Try to extract from content using shared helper
            const fallback = extractDisplayImage(page.content);
            if (fallback && fallback.imageUrl) {
                finalMetaImage = fallback.imageUrl;
            } else if (fallback && fallback.pictureId) {
                // Convert pictureId to URL
                const baseUrl = process.env.SERVER_URL || 'http://localhost:3333';
                finalMetaImage = `${baseUrl}/api/images/${fallback.pictureId}`;
            }
        }

        // Generate canonical URL
        const baseUrl = process.env.SERVER_URL || 'http://localhost:3333';
        const canonicalUrl = `${baseUrl}/user/${identifier}/pages/${slug}`;

        // Generate static HTML
        const { generateStaticHtml } = await import('../html-generator.js');
        const html = generateStaticHtml({
            title: `${truncate(page.title, 50)} by ${truncate(authorName, 20)} | PolyMech`,
            description,
            image: finalMetaImage,
            author: authorName,
            content: htmlContent,
            canonicalUrl
        });

        c.header('Content-Type', 'text/html; charset=utf-8');
        return c.html(html);
    } catch (err: any) {
        logger.error({ err }, 'User Page HTML export failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetUserPagePdf(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const identifier = c.req.param('identifier');
        let slug = c.req.param('slug');

        // Strip .pdf extension if present (due to regex match)
        if (slug && slug.endsWith('.pdf')) {
            slug = slug.slice(0, -4);
        }

        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const result = await fetchUserPageDetailsServer(supabase, identifier, slug, requesterUserId);

        if (!result || !result.page) {
            return c.text('Page not found', 404);
        }

        const { page, userProfile } = result;

        // Import PDF product dynamically
        const { PdfProduct } = await import('../../pdf/index.js');
        const pdfProduct = new PdfProduct();

        // Use the existing PDF generation logic from the PDF product
        // We'll create a mock context with the page ID
        const mockContext = {
            req: {
                param: (name: string) => {
                    if (name === 'id') return page.id;
                    return c.req.param(name);
                },
                header: (name: string) => c.req.header(name)
            },
            header: (name: string, value: string) => c.header(name, value),
            body: (data: any) => c.body(data),
            text: (text: string) => c.text(text, 500)
        } as any;

        return await pdfProduct.handleRenderPagePdf(mockContext);
    } catch (err: any) {
        logger.error({ err }, 'User Page PDF export failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetUserPageJson(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const identifier = c.req.param('identifier');
        let slug = c.req.param('slug');

        // Strip .json extension if present (due to regex match)
        if (slug && slug.endsWith('.json')) {
            slug = slug.slice(0, -5);
        }

        let requesterUserId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            requesterUserId = user?.id;
        }

        const result = await fetchUserPageDetailsServer(supabase, identifier, slug, requesterUserId);

        if (!result || !result.page) {
            return c.json({ error: 'Page not found' }, 404);
        }

        // We can't reliable detect cache hit/miss with simple null return
        // So we emit HIT if we found it (since it's always cached/memoized in getPagesState) 
        // OR we just omit the header for simplicity as requested.
        // But since getPagesState matches internal memory, it is effectively a HIT.
        c.header('X-Cache', 'HIT');

        return c.json(result);
    } catch (err: any) {
        logger.error({ err }, 'User Page JSON export failed');
        return c.json({ error: 'Internal Server Error' }, 500);
    }
}

export async function handleGetPageContent(c: Context) {
    const userId = c.req.param('userId');
    const slug = c.req.param('slug');

    const { supabase } = await import('../../../commons/supabase.js');
    const { data: page, error } = await supabase
        .from('pages')
        .select('content')
        .eq('owner', userId)
        .eq('slug', slug)
        .single();

    if (error || !page) {
        return c.text('Page not found', 404);
    }

    const { markdown } = await renderPageContent(page.content);
    return c.text(markdown, 200, { 'Content-Type': 'text/markdown' });
}

export async function handleGetPageMeta(c: Context) {
    const userId = c.req.param('userId');
    const slug = c.req.param('slug');
    const orgSlug = c.req.param('orgSlug');
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        // Resolve requester for public/private logic (though meta implies public mostly)
        // No auth header usually for bots/browsers hitting this route directly

        const result = await fetchUserPageDetailsServer(supabase, userId, slug, undefined);

        // Bot Detection: Serve markdown to bots if enabled
        if (process.env.RENDER_HTML_BOTS === 'true') {
            const userAgent = c.req.header('User-Agent');
            const { isBotRequest, renderBotResponse } = await import('../bots.js');

            if (isBotRequest(userAgent)) {
                if (!result || !result.page) {
                    return c.text('Page not found', 404);
                }

                const markdown = renderBotResponse(result.page, result.userProfile);
                c.header('Content-Type', 'text/markdown; charset=utf-8');
                return c.body(markdown);
            }
        }

        const html = await loadTemplate();
        if (!html) {
            logger.error('handleGetPageMeta:Template not found');
            return c.text('handleGetPageMeta:Template not found', 500);
        }

        if (!result || !result.page) {
            logger.warn({ userId, slug }, 'Page not found for meta injection');
            return c.html(html); // Serve app shell, let client handle 404
        }

        const { page, userProfile } = result;

        // 3. Construct Meta
        const authorName = userProfile?.display_name || userProfile?.username || "Polymech User";
        const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max - 1) + '…' : str;

        const { markdown, images } = await renderPageContent(page.content);

        const pageTitle = `${truncate(page.title, 50)} by ${truncate(authorName, 20)} | PolyMech`;

        let rawDescription = markdown
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images first
            .replace(/[#*\[\]()]/g, '')      // Remove remaining markdown chars
            .replace(/\n+/g, ' ')            // Collapse formatting
            .trim();

        let description = (rawDescription.length > 50 ? rawDescription : page.description) || `Check out this page by ${authorName}.`;

        if (description.length > 200) {
            description = truncate(description, 200);
        }

        const metaImage = images.length > 0 ? images[0] : undefined;
        let finalMetaImage = metaImage;

        if (!finalMetaImage) {
            // Fallback: Try to extract from content using shared helper (e.g. Markdown images)
            const fallback = extractDisplayImage(page.content);
            if (fallback && fallback.imageUrl) {
                finalMetaImage = fallback.imageUrl;
            }
        }

        const meta = {
            title: pageTitle,
            description: description,
            image: finalMetaImage,
            jsonLd: {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "headline": truncate(page.title, 100),
                "datePublished": page.created_at,
                "dateModified": page.updated_at,
                "author": {
                    "@type": "Person",
                    "name": authorName
                },
                "description": description
            }
        };

        const injectedHtml = inject(html, meta);
        // c.header('X-Cache', 'HIT'); // Optional: Assume hit if found
        return c.html(injectedHtml);

    } catch (err: any) {
        logger.error({ err }, 'Page Meta injection failed');
        const html = await loadTemplate();
        return c.html(html || 'Error');
    }
}
