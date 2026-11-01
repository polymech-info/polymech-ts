import { apiClient, getAuthHeaders, getAuthToken, serverUrl } from '@/lib/db';
import { vfsUrl } from '@/modules/storage/helpers';
import { INode } from '@/modules/storage/types';
import type { VfsCopyRequest, VfsCopyResponse, VfsCopyConflictResponse } from '@polymech/shared/src/fs';

export interface VfsOptions {
    accessToken?: string;
    includeSize?: boolean;
}

/** List configured VFS mount names for the current user. */
export const fetchVfsMounts = async (options: VfsOptions = {}): Promise<string[]> => {
    const headers = options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined;
    try {
        const mounts = await apiClient<{ name: string }[]>('/api/vfs/mounts', { headers, cache: 'no-cache' });
        return mounts.map((m) => m.name);
    } catch {
        return [];
    }
};

export const fetchVfsDirectory = async (mount: string, path: string, options: VfsOptions = {}): Promise<INode[]> => {
    let url = vfsUrl('ls', mount, path);
    if (options.includeSize) {
        url += '?includeSize=true';
    }
    const headers = options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined;
    return apiClient<INode[]>(url, { headers, cache: 'no-cache' });
};

export const fetchVfsSearch = async (mount: string, path: string, query: string, options: VfsOptions = {}): Promise<{ results: INode[] }> => {
    const base = path ? vfsUrl('search', mount, path) : vfsUrl('search', mount);
    const url = `${base}?q=${encodeURIComponent(query.trim())}&maxResults=200`;
    const headers = options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined;
    return apiClient<{ results: INode[] }>(url, { headers, cache: 'no-cache' });
};

/** POST `/api/vfs/upload/{mount}/…` — multipart body (binary-safe). */
export function vfsUploadUrl(mount: string, relativePath: string): string {
    const clean = relativePath.replace(/^\/+/, '');
    const encoded = clean ? clean.split('/').map((seg) => encodeURIComponent(seg)).join('/') : '';
    return `${serverUrl}/api/vfs/upload/${encodeURIComponent(mount)}${encoded ? `/${encoded}` : ''}`;
}

export async function uploadVfsFile(
    mount: string,
    relativePath: string,
    file: File | Blob,
    options: VfsOptions = {},
): Promise<{ success: boolean; path: string; size?: number }> {
    const token = options.accessToken ?? (await getAuthToken());
    const url = vfsUploadUrl(mount, relativePath);
    const formData = new FormData();
    const name = file instanceof File ? file.name : 'image.png';
    formData.append('file', file, name);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: formData });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; path?: string; size?: number; error?: string };
    if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : `VFS upload failed: HTTP ${res.status}`);
    }
    return { success: Boolean(data.success), path: data.path ?? relativePath, size: data.size };
}

export const writeVfsFile = async (
    mount: string,
    path: string,
    content: string,
    options: VfsOptions = {}
): Promise<{ success: boolean; path: string }> => {
    const url = vfsUrl('write', mount, path);
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: content,
    });
    if (!res.ok) {
        throw new Error(`Failed to write VFS file: HTTP ${res.status}`);
    }
    return res.json();
};

export const readVfsFileText = async (
    mount: string,
    path: string,
    options: VfsOptions = {}
): Promise<string> => {
    const url = vfsUrl('read', mount, path);
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers, cache: 'no-cache' });
    if (!res.ok) {
        throw new Error(`Failed to read VFS file: HTTP ${res.status}`);
    }
    return res.text();
};

export const vfsIndex = async (mount: string, path: string, fullText: boolean): Promise<{ message: string }> => {
    const cleanPath = path.replace(/^\//, '');
    let endpoint = mount === 'home'
        ? `/api/vfs/admin/index/${cleanPath}?fullText=${fullText}`
        : `/api/vfs/admin/index/${mount}/${cleanPath}?fullText=${fullText}`;
    
    // remove trailing slash before query params if path was empty
    endpoint = endpoint.replace(/\/(\?|$)/, '$1');
    return apiClient<{ message: string }>(endpoint, { method: 'POST' });
};

export const vfsClearIndex = async (mount: string, path: string): Promise<{ message: string }> => {
    const cleanPath = path.replace(/^\//, '');
    let endpoint = mount === 'home'
        ? `/api/vfs/admin/index/${cleanPath}`
        : `/api/vfs/admin/index/${mount}/${cleanPath}`;
        
    endpoint = endpoint.replace(/\/$/, '');
    return apiClient<{ message: string }>(endpoint, { method: 'DELETE' });
};

export const subscribeToVfsIndexStream = async (
    mount: string,
    targetPath: string,
    onProgress: (progress: number, msg: string) => void,
    fallbackToken?: string
): Promise<EventSource> => {
    const dbToken = await getAuthToken();
    const token = dbToken || fallbackToken;
    const streamUrl = token
        ? `${serverUrl}/api/stream?token=${encodeURIComponent(token)}`
        : `${serverUrl}/api/stream`;

    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('system', (e: any) => {
        try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'vfs-index' && payload.data) {
                const matchPath = targetPath.replace(/^\//, '');
                const payloadTarget = (payload.data.targetPath || '').replace(/^\//, '');
                if (payload.data.mount === mount && payloadTarget === matchPath) {
                    onProgress(
                        payload.data.progress,
                        `Indexing: ${payload.data.indexedCount} / ${payload.data.total}`
                    );
                }
            }
        } catch (err) { }
    });

    return eventSource;
};

export const vfsCopyOperation = async (
    payload: VfsCopyRequest
): Promise<{ status: number; data: VfsCopyResponse | VfsCopyConflictResponse }> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/vfs/copy', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 409) {
        throw new Error((data && (data.error || data.message)) || `Copy operation failed: HTTP ${res.status}`);
    }
    return { status: res.status, data };
};

export interface VfsTaskStatus {
    id: string;
    ownerId: string;
    operation: 'copy' | 'move' | 'delete';
    state: 'running' | 'paused_for_conflict' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    filesDone: number;
    totalFiles: number;
    bytesCopied: number;
    error?: string;
    conflict?: {
        source: string;
        destination: string;
        suggestedPath: string;
    };
}

export const vfsStartTransferTask = async (payload: VfsCopyRequest): Promise<{ taskId: string }> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/vfs/transfer', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Failed to start transfer: HTTP ${res.status}`);
    }
    return data;
};

export const vfsResolveTaskConflict = async (taskId: string, decision: string): Promise<{ success: boolean }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/vfs/tasks/${encodeURIComponent(taskId)}/resolve`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Failed to resolve conflict: HTTP ${res.status}`);
    }
    return data;
};

export const vfsGetTaskStatus = async (taskId: string): Promise<VfsTaskStatus> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/vfs/tasks/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers,
        cache: 'no-cache',
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Failed to load task status: HTTP ${res.status}`);
    }
    return data as VfsTaskStatus;
};
