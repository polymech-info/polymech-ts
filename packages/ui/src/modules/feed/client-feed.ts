import { FEED_API_ENDPOINT } from '@/constants';
import { apiClient } from '@/lib/db';
import { getCurrentLang } from '@/i18n';
import type { FeedSortOption } from '@/hooks/useFeedData';

export interface FetchFeedOptions {
    source?: 'home' | 'collection' | 'tag' | 'user' | 'widget' | 'search';
    sourceId?: string;
    page?: number;
    limit?: number;
    sortBy?: FeedSortOption;
    categoryIds?: string[];
    categorySlugs?: string[];
    contentType?: 'posts' | 'pages' | 'pictures' | 'files' | 'places';
    visibilityFilter?: 'invisible' | 'private';
    lang?: string;
}

export const fetchFeed = async (options: FetchFeedOptions) => {
    const params = new URLSearchParams();
    if (options.page !== undefined) params.append('page', String(options.page));
    if (options.limit !== undefined) params.append('limit', String(options.limit));
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const lang = options.lang || getCurrentLang();
    if (lang) params.append('lang', lang);

    if (options.source) params.append('source', options.source);
    if (options.sourceId) params.append('sourceId', options.sourceId);

    if (options.categoryIds && options.categoryIds.length > 0) {
        params.append('categoryIds', options.categoryIds.join(','));
    }
    if (options.categorySlugs && options.categorySlugs.length > 0) {
        params.append('categorySlugs', options.categorySlugs.join(','));
    }

    if (options.contentType) params.append('contentType', options.contentType);
    if (options.visibilityFilter) params.append('visibilityFilter', options.visibilityFilter);

    return apiClient<any[]>(`${FEED_API_ENDPOINT}?${params.toString()}`);
};
