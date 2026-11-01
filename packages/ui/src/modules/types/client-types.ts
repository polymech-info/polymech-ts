import { fetchWithDeduplication, invalidateCache, getAuthToken } from "@/lib/db";

export interface TypeDefinition {
    id: string;
    name: string;
    kind: 'primitive' | 'enum' | 'flags' | 'structure' | 'alias' | 'field';
    parent_type_id: string | null;
    description: string | null;
    json_schema: any;
    owner_id: string | null;
    visibility: 'public' | 'private' | 'custom';
    meta: any;
    settings: any;
    created_at?: string;
    updated_at?: string;

    // Children usually joined
    enum_values?: any[];
    flag_values?: any[];
    structure_fields?: {
        id?: string;
        structure_type_id?: string;
        field_name: string;
        field_type_id: string;
        required: boolean;
        default_value?: any;
        order: number;
    }[];
}

export const fetchTypes = async (options?: {
    kind?: TypeDefinition['kind'] | string;
    parentTypeId?: string;
    visibility?: string;
}) => {
    // Cache key based on options
    const key = `types-${JSON.stringify(options || {})}`;

    return fetchWithDeduplication(key, async () => {
        const params = new URLSearchParams();
        if (options?.kind) params.append('kind', options.kind);
        if (options?.parentTypeId) params.append('parentTypeId', options.parentTypeId);
        if (options?.visibility) params.append('visibility', options.visibility);

        const token = await getAuthToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/types?${params.toString()}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch types: ${res.statusText}`);

        const data = await res.json();
        return data as TypeDefinition[];
    }, 1); // 5 min cache (client side)
};

export const fetchTypeById = async (id: string) => {
    const key = `type-${id}`;
    return fetchWithDeduplication(key, async () => {
        const token = await getAuthToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/types/${id}`, { headers });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Failed to fetch type ${id}: ${res.statusText}`);
        }

        const data = await res.json();
        return data as TypeDefinition;
    });
};

export const createType = async (typeData: any) => {
    // Create usually requires API if we have complex logic globally, 
    // BUT checking server code `createTypeServer` it does multiple inserts.
    // Client side transaction is not easy.
    // Let's use the API endpoint: POST /api/types

    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/types', {
        method: 'POST',
        headers,
        body: JSON.stringify(typeData)
    });

    if (!res.ok) {
        throw new Error(`Failed to create type: ${res.statusText}`);
    }

    const newType = await res.json();

    // Invalidate list cache
    invalidateCache(`types-{}`); // Invalidate default list
    return newType;
};

export const updateType = async (id: string, updates: any) => {
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/types/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
    });

    if (!res.ok) {
        throw new Error(`Failed to update type: ${res.statusText}`);
    }

    const updated = await res.json();

    // Invalidate specific type cache
    invalidateCache(`type-${id}`);

    return updated;
};

export const deleteType = async (id: string) => {
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/types/${id}`, {
        method: 'DELETE',
        headers
    });

    if (!res.ok) {
        throw new Error(`Failed to delete type: ${res.statusText}`);
    }

    invalidateCache(`type-${id}`);
    return true;
};
