import { apiClient, fetchWithDeduplication } from '@/lib/db';
import { getCurrentLang } from '@/i18n';

export const fetchUserPage = async (userId: string, slug: string) => {
    const key = `user-page-${userId}-${slug}`;
    return fetchWithDeduplication(key, async () => {
        const lang = getCurrentLang();
        const langParam = lang && lang !== 'en' ? `?lang=${lang}` : '';
        const result = await apiClient(`/api/user-page/${userId}/${slug}${langParam}`);
        return result ?? null;
    }, 10);
};

export const fetchPageById = async (id: string) => {
    return fetchWithDeduplication(`page-${id}`, async () => {
        const result: any = await apiClient(`/api/user-page/${id}/${id}`);
        return result?.page || result;
    });
};

export const fetchUserPages = async (userId: string) => {
    const key = `user-pages-${userId}`;
    return fetchWithDeduplication(key, async () => {
        return apiClient(`/api/pages?userId=${userId}`);
    });
};

export const fetchPageDetailsById = async (pageId: string) => {
    const key = `page-details-${pageId}`;
    return fetchWithDeduplication(key, async () => {
        const result = await apiClient(`/api/user-page/${pageId}/${pageId}`);
        return result ?? null;
    });
};

export const createPage = async (pageData: any): Promise<any> => {
    return apiClient('/api/pages', {
        method: 'POST',
        body: JSON.stringify(pageData),
    });
};

export const updatePage = async (pageId: string, updates: any): Promise<any> => {
    return apiClient(`/api/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deletePage = async (pageId: string): Promise<void> => {
    return apiClient(`/api/pages/${pageId}`, { method: 'DELETE' });
};

export const updatePageMeta = async (pageId: string, metaUpdates: any) => {
    const page = await fetchPageDetailsById(pageId);
    if (!page) throw new Error('Page not found');
    const newMeta = { ...(page as any).meta, ...metaUpdates };
    return updatePage(pageId, { meta: newMeta });
};

// --- Page Versions ---

export const fetchPageVersions = async (pageId: string) => {
    return apiClient(`/api/pages/${pageId}/versions`);
};

export const createPageVersion = async (pageId: string, label?: string) => {
    return apiClient(`/api/pages/${pageId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ label }),
    });
};

export const deletePageVersion = async (pageId: string, versionId: string) => {
    return apiClient(`/api/pages/${pageId}/versions/${versionId}`, { method: 'DELETE' });
};

export const restorePageVersion = async (pageId: string, versionId: string) => {
    return apiClient(`/api/pages/${pageId}/versions/${versionId}/restore`, { method: 'POST' });
};
