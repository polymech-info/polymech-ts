import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    fetchPostWithPicturesForPdfPg,
    fetchPageForPdfPg,
    fetchProfileForPdfPg,
} from '../../products/pdf/db-pdf-pg.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const missingId = '00000000-0000-4000-8000-000000000099';
const ownerId = '00000000-0000-4000-8000-000000000001';

describe('db-pdf-pg', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it.skipIf(!canRun)('fetchPostWithPicturesForPdfPg returns null for missing post', async () => {
        const row = await fetchPostWithPicturesForPdfPg(missingId);
        expect(row).toBeNull();
    });

    it.skipIf(!canRun)('fetchPageForPdfPg returns null or object', async () => {
        const page = await fetchPageForPdfPg(missingId);
        expect(page === null || typeof page === 'object').toBe(true);
    });

    it.skipIf(!canRun)('fetchProfileForPdfPg returns null or display fields', async () => {
        const p = await fetchProfileForPdfPg(ownerId);
        expect(p === null || 'display_name' in p).toBe(true);
    });
});
