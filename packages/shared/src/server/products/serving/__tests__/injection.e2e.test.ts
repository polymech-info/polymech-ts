import { describe, it, expect } from 'vitest';
import { app } from '@/index.js';

describe('HTML Injection E2E', () => {
    it('should inject feed data into home page', async () => {
        const res = await app.request('/');
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain('window.__INITIAL_STATE__');
        // Check for specific JSON structure start or property
        expect(html).toContain('window.__INITIAL_STATE__.feed = [');
    });

    it('should inject profile data into profile page', async () => {
        // Use default profile
        const res = await app.request('/profile/default');
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain('window.__INITIAL_STATE__');
        expect(html).toContain('window.__INITIAL_STATE__.profile = {');
        expect(html).toContain('"profile":');
        expect(html).toContain('"recentPosts":');
    });
});
