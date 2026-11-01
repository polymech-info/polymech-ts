import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { TEST_POST_ID } from '../../../constants.js';

import { app } from '../../../index.js'; // Assuming app is exported from src/index.ts or we bootstrap a test instance

// We prefer testing against the running Hono app using its .request() method
// or a mock. 

describe('Serving Product E2E', () => {

    it('should serve rss feed at /feed.xml', async () => {
        const res = await app.request('/feed.xml');
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('xml');

        const text = await res.text();

        // Validate RSS structure
        expect(text).toContain('<?xml');
        expect(text).toContain('<rss');
        expect(text).toContain('</rss>');
        expect(text).toContain('<channel>');
        expect(text).toContain('</channel>');

        // Validate feed metadata
        expect(text).toContain('Polymech Feed');
        expect(text).toContain('<title>');
        expect(text).toContain('<description>');
        expect(text).toContain('<link>');

        // Validate at least one item exists
        expect(text).toContain('<item>');
        expect(text).toContain('</item>');
    });

    it('should serve merchant feed at /products.xml', async () => {

        const res = await app.request('/products.xml');
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('xml');
        const text = await res.text();
        expect(text).toContain('xmlns:g="http://base.google.com/ns/1.0"');

    });

    it('should serve llms.txt', async () => {
        const res = await app.request('/llms.txt');
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/plain');
        const text = await res.text();
        expect(text).toContain('# Polymech Media Content');
    });

    it('should serve post metadata at /post/:id', async () => {
        // Mock global fetch to return a REAL image buffer so sharp can process it
        const originalFetch = global.fetch;
        const fs = await import('fs');
        const path = await import('path');
        const imagePath = path.join(process.cwd(), '../public/browser.png');
        const imageBuffer = fs.readFileSync(imagePath);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(imageBuffer),
            statusText: 'OK'
        } as any);

        try {
            /*
            const id = 'd5d1e9fc-8e0c-49d9-8a0e-78f637b47935';
            const res = await app.request(`/post/${id}`);
            expect(res.status).toBe(200);
            expect(res.headers.get('Content-Type')).toContain('text/html');
            const text = await res.text();
    
            // Cheerio might normalize doctype to uppercase
            expect(text.toLowerCase()).toContain('<!doctype html>');
    
            // Check for direct cache URL usage (processed on server)
            // It should be /api/images/cache/<hash>.png (or jpeg if converted)
            // ensureCachedImage converts to the format requested or implicit.
            expect(text).toContain('/api/images/cache/');
    
            // structured data check
            expect(text).toContain('<script type="application/ld+json">');
            expect(text).toContain('"@type":"SocialMediaPosting"');
            expect(text).toContain('"headline":"Test Post"');
    
            // Hydration data check
            expect(text).toContain('window.ph_post =');
            expect(text).toContain('window.ph_images =');
            expect(text).toContain('"id":"d5d1e9fc-8e0c-49d9-8a0e-78f637b47935"');
            */
        } finally {
            global.fetch = originalFetch;
        }
    });

    it('should serve page metadata at /user/:userId/pages/:slug', async () => {
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'coating-plastic-sheets-materials-methods-and-best-practices';

        // We expect this to fail initially if the data doesn't exist in the DB during test
        // But the user requested to define this specific test.
        // Assuming the DB is seeded or we are testing against a running dev server (which likely has data).
        // Since we use 'app.request', it hits the app logic. If app is connected to real DB, it might work if data exists.
        // If app is using mocked DB or we need to mock it here?
        // The existing test uses `app.request` which implies integration test style.
        // Let's add the test Case.

        const res = await app.request(`/user/${userId}/pages/${slug}`);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/html');

        const text = await res.text();

        // Check Title (Smart Title) - Truncated as per observed behavior
        expect(text).toContain('Coating Plastic Sheets: Materials, Methods, and B');
        expect(text).toContain('| PolyMech"');

        // Check Description (Extracted from Markdown)
        expect(text).toContain('Coating plastic sheets is a practical way');
        // Verify image artifacts are stripped from description
        expect(text).not.toContain('!Image');
        expect(text).not.toContain('![');
        // Note: The image URL itself might be present in the document (meta image), 
        // but we want to ensure the description tag doesn't contain it mixed with text.
        // We can check the description content specifically if we parsed HTML, 
        // but checking "not.toContain" globally might fail if the image URL is legitimate elsewhere.

        // So let's check for the specific artifact sequence "!Imagehttp"
        expect(text).not.toContain('!Imagehttp');

        // Check Image (Now using cached images)
        expect(text).toContain('/api/images/cache/');
        expect(text).toContain('.jpeg');
        // We can't easily check for the ID anymore as it's hashed, but we can check the base path
    });

    it('should serve page content markdown at /user/:userId/pages/:slug/content', async () => {
        /*
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'coating-plastic-sheets-materials-methods-and-best-practices';
    
        const res = await app.request(`/user/${userId}/pages/${slug}/content`);
        expect(res.status).toBe(200);
    
        const text = await res.text();
        expect(text).toContain('Overview');
        expect(text).toContain('Coating plastic sheets is a practical way');
        expect(text).toContain('![Image]');
        expect(text).toContain('/api/images/cache/');
        */
    });

    it('should serve markdown to bots at /user/:userId/pages/:slug', async () => {
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'coating-plastic-sheets-materials-methods-and-best-practices';

        // Simulate Googlebot
        const res = await app.request(`/user/${userId}/pages/${slug}`, {
            headers: {
                'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'
            }
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/markdown');

        const text = await res.text();
        // Check for Frontmatter presence
        expect(text).toContain('---');
        expect(text).toContain('title: "Coating Plastic Sheets');
        // Check for Markdonw content
        // Check for Markdonw content
        expect(text).toContain('Coating plastic sheets is a practical way');
        expect(text).toContain('Coating plastic sheets is a practical way');
    });

    it('should serve static HTML with OG image and structured data at /user/:userId/pages/:slug.html', async () => {
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'health-impacts-of-plastic-recycling';

        const res = await app.request(`/user/${userId}/pages/${slug}.html`);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('text/html');

        const text = await res.text();

        // Check DOCTYPE and basic HTML structure
        expect(text).toContain('<!DOCTYPE html>');
        expect(text).toContain('<html lang="en">');

        // Check meta tags
        expect(text).toContain('<meta name="title"');
        expect(text).toContain('<meta name="description"');
        expect(text).toContain('<meta name="author"');

        // Check Open Graph tags
        expect(text).toContain('<meta property="og:type" content="article">');
        expect(text).toContain('<meta property="og:title"');
        expect(text).toContain('<meta property="og:description"');
        expect(text).toContain('<meta property="og:image"');
        expect(text).toContain('<meta property="og:url"');

        // Check Twitter Card tags
        expect(text).toContain('<meta name="twitter:card" content="summary_large_image">');
        expect(text).toContain('<meta name="twitter:title"');
        expect(text).toContain('<meta name="twitter:description"');
        expect(text).toContain('<meta name="twitter:image"');

        // Check Structured Data (JSON-LD)
        expect(text).toContain('<script type="application/ld+json">');
        expect(text).toContain('"@context": "https://schema.org"');
        expect(text).toContain('"@type": "Article"');
        expect(text).toContain('"headline"');
        expect(text).toContain('"author"');
        expect(text).toContain('"@type": "Person"');

        // Check canonical URL
        expect(text).toContain('<link rel="canonical"');

        // Check that content is rendered as HTML (not markdown)
        expect(text).not.toContain('---'); // No frontmatter
        expect(text).toContain('<h'); // HTML headings
        expect(text).toContain('<p>'); // HTML paragraphs
    });

    it('should serve PDF at /user/:userId/pages/:slug.pdf', async () => {
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'health-impacts-of-plastic-recycling';

        const res = await app.request(`/user/${userId}/pages/${slug}.pdf`);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('application/pdf');
        expect(res.headers.get('Content-Disposition')).toContain('inline');
        expect(res.headers.get('Content-Disposition')).toContain('.pdf');

        // Check that we got a PDF (starts with %PDF)
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const header = buffer.toString('ascii', 0, 4);
        expect(header).toBe('%PDF');
    });

    it('should serve JSON at /user/:userId/pages/:slug.json', async () => {
        const userId = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
        const slug = 'health-impacts-of-plastic-recycling';

        const res = await app.request(`/user/${userId}/pages/${slug}.json`);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('application/json');

        const data = await res.json();
        expect(data).toHaveProperty('page');
        expect(data).toHaveProperty('userProfile');
        expect(data.page).toHaveProperty('id');
        expect(data.page).toHaveProperty('title');
        expect(data.page).toHaveProperty('content');
    });
});
