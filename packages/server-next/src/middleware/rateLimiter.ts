import { Context, Next } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { recordViolation } from './autoBan.js'
import { getClientIpFromHono } from './ip.js'

// Rate limit configuration from environment variables
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '500', 10)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)

console.log('🔒 Rate Limiter Configuration:')
console.log(`   Max: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`)
console.log(`   Auto-ban threshold: ${process.env.AUTO_BAN_THRESHOLD || 50} violations`)


/**
 * Rate limiter middleware configuration
 * Limits requests per user/IP address
 */
export const apiRateLimiter = rateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
    standardHeaders: 'draft-6',
    keyGenerator: (c: Context) => {
        const authHeader = c.req.header('authorization')
        if (authHeader) {
            return `user:${authHeader}`
        }
        const ip = getClientIpFromHono(c) || 'unknown'
        return `ip:${ip}`
    },
    handler: (c: Context) => {
        const authHeader = c.req.header('authorization')
        let key: string
        if (authHeader) {
            key = `user:${authHeader}`
        } else {
            const ip = getClientIpFromHono(c) || 'unknown'
            key = `ip:${ip}`
        }

        console.log(`⚠️  [apiRateLimiter] Rate limit exceeded for ${key}`)
        recordViolation(key)

        return c.json(
            {
                error: 'Too many requests',
                message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`,
                source: 'apiRateLimiter',
                key,
                limit: RATE_LIMIT_MAX,
                windowMs: RATE_LIMIT_WINDOW_MS,
                path: c.req.path,
            },
            429
        )
    },
})

/**
 * Custom rate limiter for specific endpoints with different limits
 */
export function createCustomRateLimiter(limit: number, windowMs: number) {
    return rateLimiter({
        windowMs,
        limit,
        standardHeaders: 'draft-6',
        keyGenerator: (c: Context) => {
            const authHeader = c.req.header('authorization')
            if (authHeader) {
                return `user:${authHeader}`
            }
            const ip = getClientIpFromHono(c) || 'unknown'
            return `ip:${ip}`
        },
        handler: (c: Context) => {
            const authHeader = c.req.header('authorization')
            let key: string
            if (authHeader) {
                key = `user:${authHeader}`
            } else {
                const ip = getClientIpFromHono(c) || 'unknown'
                key = `ip:${ip}`
            }
            recordViolation(key)

            return c.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Maximum ${limit} requests per ${windowMs}ms`,
                    source: 'customRateLimiter',
                    key,
                    path: c.req.path,
                },
                429
            )
        },
    })
}

// Export configuration for testing
export const rateLimitConfig = {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
}
