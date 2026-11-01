import { queryClient } from './queryClient';
import { userManager } from './oidc';

// Deprecated: Caching now handled by React Query
// Keeping for backward compatibility
type CacheStorageType = 'memory' | 'local';

/**
 * Parse a flat string key into a hierarchical query key array.
 * This enables SSE cascade invalidation via StreamInvalidator:
 *   invalidateQueries({ queryKey: ['posts'] })  matches  ['posts', 'abc123']
 */
const KEY_PREFIXES: [RegExp, (...groups: string[]) => string[]][] = [
    [/^feed-(.+)$/, (_, id) => ['feed', id]],
    [/^full-post-(.+)$/, (_, id) => ['posts', 'full', id]],
    [/^post-(.+)$/, (_, id) => ['posts', id]],
    [/^like-(.+)-(.+)$/, (_, uid, pid) => ['likes', uid, pid]],
    [/^selected-versions-(.+)$/, (_, ids) => ['pictures', 'selected-versions', ids]],
    [/^versions-(.+)$/, (_, rest) => ['pictures', 'versions', rest]],
    [/^picture-(.+)$/, (_, id) => ['pictures', id]],
    [/^pictures-(.+)$/, (_, rest) => ['pictures', rest]],
    [/^user-page-(.+?)-(.+)$/, (_, uid, slug) => ['pages', 'user-page', uid, slug]],
    [/^user-pages-(.+)$/, (_, uid) => ['pages', 'user-pages', uid]],
    [/^page-details-(.+)$/, (_, id) => ['pages', 'details', id]],
    [/^page-(.+)$/, (_, id) => ['pages', id]],
    [/^pages-(.+)$/, (_, rest) => ['pages', rest]],
    [/^profile-(.+)$/, (_, id) => ['users', id]],
    [/^settings-(.+)$/, (_, id) => ['users', 'settings', id]],
    [/^roles-(.+)$/, (_, id) => ['users', 'roles', id]],
    [/^openai-(.+)$/, (_, id) => ['users', 'openai', id]],
    [/^api-keys-(.+)$/, (_, id) => ['users', 'api-keys', id]],
    [/^google-(.+)$/, (_, id) => ['users', 'google', id]],
    [/^user-secrets-(.+)$/, (_, id) => ['users', 'secrets', id]],
    [/^provider-(.+)-(.+)$/, (_, uid, prov) => ['users', 'provider', uid, prov]],
    [/^provider-configs-([0-9a-f-]{36})-(.+)$/, (_, uid, rest) => ['users', 'provider-configs', uid, rest]],
    [/^type-(.+)$/, (_, id) => ['types', id]],
    [/^types-(.+)$/, (_, rest) => ['types', rest]],
    [/^i18n-(.+)$/, (_, rest) => ['i18n', rest]],
    // resourceType is first segment (no hyphens); resourceId may contain hyphens (e.g. vfs mount)
    [/^acl-([^-]+)-(.+)$/, (_, type, id) => ['acl', type, id]],
    [/^layout-(.+)$/, (_, id) => ['layouts', id]],
    [/^layouts-(.+)$/, (_, rest) => ['layouts', rest]],
    [/^contacts-(.+)$/, (_, rest) => ['contacts', rest]],
    [/^contact-(.+)$/, (_, id) => ['contacts', id]],
    [/^categories-(.+)$/, (_, rest) => ['categories', rest]],
    [/^categories$/, () => ['categories']],
];

export const parseQueryKey = (key: string): string[] => {
    for (const [pattern, builder] of KEY_PREFIXES) {
        const match = key.match(pattern);
        if (match) return builder(...match);
    }
    return [key]; // fallback: wrap as single-element array
};

export const fetchWithDeduplication = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    timeout: number = 25000,
    storage: CacheStorageType = 'local'
): Promise<T> => {
    const queryKey = parseQueryKey(key);
    return queryClient.fetchQuery({
        queryKey,
        queryFn: fetcher,
        staleTime: timeout > 1 ? timeout : 1000 * 30,
    });
};

export const serverUrl = import.meta.env.VITE_SERVER_IMAGE_API_URL || window.location.origin;

/** Join `serverUrl` with a path, or pass through absolute `http(s)://` URLs unchanged. */
export function resolveApiUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
    const base = String(serverUrl).replace(/\/$/, '');
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${base}${path}`;
}

export const getAuthToken = async (): Promise<string | undefined> => {
    const user = await userManager.getUser();
    return user?.access_token ?? undefined;
};

/** Helper function to get authorization headers */
export const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

async function apiResponseJson<T>(response: Response, endpoint: string): Promise<T> {
    if (!response.ok) {
        let msg = response.statusText;
        const ct = response.headers.get('content-type');
        if (ct?.includes('application/json')) {
            try {
                const body = await response.json();
                if (body && typeof body.error === 'string') msg = body.error;
            } catch {
                /* ignore */
            }
        }
        throw new Error(`API Error on ${endpoint}: ${msg}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
        throw new Error(
            `API Error on ${endpoint}: HTTP ${response.status} returned text/html instead of JSON — SPA fallback or API upstream unavailable`,
        );
    }
    if (contentType?.includes('application/json')) {
        return response.json();
    }
    return response.text() as unknown as T;
}

/** True when the edge/proxy likely returned the SPA shell or a transient upstream error instead of the API. */
function isTransientApiFailure(response: Response): boolean {
    if ([502, 503, 504].includes(response.status)) return true;
    if (!response.ok) return false;
    const ct = response.headers.get('content-type') || '';
    return ct.includes('text/html');
}

const API_CLIENT_MAX_RETRIES = 2;
const API_CLIENT_RETRY_BASE_MS = 350;

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function isLikelyNetworkError(err: Error): boolean {
    const m = err.message;
    return m.includes('fetch') || m.includes('network') || m.includes('Failed to fetch');
}

/**
 * Retries when the edge returns the SPA index.html (200 + text/html), 502/503/504,
 * or a thrown fetch — common during Node restarts or mis-timed proxy static fallback.
 */
async function fetchWithApiRetries(url: string, init: RequestInit, labelForLog: string): Promise<Response> {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= API_CLIENT_MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, init);
            if (isTransientApiFailure(response) && attempt < API_CLIENT_MAX_RETRIES) {
                const ct = response.headers.get('content-type') || '';
                console.warn(
                    `[apiClient] transient (${response.status}${ct ? ` ${ct.split(';')[0]}` : ''}) on ${labelForLog} — retry ${attempt + 1}/${API_CLIENT_MAX_RETRIES}`,
                );
                await sleep(API_CLIENT_RETRY_BASE_MS * (attempt + 1));
                continue;
            }
            return response;
        } catch (e) {
            lastErr = e instanceof Error ? e : new Error(String(e));
            if (isLikelyNetworkError(lastErr) && attempt < API_CLIENT_MAX_RETRIES) {
                console.warn(`[apiClient] network error on ${labelForLog} — retry ${attempt + 1}/${API_CLIENT_MAX_RETRIES}`);
                await sleep(API_CLIENT_RETRY_BASE_MS * (attempt + 1));
                continue;
            }
            throw lastErr;
        }
    }
    throw lastErr ?? new Error(`fetch failed after retries: ${labelForLog}`);
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await getAuthHeaders();
    const url = resolveApiUrl(endpoint);
    const response = await fetchWithApiRetries(url, {
        ...options,
        headers: { ...headers, ...options.headers },
    }, endpoint);
    return apiResponseJson<T>(response, endpoint);
}

export async function apiClientOr404<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const headers = await getAuthHeaders();
    const url = resolveApiUrl(endpoint);
    const response = await fetchWithApiRetries(url, {
        ...options,
        headers: { ...headers, ...options.headers },
    }, endpoint);
    if (response.status === 404) return null;
    return apiResponseJson<T>(response, endpoint);
}


export const invalidateCache = (key: string) => {
    const queryKey = parseQueryKey(key);
    queryClient.invalidateQueries({ queryKey });
};

export const invalidateServerCache = async (types: string[]) => {
    // Explicit cache invalidation is handled by the server on mutation
    // No need to call /api/cache/invalidate manually
    console.debug('invalidateServerCache: Skipped manual invalidation for', types);
};



export const checkLikeStatus = async (userId: string, pictureId: string) => {
    return fetchWithDeduplication(`like-${userId}-${pictureId}`, async () => {
        try {
            const data = await apiClient<{ liked: boolean }>(`/api/pictures/${pictureId}/like-status?userId=${userId}`);
            return data.liked;
        } catch {
            return false;
        }
    });
};
