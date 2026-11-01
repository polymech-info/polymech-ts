import { fetchWithDeduplication, apiClient } from "@/lib/db";

// --- Types ---
export interface ProductSettings {
    enabled?: boolean;
    default_cost_units?: number;
    default_rate_limit?: number;
    default_rate_window?: number;
    /** Type system ids (structure/alias) enabled for this product — configured in admin Product Settings */
    assignedTypeIds?: string[];
    /** Per-type form payloads keyed by type id (from RJSF in product edit) */
    productTypeData?: Record<string, Record<string, unknown>>;
    [key: string]: any;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    settings: ProductSettings;
    created_at: string;
    updated_at: string;
}

export interface ProductCreatePayload {
    name: string;
    slug?: string;
    description?: string;
    settings?: ProductSettings;
}

export interface ProductUpdatePayload {
    name?: string;
    description?: string;
    settings?: Partial<ProductSettings>;
}

// --- API Methods ---

/**
 * Fetch all products (Admin only)
 */
export const fetchProducts = async (): Promise<Product[]> => {
    const res = await apiClient<Product[]>('/api/admin/products');
    return res || [];
};

/**
 * Create a new product (Admin only)
 */
export const createProduct = async (payload: ProductCreatePayload): Promise<Product> => {
    return apiClient<Product>('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

/**
 * Update an existing product (Admin only)
 */
export const updateProduct = async (slug: string, payload: ProductUpdatePayload): Promise<Product> => {
    return apiClient<Product>(`/api/admin/products/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

/**
 * Delete a product (Admin only)
 */
export const deleteProduct = async (slug: string): Promise<boolean> => {
    try {
        await apiClient<any>(`/api/admin/products/${encodeURIComponent(slug)}`, {
            method: 'DELETE'
        });
        return true;
    } catch (e) {
        console.error(`Failed to delete product ${slug}:`, e);
        return false;
    }
};
