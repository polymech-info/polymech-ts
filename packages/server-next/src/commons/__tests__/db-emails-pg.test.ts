import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools, isAdmin } from '../postgres.js';
import {
    fetchPostWithPicturesForEmailPg,
    fetchSentEmailsAmongPg,
    fetchUnsubscribedEmailsAmongPg,
    insertMarketingEmailTrackPg,
    unsubscribeMarketingEmailByTokenPg,
    updateMarketingEmailByIdPg,
} from '../../products/email/db-emails-pg.js';

const logger = createLogger('test-db-emails-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const ownerId = '00000000-0000-4000-8000-000000000001';
const createdMarketingEmailIds: string[] = [];

describe('db-emails-pg (db only)', () => {
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
    });

    it.skipIf(!canRun)('isAdmin (postgres) returns boolean', async () => {
        expect(typeof await isAdmin(ownerId)).toBe('boolean');
    });

    it.skipIf(!canRun)('fetchPostWithPicturesForEmailPg returns null for missing id', async () => {
        const row = await fetchPostWithPicturesForEmailPg('00000000-0000-4000-8000-000000000099');
        expect(row).toBeNull();
    });

    it.skipIf(!canRun)('marketing_emails track insert -> update -> unsub check -> delete', async () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const email = `pg-email-track-${stamp}@example.invalid`;

        const ins = await insertMarketingEmailTrackPg({
            email,
            page_slug: 'pg-test-page',
            subject: 'subj',
            tracking_id: `tr-${stamp}`,
            campaign: `pg-email-${stamp}`,
            lang: 'en',
            from_address: 'from@example.invalid',
            sender_id: ownerId,
            meta: { source: 'db-emails-pg.test.ts' },
        });
        expect(ins?.id).toBeTruthy();
        expect(ins?.unsubscribe_token).toBeTruthy();
        if (ins) createdMarketingEmailIds.push(ins.id);

        const ok = await updateMarketingEmailByIdPg(ins!.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
        });
        expect(ok).toBe(true);

        const sentList = await fetchSentEmailsAmongPg([email], { campaign: `pg-email-${stamp}` });
        expect(sentList).toContain(email);

        const unsub = await unsubscribeMarketingEmailByTokenPg(
            ins!.unsubscribe_token,
            new Date().toISOString(),
        );
        expect(unsub?.email).toBe(email);

        const unsubs = await fetchUnsubscribedEmailsAmongPg([email]);
        expect(unsubs).toContain(email);
    });
});
