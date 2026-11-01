import { apiClient, fetchWithDeduplication } from "@/lib/db";

export const createLayout = async (layoutData: any) => {
    return apiClient(`/api/layouts`, { method: 'POST', body: JSON.stringify(layoutData) });
};

export const getLayout = async (layoutId: string) => {
    return fetchWithDeduplication(`layout-${layoutId}`, () =>
        apiClient(`/api/layouts/${layoutId}`)
    );
};

export const getLayouts = async (filters?: { type?: string, visibility?: string, limit?: number, offset?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const qs = params.toString();
    return fetchWithDeduplication(`layouts-${qs}`, () =>
        apiClient(`/api/layouts${qs ? `?${qs}` : ''}`)
    );
};

export const updateLayoutMeta = async (layoutId: string, metaUpdates: any) => {
    const layout: any = await apiClient(`/api/layouts/${layoutId}`);
    const newMeta = { ...(layout?.meta ?? {}), ...metaUpdates };
    return apiClient(`/api/layouts/${layoutId}`, { method: 'PATCH', body: JSON.stringify({ meta: newMeta }) });
};

export const updateLayout = async (layoutId: string, layoutData: any) => {
    return apiClient(`/api/layouts/${layoutId}`, { method: 'PATCH', body: JSON.stringify(layoutData) });
};

export const deleteLayout = async (layoutId: string) => {
    await apiClient(`/api/layouts/${layoutId}`, { method: 'DELETE' });
    return true;
};
