import { describe, it, expect, beforeAll, afterEach } from 'vitest';

const API_URL = 'http://localhost:3000';

describe('VFS get operations', () => {
    beforeAll(async () => {
        const response = await fetch(`${API_URL}/api/health/api`);
        if (response.status !== 200) {
            throw new Error('API is not healthy');
        }

        // Create a test file for range testing
        const testContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.repeat(100); // 3600 bytes
        await fetch(`${API_URL}/vfs/write/root/${encodeURIComponent('/fs/large-test.txt')}`, {
            method: 'PUT',
            body: testContent,
            headers: { 'Content-Type': 'text/plain' }
        });
    });

    afterEach(async () => {
        // Clean up test files
        try {
            await fetch(`${API_URL}/vfs/delete/root/${encodeURIComponent('/fs/test-get.txt')}`, {
                method: 'DELETE'
            });
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    it('should serve a full file with correct headers', async () => {
        // First create a test file
        const testContent = 'Hello, this is a test file for GET endpoint!';
        await fetch(`${API_URL}/vfs/write/root/${encodeURIComponent('/fs/test-get.txt')}`, {
            method: 'PUT',
            body: testContent
        });

        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs/test-get.txt')}`;
        console.log(`Testing URL: ${url}`);
        
        const response = await fetch(url);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/plain');
        expect(response.headers.get('Accept-Ranges')).toBe('bytes');
        expect(response.headers.get('Content-Length')).toBe(testContent.length.toString());
        
        const content = await response.text();
        expect(content).toBe(testContent);
    });

    it('should handle range requests for partial content', async () => {
        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs/large-test.txt')}`;
        console.log(`Testing URL: ${url}`);
        
        // Request bytes 10-19 (should be "KLMNOPQRST")
        const response = await fetch(url, {
            headers: {
                'Range': 'bytes=10-19'
            }
        });
        
        expect(response.status).toBe(206);
        expect(response.headers.get('Content-Range')).toBe('bytes 10-19/3600');
        expect(response.headers.get('Content-Length')).toBe('10');
        
        const content = await response.text();
        expect(content).toBe('KLMNOPQRST');
    });

    it('should handle suffix range requests', async () => {
        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs/large-test.txt')}`;
        
        // Request last 10 bytes
        const response = await fetch(url, {
            headers: {
                'Range': 'bytes=-10'
            }
        });
        
        expect(response.status).toBe(206);
        expect(response.headers.get('Content-Length')).toBe('10');
        
        const content = await response.text();
        expect(content.length).toBe(10);
    });

    it('should return 416 for invalid range', async () => {
        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs/large-test.txt')}`;
        
        // Request invalid range (beyond file size)
        const response = await fetch(url, {
            headers: {
                'Range': 'bytes=5000-6000'
            }
        });
        
        expect(response.status).toBe(416);
        expect(response.headers.get('Content-Range')).toBe('bytes */3600');
    });

    it('should detect MIME types correctly', async () => {
        // Test JSON file
        const jsonResponse = await fetch(`${API_URL}/vfs/get/root/${encodeURIComponent('/fs/a.json')}`);
        expect(jsonResponse.headers.get('Content-Type')).toBe('application/json');
        
        // Test TypeScript file  
        const tsResponse = await fetch(`${API_URL}/vfs/get/root/${encodeURIComponent('/fs/ls.test.ts')}`);
        expect(tsResponse.headers.get('Content-Type')).toBe('application/typescript');
    });

    it('should return 404 for non-existent files', async () => {
        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs/non-existent.txt')}`;
        const response = await fetch(url);
        
        expect(response.status).toBe(404);
    });

    it('should return 400 for directories', async () => {
        const url = `${API_URL}/vfs/get/root/${encodeURIComponent('/fs')}`;
        const response = await fetch(url);
        
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.error).toBe('Path is a directory');
    });
});
