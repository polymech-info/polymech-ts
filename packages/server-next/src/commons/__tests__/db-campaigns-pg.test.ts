import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    deleteCampaignByIdServer,
    fetchProfileUsernameByUserIdPg,
    findPendingMarketingEmailIdPg,
    getCampaignByIdServer,
    insertCampaignServer,
    insertMarketingEmailPendingPg,
    listCampaignsServer,
    updateCampaignByIdServer,
    updateCampaignDonePg,
    updateCampaignSendingPg,
    updateMarketingEmailFailedPg,
    updateMarketingEmailSentPg,
} from '../../products/campaigns/db-campaigns-pg.js';

const logger = createLogger('test-db-campaigns-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
/** Stable test user id (same pattern as db-posts-pg). */
const ownerId = '00000000-0000-4000-8000-000000000001';
const createdCampaignIds: string[] = [];
const createdMarketingEmailIds: string[] = [];

describe('db-campaigns-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        const pool = (await import('../postgres.js')).getServicePool();
        for (const id of createdMarketingEmailIds) {
            try {
                await pool.query(`DELETE FROM public.marketing_emails WHERE id = $1::uuid`, [id]);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup marketing_emails failed');
            }
        }
        for (const id of createdCampaignIds) {
            try {
                await deleteCampaignByIdServer(id, {});
            } catch (err) {
                logger.warn({ err, id }, 'cleanup campaigns failed');
            }
        }
    });

    it.skipIf(!canRun)('listCampaignsServer returns an array (admin)', async () => {
        const rows = await listCampaignsServer({
            isAdmin: true,
            userId: ownerId,
            offset: 0,
            limit: 20,
        });
        expect(Array.isArray(rows)).toBe(true);
    });

    it.skipIf(!canRun)('insert -> get -> update -> status helpers -> delete', async () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const name = `PG Test Campaign ${stamp}`;

        const created = await insertCampaignServer({
            name,
            owner_id: ownerId,
            status: 'draft',
            group_ids: [],
            meta: { source: 'db-campaigns-pg.test.ts' },
        });
        expect(created?.id).toBeTruthy();
        expect(created?.name).toBe(name);
        createdCampaignIds.push(created.id);

        const byId = await getCampaignByIdServer(created.id, { ownerId });
        expect(byId?.id).toBe(created.id);

        const wrongOwner = await getCampaignByIdServer(created.id, {
            ownerId: '00000000-0000-4000-8000-000000000099',
        });
        expect(wrongOwner).toBeNull();

        const updated = await updateCampaignByIdServer(
            created.id,
            { subject: `Subj ${stamp}`, updated_at: new Date().toISOString() },
            { ownerId },
        );
        expect(updated?.subject).toBe(`Subj ${stamp}`);

        const listedUser = await listCampaignsServer({
            isAdmin: false,
            userId: ownerId,
            offset: 0,
            limit: 500,
        });
        expect(listedUser.some((r: { id: string }) => r.id === created.id)).toBe(true);

        const qListed = await listCampaignsServer({
            isAdmin: true,
            userId: ownerId,
            q: stamp,
            offset: 0,
            limit: 50,
        });
        expect(qListed.some((r: { id: string }) => r.id === created.id)).toBe(true);

        await updateCampaignSendingPg(created.id, new Date().toISOString());
        const sending = await getCampaignByIdServer(created.id, {});
        expect(sending?.status).toBe('sending');

        const stats = { total: 1, sent: 1, failed: 0, skipped: 0 };
        await updateCampaignDonePg(created.id, 'sent', new Date().toISOString(), stats);
        const done = await getCampaignByIdServer(created.id, {});
        expect(done?.status).toBe('sent');
        expect(done?.stats).toEqual(stats);

        const deleted = await deleteCampaignByIdServer(created.id, { ownerId });
        expect(deleted).toBe(true);
        createdCampaignIds.splice(createdCampaignIds.indexOf(created.id), 1);

        expect(await getCampaignByIdServer(created.id, {})).toBeNull();
    });

    it.skipIf(!canRun)('marketing_emails pending -> sent', async () => {
        const stamp = `${Date.now()}`;
        const row = await insertMarketingEmailPendingPg({
            email: `pg-campaign-test-${stamp}@example.invalid`,
            name: 'Test',
            page_slug: 'pg-test-page',
            subject: 'subj',
            tracking_id: `tr-${stamp}`,
            campaign: `pg-campaign-${stamp}`,
            lang: 'en',
            sender_id: ownerId,
            from_address: 'from@example.invalid',
        });
        expect(row?.id).toBeTruthy();
        expect(row?.unsubscribe_token).toBeTruthy();
        if (row) createdMarketingEmailIds.push(row.id);

        await updateMarketingEmailSentPg(row!.id, new Date().toISOString());
        const pool = (await import('../postgres.js')).getServicePool();
        const check = await pool.query(`SELECT status FROM public.marketing_emails WHERE id = $1::uuid`, [row!.id]);
        expect(check.rows[0]?.status).toBe('sent');
    });

    it.skipIf(!canRun)('marketing_emails pending -> failed + findPendingMarketingEmailIdPg', async () => {
        const stamp = `${Date.now()}-b`;
        const campaignName = `pg-campaign-fail-${stamp}`;
        const email = `pg-fail-${stamp}@example.invalid`;

        const row = await insertMarketingEmailPendingPg({
            email,
            name: 'F',
            page_slug: 'pg-test-page',
            subject: 's',
            tracking_id: `tr-${stamp}`,
            campaign: campaignName,
            lang: 'en',
            sender_id: ownerId,
            from_address: 'x@y.z',
        });
        expect(row?.id).toBeTruthy();
        if (row) createdMarketingEmailIds.push(row.id);

        const pendingId = await findPendingMarketingEmailIdPg(email, campaignName);
        expect(pendingId).toBe(row!.id);

        await updateMarketingEmailFailedPg(row!.id, 'test error');
        const pool = (await import('../postgres.js')).getServicePool();
        const check = await pool.query(
            `SELECT status, error_message FROM public.marketing_emails WHERE id = $1::uuid`,
            [row!.id],
        );
        expect(check.rows[0]?.status).toBe('failed');
        expect(String(check.rows[0]?.error_message)).toContain('test error');
    });

    it.skipIf(!canRun)('fetchProfileUsernameByUserIdPg does not throw', async () => {
        const u = await fetchProfileUsernameByUserIdPg(ownerId);
        expect(u === null || typeof u === 'string').toBe(true);
    });
});
