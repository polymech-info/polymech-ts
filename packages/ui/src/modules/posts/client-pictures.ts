import { PostMediaItem } from "@/modules/posts/views/types";
import { MediaItem } from "@/types";
import { fetchWithDeduplication, apiClient, getAuthHeaders, serverUrl } from "@/lib/db";
import { uploadImage } from "@/lib/uploadUtils";
import { FetchMediaOptions } from "@/utils/mediaUtils";

export const fetchVersions = async (mediaItem: PostMediaItem, userId?: string) => {
    const key = `versions-${mediaItem.id}-${userId || 'anon'}`;
    return fetchWithDeduplication(key, async () => {
        const rootId = mediaItem.id; // Server resolves full parent chain via collectVersionTree
        const params = new URLSearchParams({ rootId });
        if (userId) params.append('userId', userId);
        if (mediaItem.user_id) params.append('ownerId', mediaItem.user_id);

        return apiClient<any[]>(`/api/pictures/versions?${params}`);
    });
};
export const createPicture = async (picture: Partial<PostMediaItem>) => {
    return apiClient('/api/pictures', {
        method: 'POST',
        body: JSON.stringify(picture)
    });
};

export const updatePicture = async (id: string, updates: Partial<PostMediaItem>) => {
    return apiClient(`/api/pictures/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

export const deletePicture = async (id: string) => {
    return apiClient(`/api/pictures/${id}`, {
        method: 'DELETE'
    });
};

export const deletePictures = async (ids: string[]) => {
    return apiClient('/api/pictures/delete-batch', {
        method: 'POST',
        body: JSON.stringify({ ids })
    });
};

/** Fetch pictures with optional filters and pagination */
export const fetchPictures = async (options: { userId?: string; limit?: number; page?: number } = {}) => {
    const params = new URLSearchParams();
    if (options.userId) params.append('userId', options.userId);
    params.append('limit', String(options.limit ?? 9999));
    params.append('page', String(options.page ?? 0));
    return apiClient<{ data: any[]; count: number; page: number; limit: number }>(`/api/pictures?${params}`);
};

/** Convenience alias: fetch all pictures for a user */
export const fetchUserPictures = async (userId: string) => (await fetchPictures({ userId })).data;

/** Convenience alias: fetch N recent pictures */
export const fetchRecentPictures = async (limit: number = 50) => (await fetchPictures({ limit })).data;

export const uploadFileToStorage = async (userId: string, file: File | Blob, fileName?: string) => {
    const uploadFile = file instanceof File
        ? file
        : new File([file], fileName || `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}`, {
            type: file.type || 'application/octet-stream'
        });
    const { publicUrl } = await uploadImage(uploadFile, userId);
    return publicUrl;
};

export const toggleLike = async (userId: string, pictureId: string, isLiked: boolean) => {
    const result = await apiClient<{ liked: boolean }>(`/api/pictures/${pictureId}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId, isLiked }),
    });
    return result.liked;
};

/**
 * Fetches and merges pictures and videos from the database via API
 * Returns a unified array of media items sorted by created_at
 */
export async function fetchMediaItems(options: FetchMediaOptions = {}): Promise<MediaItem[]> {
    const { organizationId, includePrivate = false, limit, userId, tag } = options;

    try {
        const params = new URLSearchParams();
        params.append('limit', '9999'); // Get all, we filter client-side
        if (userId) params.append('userId', userId);
        if (tag) params.append('tag', tag);

        const result: any = await apiClient(`/api/pictures?${params}`);
        let pictures = (result.data || []) as any[];

        // Apply client-side filters not supported by the API
        pictures = pictures.filter((p: any) => p.is_selected && p.visible);

        if (organizationId !== undefined) {
            if (organizationId === null) {
                pictures = pictures.filter((p: any) => !p.organization_id);
            } else {
                pictures = pictures.filter((p: any) => p.organization_id === organizationId);
            }
        }

        // Filter private collections if needed
        const publicPictures = includePrivate
            ? pictures
            : await filterPrivateCollectionPictures(pictures);

        // Convert to unified MediaItem format
        const allMedia: MediaItem[] = (publicPictures.map(p => {
            const isLegacyVideo = p.type === 'video-intern';
            return {
                id: p.id,
                type: isLegacyVideo ? 'video' : 'picture',
                title: p.title,
                description: p.description,
                url: p.image_url,
                thumbnail_url: p.thumbnail_url,
                likes_count: p.likes_count || 0,
                created_at: p.created_at,
                user_id: p.user_id,
                comments_count: 0,
                meta: p.meta,
            };
        }) as any[]).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Apply limit if specified
        return limit ? allMedia.slice(0, limit) : allMedia;
    } catch (error) {
        console.error('Error fetching media items:', error);
        throw error;
    }
}

/**
 * Fetches user likes for all media (both pictures and videos)
 * Note: Videos are also stored in the pictures table with type='mux-video'
 */
export async function fetchUserMediaLikes(userId: string): Promise<{
    pictureLikes: Set<string>;
    videoLikes: Set<string>;
}> {
    try {
        const data = await apiClient<{ ids: string[] }>(`/api/me/likes?userId=${userId}`);
        const allLikedIds = new Set(data.ids || []);
        return { pictureLikes: allLikedIds, videoLikes: allLikedIds };
    } catch (error) {
        console.error('Error fetching user likes:', error);
        throw error;
    }
}


export const fetchPictureById = async (id: string) => {
    return fetchWithDeduplication(`picture-${id}`, async () => {
        try {
            return await apiClient<any>(`/api/pictures/${id}`);
        } catch (e: any) {
            if (e.message.includes('404')) return null;
            throw e;
        }
    });
};

/**
 * Fetch multiple media items by IDs using the server API endpoint
 * This leverages the server's caching layer for optimal performance
 */
export const fetchMediaItemsByIds = async (
    ids: string[],
    options?: {
        maintainOrder?: boolean;
    }
): Promise<MediaItem[]> => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = ids.filter(id => UUID_RE.test(id));
    const invalidIds = ids.filter(id => !UUID_RE.test(id));
    if (invalidIds.length > 0) {
        console.warn('[fetchMediaItemsByIds] Skipping non-UUID ids:', invalidIds);
    }
    if (validIds.length === 0) return [];

    const sortedIds = [...validIds].sort();
    const key = `pictures-batch-${sortedIds.join(',')}${options?.maintainOrder ? '-ordered' : ''}`;

    return fetchWithDeduplication(key, async () => {
        // Build query parameters
        const params = new URLSearchParams({
            ids: validIds.join(','),
        });

        if (options?.maintainOrder) {
            params.append('maintainOrder', 'true');
        }

        // Call server API endpoint using apiClient
        const data = await apiClient<any[]>(`/api/media-items?${params.toString()}`);

        const { adaptSupabasePicturesToMediaItems } = await import('@/modules/posts/views/adapters');
        return adaptSupabasePicturesToMediaItems(data);
    });
};
/**
 * Filters out pictures that belong to private collections the user doesn't have access to
 * (Placeholder implementation - currently returns all pictures)
 */
async function filterPrivateCollectionPictures(pictures: any[]): Promise<any[]> {
    // TODO: Implement actual privacy filtering logic based on collections
    return pictures;
}

export const unlinkPictures = async (ids: string[]) => {
    return apiClient('/api/pictures/unlink', {
        method: 'POST',
        body: JSON.stringify({ ids })
    });
};

export const upsertPictures = async (pictures: Partial<PostMediaItem>[]) => {
    return apiClient('/api/pictures/upsert', {
        method: 'POST',
        body: JSON.stringify({ pictures })
    });
};
export const addCollectionPictures = async (inserts: { collection_id: string, picture_id: string }[]) => {
    await apiClient('/api/collection-pictures', {
        method: 'POST',
        body: JSON.stringify({ inserts }),
    });
};

export const updateStorageFile = async (path: string, blob: Blob) => {
    const authHeaders = await getAuthHeaders();
    const headers = { ...authHeaders };
    delete (headers as any)['Content-Type'];
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('path', path);
    const { serverUrl } = await import('@/lib/db');
    const response = await fetch(`${serverUrl}/api/images/update-storage`, {
        method: 'PUT',
        headers,
        body: formData,
    });
    if (!response.ok) throw new Error(`Failed to update storage file: ${response.statusText}`);
};

/**
 * Apply transformations (rotate, crop, adjust) to an image file via the server API
 */
export const transformImage = async (file: File | Blob, operations: any[]): Promise<string> => {
    const authHeaders = await getAuthHeaders();
    const headers = { ...authHeaders };
    delete (headers as any)['Content-Type']; // Let browser set boundary for FormData

    const formData = new FormData();
    formData.append('file', file);
    formData.append('operations', JSON.stringify(operations));

    const response = await fetch(`${serverUrl}/api/images/transform`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Transformation failed: ${response.statusText}`);
    }

    const resultBlob = await response.blob();
    return URL.createObjectURL(resultBlob);
};

export const fetchSelectedVersions = async (rootIds: string[]) => {
    if (rootIds.length === 0) return [];

    const sortedIds = [...rootIds].sort();
    const key = `selected-versions-${sortedIds.join(',')}`;

    return fetchWithDeduplication(key, async () => {
        const params = new URLSearchParams({ rootIds: rootIds.join(',') });
        return apiClient<any[]>(`/api/pictures/versions?${params}`);
    });
};


// =============================================
// --- Comment API Functions ---
// =============================================

/** Fetch all comments for a picture, with profiles and current user's liked IDs */
export const fetchCommentsAPI = async (pictureId: string): Promise<{
    comments: any[];
    profiles: Record<string, any>;
    likedCommentIds: string[];
}> => {
    return apiClient<any>(`/api/pictures/${pictureId}/comments`);
};

/** Add a comment (or reply) to a picture */
export const addCommentAPI = async (pictureId: string, content: string, parentCommentId?: string | null) => {
    return apiClient(`/api/pictures/${pictureId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parent_comment_id: parentCommentId || null })
    });
};

/** Edit a comment */
export const editCommentAPI = async (pictureId: string, commentId: string, content: string) => {
    return apiClient(`/api/pictures/${pictureId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content })
    });
};

/** Delete a comment */
export const deleteCommentAPI = async (pictureId: string, commentId: string) => {
    return apiClient(`/api/pictures/${pictureId}/comments/${commentId}`, {
        method: 'DELETE'
    });
};

/** Toggle like on a comment */
export const toggleCommentLikeAPI = async (pictureId: string, commentId: string): Promise<{ liked: boolean }> => {
    return apiClient(`/api/pictures/${pictureId}/comments/${commentId}/like`, {
        method: 'POST'
    });
};

