import { fetchWithDeduplication, apiClient, serverUrl } from "@/lib/db";

// --- Types ---
export interface GridSearchSummary {
    id: string;
    status: string;
    regionName: string;
    level: string;
    query: string;
    countries?: string[];
    hierarchy?: string[];
    results?: number;
    emails?: number;
    generatedAt: string;
    children?: GridSearchSummary[];
}

export interface RestoredRunState {
    run: {
        id: string;
        runId: string;
        status: string;
        request: any;
        result: any;
        createdAt: string;
        updatedAt: string;
        isOwner?: boolean;
        isPublic?: boolean;
    };
    areasSearched: number;
    totalPlaces: number;
    places: any[];
}

export interface GridSearchJobPayload {
    region: string;
    types: string[];
    level?: string;
    emails?: boolean;
    names?: string[];
    enrichers?: string[];
    enrichBudgetMs?: number;
    jobId?: string;
    excludeTypes?: string[];
    limitPerArea?: number;
    guided?: {
        areas: {
            gid: string;
            name: string;
            level: number;
            raw: any;
        }[];
        settings?: any;
    };
}

export interface GridSearchGeneratePayload {
    region: string;
    level: 'cities' | 'provinces' | 'states' | 'districts' | 'towns' | 'villages';
    name?: string;
}

export interface GridSearchPolygonPayload {
    regionGid?: string;
    level?: number;
    gids?: string[];
}

export interface GridSearchPreviewPayload {
    query: string;
    lat?: number;
    lng?: number;
}

// --- API Methods ---
export const fetchGridSearchPolygons = async (payload: GridSearchPolygonPayload): Promise<any> => {
    return apiClient<any>('/api/places/polygons', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const fetchCompetitorById = async (id: string): Promise<any> => {
    const res = await apiClient<{ data: any }>(`/api/places/${id}`);
    return res.data;
};

export const fetchPlacePhotos = async (placeId: string): Promise<any> => {
    const res = await apiClient<{ data: any }>(`/api/places/${placeId}/photos`);
    return res.data;
};

/** LLM-generated place summary from /api/places/:id/place-info */
export interface PlaceLlmSummary {
    summary?: string;
    services?: string[];
    industries?: string[];
    products?: { type?: string; priceRange?: string }[];
    priceRange?: string;
    companySizeEstimate?: string;
    isBranch?: boolean;
    isFamilyBusiness?: boolean | null;
    /** 1–5 when grid search run context was sent; null otherwise */
    potentialCustomer?: number | null;
    differentiators?: string;
}

export const fetchPlaceLlmSummary = async (
    placeId: string,
    opts?: { lang?: string; runId?: string | null; context?: string | null },
): Promise<PlaceLlmSummary> => {
    const params = new URLSearchParams();
    if (opts?.lang && opts.lang.length >= 2) {
        params.set('lang', opts.lang.slice(0, 2).toLowerCase());
    }
    if (opts?.runId) {
        params.set('runId', opts.runId);
    }
    if (opts?.context && opts.context.trim()) {
        params.set('context', opts.context.trim().slice(0, 8000));
    }
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<{ data: PlaceLlmSummary }>(`/api/places/${placeId}/place-info${q}`);
    return res.data;
};

// --- Places GridSearch API Methods (New C++ backend) ---

export const fetchPlacesGridSearches = async (): Promise<GridSearchSummary[]> => {
    const res = await apiClient<{ data: GridSearchSummary[] }>('/api/places/gridsearch');
    return res.data || [];
};

export const fetchPlacesGridSearchById = async (id: string): Promise<any> => {
    const cacheKey = `places-gridsearch-id-${id}`;
    return fetchWithDeduplication(cacheKey, async () => {
        const res = await apiClient<{ data: any }>(`/api/places/gridsearch/${id}`);
        return res.data;
    }, 60000 * 5);
};

export const fetchPlacesGridSearchRunState = async (id: string): Promise<RestoredRunState> => {
    const res = await apiClient<{ data: RestoredRunState }>(`/api/places/gridsearch/${id}/state`);
    return res.data;
};

export const updatePlacesGridSearchSettings = async (id: string, settings: { is_public?: boolean; shared_with?: string[] }): Promise<{ success: boolean; settings: any }> => {
    return apiClient<{ success: boolean; settings: any }>(`/api/places/gridsearch/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};

export const submitPlacesGridSearchJob = async (payload: GridSearchJobPayload): Promise<{ message: string; jobId: string }> => {
    return apiClient<{ message: string; jobId: string }>('/api/places/gridsearch', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

export const retryPlacesGridSearchJob = async (id: string): Promise<any> => {
    return apiClient<any>(`/api/places/gridsearch/${id}/retry`, {
        method: 'POST'
    });
};

export const postPlacesGridSearchControl = async (
    id: string,
    action: 'pause' | 'resume' | 'cancel',
): Promise<{ ok: boolean }> => {
    return apiClient<{ ok: boolean }>(`/api/places/gridsearch/${id}/control`, {
        method: 'POST',
        body: JSON.stringify({ action }),
    });
};

export const expandPlacesGridSearch = async (
    parentId: string,
    areas: { gid: string; name: string; level: number; raw?: any }[],
    settings?: Record<string, any>,
    viewportData?: { viewportSearch: boolean; viewportCenter: { lat: number; lng: number }; viewportZoom: number; types?: string[] }
): Promise<{ message: string; jobId: string }> => {
    return apiClient<{ message: string; jobId: string }>(`/api/places/gridsearch/${parentId}/expand`, {
        method: 'POST',
        body: JSON.stringify({ areas, settings, ...viewportData }),
    });
};

export const deletePlacesGridSearch = async (id: string): Promise<boolean> => {
    // Note: Assuming there is a similar endpoint for places deletion.
    const res = await apiClient<{ success: boolean; data: any }>(`/api/places/gridsearch/${id}`, {
        method: 'DELETE'
    });
    return res.success !== false;
};

export const mergePlacesGridSearches = async (targetId: string, sourceId: string): Promise<{ success: boolean; mergedCount: number }> => {
    return apiClient<{ success: boolean; mergedCount: number }>(`/api/places/gridsearch/${targetId}/merge`, {
        method: 'POST',
        body: JSON.stringify({ sourceId })
    });
};

export const getPlacesGridSearchStreamUrl = (jobId: string, token?: string): string => {
    const url = `${serverUrl}/api/places/gridsearch/${jobId}/stream`;
    return token ? `${url}?token=${token}` : url;
};

export const fetchPlacesGridSearchExport = async (jobId: string, format: 'md' | 'json' = 'md'): Promise<string> => {
    return apiClient<string>(`/api/places/gridsearch/export?search=${jobId}&format=${format}`);
};

export const exportGridSearchToContacts = async (
    jobId: string,
    groupId?: string,
    opts?: { placeIds?: string[]; excludedTypes?: string[] },
): Promise<{ imported: number; skipped: number }> => {
    return apiClient<{ imported: number; skipped: number }>(`/api/places/gridsearch/${jobId}/export-to-contacts`, {
        method: 'POST',
        body: JSON.stringify({
            groupId,
            ...(opts?.placeIds !== undefined ? { placeIds: opts.placeIds } : {}),
            ...(opts?.excludedTypes !== undefined ? { excludedTypes: opts.excludedTypes } : {}),
        }),
    });
};


export const getGridSearchExcludeTypes = async (): Promise<string[]> => {
    try {
        const res = await apiClient<any>('/api/me/secrets');
        return res?.gridsearch_exclude_types || [];
    } catch (error) {
        console.error('Error fetching excluded types:', error);
        return [];
    }
};

export const saveGridSearchExcludeTypes = async (types: string[]): Promise<void> => {
    try {
        await apiClient<any>('/api/me/secrets', {
            method: 'PUT',
            body: JSON.stringify({ gridsearch_exclude_types: types })
        });
    } catch (error) {
        console.error('Error saving excluded types:', error);
        throw error;
    }
};

/** User-defined AI grid filters (stored in user_secrets.settings.places_ai_grid_filters). */
export interface PlacesAiGridFilterDef {
    id: string;
    label: string;
    prompt: string;
    targetField: string;
    enabled?: boolean;
    /** How to coerce LLM output for the grid (`auto` = infer numeric strings + optional LLM `value_type`). */
    valueType?: 'auto' | 'number' | 'string';
}

export const getPlacesAiGridFilters = async (): Promise<PlacesAiGridFilterDef[]> => {
    try {
        const res = await apiClient<any>('/api/me/secrets');
        const raw = res?.places_ai_grid_filters;
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
};

export const savePlacesAiGridFilters = async (filters: PlacesAiGridFilterDef[]): Promise<void> => {
    await apiClient<any>('/api/me/secrets', {
        method: 'PUT',
        body: JSON.stringify({ places_ai_grid_filters: filters }),
    });
};

export const postLlmFiltersRun = async (body: {
    placeIds: string[];
    filterIds: string[];
    lang?: string;
}): Promise<{ runId: string }> => {
    const res = await apiClient<{ data: { runId: string } }>('/api/places/llm-filters/run', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return res.data;
};

export const getLlmFiltersStreamUrl = (runId: string, token?: string | null): string => {
    const q = new URLSearchParams({ runId });
    if (token) q.set('token', token);
    return `${serverUrl}/api/places/llm-filters/stream?${q.toString()}`;
};

export const getPlacesTypes = async (): Promise<string[]> => {
    try {
        const res = await apiClient<{ data: string[] }>('/api/places/types');
        return res.data || [];
    } catch (e) {
        console.error('Error fetching places types:', e);
        return [];
    }
};

// --- From client-gridsearch.ts ---

export interface GridArea {
    name: string;
    gid: string;
    level: number;
    center: { lat: number; lon: number };
    bbox?: [number, number, number, number];
    areaSqKm?: number;
    maxDistanceKm?: number;
    geometry?: any;
    stats?: {
        totalPopulation: number;
        placeCount: number;
        avgElevation: number;
        minElevation: number;
        maxElevation: number;
    };
}

export interface GridSearchQuery {
    region: string;
    level: string | number;
    includeArea?: boolean;
    includeDistance?: boolean;
    includeGeometry?: boolean;
    includeStats?: boolean;
    bigdataKey?: string;
    [key: string]: any;
}

export interface GridEnumerateResult {
    query: GridSearchQuery;
    region: {
        name: string;
        gid: string;
        level: number;
        center?: { lat: number; lon: number };
        bbox?: [number, number, number, number];
        areaSqKm?: number;
        maxDistanceKm?: number;
        geometry?: any;
    };
    areas: GridArea[];
    maxLevelAvailable: number;
    generatedAt: string;
}

export interface GadmRow {
    level: number;
    queryName: string;
    gadmName: string | null;
    gid: string | null;
    gadmRow: any | null;
}

export const fetchGridSearches = async (): Promise<string[]> => {
    return fetchWithDeduplication('grid-searches-list', async () => {
        const res = await apiClient<{ data: string[] }>('/api/locations/gridsearch');
        return res.data;
    }, 60000);
};

export const fetchGridSearchesLocal = async (): Promise<string[]> => {
    return fetchWithDeduplication('grid-searches-local-list', async () => {
        const res = await apiClient<{ data: string[] }>('/api/locations/gridsearch/local');
        return res.data;
    }, 60000);
};

export const fetchGridSearch = async (id: string): Promise<GridEnumerateResult> => {
    return fetchWithDeduplication(`grid-search-${id}`, async () => {
        const res = await apiClient<{ data: GridEnumerateResult }>(`/api/locations/gridsearch/${encodeURIComponent(id)}`);
        return res.data;
    });
};

export const fetchGridSearchLocal = async (id: string): Promise<GridEnumerateResult> => {
    return fetchWithDeduplication(`grid-search-local-${id}`, async () => {
        const res = await apiClient<{ data: GridEnumerateResult }>(`/api/locations/gridsearch/local/${encodeURIComponent(id)}`);
        return res.data;
    });
};

export const generateGridSearch = async (req: {
    region: string;
    level: string | number;
    name?: string;
    gid?: string;
    includeStats?: boolean;
    maxElevation?: number;
    minDensity?: number;
}): Promise<any> => {
    return apiClient<any>('/api/locations/gridsearch/generate', {
        method: 'POST',
        body: JSON.stringify(req)
    });
};

export const searchGadmRegions = async (query: string, contentLevel?: number): Promise<any[]> => {
    if (!query) return [];
    try {
        let url = `/api/regions/search?query=${encodeURIComponent(query)}`;
        if (contentLevel !== undefined) {
            url += `&content_level=${contentLevel}`;
        }
        const res = await apiClient<any>(url);
        return res.data || res.rows || [];
    } catch (e) {
        console.error('Error searching GADM regions:', e);
        return [];
    }
};

export const fetchRegionHierarchy = async (lat: number, lon: number): Promise<any[]> => {
    const cacheKey = `gadm-hierarchy-${lat.toFixed(4)}-${lon.toFixed(4)}`;
    return fetchWithDeduplication(cacheKey, async () => {
        const res = await apiClient<{ data: any[] }>(`/api/regions/hierarchy?lat=${lat}&lon=${lon}`);
        return res.data || [];
    });
};

export const fetchRegionBoundary = async (
    gid: string,
    name: string,
    targetLevel: number,
    enrich?: boolean
): Promise<any> => {
    const cacheKey = `gadm-boundary-${gid}-L${targetLevel}-E${enrich}`;
    return fetchWithDeduplication(cacheKey, async () => {
        let url = `/api/regions/boundary/${encodeURIComponent(gid)}?name=${encodeURIComponent(name)}&targetLevel=${targetLevel}`;
        if (enrich) url += '&enrich=true';
        return apiClient<any>(url);
    });
};

export async function resolveGadmHierarchy(lat: number, lng: number): Promise<GadmRow[]> {
    const rows: GadmRow[] = [];
    try {
        const foundRows = await fetchRegionHierarchy(lat, lng);
        for (let level = 0; level <= 5; level++) {
            const match = foundRows.find((r: any) => r.level === level);
            if (match) {
                rows.push({ level, queryName: match.gadmName || '', gadmName: match.gadmName, gid: match.gid, gadmRow: match });
            } else {
                rows.push({ level, queryName: '', gadmName: null, gid: null, gadmRow: null });
            }
        }
    } catch (e) {
        for (let level = 0; level <= 5; level++) rows.push({ level, queryName: '', gadmName: null, gid: null, gadmRow: null });
    }
    return rows;
}

export const fetchRegionChildren = async (adminGid: string, targetLevel: number): Promise<any[]> => {
    const cacheKey = `gadm-children-${adminGid}-L${targetLevel}`;
    return fetchWithDeduplication(cacheKey, async () => {
        try {
            const url = `/api/regions/names?admin=${encodeURIComponent(adminGid)}&content_level=${targetLevel}&resolveNames=true`;
            const res = await apiClient<any>(url);
            return res.data || res.rows || [];
        } catch (e) {
            console.error('Failed to fetch region children', e);
            return [];
        }
    });
};

export const fetchReverseGeocode = async (lat: number, lon: number): Promise<any> => {
    const cacheKey = `reverse-geocode-${lat.toFixed(4)}-${lon.toFixed(4)}`;
    return fetchWithDeduplication(cacheKey, async () => {
        const res = await apiClient<{ data: any }>(`/api/regions/reverse?lat=${lat}&lon=${lon}`);
        return res.data;
    });
};

export const fetchIpLocation = async (): Promise<any> => {
    return fetchWithDeduplication('ip-api-location', async () => {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error(`Failed to fetch IP location: ${res.statusText}`);
        return await res.json();
    }, 600000); // 10 minutes cache
};
