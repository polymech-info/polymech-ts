import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { Scalar } from '@scalar/hono-api-reference'
import { logger } from './commons/logger.js'

/**
 * Register API documentation endpoints.
 * No-ops in production — only active when NODE_ENV !== 'production'.
 */
export function setup(app: OpenAPIHono) {
    if (process.env.NODE_ENV === 'production') {
        logger.info('API documentation endpoints disabled (production mode)');
        return;
    }

    logger.info('Registering API documentation endpoints (development mode)');

    // OpenAPI spec
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
        security: [{ bearerAuth: [] }],
    } as any);

    // Swagger UI
    app.get('/ui', swaggerUI({ url: '/doc' }));

    // Scalar API Reference
    const scalarConfig: any = {
        spec: { url: '/doc' },
        authentication: {
            preferredSecurityScheme: 'bearerAuth',
            httpBearer: { token: process.env.SCALAR_AUTH_TOKEN || '' },
        },
    };
    app.get('/reference', Scalar(scalarConfig));
    app.get('/api/reference', Scalar(scalarConfig));
}
