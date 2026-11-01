import { getAuthToken, serverUrl } from "@/lib/db";

const API_BASE = serverUrl || '';

export interface VideoEntry {
    id: string;
    title: string;
    image_url: string;
    thumbnail_url: string;
    type: string;
    user_id: string;
    created_at: string;
    meta: {
        duration?: number;
        mux_playback_id?: string;
        aspect_ratio?: string;
        max_stored_resolution?: string;
        tracks?: any[];
        [key: string]: any;
    };
    [key: string]: any;
}

/** Fetch all videos (admin only) */
export async function fetchVideos(): Promise<VideoEntry[]> {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const res = await fetch(`${API_BASE}/api/videos/list`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Failed to fetch videos: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || [];
}

/** Batch delete videos (admin only) — removes files from disk + DB rows */
export async function deleteVideos(ids: string[]): Promise<{ deleted: number; errors: string[] }> {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const res = await fetch(`${API_BASE}/api/videos/batch`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Failed to delete videos: ${res.statusText}`);
    }

    return await res.json();
}

export interface DiskVideoFolder {
    name: string;
    fileCount: number;
    totalSize: number;
}

/** Scan video storage directory on disk (admin only) */
export async function scanVideoDisk(): Promise<{ storageDir: string; folders: DiskVideoFolder[] }> {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const res = await fetch(`${API_BASE}/api/videos/scan`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Failed to scan videos: ${res.statusText}`);
    }

    return await res.json();
}

/** Delete video folders from disk only (admin only) — for orphan cleanup */
export async function deleteVideoFolders(names: string[]): Promise<{ deleted: number; errors: string[] }> {
    const token = await getAuthToken();
    if (!token) throw new Error('No active session');

    const res = await fetch(`${API_BASE}/api/videos/folders`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ names })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Failed to delete folders: ${res.statusText}`);
    }

    return await res.json();
}
