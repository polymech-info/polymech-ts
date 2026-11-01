import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = 'http://localhost:3000';

describe('VFS ls endpoint', () => {
    beforeAll(async () => {
        const response = await fetch(`${API_URL}/api/health/api`);
        if (response.status !== 200) {
            throw new Error('API is not healthy');
        }
    });

    it('should list files and directories in the root', async () => {
        const url = `${API_URL}/vfs/ls/root`;
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url);
        const responseBody = await response.json();
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        const names = responseBody.map((f: any) => f.name).sort();
        expect(names).toEqual(['fs']);
    });

    it('should list files in a subfolder', async () => {
        const url = `${API_URL}/vfs/ls/root/${encodeURIComponent('/fs')}`;
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url);
        const responseBody = await response.json();
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        const names = responseBody.map((f: any) => f.name).sort();
        expect(names).toContain('a.json');
        expect(names).toContain('file1.json'); 
        expect(names).toContain('file2.json');
        expect(names).toContain('subfolder');
    });

    it('should filter files with a glob pattern', async () => {
        const url = `${API_URL}/vfs/ls/root/${encodeURIComponent('/fs')}?glob=${encodeURIComponent('*.json')}`;
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url);
        const responseBody = await response.json();
        console.log('Response body:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        const names = responseBody.map((f: any) => f.name).sort();
        expect(names).toEqual(['a.json', 'file1.json', 'file2.json']);
    });

    it('should return 404 for a non-existent directory', async () => {
        const url = `${API_URL}/vfs/ls/root/fs/non-existent-folder`;
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url);
        expect(response.status).toBe(404);
    });
});
