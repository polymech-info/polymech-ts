import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    deleteTransactionByIdPg,
    fetchTransactionForStripeInvoicePg,
    getTransactionByIdPg,
    insertTransactionPg,
    listTransactionsOrderedPg,
    updateTransactionByExternalOrderIdPg,
    updateTransactionByIdPg,
} from '../../products/ecommerce/db-ecommerce-pg.js';

const logger = createLogger('test-db-ecommerce-pg');
const canRun = !!process.env.DATABASE_URL_NEXT?.trim();
const userId = '00000000-0000-4000-8000-000000000001';
const createdIds: string[] = [];

describe('db-ecommerce-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
    });

    afterAll(async () => {
        for (const id of createdIds) {
            try {
                await deleteTransactionByIdPg(id);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup transaction failed');
            }
        }
    });

    it.skipIf(!canRun)('listTransactionsOrderedPg returns array', async () => {
        const all = await listTransactionsOrderedPg();
        expect(Array.isArray(all)).toBe(true);
        const scoped = await listTransactionsOrderedPg({ userId });
        expect(Array.isArray(scoped)).toBe(true);
    });

    it.skipIf(!canRun)('insert -> get -> list -> stripe helpers -> patch -> delete', async () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const externalOrderId = `pi_test_${stamp}`;

        const row = await insertTransactionPg({
            user_id: userId,
            status: 'pending',
            currency: 'USD',
            total_amount: 14.0,
            shipping_info: {},
            vendor_info: {},
            product_info: [{ title: 'Test', price: 14, quantity: 1 }],
            buyer_profile: { id: userId },
            metadata: {},
            payment_provider: 'stripe',
            external_order_id: externalOrderId,
            buyer_email: 'pg-ecommerce-test@example.invalid',
        });
        expect(row?.id).toBeTruthy();
        createdIds.push(row.id);

        const got = await getTransactionByIdPg(row.id, { userId });
        expect(got?.id).toBe(row.id);

        const listed = await listTransactionsOrderedPg({ userId });
        expect(listed.some((t: { id: string }) => t.id === row.id)).toBe(true);

        const inv = await fetchTransactionForStripeInvoicePg(externalOrderId);
        expect(inv?.currency).toBe('USD');
        expect(Array.isArray((inv as any)?.product_info)).toBe(true);

        const patched = await updateTransactionByIdPg(row.id, {
            status: 'processing',
            note: 'pg test',
        });
        expect(patched?.status).toBe('processing');

        const done = await updateTransactionByExternalOrderIdPg(externalOrderId, {
            status: 'completed',
            metadata: {
                stripe_payment_intent_id: externalOrderId,
                stripe_status: 'succeeded',
            },
        });
        expect(done?.status).toBe('completed');

        const ok = await deleteTransactionByIdPg(row.id);
        expect(ok).toBe(true);
        createdIds.splice(createdIds.indexOf(row.id), 1);

        expect(await getTransactionByIdPg(row.id, {})).toBeNull();
    });
});
