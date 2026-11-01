import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    deletePostById,
    fetchAllPostsOrdered,
    fetchPostAuthFields,
    insertPostServer,
    updatePostById,
} from '../../products/serving/db/db-posts-pg.js';

const logger = createLogger('test-db-posts-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const userId = '00000000-0000-4000-8000-000000000001';
const createdPostIds: string[] = [];

describe('db-posts-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        const pool = (await import('../postgres.js')).getServicePool();
        for (const id of createdPostIds) {
            try {
                await pool.query(`DELETE FROM public.posts WHERE id = $1::uuid`, [id]);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup delete post failed');
            }
        }
    });

    it.skipIf(!canRun)('fetchAllPostsOrdered returns array', async () => {
        const rows = await fetchAllPostsOrdered();
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('insert -> fetch -> update -> delete', async () => {
        const stamp = Date.now();
        const post = await insertPostServer({
            user_id: userId,
            title: `PG Post ${stamp}`,
            description: 'db-posts-pg.test.ts',
            settings: { visibility: 'public' },
            meta: { source: 'db-posts-pg.test.ts' },
        });
        expect(post?.id).toBeTruthy();
        createdPostIds.push(post.id);

        const auth = await fetchPostAuthFields(post.id);
        expect(auth?.user_id).toBe(userId);

        const updated = await updatePostById(post.id, {
            title: `PG Post Updated ${stamp}`,
            meta: { source: 'db-posts-pg.test.ts', updated: true },
        });
        expect(updated).toBe(true);

        const deleted = await deletePostById(post.id);
        expect(deleted).toBe(true);
        createdPostIds.splice(createdPostIds.indexOf(post.id), 1);
    });
});
