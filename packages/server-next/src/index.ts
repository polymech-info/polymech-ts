import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })
dotenv.config({
  path: path.resolve(process.cwd(), '.env.zitadel.local'),
  override: true,
})

import { logger } from './commons/logger.js'

// Import middleware
import { blocklistMiddleware } from './middleware/blocklist.js'
import { autoBanMiddleware } from './middleware/autoBan.js'
import { optionalAuthMiddleware, adminMiddleware } from './middleware/auth.js'
// import { apiRateLimiter } from './middleware/rateLimiter.js'

import { compress } from 'hono/compress'
import * as csp from './middleware/csp.js'

const app = new OpenAPIHono()

// CSP, secure headers & CORS (Must be first to intercept OPTIONS preflights)
// csp.setup(app)

// Apply blocklist to all API routes (before rate limiting)
app.use('/api/*', blocklistMiddleware)
// Apply auto-ban middleware GLOBALLY — catches path-traversal probes on any route,
// not just /api/*. Also enforces rate-limit bans for API traffic.
app.use('*', autoBanMiddleware)
// Apply Analytics (tracks requests to file)

// Apply Authentication & Authorization
app.use('/api/*', optionalAuthMiddleware)
app.use('/api/*', adminMiddleware)
// app.use('/api/*', apiRateLimiter)

// Apply compression to all routes (API + Static Assets)
app.use('*', compress())

// Custom compression middleware for 3D models (Hono's compress ignores model/stl, model/obj, etc.)
app.use('*', async (c, next) => {
  await next()
  const contentType = c.res.headers.get('Content-Type')
  if (contentType &&
    (contentType.startsWith('model/') || contentType.includes('vnd.dxf') || contentType.includes('image/vnd.dxf')) &&
    !c.res.headers.has('Content-Encoding')) {
    const accepted = c.req.header('Accept-Encoding')
    if (accepted && accepted.includes('gzip') && c.res.body) {
      const stream = new CompressionStream('gzip')
      c.res = new Response(c.res.body.pipeThrough(stream), c.res)
      c.res.headers.delete('Content-Length')
      c.res.headers.set('Content-Encoding', 'gzip')
    }
  }
})

import * as serveDocs from './serve-docs.js'
import { createServer } from 'node:http'
import { getRequestListener } from '@hono/node-server'

serveDocs.setup(app)

async function startServer() {
  const port = parseInt(process.env.PORT || '3333', 10)
  logger.info(`Server is running on port ${port}`)

  const honoListener = getRequestListener(app.fetch);

  const server = createServer((req, res) => {
    honoListener(req, res);
  });

  let isShuttingDown = false;
  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Already shutting down...');
      return;
    }
    isShuttingDown = true;

    const timeout = setTimeout(() => {
      logger.warn('Shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 5000);

    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
      } else {
        console.log('HTTP server closed.');
      }
      clearTimeout(timeout);
      console.log('Gracefully shut down.');
      process.exit(err ? 1 : 0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK')); // Windows

  server.listen(port);
}

// Only start the server if not in test mode
async function main() {
  await startServer();
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  void main();
}

export { app }
