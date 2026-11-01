import pino from 'pino';

export const logger = pino({
    name: 'astro-product',
    level: process.env.LOG_LEVEL || 'info',
});
