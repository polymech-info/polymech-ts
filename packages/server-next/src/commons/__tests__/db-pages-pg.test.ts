import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createPageServer,
    deletePageServer,
    deletePageVersionServer,
    fetchPagesListingRows,
    fetchSourcePageForVersioning,
    insertManualPageVersionServer,
    listPageVersionsServer,
    updatePageServer,
} from '../../products/serving/db/db-pages.js';

const logger = createLogger('test-db-pages-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';
const access = { userId: ownerId, isAdmin: true };
const createdIds: string[] = [];

describe('db-pages-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        const pool = (await import('../postgres.js')).getServicePool();
        for (const id of createdIds) {
            try {
                await pool.query(`DELETE FROM public.pages WHERE id = $1::uuid`, [id]);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup delete page failed');
            }
        }
    });

    it.skipIf(!canRun)('fetchPagesListingRows returns array', async () => {
        const rows = await fetchPagesListingRows();
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('create -> update -> versions -> delete', async () => {
        const stamp = Date.now();
        const slug = `pg-page-${stamp}`;
        const page = await createPageServer({
            owner: ownerId,
            title: `PG Page ${stamp}`,
            slug,
            visible: true,
            is_public: true,
            content: { containers: [] },
            meta: { source: 'db-pages-pg.test.ts' },
        });
        expect(page?.id).toBeTruthy();
        createdIds.push(page.id);

        const updated = await updatePageServer(
            page.id,
            { title: `PG Page Updated ${stamp}` },
            access,
        );
        expect(updated?.title).toBe(`PG Page Updated ${stamp}`);

        const source = await fetchSourcePageForVersioning(page.id, access);
        expect(source?.id).toBe(page.id);

        const ver = await insertManualPageVersionServer({
            source,
            parentPageId: page.id,
            label: 'v1',
        });
        expect(ver?.id).toBeTruthy();
        if (ver?.id) createdIds.push(ver.id);

        const versions = await listPageVersionsServer(page.id, access);
        expect(versions.length >= 1).toBe(true);

        if (ver?.id) {
            const vDel = await deletePageVersionServer(ver.id, page.id, access);
            expect(vDel).toBe(true);
            createdIds.splice(createdIds.indexOf(ver.id), 1);
        }
        const deleted = await deletePageServer(page.id, access);
        expect(deleted).toBe(true);
        createdIds.splice(createdIds.indexOf(page.id), 1);
    });
});
