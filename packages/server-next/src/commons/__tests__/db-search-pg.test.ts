import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    searchPagesRpc,
    searchPicturesRpc,
    searchPlacesRpc,
    searchPostsRpc,
} from '../../products/serving/db/db-search.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();

describe('db-search-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it.skipIf(!canRun)('search_pages / search_posts / search_pictures return arrays', async () => {
        const q = 'test';
        const limit = 5;
        const [pages, posts, pictures] = await Promise.all([
            searchPagesRpc(q, limit),
            searchPostsRpc(q, limit),
            searchPicturesRpc(q, limit),
        ]);
        expect(Array.isArray(pages)).toBe(true);
        expect(Array.isArray(posts)).toBe(true);
        expect(Array.isArray(pictures)).toBe(true);
    });

    it.skipIf(!canRun)('search_places returns array when migration is applied', async () => {
        try {
            const rows = await searchPlacesRpc('test', 5);
            expect(Array.isArray(rows)).toBe(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('does not exist')) {
                return;
            }
            throw err;
        }
    });
});
