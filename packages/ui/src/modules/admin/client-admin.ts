/**
 * Authenticated admin API helpers (Bearer via `@/lib/db` `apiClient`).
 * Server routes are registered as admin-only (`AdminEndpointRegistry` + `adminMiddleware`).
 */

import { apiClient, getAuthToken, serverUrl } from '@/lib/db';

// --- Server / cache ---

export async function postFlushCache(body?: { mirror?: boolean }): Promise<{ success: boolean; message: string }> {
    // `apiClient` sets `Content-Type: application/json`; an empty body is invalid JSON and OpenAPI validation returns 400.
    return apiClient<{ success: boolean; message: string }>('/api/flush-cache', {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
    });
}

export async function postAdminSystemRestart(): Promise<{ message: string; pid: number }> {
    return apiClient<{ message: string; pid: number }>('/api/admin/system/restart', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

export async function getAdminSystem(): Promise<unknown> {
    return apiClient('/api/admin/system');
}

// --- Bans ---

export type AdminBanList = {
    bannedIPs: string[];
    bannedUserIds: string[];
    bannedTokens: string[];
};

export async function getAdminBanList(): Promise<AdminBanList> {
    return apiClient<AdminBanList>('/api/admin/bans');
}

export async function postAdminBanIps(ips: string[]): Promise<{ banned: number; skipped: number; message: string }> {
    return apiClient<{ banned: number; skipped: number; message: string }>('/api/admin/bans/ban-ip', {
        method: 'POST',
        body: JSON.stringify({ ips }),
    });
}

export async function postAdminUnbanIp(ip: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>('/api/admin/bans/unban-ip', {
        method: 'POST',
        body: JSON.stringify({ ip }),
    });
}

export async function postAdminUnbanUser(userId: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>('/api/admin/bans/unban-user', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
}

export type AdminViolationStats = {
    totalViolations: number;
    violations: Array<{
        key: string;
        count: number;
        firstViolation: number;
        lastViolation: number;
    }>;
};

export async function getAdminViolationStats(): Promise<AdminViolationStats> {
    return apiClient<AdminViolationStats>('/api/admin/bans/violations');
}

// --- User management (admin) — `/api/admin/users` ---

export const fetchAdminUsersAPI = async (): Promise<unknown[]> => {
    return apiClient<unknown[]>('/api/admin/users');
};

export const createAdminUserAPI = async (
    email: string,
    password: string,
    copySettings: boolean,
): Promise<unknown> => {
    return apiClient('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, copySettings }),
    });
};

export const updateAdminUserAPI = async (
    userId: string,
    profile: {
        username?: string | null;
        display_name?: string | null;
        bio?: string | null;
    },
): Promise<unknown> => {
    return apiClient(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify(profile),
    });
};

export const deleteAdminUserAPI = async (userId: string): Promise<void> => {
    await apiClient(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
    });
};

// --- Logs ---

export type AdminLogFile = { name: string; sizeBytes: number; mtimeMs: number };

// --- Zitadel ---

export type ZitadelStatus = {
    env: {
        issuer: string | null;
        jwksUrl: string | null;
        audience: string[];
        hasServerAccessToken: boolean;
        serverAccessTokenIsJwt: boolean;
        hasServiceKeyJson: boolean;
        hasServiceClientId: boolean;
    };
    jwksReachable: boolean;
    dbOk: boolean;
    authCacheSize: number;
    serviceToken: { cached: boolean; sub?: string; exp?: number };
};

export async function getZitadelStatus(): Promise<ZitadelStatus> {
    return apiClient<ZitadelStatus>('/api/admin/zitadel/status');
}

export async function postZitadelRefreshServiceToken(): Promise<{ ok: boolean; claims: Record<string, unknown>; error?: string }> {
    return apiClient('/api/admin/zitadel/service-token/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

export async function postZitadelFlushAuthCache(userId?: string): Promise<{ ok: boolean; sizeBefore: number }> {
    return apiClient('/api/admin/zitadel/auth-cache/flush', {
        method: 'POST',
        body: JSON.stringify(userId ? { userId } : {}),
    });
}

// --- Logs ---

export async function getAdminLogFiles(): Promise<{ files: AdminLogFile[] }> {
    return apiClient<{ files: AdminLogFile[] }>('/api/admin/logs');
}

export async function getAdminLog(
    file: string,
    params?: { limit?: number; offset?: number; level?: string; startDate?: string; endDate?: string },
): Promise<{ file: string; total: number; limit: number; offset: number; entries: unknown[] }> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.level) q.set('level', params.level);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiClient<{ file: string; total: number; limit: number; offset: number; entries: unknown[] }>(
        `/api/admin/logs/${encodeURIComponent(file)}${qs}`,
    );
}

export async function clearAdminLog(file: string): Promise<{ success: boolean; file: string }> {
    return apiClient<{ success: boolean; file: string }>(
        `/api/admin/logs/${encodeURIComponent(file)}`,
        { method: 'DELETE' },
    );
}

/** Fetch-based SSE tail — supports Bearer auth. `signal` controls teardown. */
export async function streamAdminLog(
    file: string,
    onEntry: (entry: unknown) => void,
    signal: AbortSignal,
): Promise<void> {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = `${serverUrl}/api/admin/logs/${encodeURIComponent(file)}/stream`;

    const response = await fetch(url, { headers, signal });
    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try { onEntry(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
            }
        }
    }
}
