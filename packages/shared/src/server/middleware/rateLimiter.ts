import { Context, Next } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { recordViolation } from './autoBan.js'

// Rate limit configuration from environment variables
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '1', 10)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '50', 10)

console.log('🔒 Rate Limiter Configuration:')
console.log(`   Max: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`)
console.log(`   Auto-ban threshold: ${process.env.AUTO_BAN_THRESHOLD || 10} violations`)


/**
 * Rate limiter middleware configuration
 * Limits requests per user/IP address
 */
export const apiRateLimiter = rateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS, // Time window in milliseconds
    limit: RATE_LIMIT_MAX, // Max requests per window
    standardHeaders: 'draft-6', // Return rate limit info in headers
    keyGenerator: (c: Context) => {
        // Try to get user ID from auth header, fallback to IP
        const authHeader = c.req.header('authorization')
        if (authHeader) {
            // Extract user ID from JWT or auth token if available
            // For now, use the auth header as key
            return `user:${authHeader}`
        }

        // Fallback to IP address
        const forwarded = c.req.header('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown'
        return `ip:${ip}`
    },
    handler: (c: Context) => {
        // Record violation for auto-ban tracking
        const authHeader = c.req.header('authorization')
        let key: string
        if (authHeader) {
            key = `user:${authHeader}`
        } else {
            const forwarded = c.req.header('x-forwarded-for')
            const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown'
            key = `ip:${ip}`
        }

        console.log(`⚠️  Rate limit exceeded for ${key}`)
        recordViolation(key)

        return c.json(
            {
                error: 'Too many requests',
                message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`,
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
            const forwarded = c.req.header('x-forwarded-for')
            const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown'
            return `ip:${ip}`
        },
        handler: (c: Context) => {
            // Record violation for auto-ban tracking
            const authHeader = c.req.header('authorization')
            let key: string
            if (authHeader) {
                key = `user:${authHeader}`
            } else {
                const forwarded = c.req.header('x-forwarded-for')
                const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown'
                key = `ip:${ip}`
            }
            recordViolation(key)

            return c.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Maximum ${limit} requests per ${windowMs}ms`,
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
