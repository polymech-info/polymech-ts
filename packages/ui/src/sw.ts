/// <reference lib="webworker" />
/**
 * Minimal service worker: Web Share Target only (see manifest.webmanifest share_target).
 * No app shell / asset / navigation caching — the network handles everything else.
 */
import { precacheAndRoute } from 'workbox-precaching';
import { set } from 'idb-keyval';

declare let self: ServiceWorkerGlobalScope;

// Required by vite-plugin-pwa injectManifest; globPatterns in vite.config.ts are empty.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            // Drop caches from older SW versions that used Workbox caching.
            const keys = await caches.keys();
            await Promise.all(keys.map((name) => caches.delete(name)));
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (
        event.request.method === 'POST' &&
        url.pathname === '/upload-share-target'
    ) {
        event.respondWith(handleShareTarget(event.request));
    }
});

async function handleShareTarget(request: Request): Promise<Response> {
    try {
        const formData = await request.formData();
        const files = formData.getAll('file');
        const title = formData.get('title');
        const text = formData.get('text');
        const urlField = formData.get('url');

        await set('share-target', {
            files,
            title,
            text,
            url: urlField,
            timestamp: Date.now(),
        });

        return Response.redirect('/new?shared=true&sw_status=success', 303);
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return Response.redirect(
            '/new?shared=true&sw_status=error&sw_error=' + encodeURIComponent(errMsg),
            303
        );
    }
}
