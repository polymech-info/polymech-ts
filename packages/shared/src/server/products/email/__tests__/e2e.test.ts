
import { describe, it, expect } from 'vitest';
import { app } from '../../../index.js';
import { logger } from '../logger.js';

describe('Email Product E2E', () => {

    it('should generate email HTML at /api/render/email/:id', async () => {
        const { supabase } = await import('../../../commons/supabase.js');
        const envId = process.env.DEFAULT_POST_TEST_ID; // undefined
        let id = envId;

        if (!id) {
            const { data: posts } = await supabase.from('posts').select('id').order('created_at', { ascending: false }).limit(1);
            id = posts?.[0]?.id;
        }

        logger.info({ id }, 'Testing Email Render with Post ID');
        if (!id) {
            logger.warn('Skipping test: No post found in DB');
            return;
        }

        const res = await app.request(`/api/render/email/${id}`);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/html');
        const text = await res.text();
        expect(text).toContain('<!DOCTYPE html>');
    }, 120000);

    it('should send email at /api/send/email/:id', async () => {
        const { supabase } = await import('../../../commons/supabase.js');

        const envId = process.env.DEFAULT_POST_TEST_ID;
        let id = envId;

        if (!id) {
            const { data: posts } = await supabase.from('posts').select('id').order('created_at', { ascending: false }).limit(1);
            id = posts?.[0]?.id;
        }

        logger.info({ id }, 'Testing Email Send with Post ID');
        if (!id) {
            logger.warn('Skipping test: No post found in DB');
            return;
        }

        const res = await app.request(`/api/send/email/${id}`, {
            method: 'POST',
            body: JSON.stringify({
                to: process.env.TEST_EMAIL_TO || 'cgoflyn@gmail.com',
                subject: 'E2E Test Email'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (res.status !== 200) {
            const body = await res.text();
            console.error('Email send failed:', body);
        }

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.messageId).toBeDefined();
    }, 120000);
});
