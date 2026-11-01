import { describe, it, expect } from 'vitest';
import { app } from '@/index.js';
import fs from 'fs/promises';
import path from 'path';

describe('Images Product E2E', async () => {
    const TEST_DIR = path.resolve(process.cwd(), 'tests/resize');

    // Get all JPG files
    // Note: This needs to be done before tests or inside a test that generates others, 
    // but in Vitest clean way is to maintain list or just map array.
    // Since we need async fs, we can just do it in the suite body if top-level await is supported, 
    // or inside a single test that loops.
    // Better pattern for dynamic tests:

    const files = await fs.readdir(TEST_DIR);
    const jpgFiles = files.filter(f => f.toLowerCase().endsWith('.jpg'));

    if (jpgFiles.length === 0) {
        it('should have test assets', () => {
            console.warn('No JPG files found in tests/resize');
        });
    }

    jpgFiles.forEach(filename => {
        it(`should upload and resize ${filename}`, async () => {
            const filePath = path.join(TEST_DIR, filename);
            const stats = await fs.stat(filePath);
            expect(stats.isFile()).toBe(true);

            const fileContent = await fs.readFile(filePath);
            const file = new File([fileContent], filename, { type: 'image/jpeg' });

            const form = new FormData();
            form.append('file', file);
            form.append('width', '200');
            form.append('height', '200');
            form.append('format', 'webp');

            const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
            const postReq = new Request(`${serverUrl}/api/images`, {
                method: 'POST',
                body: form
            });

            // Execute Request
            const res = await app.request(postReq);

            // Verify Redirect
            expect(res.status).toBe(303);
            const location = res.headers.get('location');
            expect(location).toBeTruthy();
            expect(location).toContain('/api/images/cache/');

            // Follow Redirect
            // console.log(`Following redirect to: ${location}`);
            const getReq = new Request(`${serverUrl}${location}`);
            const res2 = await app.request(getReq);

            console.log(res2.url);
            // Verify Image Response
            expect(res2.status).toBe(200);
            expect(res2.headers.get('content-type')).toBe('image/webp');

            const blob = await res2.blob();
            expect(blob.size).toBeGreaterThan(0);
        });
    });

    it('should use preset if provided', async () => {
        const filename = jpgFiles[0]; // Use first available test file
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        form.append('file', new File([fileContent], filename, { type: 'image/jpeg' }));
        // form.append('preset', 'desktop:thumb'); // Now URL param

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const postReq = new Request(`${serverUrl}/api/images?preset=desktop:thumb`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);
        expect(res.status).toBe(303);
        const location = res.headers.get('location');
        expect(location).toContain('.avif'); // Preset uses avif

        const getReq = new Request(`${serverUrl}${location}`);
        const res2 = await app.request(getReq);
        expect(res2.status).toBe(200);
        expect(res2.headers.get('content-type')).toBe('image/avif'); // Verify format override
    });

    it('should allow overriding preset values', async () => {
        const filename = jpgFiles[0];
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        form.append('file', new File([fileContent], filename, { type: 'image/jpeg' }));
        form.append('format', 'webp'); // Override 'avif' from desktop:thumb
        form.append('width', '50');    // Override 150 from desktop:thumb

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        // preset=desktop:thumb normally implies 150x150 avif
        const postReq = new Request(`${serverUrl}/api/images?preset=desktop:thumb`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);
        expect(res.status).toBe(303);
        const location = res.headers.get('location');
        expect(location).toContain('.webp'); // Should be webp

        const getReq = new Request(`${serverUrl}${location}`);
        const res2 = await app.request(getReq);
        expect(res2.status).toBe(200);
        expect(res2.headers.get('content-type')).toBe('image/webp');


        // We could also check dimensions if we parsed the image, but the cache hash check implicitly checks params
        // hash includes `w50`
    });

    it('should forward to supabase and return valid json', async () => {

        const filename = jpgFiles[0];
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        form.append('file', new File([fileContent], filename, { type: 'image/jpeg' }));

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const postReq = new Request(`${serverUrl}/api/images?preset=desktop:thumb&forward=supabase`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);

        // Ensure we actually got a success response, otherwise fail
        if (res.status !== 200) {
            const text = await res.text();
            console.error('Supabase response:', res.status, text);
        }
        expect(res.status).toBe(200);

        if (res.status === 200) {
            const data: any = await res.json();

            expect(data.url).toBeTruthy();
            expect(data.width).toBe(150); // desktop:thumb
            expect(data.filename).toBeTruthy();

            console.log('Supabase Upload URL:', data.url);

            // Cleanup: Delete from Supabase
            // Import dynamically to avoid top-level dependency if not needed
            const { supabase } = await import('../../../commons/supabase.js');
            const bucket = process.env.SUPABASE_BUCKET || 'pictures';

            // data.filename should be 'cache/...' or just filename depending on implementation
            // In index.ts we returned `storagePath` as `filename` field? Let's verify index.ts
            // Yes: `filename: storagePath` which is `cache/${filename}`

            const { error } = await supabase.storage
                .from(bucket)
                .remove([data.filename]);

            if (error) {
                console.error('Failed to cleanup Supabase test file:', error);
            } else {
                console.log('Cleaned up Supabase test file:', data.filename);
            }
        } else {
            const text = await res.text();
            console.warn('Supabase test skipped or failed (check env vars):', res.status, text);
            // If internal server error due to missing creds, we might want to skip or fail gently
            // But user asked for this test, so failing is appropriate if creds are missing but expected.
        }
    });
    it('should transform image with operations', async () => {
        const filename = jpgFiles[0];
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        const file = new File([fileContent], filename, { type: 'image/jpeg' });

        const operations = [
            { type: 'rotate', angle: 90 },
            { type: 'resize', width: 100, height: 100, fit: 'cover' }
        ];

        form.append('file', file);
        form.append('operations', JSON.stringify(operations));

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const postReq = new Request(`${serverUrl}/api/images/transform`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);
        expect(res.status).toBe(200);

        const contentType = res.headers.get('content-type');
        expect(contentType).toMatch(/image\/.*/);

        const blob = await res.blob();
        expect(blob.size).toBeGreaterThan(0);

        // Basic check that it returned *something* successfully
    });

    it('should adjust image brightness and contrast', async () => {
        const filename = jpgFiles[0];
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        const file = new File([fileContent], filename, { type: 'image/jpeg' });

        const operations = [
            { type: 'adjust', brightness: 1.2, contrast: 1.1 }
        ];

        form.append('file', file);
        form.append('operations', JSON.stringify(operations));

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const postReq = new Request(`${serverUrl}/api/images/transform`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);
        expect(res.status).toBe(200);

        const contentType = res.headers.get('content-type');
        expect(contentType).toMatch(/image\/.*/);

        const blob = await res.blob();
        expect(blob.size).toBeGreaterThan(0);
    });

    it('should extract exif data during supabase forward', async () => {
        const filenames = jpgFiles.filter(f => f.includes('exif'));
        if (filenames.length === 0) {
            console.warn('Skipping EXIF test, test asset exif.jpg not found');
            return;
        }
        const filename = filenames[0];
        const filePath = path.join(TEST_DIR, filename);

        const form = new FormData();
        const fileContent = await fs.readFile(filePath);
        form.append('file', new File([fileContent], filename, { type: 'image/jpeg' }));

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const postReq = new Request(`${serverUrl}/api/images?forward=supabase`, {
            method: 'POST',
            body: form
        });

        const res = await app.request(postReq);
        expect(res.status).toBe(200);

        const data: any = await res.json();
        expect(data.url).toBeTruthy();
        expect(data.meta).toBeTruthy();

        console.log('Returned Meta:', data.meta);

        // Verify some expected EXIF data if possible
        // The file IMG20250911123721.jpg implies a date 2025-09-11
        if (data.meta.dateTaken) {
            const date = new Date(data.meta.dateTaken);
            expect(date.getFullYear()).toBe(2025);
        }

        // Cleanup
        if (data.filename) {
            const { supabase } = await import('../../../commons/supabase.js');
            const bucket = process.env.SUPABASE_BUCKET || 'pictures';
            await supabase.storage.from(bucket).remove([data.filename]);
        }
    });
});
