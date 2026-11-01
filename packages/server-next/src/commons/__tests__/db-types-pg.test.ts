import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createTypeServer,
    deleteTypeServer,
    fetchTypeByIdServer,
    fetchTypesServer,
    flushTypeCache,
    updateTypeServer,
} from '../../products/serving/db/db-types.js';

const logger = createLogger('test-db-types-pg');
const canRunPgTypes = !!process.env.DATABASE_URL_NEXT?.trim();
const createdTypeIds: string[] = [];

describe('db-types-pg (postgres only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
        await flushTypeCache();
    });

    afterAll(async () => {
        for (const id of createdTypeIds) {
            try {
                await deleteTypeServer(id);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup deleteTypeServer failed');
            }
        }
        await flushTypeCache();
    });

    it.skipIf(!canRunPgTypes)('fetchTypesServer returns list and cache metadata', async () => {
        const first = await fetchTypesServer({});
        expect(Array.isArray(first.data)).toBe(true);
        expect(typeof first.fromCache).toBe('boolean');

        const second = await fetchTypesServer({});
        expect(Array.isArray(second.data)).toBe(true);
        expect(second.fromCache).toBe(true);
    });

    it.skipIf(!canRunPgTypes)('create -> update -> delete type lifecycle', async () => {
        const name = `pg-test-type-${Date.now()}`;

        const created = await createTypeServer({
            name,
            kind: 'enum',
            description: 'created by db-types-pg.test.ts',
            visibility: 'public',
            enum_values: [
                { value: 'a', label: 'A', order: 0 },
                { value: 'b', label: 'B', order: 1 },
            ],
        });

        expect(created).toBeTruthy();
        expect(created.id).toBeTruthy();
        createdTypeIds.push(created.id);
        expect(created.name).toBe(name);

        const updated = await updateTypeServer(created.id, {
            description: 'updated by db-types-pg.test.ts',
            enum_values: [{ value: 'c', label: 'C', order: 0 }],
        });

        expect(updated).toBeTruthy();
        expect(updated.description).toBe('updated by db-types-pg.test.ts');
        expect(Array.isArray(updated.enum_values)).toBe(true);
        expect(updated.enum_values.length).toBe(1);
        expect(updated.enum_values[0]?.value).toBe('c');

        const fetched = await fetchTypeByIdServer(created.id);
        expect(fetched).toBeTruthy();
        expect(fetched.id).toBe(created.id);

        const deleted = await deleteTypeServer(created.id);
        expect(deleted).toBe(true);
        createdTypeIds.splice(createdTypeIds.indexOf(created.id), 1);

        const afterDelete = await fetchTypeByIdServer(created.id);
        expect(afterDelete).toBeNull();
    });
});
