/**
 * Client-side ACL API wrappers (mirrors server acl endpoints).
 * Uses apiClient from @/lib/db (serverUrl + auth + JSON errors).
 */
import { apiClient, apiClientOr404, fetchWithDeduplication, invalidateCache } from "@/lib/db";
import { queryClient } from "@/lib/queryClient";

// =============================================
// Sentinel userId values
// Mirrors the virtual identity strings used by the server's DbAclBackend
// (server/src/acl/db-acl-db.ts). These are stored as group_name in the DB.
// =============================================

// =============================================
// Types (server AclEntry / AclSettings)
// =============================================

export interface AclEntry {
    userId?: string;
    group?: string;
    path?: string;
    permissions: string[];
}

export interface AclSettings {
    owner: string;
    groups?: { name: string; members: string[] }[];
    acl: AclEntry[];
}

export interface GlobalAclGroup {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    native_type?: string;
    settings?: any;
    created_at: string;
    modified_at: string;
    created_by: string;
}

export interface GroupMember {
    user_id: string;
    created_at: string;
    created_by: string;
    profiles?: {
        id: string;
        display_name?: string;
        username?: string;
        avatar_url?: string;
    };
}

// =============================================
// Helpers
// =============================================

const aclCacheKey = (resourceType: string, resourceId: string) =>
    `acl-${resourceType}-${resourceId}`;

const aclPath = (resourceType: string, resourceId: string) =>
    `/api/acl/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`;

// =============================================
// Read
// =============================================

/** GET /api/acl/:resourceType/:resourceId — cached via React Query */
export const fetchAclSettings = async (
    resourceType: string,
    resourceId: string,
): Promise<AclSettings> => {
    return fetchWithDeduplication(
        aclCacheKey(resourceType, resourceId),
        async () => {
            const data = await apiClientOr404<AclSettings>(aclPath(resourceType, resourceId));
            return data ?? { owner: "", groups: [], acl: [] };
        },
        30000,
    );
};

export const fetchAclEntries = async (
    resourceType: string,
    resourceId: string,
): Promise<AclEntry[]> => {
    const settings = await fetchAclSettings(resourceType, resourceId);
    return settings.acl;
};

export const fetchKnownAclResources = async (): Promise<{ resourceType: string, resourceId: string, ownerId: string | null }[]> => {
    return apiClient<{ resourceType: string, resourceId: string, ownerId: string | null }[]>('/api/admin/acl/resources');
};

// =============================================
// Write
// =============================================

/** POST /api/acl/:resourceType/:resourceId/grant */
export const grantAclPermission = async (
    resourceType: string,
    resourceId: string,
    grant: { userId?: string; group?: string; path?: string; permissions: string[] },
): Promise<{ success: boolean; settings: AclSettings }> => {
    const out = await apiClient<{ success: boolean; settings: AclSettings }>(
        `${aclPath(resourceType, resourceId)}/grant`,
        { method: "POST", body: JSON.stringify(grant) },
    );
    invalidateCache(aclCacheKey(resourceType, resourceId));
    return out;
};

/** POST /api/acl/:resourceType/:resourceId/revoke */
export const revokeAclPermission = async (
    resourceType: string,
    resourceId: string,
    target: { userId?: string; group?: string; path?: string },
): Promise<{ success: boolean; settings: AclSettings }> => {
    const out = await apiClient<{ success: boolean; settings: AclSettings }>(
        `${aclPath(resourceType, resourceId)}/revoke`,
        { method: "POST", body: JSON.stringify(target) },
    );
    invalidateCache(aclCacheKey(resourceType, resourceId));
    return out;
};

/** POST /api/acl/:resourceType/:resourceId/groups */
export const putAclGroup = async (
    resourceType: string,
    resourceId: string,
    group: { name: string; members: string[] },
): Promise<{ success: boolean; settings: AclSettings }> => {
    const out = await apiClient<{ success: boolean; settings: AclSettings }>(
        `${aclPath(resourceType, resourceId)}/groups`,
        { method: "POST", body: JSON.stringify(group) },
    );
    invalidateCache(aclCacheKey(resourceType, resourceId));
    return out;
};

/** POST /api/acl/:resourceType/:resourceId/evaluate */
export const evaluateAcl = async (
    resourceType: string,
    resourceId: string,
    userId: string,
    path: string,
): Promise<{ permissions: string[] }> => {
    return apiClient<{ permissions: string[] }>(`${aclPath(resourceType, resourceId)}/evaluate`, {
        method: "POST",
        body: JSON.stringify({ userId, path }),
    });
};

// =============================================
// Global groups (admin)
// =============================================

export const fetchGlobalGroups = async (nativeType?: string): Promise<GlobalAclGroup[]> => {
    const params = new URLSearchParams();
    if (nativeType) params.set("nativeType", nativeType);
    const qs = params.toString();
    return apiClient<GlobalAclGroup[]>(`/api/admin/acl/groups${qs ? `?${qs}` : ""}`);
};

export const putGlobalGroup = async (group: Partial<GlobalAclGroup>): Promise<GlobalAclGroup> => {
    const out = await apiClient<GlobalAclGroup>("/api/admin/acl/groups", {
        method: "POST",
        body: JSON.stringify(group),
    });
    queryClient.invalidateQueries({ queryKey: ["global-acl-groups"] });
    return out;
};

export const deleteGlobalGroup = async (id: string): Promise<{ success: boolean }> => {
    const out = await apiClient<{ success: boolean }>(`/api/admin/acl/groups/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    queryClient.invalidateQueries({ queryKey: ["global-acl-groups"] });
    return out;
};

export const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    return apiClient<GroupMember[]>(`/api/admin/acl/groups/${encodeURIComponent(groupId)}/members`);
};

export const addGroupMember = async (groupId: string, userId: string): Promise<GroupMember> => {
    const out = await apiClient<GroupMember>(
        `/api/admin/acl/groups/${encodeURIComponent(groupId)}/members`,
        { method: "POST", body: JSON.stringify({ userId }) },
    );
    queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    return out;
};

export const removeGroupMember = async (
    groupId: string,
    userId: string,
): Promise<{ success: boolean }> => {
    const out = await apiClient<{ success: boolean }>(
        `/api/admin/acl/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
    );
    queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    return out;
};

export const fetchUserGroups = async (userId: string): Promise<GlobalAclGroup[]> => {
    return apiClient<GlobalAclGroup[]>(`/api/admin/users/${encodeURIComponent(userId)}/groups`);
};

export const fetchUserEffectiveGroups = async (userId: string): Promise<GlobalAclGroup[]> => {
    return apiClient<GlobalAclGroup[]>(
        `/api/admin/users/${encodeURIComponent(userId)}/groups/effective`,
    );
};
