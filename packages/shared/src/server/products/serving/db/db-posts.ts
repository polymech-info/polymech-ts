import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger.js';
import { VIDEO_JOB_NAME } from '../../videos/worker.js';
import { PgBoss } from 'pg-boss';

const { fetchCategoryAncestry } = await import('./db-categories.js');
const { fetchUserProfilesCached } = await import('./db-user.js');
const { fetchCategoryPathsForPages } = await import('./db-categories.js');

export interface FeedPost {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    user_id: string;
    pictures: any[];
    cover: any;
    likes_count: number;
    comments_count: number;
    type: string;
    author?: any;
    settings?: any;
    category_paths?: any[][];
    // Extended properties for details view
    comments?: any[];
    is_liked?: boolean;
    is_saved?: boolean;
}

interface FetchFeedOptions {
    source?: 'home' | 'collection' | 'tag' | 'user' | 'widget';
    sourceId?: string;
    isOrgContext?: boolean;
    orgSlug?: string;
    page?: number;
    limit?: number;
    sizesStr?: string;
    formatsStr?: string;
    sortBy?: 'latest' | 'top';
    userId?: string;
    categoryIds?: string[];
    categorySlugs?: string[];
}

/**
 * Resolves category slugs to IDs and validates category filters
 * Also includes all descendant categories (children, grandchildren, etc.)
 */
async function resolveCategoryFilters(
    supabase: SupabaseClient,
    categoryIds?: string[],
    categorySlugs?: string[]
): Promise<{ resolvedIds: string[]; filterRequested: boolean; shouldReturnEmpty: boolean }> {
    let resolvedIds: string[] = [];
    const filterRequested = !!(categoryIds?.length || categorySlugs?.length);

    if (categoryIds && categoryIds.length > 0) {
        resolvedIds = [...categoryIds];
    }
    if (categorySlugs && categorySlugs.length > 0) {
        const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .in('slug', categorySlugs);
        if (categories) {
            resolvedIds.push(...categories.map(c => c.id));
        }
    }

    // Fetch all descendant categories recursively
    if (resolvedIds.length > 0) {
        const allDescendants = new Set<string>(resolvedIds);
        const toProcess = [...resolvedIds];

        while (toProcess.length > 0) {
            const parentIds = toProcess.splice(0, toProcess.length);

            // Find all children of current parent IDs
            const { data: children } = await supabase
                .from('category_relations')
                .select('child_category_id')
                .in('parent_category_id', parentIds);

            if (children && children.length > 0) {
                const childIds = children.map(c => c.child_category_id);

                // Add new children to the set and queue for processing
                childIds.forEach(id => {
                    if (!allDescendants.has(id)) {
                        allDescendants.add(id);
                        toProcess.push(id);
                    }
                });
            }
        }

        resolvedIds = Array.from(allDescendants);
    }

    const shouldReturnEmpty = filterRequested && resolvedIds.length === 0;
    return { resolvedIds, filterRequested, shouldReturnEmpty };
}

/**
 * Filters items (posts or pages) by category
 */
function filterByCategory<T extends { meta?: any }>(items: T[], categoryIds: string[]): T[] {
    if (categoryIds.length === 0) return items;

    return items.filter(item => {
        const itemCategoryIds: string[] = [];
        if (item.meta?.categoryIds && Array.isArray(item.meta.categoryIds)) {
            itemCategoryIds.push(...item.meta.categoryIds);
        } else if (item.meta?.categoryId) {
            itemCategoryIds.push(item.meta.categoryId);
        }
        // Exclude items without categories, and only include items with matching categories
        return itemCategoryIds.length > 0 && itemCategoryIds.some(catId => categoryIds.includes(catId));
    });
}

/**
 * Enriches a page for feed display by extracting display image
 */
async function enrichFeedPage(
    supabase: SupabaseClient,
    page: any,
    extractDisplayImage: (content: any) => any
): Promise<{ pictureId?: string; imageUrl?: string }> {
    let content = page.content;
    if (typeof content === 'string') {
        try {
            content = JSON.parse(content);
        } catch (e) {
            // Keep as string if parse fails
        }
    }

    const candidates = extractDisplayImage(content);
    return candidates || {};
}

/**
 * Transforms a page into a FeedPost object
 */
function transformPageToFeedPost(
    page: any,
    displayImage: string,
    categoryPaths: any[][]
): FeedPost {
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
}

/**
 * Fetches user profiles for a list of user IDs
 */
async function fetchUserProfiles(
    supabase: SupabaseClient,
    userIds: string[]
): Promise<Record<string, any>> {
    if (userIds.length === 0) return {};
    return fetchUserProfilesCached(supabase, userIds);
}

/**
 * Type for query filter functions
 */
type QueryFilter = (query: any) => any;

/**
 * Creates a filter for public and visible pages
 */
const publicVisibleFilter: QueryFilter = (query) => {
    return query.eq('is_public', true).eq('visible', true);
};

/**
 * Creates a filter for user-owned pages
 */
const userOwnerFilter = (userId: string): QueryFilter => (query) => {
    return query.eq('owner', userId);
};

/**
 * Fetches pages with composable filters
 */
async function fetchPages(
    supabase: SupabaseClient,
    start: number,
    end: number,
    filters: QueryFilter[] = []
): Promise<any[]> {
    let query = supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end);

    // Apply all filters
    for (const filter of filters) {
        query = filter(query);
    }

    const { data: pages, error } = await query;
    return (!error && pages) ? pages : [];
}

/**
 * Sort function type for feed items
 */
type FeedSortFn = (a: FeedPost, b: FeedPost) => number;

/**
 * Sorts feed items by popularity (likes count, then by date)
 */
const sortByTop: FeedSortFn = (a, b) => {
    const likesA = a.likes_count || 0;
    const likesB = b.likes_count || 0;
    if (likesB !== likesA) return likesB - likesA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
};

/**
 * Sorts feed items by latest activity (most recent picture or post date)
 */
const sortByLatest: FeedSortFn = (a, b) => {
    const latestPicDateA = a.pictures && a.pictures.length > 0
        ? Math.max(...a.pictures.map((p: any) => new Date(p.created_at || a.created_at).getTime()))
        : new Date(a.created_at).getTime();

    const latestPicDateB = b.pictures && b.pictures.length > 0
        ? Math.max(...b.pictures.map((p: any) => new Date(p.created_at || b.created_at).getTime()))
        : new Date(b.created_at).getTime();

    return latestPicDateB - latestPicDateA;
};

import { appCache } from '../../../cache.js';

// --- Posts Cache ---

interface PostsCacheState {
    posts: any[];
    pictures: any[];
    postsMap: Map<string, any>;
    picturesMap: Map<string, any>;
    picturesByPostId: Map<string, any[]>;

    // Interactions
    commentsMap: Map<string, any[]>; // pictureId -> comments[]
    likesMap: Map<string, Set<string>>; // userId -> Set<pictureId>

    loaded: boolean;
    timestamp: number;
}

const CACHE_KEY = 'posts';
const POSTS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const getPostsState = async (supabase: SupabaseClient): Promise<{ state: PostsCacheState, fromCache: boolean }> => {
    let state = await appCache.get<PostsCacheState>(CACHE_KEY);

    const now = Date.now();
    if (state && state.loaded && (now - state.timestamp < POSTS_CACHE_TTL)) {
        return { state, fromCache: true };
    }

    // Load from DB
    const [postsRes, picsRes, commentsRes, likesRes, profilesRes] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('pictures').select('*').order('position', { ascending: true }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('likes').select('user_id, picture_id'),
        supabase.from('profiles').select('id, username, avatar_url')
    ]);

    if (postsRes.error) throw postsRes.error;
    if (picsRes.error) throw picsRes.error;
    if (commentsRes.error) throw commentsRes.error;
    if (likesRes.error) throw likesRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const posts = postsRes.data || [];
    const pictures = picsRes.data || [];

    // Reconstruct Maps
    const postsMap = new Map();
    const picturesMap = new Map();
    const picturesByPostId = new Map();
    const commentsMap = new Map();
    const likesMap = new Map();

    const profilesMap = new Map();
    (profilesRes.data || []).forEach((p: any) => profilesMap.set(p.id, p));

    // Index Pictures
    pictures.forEach(pic => {
        picturesMap.set(pic.id, pic);

        // Link to Post
        if (pic.post_id) {
            const existing = picturesByPostId.get(pic.post_id) || [];
            existing.push(pic);
            picturesByPostId.set(pic.post_id, existing);
        }
    });

    // Index Comments (Attach Profile)
    (commentsRes.data || []).forEach((comment: any) => {
        // join profile manually
        if (comment.user_id) {
            comment.profiles = profilesMap.get(comment.user_id) || null;
        }

        if (comment.picture_id) {
            const existing = commentsMap.get(comment.picture_id) || [];
            existing.push(comment);
            commentsMap.set(comment.picture_id, existing);
        }
    });

    // Index Likes
    (likesRes.data || []).forEach((like: any) => {
        if (like.user_id && like.picture_id) {
            const existing = likesMap.get(like.user_id) || new Set();
            existing.add(like.picture_id);
            likesMap.set(like.user_id, existing);
        }
    });

    // Index Posts and Attach Pictures
    posts.forEach(post => {
        const postPics = picturesByPostId.get(post.id) || [];
        postPics.sort((a: any, b: any) => (a.position - b.position));
        post.pictures = postPics;
        postsMap.set(post.id, post);
    });

    state = {
        posts,
        pictures,
        postsMap,
        picturesMap,
        picturesByPostId,
        commentsMap,
        likesMap,
        loaded: true,
        timestamp: now
    };

    await appCache.set(CACHE_KEY, state, POSTS_CACHE_TTL);
    return { state, fromCache: false };
};

export const flushPostsCache = async () => {
    await appCache.invalidate(CACHE_KEY);
};

// Periodically invalidate?
// No, let generic cache handle TTL or external trigger. The recurring interval in original code 
// was arguably redundant if TTL is checked on access, but if we want proactive refresh...
// For now, removing the interval and relying on TTL check on access.



export const fetchFeedPostsServer = async (
    supabase: SupabaseClient,
    options: FetchFeedOptions,
    boss?: PgBoss
): Promise<FeedPost[]> => {
    const {
        source = 'home',
        sourceId,
        page = 0,
        limit = 30,
        sizesStr,
        formatsStr,
        sortBy = 'latest',
        userId,
        categoryIds,
        categorySlugs
    } = options;

    const { state: postsCache } = await getPostsState(supabase);

    // Resolve category filters
    const { resolvedIds: resolvedCategoryIds, shouldReturnEmpty } = await resolveCategoryFilters(
        supabase,
        categoryIds,
        categorySlugs
    );

    // 1. Filter Posts in Memory
    let filteredPosts = postsCache.posts;

    // Apply Filters based on Source
    if (!sourceId && source === 'home') {
        // Public visibility check
        // query.or('settings.is.null,settings->>visibility.eq.public');
        filteredPosts = filteredPosts.filter(p => {
            const visibility = p.settings?.visibility;
            return !p.settings || !visibility || visibility === 'public';
        });
    } else if (source === 'user' && sourceId) {
        filteredPosts = filteredPosts.filter(p => p.user_id === sourceId);
    }

    // Apply Category Filter
    if (shouldReturnEmpty) {
        filteredPosts = [];
    } else if (resolvedCategoryIds.length > 0) {
        filteredPosts = filterByCategory(filteredPosts, resolvedCategoryIds);
    }

    // 2. Fetch Pages (Still DB for now, or mixed?)
    // User only asked for db-posts.ts caching. Pages fetching logic remains similar, 
    // but needs to be integrated.

    let pagesData: any[] = [];
    const start = page * limit;
    const end = start + limit - 1;

    // We can't easily paginate *before* merging if we have two data sources (posts + pages)
    // unless we fetch ALL pages too (which isn't cached yet)
    // OR we just fetch pages for the requested range and assume distribution? NO.
    // If we want correct pagination across mixed types, we basically need to fetch all candidates of both types, 
    // merge, sort, then slice.

    // Since 'fetchPages' uses DB range, it was efficient before.
    // Now 'filteredPosts' is in memory (all of them).
    // To support correct mixed feed, we should probably fetch ALL relevant pages too?
    // Or just fetch pages for the range... but we don't know the range offsets if we mix.
    // Compromise: Fetch ALL relevant pages (usually much fewer than posts) for the context.

    if (source === 'home' || source === 'user' || source === 'collection') {
        if (!shouldReturnEmpty) {
            // Build filter array based on source
            const pageFilters: QueryFilter[] = [];

            if (source === 'user' && sourceId) {
                pageFilters.push(userOwnerFilter(sourceId));
                pageFilters.push(publicVisibleFilter);
            } else if (source === 'home') {
                pageFilters.push(publicVisibleFilter);
            }

            // Fetch ALL pages (remove limit/range) to merge and sort reliably
            // NOTE: This might be heavy if there are thousands of pages.
            // Using a large range for now or implementing PagesCache later.
            // For now, let's just use 'fetchPages' with a large range logic or simplified 'select all'.

            let query = supabase
                .from('pages')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply all filters
            for (const filter of pageFilters) {
                query = filter(query);
            }

            const { data: allPages } = await query;
            pagesData = shouldReturnEmpty ? [] : filterByCategory(allPages || [], resolvedCategoryIds);
        }
    }

    // 3. Process Pages Images (Display Image Extraction)
    const { extractDisplayImage } = await import('../renderer.js');
    const pageImageData = new Map<string, { pictureId?: string; imageUrl?: string }>();

    await Promise.all(pagesData.map(async (page) => {
        const imageData = await enrichFeedPage(supabase, page, extractDisplayImage);
        pageImageData.set(page.id, imageData);
    }));

    // Resolve Page Images from Cache if possible?
    const pageImages = new Map<string, string>();
    const pageImageIds = Array.from(pageImageData.values())
        .map(data => data.pictureId)
        .filter(Boolean) as string[];

    if (pageImageIds.length > 0) {
        // Try to find in cache first
        const missingIds: string[] = [];
        pageImageIds.forEach(id => {
            const pic = postsCache.picturesMap.get(id);
            if (pic) {
                pageImages.set(id, pic.image_url);
            } else {
                missingIds.push(id);
            }
        });

        // Fetch missing (though cache should have all)
        if (missingIds.length > 0) {
            const { data: pics } = await supabase
                .from('pictures')
                .select('id, image_url')
                .in('id', missingIds);
            pics?.forEach((p: any) => pageImages.set(p.id, p.image_url));
        }
    }

    // Fetch Category Paths for Pages
    const categoryPathsMap = await fetchCategoryPathsForPages(supabase, pagesData);

    // Fetch User Profiles (Batched)
    const allItems = [...filteredPosts, ...pagesData];
    const userIds = Array.from(new Set(allItems.map(p => p.user_id || p.owner).filter(Boolean)));
    const profilesMap = await fetchUserProfiles(supabase, userIds);

    // Transform Pages
    const transformedPages: FeedPost[] = pagesData.map(page => {
        const imageData = pageImageData.get(page.id);
        let displayImage = "https://picsum.photos/640"; // Fallback

        if (imageData?.pictureId) {
            const found = pageImages.get(imageData.pictureId);
            if (found) displayImage = found;
        } else if (imageData?.imageUrl) {
            displayImage = imageData.imageUrl;
        }

        const categoryPaths = categoryPathsMap.get(page.id) || [];
        return transformPageToFeedPost(page, displayImage, categoryPaths);
    });

    // Helper for Posts - Fetch Overrides (Selected Versions)
    const rootIds = new Set<string>();
    const postCandidates = new Map<string, any>();

    filteredPosts.forEach((post: any) => {
        const pics = post.pictures || [];
        const validPics = pics.filter((p: any) => p.visible !== false); // Already sorted in cache logic
        const cover = validPics[0];
        if (cover) {
            postCandidates.set(post.id, cover);
            rootIds.add(cover.parent_id || cover.id);
        }
    });

    let selectedVersions: any[] = [];
    if (rootIds.size > 0) {
        const sortedIds = Array.from(rootIds).sort();
        // Check cache for selected versions?
        // Selected versions are pictures with is_selected=true.
        // We can filter from cache.pictures.
        // This is much faster than DB query.

        selectedVersions = postsCache.pictures.filter(p =>
            p.is_selected &&
            (sortedIds.includes(p.id) || (p.parent_id && sortedIds.includes(p.parent_id)))
        );
    }

    // Fetch Category Paths for Posts (Optimized)
    const postCategoryIds = new Set<string>();
    filteredPosts.forEach((post: any) => {
        const categoryIds = post.settings?.meta?.categoryIds ||
            (post.settings?.meta?.categoryId ? [post.settings?.meta?.categoryId] : []);
        categoryIds.forEach((id: string) => postCategoryIds.add(id));
    });

    const postCategoryPathsMap = new Map<string, any[]>();
    if (postCategoryIds.size > 0) {
        const paths = await fetchCategoryAncestry(supabase, Array.from(postCategoryIds));
        paths.forEach(path => {
            if (path.length > 0) {
                const folderId = path[path.length - 1].id;
                postCategoryPathsMap.set(folderId, path);
            }
        });
    }

    // Process Posts (Transform to FeedPost)
    const processedPosts = await Promise.all(filteredPosts.map(async (post: any) => {
        // Clone post to avoid mutating cache
        const postCopy = { ...post, pictures: [...(post.pictures || [])] };

        if (!postCopy.pictures || postCopy.pictures.length === 0) {
            const settings = postCopy.settings || {};
            if (settings && settings.link) {
                const virtualPic = {
                    id: postCopy.id,
                    picture_id: postCopy.id,
                    title: postCopy.title,
                    description: postCopy.description,
                    image_url: settings.image_url || 'https://picsum.photos/seed/' + postCopy.id + '/600/400',
                    thumbnail_url: settings.thumbnail_url || null,
                    type: 'page-external',
                    meta: { url: settings.link },
                    created_at: postCopy.created_at,
                    user_id: postCopy.user_id,
                    likes_count: 0,
                    comments: [{ count: 0 }],
                    visible: true,
                    is_selected: false,
                    position: 0
                };
                postCopy.pictures = [virtualPic];
            } else {
                return null;
            }
        }

        // NOTE: augmentPictures depends on request params (sizes/formats), so we run it here, NOT in cache.
        const augmentedPictures = await augmentPictures(postCopy.pictures, sizesStr, formatsStr, boss);
        postCopy.pictures = augmentedPictures;

        let coverPic = postCandidates.get(postCopy.id) || postCopy.pictures[0];
        const rootId = coverPic?.parent_id || coverPic?.id;

        if (rootId) {
            const selected = selectedVersions.find((v: any) => (v.id === rootId || v.parent_id === rootId) && v.is_selected);
            if (selected) {
                const inList = postCopy.pictures.find((p: any) => p.id === selected.id);
                if (inList) {
                    coverPic = inList;
                } else {
                    // Need to augment the selected one too as it came from cache (raw)
                    const augmentedSelected = await augmentPictures([selected], sizesStr, formatsStr, boss);
                    coverPic = augmentedSelected[0];
                    postCopy.pictures.unshift(coverPic);
                }
            }
        }

        const author = profilesMap[postCopy.user_id];

        const categoryIds = postCopy.settings?.meta?.categoryIds ||
            (postCopy.settings?.meta?.categoryId ? [postCopy.settings?.meta?.categoryId] : []);
        const category_paths = categoryIds.length > 0
            ? categoryIds.map((id: string) => postCategoryPathsMap.get(id)).filter(Boolean)
            : undefined;

        return {
            id: postCopy.id,
            title: postCopy.title,
            description: postCopy.description,
            created_at: postCopy.created_at,
            user_id: postCopy.user_id,
            pictures: postCopy.pictures,
            cover: coverPic,
            likes_count: postCopy.pictures.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0),
            comments_count: 0,
            type: coverPic?.type,
            author,
            settings: postCopy.settings,
            is_liked: false,
            category_paths
        } as FeedPost;
    }));

    const validPosts = processedPosts.filter(Boolean) as FeedPost[];

    // 6. Batch Fetch Likes
    // We already have posts and their pictures.
    // Likes are user-specific, so we CANNOT cache them globally.
    // We must query likes for the current user and valid posts.
    if (userId && validPosts.length > 0) {
        const allPictureIds = new Set<string>();
        validPosts.forEach(p => {
            if (p.cover) allPictureIds.add(p.cover.id);
            if (p.pictures) p.pictures.forEach((pic: any) => allPictureIds.add(pic.id));
        });

        if (allPictureIds.size > 0) {
            const { data: likes } = await supabase
                .from('likes')
                .select('picture_id')
                .eq('user_id', userId)
                .in('picture_id', Array.from(allPictureIds));

            const likedSet = new Set(likes?.map((l: any) => l.picture_id));

            validPosts.forEach(p => {
                if (p.pictures) {
                    p.pictures.forEach((pic: any) => {
                        if (likedSet.has(pic.id)) {
                            pic.is_liked = true;
                        }
                    });
                }
                if (p.cover && likedSet.has(p.cover.id)) {
                    p.cover.is_liked = true;
                    p.is_liked = true;
                }
            });
        }
    }

    // Merge and Sort
    const finalFeed = [...validPosts, ...transformedPages];

    if (sortBy === 'top') {
        finalFeed.sort(sortByTop);
    } else {
        finalFeed.sort(sortByLatest);
    }

    // Paginate (Slice)
    // We waited until the end to slice because we need to sort mixed content (posts + pages).
    // This is computationally more expensive than DB-side pagination but necessary for correct mixed sorting 
    // without complex SQL unions or assumptions.
    const slicedFeed = finalFeed.slice(start, end + 1);

    return slicedFeed;
};

// ... Helper: augmentPictures ...
const augmentPictures = async (pictures: any[], sizesStr: string | undefined, formatsStr: string | undefined, boss?: PgBoss) => {
    const includeResponsive = process.env.FEED_INCLUDE_RESPONSIVE_IMAGES !== 'false' && process.env.ENABLE_SERVER_IMAGE_OPTIMIZATION === 'true';

    if (!includeResponsive && !boss) return pictures;

    return Promise.all(pictures.map(async (p: any) => {
        // Clone picture to avoid mutating cache objects deep inside
        const pic = { ...p };

        if (includeResponsive) {
            const baseUrl = process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
            const envSizes = process.env.DEFAULT_IMAGE_SIZES ? process.env.DEFAULT_IMAGE_SIZES.split(',').map(Number) : [320, 640, 1024];
            const envFormats = process.env.DEFAULT_IMAGE_FORMATS ? process.env.DEFAULT_IMAGE_FORMATS.split(',') : ['avif', 'webp'];

            const sizes = sizesStr ? sizesStr.split(',').map(Number) : envSizes;
            const formats = formatsStr ? formatsStr.split(',') : envFormats;

            const meta = pic.meta || {};
            const aspect = (meta.width && meta.height) ? meta.height / meta.width : 0;
            const isVideo = ['mux-video', 'youtube', 'tiktok', 'video-intern'].includes(pic.type);
            const sourceUrl = (isVideo && pic.thumbnail_url) ? pic.thumbnail_url : pic.image_url;

            if (sourceUrl) {
                try {
                    const { ensureCachedImageFromUrl } = await import('../../images/index.js');

                    const makeUrl = async (w: number, fmt: string) => {
                        const h = aspect ? Math.round(w * aspect) : undefined;
                        const filename = await ensureCachedImageFromUrl(sourceUrl, w, h, fmt);
                        return `${baseUrl}/api/images/cache/${filename}`;
                    };

                    const sources = await Promise.all(formats.map(async fmt => ({
                        type: `image/${fmt}`,
                        srcset: (await Promise.all(sizes.map(async s => {
                            const url = await makeUrl(s, fmt);
                            return `${url} ${s}w`;
                        }))).join(', ')
                    })));

                    const fallbackWidth = 1024;
                    const fallbackHeight = aspect ? Math.round(fallbackWidth * aspect) : 0;
                    const fallbackSrc = await makeUrl(fallbackWidth, 'avif');

                    pic.responsive = {
                        img: { src: fallbackSrc, width: fallbackWidth, height: fallbackHeight, format: 'avif' },
                        sources
                    };
                } catch (e) {
                    logger.error({ err: e, sourceUrl }, 'Failed to eager load image for feed');
                }
            }
        }

        if (pic.type === 'video-intern' && boss) {
            const jobId = pic.meta?.mux_playback_id;
            if (jobId) {
                try {
                    const job = await boss.getJobById(VIDEO_JOB_NAME, jobId);
                    if (job) {
                        const status = job.state;
                        const baseUrl = process.env.SERVER_IMAGE_API_URL || process.env.VITE_SERVER_IMAGE_API_URL || 'http://localhost:3333';
                        const resultUrl = status === 'completed'
                            ? `${baseUrl}/api/videos/jobs/${job.id}/hls/playlist.m3u8`
                            : undefined;

                        pic.job = {
                            id: job.id,
                            status: status,
                            progress: status === 'completed' ? 100 : 0,
                            resultUrl,
                            error: null
                        };
                    }
                } catch (err) {
                    logger.error({ err, jobId }, 'Failed to fetch video job status');
                }
            }
        }

        return pic;
    }));
};

/**
 * Fetch a single Post by ID with all details (pictures, profile, comments, likes)
 */
export const fetchPostDetailsServer = async (
    supabase: SupabaseClient,
    postId: string,
    options: { userId?: string, sizesStr?: string, formatsStr?: string } = {},
    boss?: PgBoss
): Promise<{ data: FeedPost | null, fromCache: boolean }> => {
    const startTotal = performance.now();
    const { userId, sizesStr, formatsStr } = options;

    const startCache = performance.now();
    const { state: postsCache, fromCache } = await getPostsState(supabase);
    logger.info({ duration: performance.now() - startCache }, 'Perf: ensurePostsCache');

    let post = postsCache.postsMap.get(postId);

    // Check if it's a Picture acting as pseudo-post
    if (!post) {
        const picture = postsCache.picturesMap.get(postId);
        if (picture) {
            if (picture.post_id) {
                // Redirect to actual post
                return fetchPostDetailsServer(supabase, picture.post_id, options, boss);
            } else {
                // Pseudo post
                // Clone to avoid mutation
                const picClone = { ...picture };
                const startAugment = performance.now();
                const augmentedPics = await augmentPictures([picClone], sizesStr, formatsStr, boss);
                logger.info({ duration: performance.now() - startAugment, count: 1 }, 'Perf: augmentPictures (pseudo)');

                const pseudoPost: FeedPost = {
                    id: picture.id,
                    title: picture.title || 'Untitled',
                    description: picture.description,
                    user_id: picture.user_id,
                    created_at: picture.created_at,
                    pictures: augmentedPics,
                    cover: augmentedPics[0],
                    likes_count: picture.likes_count || 0,
                    comments_count: 0,
                    type: picture.type
                };

                const startCtx = performance.now();
                const result = await enrichPostCtx(supabase, pseudoPost, postsCache, userId);
                logger.info({ duration: performance.now() - startCtx }, 'Perf: enrichPostCtx (pseudo)');
                return { data: result, fromCache };
            }
        }
        return { data: null, fromCache };
    }

    // Clone post and pictures for threading safety / mutation
    post = { ...post, pictures: [...(post.pictures || [])] };

    // Augment pictures
    const startAugment = performance.now();
    const augmentedPics = await augmentPictures(post.pictures, sizesStr, formatsStr, boss);
    post.pictures = augmentedPics;
    logger.info({ duration: performance.now() - startAugment, count: post.pictures.length }, 'Perf: augmentPictures');

    // Fetch category paths
    const categoryIds: string[] = [];
    if (post.meta?.categoryIds && Array.isArray(post.meta.categoryIds)) {
        categoryIds.push(...post.meta.categoryIds);
    } else if (post.meta?.categoryId) {
        categoryIds.push(post.meta.categoryId);
    }

    const startCats = performance.now();
    let categoryPaths: any[][] = [];
    if (categoryIds.length > 0) {
        categoryPaths = await fetchCategoryAncestry(supabase, categoryIds);
    }
    logger.info({ duration: performance.now() - startCats }, 'Perf: fetchCategoryAncestry');

    const feedPost: FeedPost = {
        id: post.id,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        user_id: post.user_id,
        pictures: post.pictures,
        cover: post.pictures[0],
        likes_count: post.pictures.reduce((s: number, p: any) => s + (p.likes_count || 0), 0),
        comments_count: 0,
        type: post.pictures[0]?.type || 'image',
        settings: post.settings,
        category_paths: categoryPaths
    };

    const result = await enrichPostCtx(supabase, feedPost, postsCache, userId);
    return { data: result, fromCache };
};

// Helper to enrich post with Author, Comments, Likes
async function enrichPostCtx(
    supabase: SupabaseClient,
    post: FeedPost,
    postsCache: PostsCacheState, // Pass cache explicitly
    userId?: string
): Promise<FeedPost> {
    const tasks: Promise<any>[] = [];
    // 1. Author (Parallel Task)
    tasks.push((async () => {
        if (post.user_id) {
            const profiles = await fetchUserProfilesCached(supabase, [post.user_id]);
            post.author = profiles[post.user_id] || null;
        }
    })());

    // 2. Comments (From Memory)
    if (post.pictures && post.pictures.length > 0) {
        post.pictures.forEach((p: any) => {
            const cachedComments = postsCache.commentsMap.get(p.id);
            if (cachedComments) {
                // Return copy or slice to prevent mutation of cache if we were to modify it later
                p.comments = cachedComments;
            } else {
                p.comments = [];
            }
        });
    }

    // 3. User Interaction - Likes (From Memory)
    if (userId) {
        const userLikes = postsCache.likesMap.get(userId);
        if (userLikes && post.pictures) {
            post.pictures.forEach((p: any) => {
                p.is_liked = userLikes.has(p.id);
            });
        }
    }

    await Promise.all(tasks);
    return post;
}

/**
 * Fetch multiple media items by IDs using server-side cache
 * This leverages the postsCache for fast lookups
 */
export async function fetchMediaItemsByIdsServer(
    supabase: SupabaseClient,
    ids: string[],
    options?: {
        maintainOrder?: boolean;
        sizesStr?: string;
        formatsStr?: string;
    },
    boss?: PgBoss
): Promise<any[]> {
    if (!ids || ids.length === 0) return [];

    const { state: postsCache } = await getPostsState(supabase);

    // Try to find pictures in cache first
    const cachedPictures: any[] = [];
    const missingIds: string[] = [];

    ids.forEach(id => {
        const pic = postsCache.picturesMap.get(id);
        if (pic) {
            cachedPictures.push(pic);
        } else {
            missingIds.push(id);
        }
    });

    // Fetch missing pictures from database
    let missingPictures: any[] = [];
    if (missingIds.length > 0) {
        const { data, error } = await supabase
            .from('pictures')
            .select('*')
            .in('id', missingIds);

        if (error) throw error;
        missingPictures = data || [];
    }

    // Combine cached and fetched pictures
    const allPictures = [...cachedPictures, ...missingPictures];

    // Augment pictures with responsive images if requested
    const augmented = await augmentPictures(
        allPictures,
        options?.sizesStr,
        options?.formatsStr,
        boss
    );

    // Maintain order if requested
    if (options?.maintainOrder) {
        return ids
            .map(id => augmented.find(item => item.id === id))
            .filter(item => item !== undefined);
    }

    return augmented;
}
