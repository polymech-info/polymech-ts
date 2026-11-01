
import { describe, it, expect } from 'vitest';
import { app } from '../../../index.js';
import { logger } from '../logger.js';

describe('Pdf Product E2E', () => {


    it('should probe the PDF service', async () => {
        const res = await app.request('/api/pdf/probe');
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('PDF Service OK');
    });

    it('should generate PDF at /api/render/pdf/:id', async () => {


        const { supabase } = await import('../../../commons/supabase.js');


        const envId = process.env.DEFAULT_POST_TEST_ID;
        let id = envId;

        if (!id) {
            const { data: posts } = await supabase.from('posts').select('id').order('created_at', { ascending: false }).limit(1);
            id = posts?.[0]?.id;
        }

        logger.info({ id }, 'Testing with Post ID');
        if (!id) {
            logger.warn('Skipping test: No post found in DB : ' + process.env.DEFAULT_POST_TEST_ID);
            return;
        }

        const res = await app.request(`/api/render/pdf/${id}`);
        logger.info({ status: res.status }, 'PDF Response Status');
        if (res.status !== 200) {
            const body = await res.text();
            logger.error({ body }, 'PDF Response Body');
        }
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('application/pdf');

        // Check content size to ensure it's not empty
        const buffer = await res.arrayBuffer();
        expect(buffer.byteLength).toBeGreaterThan(100);

        // Optional: Check content disposition
        const disposition = res.headers.get('Content-Disposition');
        expect(disposition).toContain('attachment');
        expect(disposition).toContain('.pdf');
    });

    it('should return 404 for non-existent post', async () => {
        const res = await app.request('/api/render/pdf/00000000-0000-0000-0000-000000000000');
        // Likely 404 or 500 depending on handling.
        // Product code returns: c.text('Post not found', 404);
        expect(res.status).toBe(404);
    });
});
