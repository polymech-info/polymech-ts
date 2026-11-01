
import { getLayouts, getLayout, createLayout, updateLayout, deleteLayout } from './client-layouts';
type Layout = any; // TODO: replace with actual type
type LayoutInsert = any; // TODO: replace with actual type
type LayoutUpdate = any; // TODO: replace with actual type
type LayoutVisibility = any; // TODO: replace with actual type

export interface UseLayoutsReturn {
    getLayouts: (filters?: {
        visibility?: LayoutVisibility;
        type?: string;
        limit?: number;
        offset?: number;
    }) => Promise<{ data: Layout[] | null; error: any }>;
    getLayout: (id: string) => Promise<{ data: Layout | null; error: any }>;
    createLayout: (layout: Omit<LayoutInsert, 'owner_id'>) => Promise<{ data: Layout | null; error: any }>;
    updateLayout: (id: string, updates: LayoutUpdate) => Promise<{ data: Layout | null; error: any }>;
    deleteLayout: (id: string) => Promise<{ error: any }>;
}

const safe = async <T>(fn: () => Promise<T>) => {
    try {
        const res: any = await fn();
        return res?.data ? res : { data: res, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const useLayouts = (): UseLayoutsReturn => ({
    getLayouts: (filters) => safe(() => getLayouts(filters as any)),
    getLayout: (id) => safe(() => getLayout(id)),
    createLayout: (layout) => safe(() => createLayout(layout)),
    updateLayout: (id, updates) => safe(() => updateLayout(id, updates)),
    deleteLayout: async (id) => {
        try { await deleteLayout(id); return { error: null }; }
        catch (error) { return { error }; }
    }
});
