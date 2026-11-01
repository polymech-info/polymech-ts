import './zod-setup'
import { serve } from '@hono/node-server'

import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })
import { logger } from './commons/logger.js'
import { WebSocketManager } from './commons/websocket.js';

console.log('Environment Check - SUPABASE_URL:', process.env.SUPABASE_URL ? 'Defined' : 'Missing');
console.log('Environment Check - Current Directory:', process.cwd());

// Import middleware
import { blocklistMiddleware } from './middleware/blocklist.js'
import { autoBanMiddleware } from './middleware/autoBan.js'
import { optionalAuthMiddleware, adminMiddleware } from './middleware/auth.js'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'

// Import endpoints

import { registerProductRoutes, startProducts } from './products/registry.js'

const app = new OpenAPIHono()


// Middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-stainless-os', 'x-stainless-lang', 'x-stainless-arch', 'x-stainless-package-version', 'x-stainless-runtime', 'x-stainless-runtime-version', 'x-stainless-helper-method', 'x-stainless-retry-count'],
  exposeHeaders: ['Content-Length', 'X-Cache'],
  maxAge: 600,
  credentials: true,
}))

// Apply blocklist to all API routes (before rate limiting)
//app.use('/api/*', blocklistMiddleware)
// Apply auto-ban middleware (checks ban.json for auto-banned IPs/users)
//app.use('/api/*', autoBanMiddleware)


// Apply Authentication & Authorization
app.use('/api/*', optionalAuthMiddleware)
app.use('/api/*', adminMiddleware)
//app.use('/api/*', apiRateLimiter)

// Apply compression to all API routes
// Apply compression to all routes (API + Static Assets)
app.use('*', compress())
app.use(secureHeaders({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  xFrameOptions: false,
  contentSecurityPolicy: {
    frameAncestors: ["'self'", "*"]
  }
}))


// Register API routes
import { createLogRoutes, createLogHandlers } from './commons/log-routes-factory.js'
import { registerAssetRoutes } from './serve-assets.js'

// System Logs
const { getRoute: sysGetLogRoute, streamRoute: sysStreamLogRoute } = createLogRoutes('System', '/api/logs/system');
const { getHandler: sysGetLogHandler, streamHandler: sysStreamLogHandler } = createLogHandlers(path.join(process.cwd(), 'app.log'));

app.openapi(sysGetLogRoute, sysGetLogHandler);
app.openapi(sysStreamLogRoute, sysStreamLogHandler);

// Register Product Routes
registerProductRoutes(app)

// Initialize Products
// Products initialized after PgBoss check below

// API Documentation (Development Only)
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  logger.info('Registering API documentation endpoints (development mode)');

  // Swagger UI
  app.doc31('/doc', {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Images API',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  } as any);

  // Swagger UI
  app.get('/ui', swaggerUI({ url: '/doc' }));

  // Scalar API Reference
  app.get('/reference', Scalar({
    spec: {
      url: '/doc',
    },
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
      http: {
        bearer: {
          token: process.env.SCALAR_AUTH_TOKEN || '',
        },
      },
    },
  } as any));

  // Alternative: API Reference at /api/reference
  app.get('/api/reference', Scalar({
    spec: {
      url: '/doc',
    },
    authentication: {
      preferredSecurityScheme: 'bearerAuth',
      http: {
        bearer: {
          token: process.env.SCALAR_AUTH_TOKEN || '',
        },
      },
    },
  } as any));
} else {
  logger.info('API documentation endpoints disabled (production mode)');
}

import {
  postBossJobRoute, postBossJobHandler,
  getBossJobRoute, getBossJobHandler,
  cancelBossJobRoute, cancelBossJobHandler,
  resumeBossJobRoute, resumeBossJobHandler,
  completeBossJobRoute, completeBossJobHandler,
  failBossJobRoute, failBossJobHandler
} from './endpoints/boss.js'

import { startBoss, stopBoss } from './jobs/boss/client.js'
import { registerMockWorkers } from './jobs/boss/workers.js'


// Register PgBoss routes
// @ts-ignore - Route type mismatch
app.openapi(postBossJobRoute, postBossJobHandler)
// @ts-ignore - Route type mismatch
app.openapi(getBossJobRoute, getBossJobHandler)
// @ts-ignore - Route type mismatch
app.openapi(cancelBossJobRoute, cancelBossJobHandler)
// @ts-ignore - Route type mismatch
app.openapi(resumeBossJobRoute, resumeBossJobHandler)
// @ts-ignore - Route type mismatch
app.openapi(completeBossJobRoute, completeBossJobHandler)
// @ts-ignore - Route type mismatch
app.openapi(failBossJobRoute, failBossJobHandler)

// Register Streaming Route
import { getStreamRoute, streamHandler } from './endpoints/stream.js'
app.openapi(getStreamRoute, streamHandler)

// Register Admin Routes
import { registerAdminRoutes } from './endpoints/admin.js'
import { AdminEndpointRegistry } from './commons/registry.js'

// Register restart endpoint as admin-only
AdminEndpointRegistry.register('/api/admin/system/restart', 'POST')
// Register ban management endpoints as admin-only
AdminEndpointRegistry.register('/api/admin/bans', 'GET')
AdminEndpointRegistry.register('/api/admin/bans/unban-ip', 'POST')
AdminEndpointRegistry.register('/api/admin/bans/unban-user', 'POST')
AdminEndpointRegistry.register('/api/admin/bans/violations', 'GET')
registerAdminRoutes(app)

// Register Asset Routes (Static files, SW, SPA fallback)
// IMPORTANT: This MUST be registered AFTER all API routes to prevent the catch-all from intercepting API calls
registerAssetRoutes(app);


// Initialize PgBoss
// Initialize PgBoss and Products
try {
  const boss = await startBoss();
  if (boss) {
    registerMockWorkers();
    try {
      await startProducts(boss);
    } catch (err) {
      logger.error({ err }, 'Failed to init products with Boss');
    }
  } else {
    // Fallback: Start products without Boss
    logger.info('Starting products without PgBoss');
    await startProducts();
  }
} catch (err) {
  logger.error({ err }, 'Failed to init PgBoss');
  // Fallback: Start products without Boss on error
  logger.info('Starting products without PgBoss (after error)');
  await startProducts();
}

const port = parseInt(process.env.PORT || '3333', 10)
logger.info(`Server is running on port ${port}`)
// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const server = serve({
    fetch: app.fetch,
    port
  })

  // Initialize WebSocket Server
  if (process.env.ENABLE_WEBSOCKETS === 'true') {
    WebSocketManager.getInstance().init(server as any);
  }

  let isShuttingDown = false;
  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Already shutting down...');
      return;
    }
    isShuttingDown = true;

    // Force exit after a timeout
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
  process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK')); // For Windows
}

export { app }
