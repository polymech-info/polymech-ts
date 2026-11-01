import { describe, it, expect, vi } from 'vitest';
import { extractSiteInfo } from '../site-info.js';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('extractSiteInfo', () => {
    it('should extract basic meta tags and normalize page info', async () => {
        const html = `
            <html>
                <head>
                    <title>Test Page</title>
                    <meta name="description" content="A test page description">
                    <link rel="canonical" href="https://example.com/canonical">
                </head>
                <body></body>
            </html>
        `;

        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: async () => html,
            url: 'https://example.com/original'
        });

        const info = await extractSiteInfo('https://example.com/test');
        expect(info.title).toBe('Test Page');
        expect(info.description).toBe('A test page description');
        expect(info.url).toBe('https://example.com/canonical');

        // Check Normalized Page Info
        expect(info.page.title).toBe('Test Page');
        expect(info.page.description).toBe('A test page description');
        expect(info.page.url).toBe('https://example.com/canonical');
    });

    it('should extract Open Graph data and prioritize it for page image', async () => {
        const html = `
            <html>
                <head>
                    <meta property="og:title" content="OG Title">
                    <meta property="og:description" content="OG Description">
                    <meta property="og:image" content="https://example.com/og.jpg">
                    <meta property="og:site_name" content="My Site">
                </head>
                <body></body>
            </html>
        `;

        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: async () => html,
            url: 'https://example.com/'
        });

        const info = await extractSiteInfo('https://example.com/');
        expect(info.title).toBe('OG Title');
        expect(info.og?.image).toBe('https://example.com/og.jpg');

        // Normalized
        expect(info.page.title).toBe('OG Title');
        expect(info.page.image).toBe('https://example.com/og.jpg');
    });

    it('should handle YouTube URLs with specific logic', async () => {
        // Mock YouTube HTML (minimal)
        const html = `
            <html>
                <head>
                    <title>YouTube Video Title</title>
                    <meta property="og:image" content="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg">
                </head>
                <body></body>
            </html>
        `;

        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: async () => html,
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        });

        const info = await extractSiteInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        // Verify we got the title from HTML
        expect(info.title).toBe('YouTube Video Title');

        // Verify we OVERRIDE the image with maxresdefault
        expect(info.page.image).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
        expect(info.images?.[0].src).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should handle YouTube short URLs (youtu.be)', async () => {
        const html = `<html><title>Short</title></html>`;

        fetchMock.mockResolvedValueOnce({
            ok: true,
            text: async () => html,
            url: 'https://youtu.be/dQw4w9WgXcQ'
        });

        const info = await extractSiteInfo('https://youtu.be/dQw4w9WgXcQ');
        expect(info.page.image).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });
});
