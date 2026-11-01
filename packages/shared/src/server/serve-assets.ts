
import { OpenAPIHono } from '@hono/zod-openapi'
import { serveStatic } from '@hono/node-server/serve-static'
import path from 'path'

export const registerAssetRoutes = (app: OpenAPIHono) => {
    // Serve manifest.webmanifest from dist root
    app.get('/manifest.webmanifest', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        path: 'manifest.webmanifest'
    }));

    // Serve service worker
    app.get('/sw.js', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        path: 'sw.js'
    }));

    // Serve registerSW.js
    app.get('/registerSW.js', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        path: 'registerSW.js'
    }));

    // Serve workbox assets if they are at root
    app.get('/workbox-*.js', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        rewriteRequestPath: (path) => path // Serve matching file
    }));

    // Serve workbox assets if they are at root
    app.get('/widgets/*', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist/widgets',
        rewriteRequestPath: (path) => path // Serve matching file
    }));

    // Serve root static assets (images, icons, robots.txt, etc)
    app.get('/:file{.+\\.(png|ico|svg|txt|xml)$}', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
    }));

    // Serve static assets from dist
    app.use('/assets/*', async (c, next) => {
        await next();
        if (c.res.ok && c.res.status === 200) {
            c.res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
    });
    app.use('/assets/*', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        onNotFound: (path, c) => {
            return undefined;
        }
    }));

    // Serve embed assets
    app.use('/embed_assets/*', serveStatic({
        root: process.env.CLIENT_DIST_PATH ? path.join(process.env.CLIENT_DIST_PATH, 'client/embed') : '../dist/client/embed',
        onNotFound: (path, c) => {
            return undefined;
        },
        rewriteRequestPath: (path) => path.replace(/^\/embed_assets/, ''),
    }));

    // Fallback to index.html for SPA
    app.get('*', serveStatic({
        root: process.env.CLIENT_DIST_PATH || '../dist',
        path: 'index.html'
    }));
}
