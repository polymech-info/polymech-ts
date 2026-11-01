import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createCategoryServer,
    deleteCategoryServer,
    fetchCategoriesServer,
    fetchCategoryByIdServer,
    flushCategoryCache,
    updateCategoryServer,
} from '../../products/serving/db/db-categories-pg.js';

const logger = createLogger('test-db-categories-pg');
const canRunPgCategories = !!process.env.DATABASE_URL_NEXT?.trim();
const createdCategoryIds: string[] = [];

describe('db-categories-pg (postgres only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
        await flushCategoryCache();
    });

    afterAll(async () => {
        for (const id of createdCategoryIds) {
            try {
                await deleteCategoryServer(id);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup deleteCategoryServer failed');
            }
        }
        await flushCategoryCache();
    });

    it.skipIf(!canRunPgCategories)('fetchCategoriesServer returns list and cache metadata', async () => {
        const first = await fetchCategoriesServer({});
        expect(Array.isArray(first.data)).toBe(true);
        expect(typeof first.fromCache).toBe('boolean');

        const second = await fetchCategoriesServer({});
        expect(Array.isArray(second.data)).toBe(true);
        expect(second.fromCache).toBe(true);
    });

    it.skipIf(!canRunPgCategories)('create -> update -> delete category lifecycle', async () => {
        const stamp = Date.now();
        const created = await createCategoryServer({
            name: `PG Test Category ${stamp}`,
            slug: `pg-test-category-${stamp}`,
            description: 'created by db-categories-pg.test.ts',
            visibility: 'public',
            meta: { source: 'db-categories-pg.test.ts' },
        });

        expect(created).toBeTruthy();
        expect(created.id).toBeTruthy();
        createdCategoryIds.push(created.id);
        expect(created.slug).toBe(`pg-test-category-${stamp}`);

        const byId = await fetchCategoryByIdServer(created.id);
        expect(byId).toBeTruthy();
        expect(byId.id).toBe(created.id);

        const updated = await updateCategoryServer(created.id, {
            name: `PG Test Category Updated ${stamp}`,
            description: 'updated by db-categories-pg.test.ts',
            meta: { updated: true },
        });
        expect(updated).toBeTruthy();
        expect(updated?.name).toBe(`PG Test Category Updated ${stamp}`);
        expect(updated?.description).toBe('updated by db-categories-pg.test.ts');

        const deleted = await deleteCategoryServer(created.id);
        expect(deleted).toBe(true);
        createdCategoryIds.splice(createdCategoryIds.indexOf(created.id), 1);

        const afterDelete = await fetchCategoryByIdServer(created.id);
        expect(afterDelete).toBeNull();
    });
});
