import { describe, it, expect, beforeAll, afterEach } from 'vitest';

const API_URL = 'http://localhost:3000';

describe('VFS write operations', () => {
    beforeAll(async () => {
        const response = await fetch(`${API_URL}/api/health/api`);
        if (response.status !== 200) {
            throw new Error('API is not healthy');
        }
    });

    afterEach(async () => {
        // Clean up test files after each test
        try {
            await fetch(`${API_URL}/vfs/delete/root/${encodeURIComponent('/fs/test-write.txt')}`, {
                method: 'DELETE'
            });
            await fetch(`${API_URL}/vfs/delete/root/${encodeURIComponent('/fs/test-upload.txt')}`, {
                method: 'DELETE'
            });
            await fetch(`${API_URL}/vfs/delete/root/${encodeURIComponent('/fs/test-dir')}`, {
                method: 'DELETE'
            });
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    it('should write file content via PUT', async () => {
        const url = `${API_URL}/vfs/write/root/${encodeURIComponent('/fs/test-write.txt')}`;
        console.log(`Testing URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'PUT',
            body: 'Hello, VFS World!',
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        
        const responseBody = await response.json();
        console.log('Write response:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        expect(responseBody.success).toBe(true);
        
        // Verify the file was created by reading it back
        const readResponse = await fetch(`${API_URL}/vfs/read/root/${encodeURIComponent('/fs/test-write.txt')}`);
        const content = await readResponse.text();
        expect(content).toBe('Hello, VFS World!');
    });

    it('should upload a file via POST', async () => {
        const url = `${API_URL}/vfs/upload/root/${encodeURIComponent('/fs/test-upload.txt')}`;
        console.log(`Testing URL: ${url}`);
        
        const formData = new FormData();
        const file = new File(['Uploaded file content'], 'test-upload.txt', { type: 'text/plain' });
        formData.append('file', file);
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const responseBody = await response.json();
        console.log('Upload response:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        expect(responseBody.success).toBe(true);
        
        // Verify the file was uploaded by reading it back
        const readResponse = await fetch(`${API_URL}/vfs/read/root/${encodeURIComponent('/fs/test-upload.txt')}`);
        const content = await readResponse.text();
        expect(content).toBe('Uploaded file content');
    });

    it('should create a directory', async () => {
        const url = `${API_URL}/vfs/mkdir/root/${encodeURIComponent('/fs/test-dir')}`;
        console.log(`Testing URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST'
        });
        
        const responseBody = await response.json();
        console.log('Mkdir response:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        expect(responseBody.success).toBe(true);
        
        // Verify the directory was created by listing the parent
        const listResponse = await fetch(`${API_URL}/vfs/ls/root/${encodeURIComponent('/fs')}`);
        const files = await listResponse.json();
        const names = files.map((f: any) => f.name);
        expect(names).toContain('test-dir');
    });

    it('should delete a file', async () => {
        // First create a file to delete
        const writeUrl = `${API_URL}/vfs/write/root/${encodeURIComponent('/fs/test-delete.txt')}`;
        await fetch(writeUrl, {
            method: 'PUT',
            body: 'File to be deleted'
        });
        
        // Now delete it
        const deleteUrl = `${API_URL}/vfs/delete/root/${encodeURIComponent('/fs/test-delete.txt')}`;
        console.log(`Testing URL: ${deleteUrl}`);
        
        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });
        
        const responseBody = await response.json();
        console.log('Delete response:', JSON.stringify(responseBody, null, 2));
        expect(response.status).toBe(200);
        expect(responseBody.success).toBe(true);
        
        // Verify the file was deleted
        const readResponse = await fetch(`${API_URL}/vfs/read/root/${encodeURIComponent('/fs/test-delete.txt')}`);
        expect(readResponse.status).toBe(404);
    });
});
