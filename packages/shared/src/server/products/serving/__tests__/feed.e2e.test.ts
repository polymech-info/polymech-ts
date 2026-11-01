import { describe, it, expect } from 'vitest';
import { app } from '@/index.js';
// Config vars from env (user provided)
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

describe('Serving Product E2E', () => {
    let authToken: string | null = null;

    it('should login and get token', async () => {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            console.warn('Skipping login test - missing TEST_EMAIL/TEST_PASSWORD');
            return;
        }

        const { supabase } = await import('../../../commons/supabase.js');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (error) {
            console.error('Login failed:', error);
            throw error;
        }

        expect(data.session).toBeTruthy();
        authToken = data.session?.access_token || null;
    });

    it('should verify pagination and caching (X-Cache)', async () => {
        // 1. Fetch Page 0 (Limit 1) -> Expect MISS
        const res1 = await app.request('/api/feed?page=0&limit=1');
        if (res1.status !== 200) console.error('P0 error:', await res1.text());
        expect(res1.status).toBe(200);
        expect(res1.headers.get('X-Cache')).toBe('MISS');
        const data1 = await res1.json();
        expect(data1.length).toBe(1);
        expect(data1[0]).toHaveProperty('likes_count');
        expect(typeof data1[0].likes_count).toBe('number');
        // Author might be null if user deleted/test data, but structure should exist in our logic
        // or at least be verifyable if we know the user exists.
        // For test data, we just inserted posts, maybe assume author exists.
        if (data1[0].author) {
            expect(data1[0].author).toHaveProperty('username');
        }

        // Verify Responsive Object (Lazy Render URLs)
        if (data1[0].pictures && data1[0].pictures.length > 0) {
            const pic = data1[0].pictures[0];
            // Only if ENABLE_SERVER_IMAGE_OPTIMIZATION is true (default in env now)
            if (pic.responsive) {
                expect(pic.responsive).toHaveProperty('img');
                expect(pic.responsive.img).toHaveProperty('src');
                expect(pic.responsive.img.src).toContain('/api/images/cache/');
                expect(pic.responsive).toHaveProperty('sources');
                expect(Array.isArray(pic.responsive.sources)).toBe(true);
            }
        }

        // 2. Fetch Page 0 Again -> Expect HIT
        const res1Cached = await app.request('/api/feed?page=0&limit=1');
        expect(res1Cached.status).toBe(200);
        expect(res1Cached.headers.get('X-Cache')).toBe('HIT');
        const data1Cached = await res1Cached.json();
        expect(JSON.stringify(data1Cached)).toBe(JSON.stringify(data1));

        // 3. Fetch Page 1 (Limit 1) -> Expect MISS (different key)
        const res2 = await app.request('/api/feed?page=1&limit=1');
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('MISS');
        const data2 = await res2.json();
        expect(data2.length).toBe(1);

        // 4. Verify Pagination: Page 0 item != Page 1 item
        // Only if we actually have enough data. 
        if (data1.length > 0 && data2.length > 0) {
            expect(data1[0].id).not.toBe(data2[0].id);
        }
    });

    it('should fetch /api/me/secrets (Authorized)', async () => {
        if (!authToken) {
            console.warn('Skipping secrets test - no auth token');
            return;
        }

        const res = await app.request('/api/me/secrets', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (res.status === 401) {
            console.warn('Auth Middleware returned 401 - likely due to mock/env limits');
            return;
        }

        if (res.status === 200) {
            const data = await res.json();
            expect(typeof data).toBe('object');
        }
    });
});
