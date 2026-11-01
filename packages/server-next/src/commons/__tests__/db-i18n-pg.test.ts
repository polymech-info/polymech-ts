import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { defaultPool, initPostgresPools } from '../postgres.js';
import {
    createTranslationServer,
    deleteWidgetTranslationServer,
    deleteWidgetTranslationsByEntityServer,
    fetchGlossariesServer,
    fetchGlossaryTermsServer,
    fetchTranslationsServer,
    fetchWidgetTranslationsServer,
    flushGlossaryCache,
    updateGlossaryMetaServer,
    upsertWidgetTranslationServer,
} from '../../products/serving/db/db-i18n.js';

const logger = createLogger('test-db-i18n-pg');
const canRunPgI18n = !!process.env.DATABASE_URL_NEXT?.trim();

const createdGlossaryIds: string[] = [];
const createdWidgetTranslationIds: string[] = [];

describe('db-i18n-pg (db only)', () => {
    beforeAll(async () => {
        initPostgresPools();
        await defaultPool();
        await flushGlossaryCache();
    });

    afterAll(async () => {
        for (const id of createdWidgetTranslationIds) {
            try {
                await deleteWidgetTranslationServer(id);
            } catch (err) {
                logger.warn({ err, id }, 'cleanup deleteWidgetTranslationServer failed');
            }
        }

        for (const glossaryId of createdGlossaryIds) {
            try {
                await deleteWidgetTranslationsByEntityServer('glossary', glossaryId);
            } catch {
                // no-op cleanup helper call for cache invalidation
            }
        }

        await flushGlossaryCache();
    });

    it.skipIf(!canRunPgI18n)('translation upsert + fetch by criteria', async () => {
        const stamp = Date.now();
        const src = `hello-${stamp}`;
        const dst = `bonjour-${stamp}`;

        const row = await createTranslationServer({
            src_lang: 'en',
            dst_lang: 'fr',
            src_text: src,
            dst_text: dst,
            meta: { test: true },
        });

        expect(row).toBeTruthy();
        expect(row.src_text).toBe(src);
        expect(row.dst_text).toBe(dst);

        const fetched = await fetchTranslationsServer({
            srcLang: 'en',
            dstLang: 'fr',
            srcText: src,
        });

        expect(Array.isArray(fetched)).toBe(true);
        const found = fetched.find((r: any) => r.src_text === src);
        expect(found).toBeTruthy();
        expect(found.dst_text).toBe(dst);
    });

    it.skipIf(!canRunPgI18n)('glossary metadata upsert + cached term fetch', async () => {
        const stamp = Date.now();
        const glossaryId = `pg-test-glossary-${stamp}`;
        createdGlossaryIds.push(glossaryId);

        const upserted = await updateGlossaryMetaServer({
            glossary_id: glossaryId,
            name: `PG Glossary ${stamp}`,
            source_lang: 'en',
            target_lang: 'fr',
            entry_count: 0,
            ready: true,
        });

        expect(upserted).toBeTruthy();
        expect(upserted.glossary_id).toBe(glossaryId);

        const glossaries = await fetchGlossariesServer();
        expect(Array.isArray(glossaries.data)).toBe(true);
        expect(glossaries.data.some((g: any) => g.glossary_id === glossaryId)).toBe(true);

        const terms = await fetchGlossaryTermsServer('en', 'fr');
        expect(Array.isArray(terms.data)).toBe(true);
        expect(typeof terms.fromCache).toBe('boolean');
    });

    it.skipIf(!canRunPgI18n)('widget translation upsert + fetch + delete', async () => {
        const stamp = Date.now();
        const entityId = '00000000-0000-4000-8000-000000000001';

        const upserted = await upsertWidgetTranslationServer({
            entity_type: 'page',
            entity_id: entityId,
            widget_id: '__meta__',
            prop_path: 'title',
            source_lang: 'en',
            target_lang: 'fr',
            source_text: `Title ${stamp}`,
            translated_text: `Titre ${stamp}`,
            status: 'machine',
            meta: { test: true },
        });

        expect(upserted).toBeTruthy();
        expect(upserted.id).toBeTruthy();
        createdWidgetTranslationIds.push(upserted.id);

        const fetched = await fetchWidgetTranslationsServer({
            entityType: 'page',
            entityId,
            targetLang: 'fr',
        });
        expect(Array.isArray(fetched)).toBe(true);
        expect(fetched.some((r: any) => r.id === upserted.id)).toBe(true);

        const deleted = await deleteWidgetTranslationServer(upserted.id);
        expect(deleted.success).toBe(true);
        createdWidgetTranslationIds.splice(createdWidgetTranslationIds.indexOf(upserted.id), 1);
    });
});
