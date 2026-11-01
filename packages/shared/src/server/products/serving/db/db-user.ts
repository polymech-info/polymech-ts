import { Context } from 'hono';
import { logger } from '../logger.js';
import { loadTemplate, inject } from '../renderer.js';
import { augmentPosts, applyClientSortAndCovers, safeStringify } from '../content.js'; // Ensure safeStringify is exported from content.ts
import { PgBoss } from 'pg-boss';

const { getCache } = await import('../../../commons/cache/index.js');
const { supabase } = await import('../../../commons/supabase.js');

// --- Shared Helper ---
export async function getProfileData(userId: string, options: { page: number, limit: number, sizesStr?: string, formatsStr?: string, useCache?: boolean, sortBy?: 'latest' | 'top' }, boss?: PgBoss) {
    const { page, limit, sizesStr, formatsStr, useCache, sortBy = 'latest' } = options;

    const cacheKeyString = `profile-${userId}-p${page}-l${limit}-sort-${sortBy}`;
    let cacheKey = cacheKeyString;
    if (sizesStr) cacheKey += `-s${sizesStr}`;
    if (formatsStr) cacheKey += `-f${formatsStr}`;

    const cache = getCache();

    if (useCache !== false) {
        const cached = await cache.get(cacheKey);
        if (cached) return { data: cached, _cacheHit: true };
    }

    const start = page * limit;
    const end = start + limit - 1;

    const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('id, user_id, username, display_name, avatar_url, bio, created_at, updated_at').eq('user_id', userId).single(),
        supabase.from('posts').select('*, pictures(*)').eq('user_id', userId).order('created_at', { ascending: false }).range(start, end)
    ]);

    if (profileRes.error) return null;

    const posts = postsRes.data || [];
    const profilesMap = { [userId]: profileRes.data };

    let augmentedPosts = await augmentPosts(supabase, posts, profilesMap, { sizesStr, formatsStr }, boss);

    augmentedPosts = applyClientSortAndCovers(augmentedPosts, sortBy);

    const result = {
        profile: profileRes.data,
        recentPosts: augmentedPosts
    };

    await cache.set(cacheKey, result, 300);
    return { data: result, _cacheHit: false };
}

/**
 * Efficiently fetches user profiles with individual caching strategy
 * Read-Through Cache: Checks cache for each ID, fetches missing, caches result.
 */
export async function fetchUserProfilesCached(
    supabase: any,
    userIds: string[]
): Promise<Record<string, any>> {
    if (userIds.length === 0) return {};

    // 1. Check Cache
    const cache = getCache();
    const CACHE_TTL = 300; // 5 minutes

    const uniqueIds = [...new Set(userIds)];
    const missingIds: string[] = [];
    const profilesMap: Record<string, any> = {};

    await Promise.all(uniqueIds.map(async (id) => {
        const key = `user-profile:${id}`;
        const cached = await cache.get<any>(key);
        if (cached) {
            profilesMap[id] = cached;
        } else {
            missingIds.push(id);
        }
    }));

    if (missingIds.length === 0) {
        return profilesMap;
    }

    // 2. Fetch Missing
    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', missingIds);

    if (profiles) {
        await Promise.all(profiles.map(async (p: any) => {
            const key = `user-profile:${p.user_id}`;
            await cache.set(key, p, CACHE_TTL);
            profilesMap[p.user_id] = p;
        }));
    }

    return profilesMap;
}

// --- Handlers ---

export async function handleGetProfiles(c: Context) {
    try {
        const idsStr = c.req.query('ids');
        if (!idsStr) return c.json({});

        const ids = idsStr.split(',').filter(Boolean);
        if (ids.length === 0) return c.json({});

        // Check Cache first
        const cache = getCache();
        const cacheKey = `profiles-batch-${ids.sort().join('-')}`;

        const cached = await cache.get(cacheKey);
        if (cached) {
            c.header('X-Cache', 'HIT');
            return c.json(cached);
        }

        const { supabase } = await import('../../../commons/supabase.js');
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .in('user_id', ids);

        if (error) throw error;

        const profilesMap = (data || []).reduce((acc: any, p: any) => {
            acc[p.user_id] = p;
            return acc;
        }, {});

        // Cache for 5 minutes
        await cache.set(cacheKey, profilesMap, 300);

        c.header('X-Cache', 'MISS');
        return c.json(profilesMap);
    } catch (err: any) {
        logger.error({ err }, 'Batch profiles fetch failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetProfile(c: Context, boss?: PgBoss) {
    let userId = c.req.param('id');
    if (userId === 'default') userId = process.env.DEFAULT_USER_ID || '';

    try {
        const page = parseInt(c.req.query('page') || '0');
        const limit = parseInt(c.req.query('limit') || '10');
        const sizesStr = c.req.query('sizes');
        const formatsStr = c.req.query('formats');
        const sortBy = c.req.query('sortBy') as 'latest' | 'top' || 'latest';
        const cache = c.req.query('cache') !== 'false';

        const result = await getProfileData(userId, { page, limit, sizesStr, formatsStr, useCache: cache, sortBy }, boss);
        if (!result) return c.text('Profile not found', 404);


        c.header('X-Cache', result._cacheHit ? 'HIT' : 'MISS');
        return c.json(result.data);
    } catch (err: any) {
        logger.error({ err, userId }, 'API Profile fetch failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetProfilePage(c: Context, boss?: PgBoss) {
    let userId = c.req.param('id');
    if (userId === 'default') userId = process.env.DEFAULT_USER_ID || '';

    try {
        const html = await loadTemplate();
        if (!html) return c.text('Template not found', 500);

        if (process.env.INJECT_PROFILE_FEED === 'true') {
            const sortBy = c.req.query('sortBy') as 'latest' | 'top' || 'latest';
            // Default params for injection
            const result = await getProfileData(userId, { page: 0, limit: 10, useCache: true, sortBy }, boss);
            if (result) {
                const injectionScript = {
                    id: 'initial-state',
                    content: `window.__INITIAL_STATE__ = window.__INITIAL_STATE__ || {}; window.__INITIAL_STATE__.profile = ${safeStringify(result.data)}; `
                };
                const injected = inject(html, { scripts: [injectionScript] });
                return c.html(injected);
            }
        }
        return c.html(html);
    } catch (err) {
        logger.error({ err, userId }, 'Profile page injection failed');
        const html = await loadTemplate();
        return c.html(html || 'Error');
    }
}

export async function handleGetSecrets(c: Context) {
    // Get user from context (set by auth middleware)
    const user = c.get('user');
    if (!user) return c.text('Unauthorized', 401);

    try {
        const { data, error } = await supabase
            .from('user_secrets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return c.json(data);
    } catch (err: any) {
        logger.error({ err }, 'Secrets fetch failed');
        return c.text('Internal Server Error', 500);
    }
}
