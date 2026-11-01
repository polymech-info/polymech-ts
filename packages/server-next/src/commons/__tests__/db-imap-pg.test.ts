import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools, isAdmin } from '../postgres.js';
import {
    deleteContactByIdPg,
    deleteContactGroupByIdPg,
    deleteContactGroupMemberPg,
    deleteContactsByIdsPg,
    exportContactsPg,
    fetchAppSettingValueByIdPg,
    fetchContactIdEmailsForOwnerPg,
    fetchUserSecretsSettingsPg,
    getContactByIdPg,
    getContactGroupByIdPg,
    insertContactGroupPg,
    insertContactPg,
    insertContactsBulkReturningIdsPg,
    insertContactsChunkPg,
    listContactGroupMembershipsChunkPg,
    listContactGroupsPg,
    listContactsChunkPg,
    updateContactByIdPg,
    upsertContactGroupMembersPg,
} from '../../products/contacts/db-imap-pg.js';

const logger = createLogger('test-db-imap-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';

const createdContactIds: string[] = [];
const createdGroupIds: string[] = [];

describe('db-imap-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        for (const cid of createdContactIds) {
            try {
                await deleteContactByIdPg(cid, {});
            } catch (err) {
                logger.warn({ err, cid }, 'cleanup contact failed');
            }
        }
        for (const gid of createdGroupIds) {
            try {
                await deleteContactGroupByIdPg(gid, {});
            } catch (err) {
                logger.warn({ err, gid }, 'cleanup group failed');
            }
        }
    });

    it.skipIf(!canRun)('isAdmin (postgres) returns boolean', async () => {
        const v = await isAdmin(ownerId);
        expect(typeof v).toBe('boolean');
    });

    it.skipIf(!canRun)('fetchUserSecretsSettingsPg returns object', async () => {
        const s = await fetchUserSecretsSettingsPg(ownerId);
        expect(s).toBeTruthy();
        expect(typeof s).toBe('object');
    });

    it.skipIf(!canRun)('fetchAppSettingValueByIdPg does not throw', async () => {
        const v = await fetchAppSettingValueByIdPg('contacts_mailboxes');
        expect(v === null || typeof v === 'object').toBe(true);
    });

    it.skipIf(!canRun)('listContactsChunkPg (admin) and fetchContactIdEmailsForOwnerPg', async () => {
        const rows = await listContactsChunkPg({
            isAdmin: true,
            userId: ownerId,
            offset: 0,
            limit: 5,
        });
        expect(Array.isArray(rows)).toBe(true);

        const emails = await fetchContactIdEmailsForOwnerPg(ownerId);
        expect(Array.isArray(emails)).toBe(true);
    });

    it.skipIf(!canRun)('group + contact + membership + list/export + batch delete', async () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const group = await insertContactGroupPg({
            name: `pg-test-group-${stamp}`,
            owner_id: ownerId,
            description: 'db-imap-pg.test.ts',
            meta: { source: 'db-imap-pg.test.ts' },
        });
        expect(group?.id).toBeTruthy();
        createdGroupIds.push(group.id);

        const contact = await insertContactPg({
            owner_id: ownerId,
            name: `PG Contact ${stamp}`,
            status: 'active',
            emails: [{ email: `pg-${stamp}@example.invalid`, primary: true }],
            address: {},
            meta: {},
            log: {},
        });
        expect(contact?.id).toBeTruthy();
        createdContactIds.push(contact.id);

        const n = await upsertContactGroupMembersPg([
            { group_id: group.id, contact_id: contact.id },
        ]);
        expect(n).toBeGreaterThanOrEqual(0);

        const listed = await listContactsChunkPg({
            isAdmin: false,
            userId: ownerId,
            groupId: group.id,
            offset: 0,
            limit: 50,
        });
        expect(listed.some((r: { id: string }) => r.id === contact.id)).toBe(true);

        const mem = await listContactGroupMembershipsChunkPg(0, 100, false, ownerId);
        expect(mem.some((m) => m.contact_id === contact.id && m.group_id === group.id)).toBe(true);

        const updated = await updateContactByIdPg(
            contact.id,
            { notes: 'updated', updated_at: new Date().toISOString() },
            { ownerId },
        );
        expect(updated?.notes).toBe('updated');

        const exported = await exportContactsPg({
            isAdmin: false,
            userId: ownerId,
            ids: [contact.id],
        });
        expect(exported.length).toBe(1);

        const deletedIds = await deleteContactsByIdsPg([contact.id], false, ownerId);
        expect(deletedIds).toContain(contact.id);
        createdContactIds.splice(createdContactIds.indexOf(contact.id), 1);

        const gone = await getContactByIdPg(contact.id, {});
        expect(gone).toBeNull();

        await deleteContactGroupByIdPg(group.id, { ownerId });
        createdGroupIds.splice(createdGroupIds.indexOf(group.id), 1);
    });

    it.skipIf(!canRun)('insertContactsBulkReturningIdsPg + insertContactsChunkPg', async () => {
        const stamp = `${Date.now()}-bulk`;
        const rows = [
            {
                owner_id: ownerId,
                name: `Bulk A ${stamp}`,
                status: 'active',
                emails: [],
                address: {},
                meta: {},
                log: {},
            },
            {
                owner_id: ownerId,
                name: `Bulk B ${stamp}`,
                status: 'active',
                emails: [],
                address: {},
                meta: {},
                log: {},
            },
        ];
        const ids = await insertContactsBulkReturningIdsPg(rows);
        expect(ids.length).toBe(2);
        for (const { id } of ids) createdContactIds.push(id);

        const ok = await insertContactsChunkPg([
            {
                owner_id: ownerId,
                name: `Chunk ${stamp}`,
                status: 'active',
                emails: [],
                address: {},
                meta: {},
                log: {},
            },
        ]);
        expect(ok).toBe(true);
        const pool = (await import('../postgres.js')).getServicePool();
        const res = await pool.query(
            `SELECT id FROM public.contacts WHERE owner_id = $1::uuid AND name = $2 LIMIT 1`,
            [ownerId, `Chunk ${stamp}`],
        );
        if (res.rows[0]?.id) createdContactIds.push(res.rows[0].id);
    });

    it.skipIf(!canRun)('listContactGroupsPg + getContactGroupByIdPg', async () => {
        const groups = await listContactGroupsPg(false, ownerId);
        expect(Array.isArray(groups)).toBe(true);
        if (groups.length > 0) {
            const g = await getContactGroupByIdPg(groups[0].id, { ownerId });
            expect(g?.id).toBe(groups[0].id);
        }
    });

    it.skipIf(!canRun)('deleteContactGroupMemberPg is idempotent cleanup', async () => {
        await deleteContactGroupMemberPg(randomUUID(), randomUUID());
    });
});
