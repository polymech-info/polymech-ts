import { apiClient, getAuthHeaders, serverUrl as defaultServerUrl, getAuthToken } from '@/lib/db';

export const fetchAnalytics = async (options: { limit?: number, startDate?: string, endDate?: string, baseUrl?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const base = options.baseUrl && options.baseUrl !== defaultServerUrl ? options.baseUrl : '';
    
    return apiClient<any>(`${base}/api/analytics${query}`);
};

export const fetchAnalyticsOverview = async (options: { period?: string, tracking?: string, showBots?: boolean, showApi?: boolean, baseUrl?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.period) params.append('period', options.period);
    if (options.tracking) params.append('tracking', options.tracking);
    if (options.showBots === false) params.append('showBots', 'false');
    if (options.showApi === true) params.append('showApi', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    const base = options.baseUrl && options.baseUrl !== defaultServerUrl ? options.baseUrl : '';

    return apiClient<any>(`${base}/api/analytics/overview${query}`);
};

export const clearAnalytics = async (baseUrl?: string) => {
    const base = baseUrl && baseUrl !== defaultServerUrl ? baseUrl : '';
    return apiClient<any>(`${base}/api/analytics`, { method: 'DELETE' });
};

export const subscribeToAnalyticsStream = async (
    onLog: (entry: any) => void,
    baseUrl?: string
): Promise<EventSource> => {
    const token = await getAuthToken();
    const base = baseUrl || defaultServerUrl;
    
    const url = token
        ? `${base}/api/analytics/stream?token=${encodeURIComponent(token)}`
        : `${base}/api/analytics/stream`;

    const es = new EventSource(url);
    
    es.addEventListener('log', (event: any) => {
        try {
            const entry = JSON.parse(event.data);
            onLog(entry);
        } catch { /* ignore */ }
    });

    return es;
};
