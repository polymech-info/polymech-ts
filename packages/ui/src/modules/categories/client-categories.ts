import { fetchWithDeduplication, getAuthToken } from "@/lib/db";
import { getCurrentLang } from '@/i18n';

// --- Category Management ---
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    owner_id?: string;
    visibility: 'public' | 'unlisted' | 'private';
    parent_category_id?: string;
    created_at?: string;
    meta?: {
        type?: string;
        assignedTypes?: string[]; // Array of Type IDs
        [key: string]: any;
    };
    children?: { child: Category }[];
}

export const fetchCategories = async (options?: { parentSlug?: string; includeChildren?: boolean; sourceLang?: string }): Promise<Category[]> => {
    // Build a deterministic cache key from the options
    const parts = ['categories'];
    if (options?.parentSlug) parts.push(`parent-${options.parentSlug}`);
    if (options?.includeChildren) parts.push('children');
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const lang = urlLang || getCurrentLang();
    const srcLang = options?.sourceLang || 'en';
    if (lang && lang !== srcLang) parts.push(`lang-${lang}`);
    const cacheKey = parts.join('-');

    return fetchWithDeduplication(cacheKey, async () => {
        const token = await getAuthToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        if (options?.parentSlug) params.append('parentSlug', options.parentSlug);
        if (options?.includeChildren) params.append('includeChildren', String(options.includeChildren));
        if (lang && lang !== srcLang) params.append('lang', lang);

        const res = await fetch(`/api/categories?${params.toString()}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
        return await res.json();
    }, 60000);
};

export const createCategory = async (category: Partial<Category> & { parentId?: string; relationType?: string }) => {

    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error(`Failed to create category: ${res.statusText}`);
    return await res.json();
};

export const updateCategory = async (id: string, updates: Partial<Category>) => {
    const token = await getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Failed to update category: ${res.statusText}`);
    return await res.json();
};

export const deleteCategory = async (id: string) => {
    const token = await getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error(`Failed to delete category: ${res.statusText}`);
    return await res.json();
};
