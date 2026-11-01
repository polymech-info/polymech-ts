import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createLayoutServer,
    deleteLayoutServer,
    fetchLayoutByIdServer,
    fetchLayoutsServer,
    flushLayoutCache,
    updateLayoutServer,
} from '../../products/serving/db/db-layouts.js';

const logger = createLogger('test-db-layouts-pg');
const canRunPgLayouts = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';
const createdLayoutIds: string[] = [];

describe('db-layouts-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
        await flushLayoutCache();
    });

    afterAll(async () => {
        for (const id of createdLayoutIds) {
            try {
                await deleteLayoutServer(id, ownerId);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup deleteLayoutServer failed');
            }
        }
        await flushLayoutCache();
    });

    it.skipIf(!canRunPgLayouts)('fetchLayoutsServer returns list and cache metadata', async () => {
        const first = await fetchLayoutsServer({ userId: ownerId, limit: 10, offset: 0 });
        expect(Array.isArray(first.data)).toBe(true);
        expect(typeof first.fromCache).toBe('boolean');
        expect(typeof first.total).toBe('number');

        const second = await fetchLayoutsServer({ userId: ownerId, limit: 10, offset: 0 });
        expect(Array.isArray(second.data)).toBe(true);
        expect(second.fromCache).toBe(true);
    });

    it.skipIf(!canRunPgLayouts)('create -> update -> delete layout lifecycle', async () => {
        const stamp = Date.now();
        const created = await createLayoutServer({
            name: `PG Layout ${stamp}`,
            owner_id: ownerId,
            layout_json: { version: 1, widgets: [] },
            type: 'canvas',
            visibility: 'private',
            meta: { source: 'db-layouts-pg.test.ts' },
            is_predefined: false,
        });

        expect(created).toBeTruthy();
        expect(created.id).toBeTruthy();
        createdLayoutIds.push(created.id);

        const byId = await fetchLayoutByIdServer(created.id);
        expect(byId.data).toBeTruthy();
        expect(byId.data.id).toBe(created.id);

        const updated = await updateLayoutServer(
            created.id,
            {
                name: `PG Layout Updated ${stamp}`,
                visibility: 'listed',
                meta: { updated: true },
            },
            ownerId,
        );
        expect(updated).toBeTruthy();
        expect(updated?.name).toBe(`PG Layout Updated ${stamp}`);
        expect(updated?.visibility).toBe('listed');

        const deleted = await deleteLayoutServer(created.id, ownerId);
        expect(deleted).toBe(true);
        createdLayoutIds.splice(createdLayoutIds.indexOf(created.id), 1);

        const afterDelete = await fetchLayoutByIdServer(created.id);
        expect(afterDelete.data).toBeNull();
    });
});
