import { beforeAll, describe, expect, it } from 'vitest';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    getSearchByHashPg,
    getGridSearchRunByIdPg,
    getPlacesTypesPg,
    getPlacesChunkPg,
    getPlaceByIdPg,
    getPlaceSearchesByRunIdPg,
    getUserGridSearchRunsPg,
    fetchUserSecretsSettingsPg,
} from '../../products/places/db-places.js';

const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const missingUuid = '00000000-0000-4000-8000-000000000099';
const ownerId = '00000000-0000-4000-8000-000000000001';

describe('db-places-pg', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    it('getPlacesChunkPg returns error for invalid select list', async () => {
        const { data, error } = await getPlacesChunkPg(['x'], 'place_id, bogus_column');
        expect(error).not.toBeNull();
        expect(data).toBeNull();
    });

    it.skipIf(!canRun)('getSearchByHashPg returns null for unknown hash', async () => {
        const row = await getSearchByHashPg('nonexistent-hash-xxxxxxxx');
        expect(row).toBeNull();
    });

    it.skipIf(!canRun)('getGridSearchRunByIdPg returns null data for unknown id', async () => {
        const { data, error } = await getGridSearchRunByIdPg(missingUuid);
        expect(error).toBeNull();
        expect(data).toBeNull();
    });

    it.skipIf(!canRun)('getPlacesTypesPg returns rows array', async () => {
        const { rows, error } = await getPlacesTypesPg();
        expect(error).toBeNull();
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('getPlacesChunkPg empty ids', async () => {
        const { data, error } = await getPlacesChunkPg([]);
        expect(error).toBeNull();
        expect(data).toEqual([]);
    });

    it.skipIf(!canRun)('getPlaceByIdPg not found', async () => {
        const { data, error } = await getPlaceByIdPg('ChIJxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        expect(data).toBeNull();
        expect(error).not.toBeNull();
    });

    it.skipIf(!canRun)('getPlaceSearchesByRunIdPg returns array', async () => {
        const { data, error } = await getPlaceSearchesByRunIdPg('nonexistent-run');
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    it.skipIf(!canRun)('getUserGridSearchRunsPg returns array', async () => {
        const { data, error } = await getUserGridSearchRunsPg(ownerId);
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
    });

    it.skipIf(!canRun)('fetchUserSecretsSettingsPg returns object', async () => {
        const s = await fetchUserSecretsSettingsPg(ownerId);
        expect(typeof s).toBe('object');
    });
});
