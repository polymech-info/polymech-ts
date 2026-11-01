import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import { DbAclBackendPg } from '../../acl/db-acl-db-pg.js';

const logger = createLogger('test-db-acl-db-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';
const resourceType = 'acl-pg-test';
const resourceId = `rid-${Date.now()}`;

describe('db-acl-db-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        const pool = (await import('../postgres.js')).getServicePool();
        try {
            await pool.query(`DELETE FROM public.resource_acl WHERE resource_type = $1 AND resource_id = $2`, [
                resourceType,
                resourceId,
            ]);
        } catch (err) {
            logger.warn({ err, resourceType, resourceId }, 'cleanup resource_acl failed');
        }
    });

    it.skipIf(!canRun)('ensure -> read -> write (round-trip)', async () => {
        const backend = new DbAclBackendPg();

        const ensured = await backend.ensure(resourceType, resourceId, ownerId);
        expect(ensured.owner).toBe(ownerId);
        expect(Array.isArray(ensured.acl)).toBe(true);

        const read1 = await backend.read(resourceType, resourceId);
        expect(read1?.owner).toBe(ownerId);

        await backend.write(resourceType, resourceId, {
            owner: ownerId,
            groups: [{ name: 'g1', members: [] }],
            acl: [
                { userId: ownerId, path: '/', permissions: ['read'] },
                { group: 'everyone', path: '/public', permissions: ['read'] },
            ],
        });

        const read2 = await backend.read(resourceType, resourceId);
        expect(read2?.groups?.length).toBe(1);
        expect(read2?.acl?.length).toBe(2);
    });
});
