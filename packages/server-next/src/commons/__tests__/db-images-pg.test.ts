import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import { fetchPictureImageUrlByIdPg } from '../../products/images/db-images-pg.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();

describe('db-images-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it.skipIf(!canRun)('fetchPictureImageUrlByIdPg returns null for missing id', async () => {
        const url = await fetchPictureImageUrlByIdPg('00000000-0000-4000-8000-000000000099');
        expect(url).toBeNull();
    });
});
