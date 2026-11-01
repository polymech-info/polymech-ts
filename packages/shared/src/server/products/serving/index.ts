import path from 'path';
import { Context } from 'hono';
import { getCache } from '../../commons/cache/index.js';
import { fetchCategoryPathsForPages } from './db/db-categories.js';
import { fetchPostDetailsServer } from './db/db-posts.js';
const { supabase } = await import('../../commons/supabase.js');
import { AbstractProduct } from '../AbstractProduct.js';
import { appCache } from '../../cache.js';

import {
    getFeedRoute,
    getMerchantFeedRoute,
    getLLMTextRoute,
    getPostMetaRoute,
    getApiFeedRoute,
    getApiPostDetailsRoute,
    getProfileRoute,
    getSecretsRoute,
    getProfilesRoute,
    getApiMediaItemsRoute,
    getHomeRoute,
    getProfilePageRoute,
    getEmbedRoute,
    getSiteInfoRoute,
    getSitemapRoute,
    postFlushCacheRoute,
    invalidateCacheRoute
} from './routes.js';
import {
    getUserPageRoute,
    getOrgUserPageRoute,
    getApiUserPageRoute,
    getUserPageContentRoute,
    getOrgUserPageContentRoute,
    getEmbedPageRoute,
    getUserPageMarkdownRoute,
    getUserPageHtmlRoute,
    getUserPagePdfRoute,
    getUserPageJsonRoute,
    renderPageContent,
    getCategoriesRoute,
    getCategoryRoute,
    createCategoryRoute,
    updateCategoryRoute,
    deleteCategoryRoute,
    handleGetCategories,
    handleGetCategory,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    getTypesRoute,
    getTypeRoute,
    createTypeRoute,
    updateTypeRoute,
    deleteTypeRoute,
    handleGetTypes,
    handleGetType,
    handleCreateType,
    handleUpdateType,
    handleDeleteType,
    getLayoutsRoute,
    getLayoutRoute,
    createLayoutRoute,
    updateLayoutRoute,
    deleteLayoutRoute,
    handleGetLayouts,
    handleGetLayout,
    handleCreateLayout,
    handleUpdateLayout,
    handleDeleteLayout,
    handleGetProfiles,
    handleGetProfile,
    handleGetProfilePage,
    handleGetSecrets
} from './db/index.js';
import { CachedHandler } from '../../commons/decorators.js';
import {
    handleGetFeedXml,
    handleGetMerchantFeed,
    handleGetLLMText,
    handleGetSitemap,
    handleGetSiteInfo,
    handleGetPostMeta,
    handleGetEmbed,
    handleGetEmbedPage,
    augmentPosts,
    applyClientSortAndCovers
} from './content.js';
import {
    handleGetApiUserPage,
    handleGetUserPageMarkdown,
    handleGetUserPageHtml,
    handleGetUserPagePdf,
    handleGetUserPageJson,
    handleGetPageContent,
    handleGetPageMeta
} from './db/index.js';
import {
    getPostPdfRoute,
    getPostJsonRoute,
    getPostHtmlRoute,
    getPostMarkdownRoute,
    handleGetPostPdf,
    handleGetPostJson,
    handleGetPostHtml,
    handleGetPostMarkdown
} from './db/db-post-exports.js';
import { generateRSS, generateMerchantXML, generateLLMText, generateSitemapXML } from './generators.js';
import { generateMarkdownFromPage } from './markdown-generator.js';
import { loadTemplate, inject, extractDisplayImage } from './renderer.js';
import { logger } from './logger.js';
import { ensureCachedImage, CACHE_DIR } from '../images/index.js';
import fs from 'fs/promises';
import { PgBoss } from 'pg-boss';
import { VIDEO_JOB_NAME } from '../videos/worker.js';


// Helper to escape JSON for safe HTML injection
const safeStringify = (data: any) => {
    return JSON.stringify(data).replace(/</g, '\\u003c');
};

export class ServingProduct extends AbstractProduct<any> {
    id = 'serving';
    jobOptions = {};
    actions = {};
    workers = [];
    routes: any[] = [];
    private boss?: PgBoss;

    constructor() {
        super();
        this.initializeRoutes();
    }

    hash(data: any): string {
        return 'serving-hash';
    }

    meta(userId: string): any {
        return { userId };
    }

    initializeRoutes() {
        // Feature Flags
        const enableRss = process.env.ENABLE_RSS_FEED === 'true';
        const enableMerchant = process.env.ENABLE_MERCHANT_FEED === 'true';
        const enableLlm = process.env.ENABLE_LLM_TXT === 'true';
        const enableMeta = process.env.ENABLE_META_INJECTION === 'true';

        // Legacy/SEO Routes
        if (enableRss) this.routes.push({ definition: getFeedRoute, handler: handleGetFeedXml });
        if (enableMerchant) this.routes.push({ definition: getMerchantFeedRoute, handler: handleGetMerchantFeed });
        if (enableLlm) this.routes.push({ definition: getLLMTextRoute, handler: handleGetLLMText });
        // Post Export Routes (Must be before Generic Post Route)
        this.routes.push({ definition: getPostPdfRoute, handler: handleGetPostPdf });
        this.routes.push({ definition: getPostJsonRoute, handler: handleGetPostJson });
        this.routes.push({ definition: getPostHtmlRoute, handler: handleGetPostHtml });
        this.routes.push({ definition: getPostMarkdownRoute, handler: handleGetPostMarkdown });

        if (enableMeta) this.routes.push({ definition: getPostMetaRoute, handler: CachedHandler(handleGetPostMeta) });

        // New API Routes (Always Enabled)
        this.routes.push({ definition: getApiFeedRoute, handler: CachedHandler(this.handleGetApiFeed.bind(this)), cache: { varyByAuth: true } });
        this.routes.push({ definition: getApiPostDetailsRoute, handler: this.handleGetApiPostDetails.bind(this), cache: { varyByAuth: true } });
        this.routes.push({ definition: getProfileRoute, handler: (c: Context) => handleGetProfile(c, this.boss) });
        this.routes.push({ definition: getSecretsRoute, handler: handleGetSecrets });
        this.routes.push({ definition: getApiUserPageRoute, handler: CachedHandler(handleGetApiUserPage, { varyByAuth: true }) });
        this.routes.push({ definition: postFlushCacheRoute, handler: this.handlePostFlushCache.bind(this) });
        this.routes.push({ definition: invalidateCacheRoute, handler: this.handleInvalidateCache.bind(this) });

        // Batch Profiles
        this.routes.push({ definition: getProfilesRoute, handler: CachedHandler(handleGetProfiles, { varyByAuth: true }) });

        // Batch Media Items
        this.routes.push({ definition: getApiMediaItemsRoute, handler: CachedHandler(this.handleGetApiMediaItems.bind(this), { varyByAuth: false }) });

        // Page Export Routes (Must be before Generic Page Route)
        this.routes.push({ definition: getUserPageMarkdownRoute, handler: handleGetUserPageMarkdown });
        this.routes.push({ definition: getUserPageHtmlRoute, handler: handleGetUserPageHtml });
        this.routes.push({ definition: getUserPagePdfRoute, handler: handleGetUserPagePdf });
        this.routes.push({ definition: getUserPageJsonRoute, handler: handleGetUserPageJson });



        // HTML Injection Routes
        this.routes.push({ definition: getHomeRoute, handler: this.handleGetHome.bind(this) });
        this.routes.push({ definition: getProfilePageRoute, handler: (c: Context) => handleGetProfilePage(c, this.boss) });
        this.routes.push({ definition: getUserPageRoute, handler: handleGetPageMeta });
        //this.routes.push({ definition: getOrgUserPageRoute, handler: CachedHandler(handleGetPageMeta) });

        // Content Routes
        this.routes.push({ definition: getUserPageContentRoute, handler: handleGetPageContent });
        this.routes.push({ definition: getOrgUserPageContentRoute, handler: handleGetPageContent });

        // Embed Route
        this.routes.push({ definition: getEmbedRoute, handler: CachedHandler((c: Context) => handleGetEmbed(c, this.boss)) });
        this.routes.push({ definition: getEmbedPageRoute, handler: CachedHandler(handleGetEmbedPage) });

        // Site Info Route
        this.routes.push({ definition: getSiteInfoRoute, handler: handleGetSiteInfo });

        // Sitemap Route
        this.routes.push({ definition: getSitemapRoute, handler: handleGetSitemap });

        // Category CRUD Routes
        this.routes.push({ definition: getCategoriesRoute, handler: handleGetCategories });
        this.routes.push({ definition: getCategoryRoute, handler: handleGetCategory });
        this.routes.push({ definition: createCategoryRoute, handler: handleCreateCategory });
        this.routes.push({ definition: updateCategoryRoute, handler: handleUpdateCategory });
        this.routes.push({ definition: deleteCategoryRoute, handler: handleDeleteCategory });

        // Types Routes
        this.routes.push({ definition: getTypesRoute, handler: handleGetTypes });
        this.routes.push({ definition: getTypeRoute, handler: handleGetType });
        this.routes.push({ definition: createTypeRoute, handler: handleCreateType });
        this.routes.push({ definition: updateTypeRoute, handler: handleUpdateType });
        this.routes.push({ definition: deleteTypeRoute, handler: handleDeleteType });

        // Layouts Routes
        this.routes.push({ definition: getLayoutsRoute, handler: handleGetLayouts });
        this.routes.push({ definition: getLayoutRoute, handler: handleGetLayout });
        this.routes.push({ definition: createLayoutRoute, handler: handleCreateLayout });
        this.routes.push({ definition: updateLayoutRoute, handler: handleUpdateLayout });
        this.routes.push({ definition: deleteLayoutRoute, handler: handleDeleteLayout });
    }

    async handleGetApiFeed(c: Context) {
        try {

            const { fetchFeedPostsServer } = await import('./db/index.js');
            const { supabase } = await import('../../commons/supabase.js');

            const page = parseInt(c.req.query('page') || '0');
            const limit = parseInt(c.req.query('limit') || '30');
            const source = c.req.query('source') as any || 'home';
            const sourceId = c.req.query('sourceId');
            const isOrgContext = c.req.query('isOrgContext') === 'true';
            const orgSlug = c.req.query('orgSlug');
            const sizesStr = c.req.query('sizes');
            const formatsStr = c.req.query('formats');
            const sortBy = c.req.query('sortBy') as 'latest' | 'top' || 'latest';
            const cache = c.req.query('cache') !== 'false';

            // Extract category filters
            const categoryIdsParam = c.req.query('categoryIds');
            const categorySlugsParam = c.req.query('categorySlugs');
            const categoryIds = categoryIdsParam ? categoryIdsParam.split(',') : undefined;
            const categorySlugs = categorySlugsParam ? categorySlugsParam.split(',') : undefined;

            // Extract user ID from Auth Token (if present)
            let userId: string | undefined;
            const authHeader = c.req.header('Authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user } } = await supabase.auth.getUser(token);
                userId = user?.id;
            }

            // Cache Key
            let cacheKey = `${source}-feed`;
            if (sourceId) cacheKey += `-${sourceId}`;
            if (isOrgContext) cacheKey += `-org-${orgSlug}`;
            if (userId) cacheKey += `-u${userId}`;
            cacheKey += `-p${page}-l${limit}-sort-${sortBy}`;
            if (sizesStr) cacheKey += `-s${sizesStr}`;
            if (formatsStr) cacheKey += `-f${formatsStr}`;
            if (categoryIds) cacheKey += `-catIds${categoryIds.join(',')}`;
            if (categorySlugs) cacheKey += `-catSlugs${categorySlugs.join(',')}`;

            const { getCache } = await import('../../commons/cache/index.js');
            const cacheInstance = getCache();

            if (cache) {
                const cached = await cacheInstance.get(cacheKey);
                if (cached) {
                    c.header('X-Cache', 'HIT');
                    return c.json(cached);
                }
            }

            const data = await fetchFeedPostsServer(supabase, {
                page,
                limit,
                sizesStr,
                formatsStr,
                sortBy,
                sourceId,
                isOrgContext,
                orgSlug,
                userId,
                categoryIds,
                categorySlugs
            }, this.boss);

            if (cache) {
                await cacheInstance.set(cacheKey, data, 100);
            }

            c.header('X-Cache', 'MISS');
            return c.json(data);
        } catch (err: any) {
            logger.error({ err }, 'API Feed fetch failed');
            return c.text('Internal Server Error', 500);
        }
    }

    async handleGetApiPostDetails(c: Context) {
        try {
            const id = c.req.param('id');
            const sizesStr = c.req.query('sizes');
            const formatsStr = c.req.query('formats');

            // Extract user ID from Auth Token (if present)
            let userId: string | undefined;
            const authHeader = c.req.header('Authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const { data: { user } } = await supabase.auth.getUser(token);
                userId = user?.id;
            }

            const { data, fromCache } = await fetchPostDetailsServer(supabase, id, { sizesStr, formatsStr, userId }, this.boss);

            if (!data) {
                return c.json({ error: 'Post not found' }, 404);
            }

            c.header('X-Cache', fromCache ? 'HIT' : 'MISS');
            return c.json(data);
        } catch (err: any) {
            logger.error({ err }, 'API Post Details fetch failed');
            return c.text('Internal Server Error', 500);
        }
    }

    async handleGetApiMediaItems(c: Context) {
        try {
            const idsParam = c.req.query('ids');
            if (!idsParam) {
                return c.json({ error: 'ids parameter is required' }, 400);
            }

            const ids = idsParam.split(',').filter(Boolean);
            const maintainOrder = c.req.query('maintainOrder') === 'true';
            const sizesStr = c.req.query('sizes');
            const formatsStr = c.req.query('formats');

            const { fetchMediaItemsByIdsServer } = await import('./db/db-posts.js');
            const data = await fetchMediaItemsByIdsServer(
                supabase,
                ids,
                { maintainOrder, sizesStr, formatsStr },
                this.boss
            );

            return c.json(data);
        } catch (err: any) {
            logger.error({ err }, 'API Media Items fetch failed');
            return c.text('Internal Server Error', 500);
        }
    }

    async handlePostFlushCache(c: Context) {
        try {
            const cache = getCache();

            if (cache) {
                // 1. Flush Memory/Redis Cache
                await cache.flush();
            }

            // 2. Flush Category Cache
            const { flushCategoryCache } = await import('./db/db-categories.js');
            await flushCategoryCache();

            // 3. Flush Posts Cache
            const { flushPostsCache } = await import('./db/db-posts.js');
            await flushPostsCache();

            // 4. Flush Pages Cache
            const { flushPagesCache } = await import('./db/db-pages.js');
            await flushPagesCache();

            // 4. Flush Image Disk Cache
            try {
                // Check if directory exists first to avoid error
                await fs.access(CACHE_DIR);
                await fs.rm(CACHE_DIR, { recursive: true, force: true });
                await fs.mkdir(CACHE_DIR, { recursive: true });
            } catch (err) {
                // If it doesn't exist, just create it
                await fs.mkdir(CACHE_DIR, { recursive: true });
            }

            logger.info('Cache flushed (Content + Images)');
            return c.json({ success: true, message: 'Cache flushed successfully' });
        } catch (err: any) {
            logger.error({ err }, 'Cache flush failed');
            return c.json({ success: false, message: 'Failed to flush cache' }, 500);
        }
    }

    async handleInvalidateCache(c: Context) {
        try {
            const body = await c.req.json();
            const paths = body.paths as string[];
            const types = body.types as string[];

            const cache = getCache();

            let count = 0;
            if (Array.isArray(types)) {
                for (const type of types) {
                    await appCache.invalidate(type);
                    count++;
                }
            }

            if (Array.isArray(paths)) {
                for (const path of paths) {
                    // Pattern: "auto-cache:GET:/api/user-page/UID/SLUG"
                    // We assume the user sends the PATH component.
                    const pattern = `auto-cache:GET:${path}`;
                    await cache.flush(pattern);
                    count++;
                }
            }
            logger.info({ count, paths, types }, 'Cache invalidated by path/type');
            return c.json({ success: true, count });
        } catch (err: any) {
            logger.error({ err }, 'Cache invalidation failed');
            return c.json({ success: false, message: 'Invalidation failed' }, 500);
        }
    }

    async handleGetHome(c: Context) {
        try {
            // 1. Load HTML Template
            const html = await loadTemplate();
            if (!html) return c.text('handleGetHome:Template not found', 500);

            // 2. Check Injection Flag
            if (process.env.INJECT_FEED === 'true') {
                const sortBy = c.req.query('sortBy') as 'latest' | 'top' || 'latest';

                // Reuse feed logic: page 0, limit 30 (defaults)
                const { data } = await this.getFeedData({ page: 0, limit: 30, sortBy, useCache: false });
                const injectionScript = {
                    id: 'initial-state',
                    content: `window.__INITIAL_STATE__ = window.__INITIAL_STATE__ || {}; window.__INITIAL_STATE__.feed = ${safeStringify(data)};`
                };

                const injected = inject(html, { scripts: [injectionScript] });
                // Ensure we return the INJECTED html
                return c.html(injected);
            }

            // Return plain HTML if injection disabled
            return c.html(html);
        } catch (err) {
            logger.error({ err }, 'Home page injection failed');
            const html = await loadTemplate();
            return c.html(html || 'Error');
        }
    }

    private async getFeedData(options: { page: number, limit: number, sizesStr?: string, formatsStr?: string, sortBy?: 'latest' | 'top', useCache?: boolean }) {
        const { page, limit, sizesStr, formatsStr, sortBy = 'latest', useCache } = options;
        const start = page * limit;
        const end = start + limit - 1;

        const cache = getCache();

        // Cache Key includes params
        let cacheKey = `home-feed-p${page}-l${limit}-sort-${sortBy}`;
        if (sizesStr) cacheKey += `-s${sizesStr}`;
        if (formatsStr) cacheKey += `-f${formatsStr}`;

        if (useCache === true) { // Default false for now to debug
            const cached = await cache.get(cacheKey);
            if (cached) {
                return { data: cached, _cacheHit: true };
            }
        }

        // 1. Fetch Posts & Pages in Parallel
        const [postsRes, pagesRes] = await Promise.all([
            supabase
                .from('posts')
                .select('*, pictures(*)')
                .order('created_at', { ascending: false })
                .range(start, end),
            supabase
                .from('pages')
                .select('*')
                .eq('is_public', true)
                .eq('visible', true)
                .order('created_at', { ascending: false })
                .range(start, end)
        ]);

        if (postsRes.error) throw postsRes.error;

        const posts = postsRes.data || [];
        const pages = pagesRes.data || [];

        // 1.5 Extract Page Images (to find display image for pages)
        const pageImageIds: string[] = [];
        const pageIdToImageId = new Map<string, string>();
        const pageIdToDirectUrl = new Map<string, string>();

        pages.forEach((page: any) => {
            let content = page.content;
            if (typeof content === 'string') {
                try { content = JSON.parse(content); } catch (e) { }
            }

            // DEBUG: Write content to file
            try {
                // await fs.writeFile(path.join(process.cwd(), 'debug_page_content.json'), JSON.stringify(content, null, 2));
            } catch (e) { console.error('Failed to write debug file', e); }

            const candidates = extractDisplayImage(content);
            if (candidates) {
                if (candidates.pictureId) {
                    pageImageIds.push(candidates.pictureId);
                    pageIdToImageId.set(page.id, candidates.pictureId);
                } else if (candidates.imageUrl) {
                    pageIdToDirectUrl.set(page.id, candidates.imageUrl);
                }
            }
        });

        const pageImages = new Map<string, string>();
        if (pageImageIds.length > 0) {
            logger.debug({ pageImageIds }, 'Fetching page images');
            const { data: pics, error: picsError } = await supabase
                .from('pictures')
                .select('id, image_url')
                .in('id', pageImageIds);

            if (picsError) {
                logger.error({ err: picsError }, 'Failed to fetch page images');
            } else {
                logger.debug({ count: pics?.length }, 'Fetched page images');
                pics?.forEach((p: any) => pageImages.set(p.id, p.image_url));
            }
        } else {
            // logger.debug('No page images to fetch');
        }

        // 1.6. Fetch Category Paths for Pages

        const categoryPathsMap = await fetchCategoryPathsForPages(supabase, pages);

        // 2. Transform Pages to FeedPost format
        const transformedPages = pages.map((page: any) => {
            let displayImage = "https://picsum.photos/640";
            const requiredPicId = pageIdToImageId.get(page.id);
            const directUrl = pageIdToDirectUrl.get(page.id);

            if (requiredPicId) {
                const foundUrl = pageImages.get(requiredPicId);
                if (foundUrl) displayImage = foundUrl;
            } else if (directUrl) {
                displayImage = directUrl;
            }

            const virtualPic = {
                id: page.id,
                picture_id: page.id,
                title: page.title,
                description: null,
                image_url: displayImage,
                thumbnail_url: null,
                type: 'page-intern',
                meta: { slug: page.slug },
                created_at: page.created_at,
                user_id: page.owner,
                likes_count: 0,
                comments: [{ count: 0 }],
                visible: true,
                is_selected: false,
                position: 0
            };

            // Get category paths for this page
            const categoryPaths = categoryPathsMap.get(page.id) || [];

            return {
                id: page.id,
                title: page.title,
                description: null,
                created_at: page.created_at,
                user_id: page.owner,
                pictures: [virtualPic],
                cover: virtualPic,
                likes_count: 0,
                comments_count: 0,
                type: 'page-intern',
                category_paths: categoryPaths
            };
        });

        // 3. Merge Posts and Pages
        const allItems = [...posts, ...transformedPages];
        const userIds = Array.from(new Set(allItems.map((p: any) => p.user_id || p.owner).filter(Boolean)));

        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, username, display_name, avatar_url')
                .in('user_id', userIds);

            if (profiles) {
                profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {});
            }
        }

        let augmentedPosts = await augmentPosts(supabase, allItems, profilesMap, { sizesStr, formatsStr }, this.boss);

        // 4. Apply Client-Side Sort/Cover Logic
        augmentedPosts = applyClientSortAndCovers(augmentedPosts, sortBy);

        // Cache for 60 seconds
        await cache.set(cacheKey, augmentedPosts, 60);

        return { data: augmentedPosts, _cacheHit: false };
    }
    async onStart(boss?: PgBoss) {
        this.boss = boss;

        // Listen for internal app updates to invalidate cache
        const { appEvents } = await import('../../events.js');
        const { getCache } = await import('../../commons/cache/index.js');

        appEvents.on('app-update', async (event) => {
            if (event.type === 'categories') {
                logger.info({ event }, 'Category updated, invalidating feed cache');
                const cache = getCache();
                // Invalidate all feeds since categories can affect any feed (filtering, home, etc)
                // A more targeted approach would be better but for now flush feeds.
                // Or just flush everything related to feeds.
                // Pattern matching support in cache would be ideal: "*-feed*"
                // appCache supports prefix? No, but we can iterate or just flush all for safety 
                // IF we don't have pattern matching. 
                // But wait, our cache key structure is mutable?
                // `home-feed-...` 
                // Let's assume we can't easily find all keys. 
                // But if we want to pass the test, we need to invalidate the specific key or all.

                // For the purpose of this task and test, let's try to invalidate broadly or specific if we know how.
                // The test uses `/api/feed?page=0&limit=5&categoryIds=...`
                // Cache key: `home-feed...-catIds...`

                // Implementation: Flush all feed-related keys if possible, or just flush generic feed cache.
                // Since our generic cache doesn't support wildcard deletion easily without tracking keys,
                // and `appCache` is simple, we might need to rely on the fact that `db-categories.ts` 
                // calls `flushCategoryCache` (which clears `categories` key), 
                // BUT `handleGetApiFeed` caches the *result* (posts) with the category applied.

                // We need to clear the feed cache. 
                // Let's try to clear keys starting with "home-feed" or similar if the cache supports it.
                // Checking `cache.ts`... `appCache` wrapper might not support it.
                // But `getCache()` returns the underlying `ICache`.

                // If I can't wildcard, I might have to accept that for now we rely on short TTL (60s) 
                // OR we implement a `flushPattern` if available.
                // `index.ts` has `handleInvalidateCache` using `cache.flush(pattern)`.
                // So `cache.flush` supports patterns!

                await cache.flush('home-feed*');
                await cache.flush('*-feed*'); // Cover other sources
            }
        });

        // Example: Register a custom handler
        if (process.env.ENABLE_WEBSOCKETS === 'true') {
            const { WebSocketManager } = await import('../../commons/websocket.js');
            WebSocketManager.getInstance().registerHandler('serving-echo', (ws, payload) => {
                ws.send(JSON.stringify({ type: 'serving-echo-response', original: payload }));
            });
        }
    }
}
