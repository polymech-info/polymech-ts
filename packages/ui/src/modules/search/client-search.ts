import { serverUrl } from "@/lib/db";

export interface SearchOptions {
    q: string;
    limit?: number;
    type?: 'all' | 'pages' | 'posts' | 'pictures' | 'files' | 'places';
    sizes?: string;
    formats?: string;
    token?: string;
    visibilityFilter?: 'invisible' | 'private';
}

/**
 * Search content using server FTS.
 * Returns enriched FeedPost-shaped objects (with cover, responsive, author, etc.)
 */
export const searchContent = async (options: SearchOptions): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('q', options.q);
    if (options.limit) params.append('limit', String(options.limit));
    if (options.type && options.type !== 'all') params.append('type', options.type);
    if (options.sizes) params.append('sizes', options.sizes);
    if (options.formats) params.append('formats', options.formats);
    if (options.visibilityFilter) params.append('visibilityFilter', options.visibilityFilter);

    const url = `${serverUrl}/api/search?${params.toString()}`;
    const headers: Record<string, string> = {};
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
        throw new Error(`Search request failed: ${res.status}`);
    }

    return res.json();
};

/**
 * Stream search content from the server using Server-Sent Events.
 * Invokes callbacks as results arrive from different search providers.
 */
export const searchContentStream = (
    options: SearchOptions,
    onResults: (hits: any[]) => void,
    onError: (err: any) => void,
    onDone: () => void
): (() => void) => {
    
    const params = new URLSearchParams();
    params.append('q', options.q);
    
    if (options.limit) params.append('limit', String(options.limit));
    if (options.type && options.type !== 'all') params.append('type', options.type);
    if (options.sizes) params.append('sizes', options.sizes);
    if (options.formats) params.append('formats', options.formats);
    if (options.visibilityFilter) params.append('visibilityFilter', options.visibilityFilter);
    if (options.token) params.append('token', options.token);

    const url = `${serverUrl}/api/search/stream?${params.toString()}`;
    const es = new EventSource(url);

    es.addEventListener('results', (e: any) => {
        try {
            const data = JSON.parse(e.data);
            onResults(data);
        } catch (err) {
            console.error('Failed to parse search stream results', err);
        }
    });

    es.addEventListener('done', () => {
        onDone();
        es.close();
    });

    es.addEventListener('error', (e: any) => {
        onError(new Error("SSE Search Stream Error"));
        es.close();
    });

    return () => {
        es.close();
    };
};
