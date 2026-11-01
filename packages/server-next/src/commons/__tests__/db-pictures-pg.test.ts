import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createPictureServer,
    deletePictureServer,
    fetchPictureByIdServer,
    fetchPicturesServer,
    flushPicturesCache,
    getPicturesState,
    updatePictureServer,
} from '../../products/serving/db/db-pictures.js';

const logger = createLogger('test-db-pictures-pg');
const canRunPgPictures = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';
const createdPictureIds: string[] = [];

describe('db-pictures-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
        await flushPicturesCache();
    });

    afterAll(async () => {
        for (const id of createdPictureIds) {
            try {
                await deletePictureServer(id);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup deletePictureServer failed');
            }
        }
        await flushPicturesCache();
    });

    it.skipIf(!canRunPgPictures)('getPicturesState loads and caches', async () => {
        const first = await getPicturesState();
        expect(first.state.loaded).toBe(true);
        expect(Array.isArray(first.state.pictures)).toBe(true);
        expect(first.fromCache).toBe(false);

        const second = await getPicturesState();
        expect(second.fromCache).toBe(true);
    });

    it.skipIf(!canRunPgPictures)('create -> fetch -> update -> list by tag -> delete', async () => {
        const stamp = Date.now();
        const tag = `pg-pic-${stamp}`;
        const created = await createPictureServer({
            user_id: ownerId,
            title: `PG Picture ${stamp}`,
            image_url: 'https://example.com/pg-picture.png',
            visible: true,
            tags: [tag],
            meta: { source: 'db-pictures-pg.test.ts' },
        });

        expect(created?.id).toBeTruthy();
        createdPictureIds.push(created.id);

        const byId = await fetchPictureByIdServer(created.id);
        expect(byId?.id).toBe(created.id);
        expect(byId?.title).toBe(`PG Picture ${stamp}`);

        const updated = await updatePictureServer(created.id, {
            title: `PG Picture Updated ${stamp}`,
        });
        expect(updated?.title).toBe(`PG Picture Updated ${stamp}`);

        const listed = await fetchPicturesServer({
            userId: ownerId,
            tag,
            page: 0,
            limit: 50,
        });
        expect(listed.count >= 1).toBe(true);
        expect(listed.data.some((p: { id: string }) => p.id === created.id)).toBe(true);

        const deleted = await deletePictureServer(created.id);
        expect(deleted).toBe(true);
        createdPictureIds.splice(createdPictureIds.indexOf(created.id), 1);

        const gone = await fetchPictureByIdServer(created.id);
        expect(gone).toBeNull();
    });
});
