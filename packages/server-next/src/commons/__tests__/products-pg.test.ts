import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createProductServer,
    deleteProductAclRowsBySlug,
    deleteProductBySlug,
    listProductsServer,
    updateProductBySlug,
} from '../../endpoints/products-pg.js';

const logger = createLogger('test-products-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const createdSlugs: string[] = [];

describe('products-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        for (const slug of createdSlugs) {
            try {
                await deleteProductAclRowsBySlug(slug);
                await deleteProductBySlug(slug);
            } catch (err) {
                logger.warn({ err, slug }, 'cleanup products-pg failed');
            }
        }
    });

    it.skipIf(!canRun)('listProductsServer returns an array', async () => {
        const rows = await listProductsServer();
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('create -> list -> update -> deleteProductBySlug lifecycle', async () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const slug = `pg-test-product-${stamp}`;

        const created = await createProductServer({
            name: `PG Test Product ${stamp}`,
            slug,
            description: 'products-pg.test.ts',
            settings: { enabled: true, default_cost_units: 0, source: 'products-pg.test.ts' },
        });
        expect(created?.slug).toBe(slug);
        expect(created?.name).toBe(`PG Test Product ${stamp}`);
        createdSlugs.push(slug);

        const listed = await listProductsServer();
        const found = listed.find((p: { slug: string }) => p.slug === slug);
        expect(found).toBeTruthy();

        const updated = await updateProductBySlug(slug, {
            updated_at: new Date().toISOString(),
            name: `PG Test Product Updated ${stamp}`,
            description: 'updated by products-pg.test.ts',
            settings: { enabled: true, default_cost_units: 1 },
        });
        expect(updated?.name).toBe(`PG Test Product Updated ${stamp}`);

        await deleteProductAclRowsBySlug(slug);

        const deleted = await deleteProductBySlug(slug);
        expect(deleted).toBe(true);
        createdSlugs.splice(createdSlugs.indexOf(slug), 1);

        const after = await listProductsServer();
        expect(after.find((p: { slug: string }) => p.slug === slug)).toBeUndefined();
    });

    it.skipIf(!canRun)('updateProductBySlug returns null when slug missing', async () => {
        const out = await updateProductBySlug(`missing-slug-${Date.now()}`, {
            updated_at: new Date().toISOString(),
            name: 'nope',
        });
        expect(out).toBeNull();
    });

    it.skipIf(!canRun)('deleteProductBySlug returns false when slug missing', async () => {
        const ok = await deleteProductBySlug(`missing-slug-${Date.now()}`);
        expect(ok).toBe(false);
    });
});
