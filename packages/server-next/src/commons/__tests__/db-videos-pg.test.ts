import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import { fetchVideoPictureMetaByIdPg, listVideoInternPicturesPg } from '../../products/videos/db-videos-pg.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const missingId = '00000000-0000-4000-8000-000000000099';

describe('db-videos-pg', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it.skipIf(!canRun)('listVideoInternPicturesPg returns array', async () => {
        const rows = await listVideoInternPicturesPg();
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('fetchVideoPictureMetaByIdPg returns null for missing id', async () => {
        const row = await fetchVideoPictureMetaByIdPg(missingId);
        expect(row).toBeNull();
    });
});
