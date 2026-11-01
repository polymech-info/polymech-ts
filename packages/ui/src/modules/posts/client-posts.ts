import { UserProfile } from "@/modules/posts/views/types";
import { MediaType, MediaItem } from "@/types";
import { fetchWithDeduplication, getAuthToken } from "@/lib/db";

export interface FeedPost {
    id: string; // Post ID
    title: string;
    description: string | null;
    created_at: string;
    user_id: string;
    pictures: MediaItem[]; // All visible pictures
    cover: MediaItem; // The selected cover picture
    likes_count: number;
    comments_count: number;
    type: MediaType;
    author?: UserProfile;
    settings?: any;
    is_liked?: boolean;
    category_paths?: any[][]; // Array of category paths (each path is root -> leaf)
    meta?: any; // Additional metadata
}

export const fetchPostDetailsAPI = async (id: string, options: { sizes?: string, formats?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.sizes) params.set('sizes', options.sizes);
    if (options.formats) params.set('formats', options.formats);

    const { getCurrentLang } = await import('@/i18n');
    params.set('lang', getCurrentLang());

    const qs = params.toString();
    const url = `/api/posts/${id}${qs ? `?${qs}` : ''}`;

    // We rely on the browser/hook to handle auth headers if global fetch is intercepted, 
    // OR we explicitly get session? 
    // Usually standard `fetch` in our app might not send auth if using implicit flows or we need to pass headers.
    // In `useFeedData`, we manually added headers.
    // Let's assume we need to handle auth here or use a helper that does.
    // To keep it simple for now, we'll import `supabase` and get session.

    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch post: ${res.statusText}`);
    }

    return res.json();
};

/** Fetch posts with cover pictures, paginated */
export const fetchPostsList = async (options: { page?: number; limit?: number; userId?: string } = {}) => {
    const params = new URLSearchParams();
    params.append('page', String(options.page ?? 0));
    params.append('limit', String(options.limit ?? 30));
    if (options.userId) params.append('userId', options.userId);

    const res = await fetch(`/api/posts?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`);
    return await res.json() as { data: any[]; count: number; page: number; limit: number };
};

export const fetchPostById = async (id: string) => {
    // Use API-mediated fetching instead of direct Supabase calls
    // This returns enriched FeedPost data including category_paths, author info, etc.
    return fetchWithDeduplication(`post-${id}`, async () => {
        const data = await fetchPostDetailsAPI(id);
        if (!data) return null;
        return data;
    }, 1);
};


export const fetchFullPost = async (postId: string) => {
    return fetchWithDeduplication(`full-post-${postId}`, () => fetchPostDetailsAPI(postId));
};

export const deletePost = async (id: string) => {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
    }

    return await response.json();
};
export const createPost = async (postData: { title: string, description?: string, settings?: any, meta?: any }) => {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const response = await fetch(`/api/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
    });

    if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
    }

    return await response.json();
};

export const updatePostDetails = async (postId: string, updates: { title?: string, description?: string, settings?: any, meta?: any }) => {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        throw new Error(`Failed to update post details: ${response.statusText}`);
    }

    return await response.json();
};


// Map FeedPost[] back to MediaItemType[] for backward compatibility w/ PhotoGrid
export const mapFeedPostsToMediaItems = (posts: FeedPost[], sortBy: 'latest' | 'top' = 'latest'): any[] => {
    return posts.map(post => {
        let cover = post.cover;

        // Use server-provided cover (respects is_selected versions).
        // Only fall back to position-based selection if no cover was provided.
        if (!cover && post.pictures && post.pictures.length > 0) {
            const validPics = post.pictures.filter((p: any) => p.visible !== false);

            if (validPics.length > 0) {
                const sortedByPosition = [...validPics].sort((a, b) => (a.position || 0) - (b.position || 0));
                cover = sortedByPosition[0];
            } else {
                cover = post.pictures[0]; // Fallback to any picture
            }
        }

        if (!cover) {
            // Support items without covers that should still be displayed
            const allowedWithoutCover = ['page-vfs-folder', 'page-vfs-file', 'page-external', 'page-intern', 'page-github', 'place-search'];
            if (allowedWithoutCover.includes(post.type)) {
                return {
                    id: post.id,
                    picture_id: post.id,
                    title: post.title,
                    description: post.description,
                    image_url: post.type === 'place-search' ? '' : (post.meta?.url || ''),
                    thumbnail_url: null,
                    type: post.type as MediaType,
                    meta: post.meta,
                    created_at: post.created_at,
                    user_id: post.user_id,
                    likes_count: post.likes_count,
                    comments: [{ count: post.comments_count }],
                    responsive: undefined,
                    job: undefined,
                    author: post.author,
                    versionCount: 1,
                    _searchSource: (post as any)._searchSource
                };
            }
            return null;
        }

        const versionCount = post.pictures ? post.pictures.length : 1;

        const coverType = ((cover as any).type || (cover as any).mediaType) as MediaType;
        const finalType = (post.type && post.type.startsWith('page-')) ? (post.type as MediaType) : coverType;

        return {
            id: post.id,
            picture_id: cover.id,
            title: post.title,
            description: post.description,
            image_url: cover.image_url,
            thumbnail_url: cover.thumbnail_url,
            type: finalType,
            meta: { ...(post.meta || {}), ...(cover.meta || {}) },
            created_at: post.created_at,
            user_id: post.user_id,
            likes_count: post.likes_count,
            comments: [{ count: post.comments_count }],
            responsive: (cover as any).responsive,
            job: (cover as any).job,
            author: post.author,
            versionCount,
            _searchSource: (post as any)._searchSource
        };
    }).filter(item => item !== null);
};

// Augment posts if they come from API/Hydration (missing cover/author)
export const augmentFeedPosts = (posts: any[]): FeedPost[] => {
    return posts.map(p => {
        // Check if we need to augment (heuristic: missing cover)
        if (!p.cover) {
            const pics = p.pictures || [];
            const validPics = pics.filter((pic: any) => pic.visible !== false)
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

            return {
                ...p,
                cover: validPics[0] || pics[0], // fallback to first if none visible?
                author: p.author || (p.author ? {
                    user_id: p.author.user_id,
                    username: p.author.username,
                    display_name: p.author.display_name,
                    avatar_url: p.author.avatar_url
                } : undefined)
            };
        }
        return p;
    });
};

export const updatePostMeta = async (postId: string, meta: any) => {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meta })
    });

    if (!response.ok) {
        throw new Error(`Failed to update post meta: ${response.statusText}`);
    }

    return await response.json();
};
