import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '@/index.js';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Dedicated Test Logger
const testLogFile = path.join(logsDir, 'test-cache.log');
const testLogger = pino({
    level: 'info',
    base: { module: 'test-logger-cache' },
}, pino.transport({
    targets: [
        {
            target: 'pino/file',
            options: { destination: testLogFile, mkdir: true }
        },
        {
            target: 'pino-pretty',
            options: { colorize: true, destination: 1 }
        }
    ]
}));
// Test Control Flags
const RUN_FEED_CACHE_TEST = true;
const RUN_POST_CACHE_TEST = true;
const RUN_PAGE_CACHE_TEST = true;
const RUN_INVALIDATION_TEST = true;
const RUN_STREAM_TEST = true;
const RUN_CATEGORY_CACHE_TEST = true;
const RUN_TYPE_CACHE_TEST = true;

// Config vars from env
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const POST_ID = process.env.TEST_CACHE_POST_ID;
const PAGE_ID = process.env.TEST_CACHE_PAGE_ID;
const CATEGORY_NAME_BASE = process.env.TEST_CACHE_CATEGORY_NAME || 'test';
const TEST_USERNAME = process.env.TEST_CACHE_USERNAME || 'cgo';
const TEST_PAGE_SLUG = process.env.TEST_CACHE_PAGE_SLUG || 'test-page';

describe('Cache System E2E', () => {
    let authToken: string | null = null;
    let createdCategoryId: string | null = null;

    beforeAll(async () => {
        testLogger.info('Starting Cache E2E Tests setup...');
        // Login to get token
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            testLogger.warn('Skipping login - missing credentials');
            return;
        }

        const { supabase } = await import('../../../commons/supabase.js');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        if (error) {
            testLogger.error({ error }, 'Login failed');
            throw error;
        }
        authToken = data.session?.access_token || null;
        testLogger.info('Login successful');
    });

    (RUN_FEED_CACHE_TEST ? it : it.skip)('should cache feed requests (HIT/MISS)', async () => {
        testLogger.info('Testing Feed Caching...');

        // Fetch Feed Page 0
        const res1 = await app.request('/api/feed?page=0&limit=5');
        expect(res1.status).toBe(200);
        const cacheStatus1 = res1.headers.get('X-Cache');
        testLogger.info({ cacheStatus: cacheStatus1 }, 'Feed request 1');

        // Fetch Feed Page 0 Again -> Expect HIT
        const res2 = await app.request('/api/feed?page=0&limit=5');
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Feed request 2 (HIT confirmed)');
    });

    (RUN_POST_CACHE_TEST ? it : it.skip)('should cache specific post details', async () => {
        testLogger.info('Testing Post Caching...');

        if (!POST_ID) {
            testLogger.warn('Skipping post cache test - missing TEST_CACHE_POST_ID');
            return;
        }

        // Fetch Post
        const res1 = await app.request(`/api/posts/${POST_ID}`);
        if (res1.status === 404) {
            testLogger.warn(`Post ${POST_ID} not found, skipping`);
            return;
        }
        expect(res1.status).toBe(200);
        testLogger.info({ cacheStatus: res1.headers.get('X-Cache') }, 'Post request 1');

        // Fetch Again -> Expect HIT
        const res2 = await app.request(`/api/posts/${POST_ID}`);
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Post request 2 (HIT confirmed)');
    });

    (RUN_PAGE_CACHE_TEST ? it : it.skip)('should cache user page requests', async () => {
        testLogger.info('Testing User Page Caching...');

        if (!PAGE_ID) {
            testLogger.warn('Skipping page cache test - missing TEST_CACHE_PAGE_ID');
            return;
        }

        // Fetch User Page (using TEST_USERNAME and TEST_PAGE_SLUG)
        const res1 = await app.request(`/api/user-page/${TEST_USERNAME}/${TEST_PAGE_SLUG}`);
        if (res1.status === 404) {
            testLogger.warn(`User page for ${TEST_USERNAME}/${TEST_PAGE_SLUG} not found, skipping`);
            return;
        }
        expect(res1.status).toBe(200);
        // We aren't checking X-Cache on first request because it might be MISS or HIT depending on previous tests.
        testLogger.info({ cacheStatus: res1.headers.get('X-Cache') }, 'Page request 1');

        // Fetch Again -> Expect HIT
        const res2 = await app.request(`/api/user-page/${TEST_USERNAME}/${TEST_PAGE_SLUG}`);
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Page request 2 (HIT confirmed)');
    });

    (RUN_CATEGORY_CACHE_TEST ? it : it.skip)('should cache category list requests', async () => {
        testLogger.info('Testing Category List Caching...');

        // Fetch Categories
        const res1 = await app.request('/api/categories');
        expect(res1.status).toBe(200);
        const cacheStatus1 = res1.headers.get('X-Cache');
        testLogger.info({ cacheStatus: cacheStatus1 }, 'Category list request 1');

        // Fetch Again -> Expect HIT
        const res2 = await app.request('/api/categories');
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Category list request 2 (HIT confirmed)');
    });

    (RUN_TYPE_CACHE_TEST ? it : it.skip)('should cache type list requests', async () => {
        testLogger.info('Testing Type List Caching...');

        // Fetch Types
        const res1 = await app.request('/api/types');
        expect(res1.status).toBe(200);
        const cacheStatus1 = res1.headers.get('X-Cache');
        testLogger.info({ cacheStatus: cacheStatus1 }, 'Type list request 1');

        // Fetch Again -> Expect HIT
        const res2 = await app.request('/api/types');
        expect(res2.status).toBe(200);
        expect(res2.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Type list request 2 (HIT confirmed)');
    });

    (RUN_TYPE_CACHE_TEST ? it : it.skip)('should invalidate type cache on update', async () => {
        testLogger.info('Testing Type Invalidation...');

        if (!authToken) {
            testLogger.warn('Skipping type invalidation test - missing token');
            return;
        }

        // 1. Create a Temp Type
        const payload = {
            name: `Test Type Inval ${Date.now()}`,
            kind: 'structure',
            description: 'Temp type for invalidation',
            structure_fields: []
        };

        const createRes = await app.request('/api/types', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        expect(createRes.status).toBe(200);
        const typeData = await createRes.json();
        const typeId = typeData.id;

        // 2. Fetch Types -> Ensure Cache is populated with new type (or at least valid)
        await app.request('/api/types');
        const resHit = await app.request('/api/types');
        expect(resHit.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Types cache established (HIT)');

        // 3. Update the Type
        testLogger.info('Updating type to trigger invalidation...');
        const updateRes = await app.request(`/api/types/${typeId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: 'Updated for invalidation test' })
        });
        expect(updateRes.status).toBe(200);

        // 4. Wait for propagation
        // The event listener for 'app-update' invokes cache.flush (or similar), 
        // AND db-types calls flushTypeCache -> AppCache.invalidate('types')
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. Fetch Types -> Should be HIT (because updateTypeServer triggers a reload)
        // But the content MUST be updated.
        const resMiss = await app.request('/api/types');
        expect(resMiss.status).toBe(200);
        expect(resMiss.headers.get('X-Cache')).toBe('HIT');

        const typesList = await resMiss.json();
        const updatedType = typesList.find((t: any) => t.id === typeId);
        expect(updatedType).toBeDefined();
        expect(updatedType.description).toBe('Updated for invalidation test');

        testLogger.info('Types cache refreshed with new data (HIT)');

        // Cleanup
        await app.request(`/api/types/${typeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    });

    (RUN_INVALIDATION_TEST ? it : it.skip)('should invalidate dependent caches (posts) when category is updated', async () => {
        testLogger.info('Testing Dependency Invalidation...');

        if (!authToken || !POST_ID) {
            testLogger.warn('Skipping invalidation test - missing token or POST_ID');
            return;
        }

        // 1. Fetch Post -> Ensure Cache is populated (expect HIT or MISS, but ensure it ends up in cache)
        await app.request(`/api/posts/${POST_ID}`);
        const resHit = await app.request(`/api/posts/${POST_ID}`);
        expect(resHit.status).toBe(200);
        expect(resHit.headers.get('X-Cache')).toBe('HIT');
        testLogger.info('Post cache established (HIT)');

        // 2. Create a Temp Category to Update
        // We need a category to update to trigger the event. It doesn't even need to be related to the post
        // because the current implementation invalidates ALL posts on ANY category update.
        // But to be "correct" let's create one.

        const payload = {
            name: `${CATEGORY_NAME_BASE} Inval Test`,
            slug: `${CATEGORY_NAME_BASE}-inval-${Date.now()}`,
            description: 'Temp category for invalidation'
        };

        const createRes = await app.request('/api/categories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        expect(createRes.status).toBe(200);
        const catData = await createRes.json();
        createdCategoryId = catData.id;

        // 3. Update the Category
        testLogger.info('Updating category to trigger invalidation...');
        const updateRes = await app.request(`/api/categories/${createdCategoryId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: 'Updated for invalidation test' })
        });
        expect(updateRes.status).toBe(200);

        // 4. Wait for propagation
        // The event listener for 'app-update' invokes cache.flush (or similar), 
        // AND db-categories calls flushCategoryCache -> AppCache.invalidate('categories') -> 'posts'
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. Fetch Post -> Should be MISS
        const resMiss = await app.request(`/api/posts/${POST_ID}`);
        expect(resMiss.status).toBe(200);
        // db-posts.ts logic: "posts" cache key deleted. Next fetch should be MISS.
        expect(resMiss.headers.get('X-Cache')).toBe('MISS');
        testLogger.info('Post cache invalidated successfully (MISS)');

        // Cleanup
        if (createdCategoryId) {
            await app.request(`/api/categories/${createdCategoryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        }
    });

    (RUN_STREAM_TEST && RUN_TYPE_CACHE_TEST ? it : it.skip)('should stream type invalidation events', async () => {
        testLogger.info('Testing Type Streaming Endpoint...');

        if (!authToken) return;

        // 1. Start Stream
        const res = await app.request('/api/stream');
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        const receivedEvents: any[] = [];

        // Background reader
        (async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.trim().substring(6));
                                receivedEvents.push(data);
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) { }
        })();

        // 2. Create & Update Type
        const payload = {
            name: `Test Type Stream ${Date.now()}`,
            kind: 'structure'
        };

        const createRes = await app.request('/api/types', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const typeData = await createRes.json();
        const typeId = typeData.id;

        // Update (Triggers Events) - Update -> flushTypeCache -> appCache.invalidate('types') -> emit 'types' delete
        await app.request(`/api/types/${typeId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Update for stream' })
        });

        // 3. Wait
        await new Promise(resolve => setTimeout(resolve, 1500));
        await reader.cancel();

        // 4. Verify
        const typesEvent = receivedEvents.find(e => {
            return (e.type === 'types') && e.action === 'delete';
        });

        testLogger.info({ receivedEvents }, 'Streamed events received for Types');
        expect(typesEvent).toBeDefined();

        // Cleanup
        await app.request(`/api/types/${typeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    });

    (RUN_STREAM_TEST ? it : it.skip)('should stream cache invalidation events', async () => {
        testLogger.info('Testing Streaming Endpoint...');

        if (!authToken) {
            testLogger.warn('Skipping stream test - missing auth token');
            return;
        }

        // 1. Start Stream
        const res = await app.request('/api/stream');
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/event-stream');

        if (!res.body) throw new Error('No body in stream response');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const receivedEvents: any[] = [];

        // Background reader
        (async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.trim().substring(6));
                                receivedEvents.push(data);
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) {
                // ignore tracking errors (abort)
            }
        })();

        // 2. Configure & Trigger Update
        const payload = {
            name: `${CATEGORY_NAME_BASE} Stream`,
            slug: `${CATEGORY_NAME_BASE}-stream-${Date.now()}`,
            description: 'Stream Test Category'
        };

        // Create
        const createRes = await app.request('/api/categories', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const catData = await createRes.json();
        const tempId = catData.id;

        // Update (Triggers Events)
        await app.request(`/api/categories/${tempId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: 'Update for stream' })
        });

        // 3. Wait for events to arrive
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 4. Close Stream
        await reader.cancel();
        // await readPromise; // might hang if not careful, validation below is enough

        // 5. Verify Events
        // We expect AppCache to emit 'delete' events for 'categories' AND recursive 'posts', 'pages'
        const categoriesEvent = receivedEvents.find(e => e.type === 'categories' && e.action === 'delete');
        const postsEvent = receivedEvents.find(e => e.type === 'posts' && e.action === 'delete');
        const pagesEvent = receivedEvents.find(e => e.type === 'pages' && e.action === 'delete');

        testLogger.info({ receivedEvents }, 'Streamed events received');

        expect(categoriesEvent).toBeDefined();
        expect(postsEvent).toBeDefined();
        expect(pagesEvent).toBeDefined();

        // Cleanup
        await app.request(`/api/categories/${tempId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    });

    (RUN_STREAM_TEST ? it : it.skip)('should stream client-initiated invalidation events', async () => {
        if (!authToken) return;

        // 1. Start Stream
        const res = await app.request('/api/stream');
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        const receivedEvents: any[] = [];

        // Background reader
        (async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.trim().substring(6));
                                receivedEvents.push(data);
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) { }
        })();

        // 2. Trigger Client Invalidation
        const invalRes = await app.request('/api/cache/invalidate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ types: ['posts', 'pages'] })
        });
        expect(invalRes.status).toBe(200);

        // 3. Wait
        await new Promise(resolve => setTimeout(resolve, 1000));
        await reader.cancel();

        // 4. Verify
        const postsEvent = receivedEvents.find(e => e.type === 'posts' && e.action === 'delete');
        const pagesEvent = receivedEvents.find(e => e.type === 'pages' && e.action === 'delete');

        expect(postsEvent).toBeDefined();
        expect(pagesEvent).toBeDefined();
    });
});
