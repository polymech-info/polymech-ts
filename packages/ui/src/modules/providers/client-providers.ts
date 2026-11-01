/**
 * Client API for `public.provider_configs` (auth-scoped on the server).
 * Mirrors the pattern in `@/modules/user/client-user` + `@/lib/db`.
 */

import { fetchWithDeduplication, apiClient, getAuthToken as getZitadelToken, serverUrl as serverBaseUrl } from '@/lib/db';

const serverUrl = (path: string) => {
    const baseUrl = serverBaseUrl || window.location.origin;
    return `${baseUrl}${path}`;
};

const getAuthToken = async (): Promise<string> => {
    const token = await getZitadelToken();
    if (!token) throw new Error('Not authenticated');
    return token;
};

/** Row shape returned by GET/PATCH/POST `/api/provider-configs` */
export type ProviderConfigRow = {
    id: string;
    user_id?: string | null;
    name: string;
    display_name: string;
    base_url?: string | null;
    models?: unknown;
    rate_limits?: Record<string, unknown> | null;
    is_active?: boolean | null;
    settings?: Record<string, unknown> | null;
    created_at?: string | null;
    updated_at?: string | null;
};

const listCacheKey = (userId: string, opts?: { is_active?: boolean; name?: string }) =>
    `provider-configs-${userId}-${JSON.stringify({ a: opts?.is_active ?? null, n: opts?.name ?? null })}`;

/**
 * List provider_configs for the authenticated user. The server resolves the user from the Bearer token;
 * `userId` is only used for React Query / deduplication keys.
 */
export const fetchProviderConfigs = async (
    userId: string,
    opts?: { is_active?: boolean; name?: string },
): Promise<ProviderConfigRow[]> => {
    return fetchWithDeduplication(listCacheKey(userId, opts), async () => {
        const params = new URLSearchParams();
        if (opts?.is_active !== undefined) params.set('is_active', String(opts.is_active));
        if (opts?.name) params.set('name', opts.name);
        const qs = params.toString();
        return apiClient<ProviderConfigRow[]>(`/api/provider-configs${qs ? `?${qs}` : ''}`);
    });
};

export const createProviderConfig = async (
    _userId: string,
    body: Omit<ProviderConfigRow, 'id' | 'created_at' | 'updated_at'> & { user_id?: string },
): Promise<ProviderConfigRow> => {
    return apiClient<ProviderConfigRow>('/api/provider-configs', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

export const updateProviderConfig = async (
    _userId: string,
    id: string,
    body: Partial<Omit<ProviderConfigRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ProviderConfigRow> => {
    return apiClient<ProviderConfigRow>(`/api/provider-configs/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
};

export const deleteProviderConfig = async (_userId: string, id: string): Promise<void> => {
    await apiClient(`/api/provider-configs/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

/**
 * GET /api/me/provider-config/:provider — returns `{ settings }` for that named provider (or 404).
 */
export const getProviderConfig = async (userId: string, provider: string) => {
    return fetchWithDeduplication(`provider-${userId}-${provider}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl(`/api/me/provider-config/${encodeURIComponent(provider)}`), {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to fetch provider config: ${res.statusText}`);
        return await res.json();
    });
};
