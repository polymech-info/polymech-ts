import { UserProfile } from "@/modules/posts/views/types";
import { fetchWithDeduplication, apiClient, getAuthToken as getZitadelToken, serverUrl as serverBaseUrl } from "@/lib/db";

const serverUrl = (path: string) => {
    const baseUrl = serverBaseUrl || window.location.origin;
    return `${baseUrl}${path}`;
};

/** Fetch full profile data from server API endpoint */
export const fetchProfileAPI = async (userId: string): Promise<{ profile: any; recentPosts: any[] } | null> => {
    const res = await fetch(serverUrl(`/api/profile/${userId}`));
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch profile: ${res.statusText}`);
    }
    return await res.json();
};

export const fetchAuthorProfile = async (userId: string): Promise<UserProfile | null> => {
    return fetchWithDeduplication(`profile-${userId}`, async () => {
        const result = await fetchProfileAPI(userId);
        return (result?.profile as UserProfile) ?? null;
    });
};

export const getUserSettings = async (userId: string) => {
    return fetchWithDeduplication(`settings-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/settings'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
        return await res.json();
    }, 100000);
};

export const updateUserSettings = async (userId: string, settings: any) => {
    const token = await getAuthToken();
    const res = await fetch(serverUrl('/api/me/settings'), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(`Failed to update settings: ${res.statusText}`);
};

export const getUserOpenAIKey = async (userId: string) => {
    return fetchWithDeduplication(`openai-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch secrets: ${res.statusText}`);
        const data = await res.json();
        // Server returns masked keys — for checking existence, use has_key
        // For actual key value, the server-side code reads it directly
        return data.api_keys?.openai_api_key?.has_key ? '(set)' : null;
    });
}

/** Get all API keys (masked) from server proxy */
export const getUserApiKeys = async (userId: string): Promise<Record<string, { masked: string | null; has_key: boolean }> | null> => {
    return fetchWithDeduplication(`api-keys-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch secrets: ${res.statusText}`);
        const data = await res.json();
        return data.api_keys || null;
    });
};

export const getUserGoogleApiKey = async (userId: string) => {
    return fetchWithDeduplication(`google-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch secrets: ${res.statusText}`);
        const data = await res.json();
        const ret = data.api_keys?.google_api_key || null;
        return ret;
    });
}

export const getUserSecrets = async (userId: string) => {
    return fetchWithDeduplication(`user-secrets-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to fetch secrets: ${res.statusText}`);
        const data = await res.json();
        return data.variables || {};
    });
};

export const fetchUserRoles = async (userId: string) => {
    return fetchWithDeduplication(`roles-${userId}`, async () => {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/roles'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            console.error('Error fetching user roles:', res.statusText);
            return [];
        }
        return await res.json();
    });
};

/**
 * Fetch the resolved app identity in one call:
 * - `id`    — app UUID (profiles.user_id) — use this everywhere in the app
 * - `sub`   — original Zitadel numeric sub from the OIDC token
 * - `roles` — the user's roles array
 *
 * No cache key here since it's called once per auth session and
 * the result drives the AuthContext state.
 */
export const fetchUserIdentity = async (): Promise<{ id: string; sub: string; roles: string[] }> => {
    return apiClient<{ id: string; sub: string; roles: string[] }>('/api/me/identity');
};

/**
 * Update user secrets via server proxy (API keys are merged, other fields replaced).
 */
export const updateUserSecrets = async (userId: string, secrets: Record<string, string>): Promise<void> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ api_keys: secrets })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Failed to update secrets: ${res.statusText}`);
        }
    } catch (error) {
        console.error('Error updating user secrets:', error);
        throw error;
    }
};

/**
 * Get user variables via server proxy
 */
export const getUserVariables = async (userId: string): Promise<Record<string, any> | null> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.variables || {};
    } catch (error) {
        console.error('Error fetching user variables:', error);
        return null;
    }
};

/**
 * Update user variables via server proxy
 */
export const updateUserVariables = async (userId: string, variables: Record<string, any>): Promise<void> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ variables })
        });
        if (!res.ok) throw new Error(`Failed to update variables: ${res.statusText}`);
    } catch (error) {
        console.error('Error updating user variables:', error);
        throw error;
    }
};

// =============================================
// Shipping Addresses (stored in user_secrets.settings.shipping_addresses)
// =============================================

export interface SavedShippingAddress {
    id: string;
    label: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    note: string;
    isDefault: boolean;
}

/** Get shipping addresses via server proxy */
export const getShippingAddresses = async (userId: string): Promise<SavedShippingAddress[]> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.shipping_addresses as SavedShippingAddress[]) || [];
    } catch (error) {
        console.error('Error fetching shipping addresses:', error);
        return [];
    }
};

/** Save shipping addresses via server proxy (full replace) */
export const saveShippingAddresses = async (userId: string, addresses: SavedShippingAddress[]): Promise<void> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ shipping_addresses: addresses })
        });
        if (!res.ok) throw new Error(`Failed to save shipping addresses: ${res.statusText}`);
    } catch (error) {
        console.error('Error saving shipping addresses:', error);
        throw error;
    }
};

// =============================================
// Vendor Profiles (stored in user_secrets.settings.vendor_profiles)
// =============================================

export interface VendorProfile {
    id: string;
    label: string;
    companyName: string;
    email: string;
    phone: string;
    vatId: string;
    eoriNumber: string;
    logoUrl: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    defaultCurrency: string;
    defaultCountryOfOrigin: string;
    note: string;
    isDefault: boolean;
}

/** Get vendor profiles via server proxy */
export const getVendorProfiles = async (userId: string): Promise<VendorProfile[]> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.vendor_profiles as VendorProfile[]) || [];
    } catch (error) {
        console.error('Error fetching vendor profiles:', error);
        return [];
    }
};

/** Save vendor profiles via server proxy (full replace) */
export const saveVendorProfiles = async (userId: string, profiles: VendorProfile[]): Promise<void> => {
    try {
        const token = await getAuthToken();
        const res = await fetch(serverUrl('/api/me/secrets'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ vendor_profiles: profiles })
        });
        if (!res.ok) throw new Error(`Failed to save vendor profiles: ${res.statusText}`);
    } catch (error) {
        console.error('Error saving vendor profiles:', error);
        throw error;
    }
};

/** Update the current user's profile via API */
export const updateProfileAPI = async (profileData: {
    username?: string | null;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    settings?: any;
}): Promise<any> => {
    const token = await getZitadelToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(serverUrl('/api/profile'), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error(`Failed to update profile: ${res.statusText}`);
    return await res.json();
};

/** Update the current user's email via server API */
export const updateUserEmail = async (newEmail: string): Promise<void> => {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    await apiClient('/api/me/email', {
        method: 'PATCH',
        body: JSON.stringify({ email: newEmail }),
    });
};

const getAuthToken = async (): Promise<string> => {
    const token = await getZitadelToken();
    if (!token) throw new Error('Not authenticated');
    return token;
};

/** Batch-fetch profiles for admin UIs (e.g. ACL subject column). GET /api/profiles?ids= */
export const fetchProfilesByUserIds = async (
    userIds: string[],
): Promise<Record<string, { display_name?: string; username?: string }>> => {
    if (userIds.length === 0) return {};
    const token = await getAuthToken();
    const params = new URLSearchParams();
    params.set('ids', userIds.join(','));
    const res = await fetch(serverUrl(`/api/profiles?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch profiles');
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return {};
    const map: Record<string, { display_name?: string; username?: string }> = {};
    for (const p of data as { user_id: string }[]) {
        if (p?.user_id) map[p.user_id] = p as { display_name?: string; username?: string };
    }
    return map;
};

export {
    fetchAdminUsersAPI,
    createAdminUserAPI,
    updateAdminUserAPI,
    deleteAdminUserAPI,
} from '@/modules/admin/client-admin';

/** Notify the server to flush its auth cache for the current user (best-effort, never throws) */
export const notifyServerLogout = (token: string): void => {
    fetch(serverUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => { /* best-effort — don't block logout */ });
};
