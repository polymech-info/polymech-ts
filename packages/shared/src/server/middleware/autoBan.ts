import { Context, Next } from 'hono'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { logger, securityLogger } from '../commons/logger.js'

interface BanList {
    bannedIPs: string[]
    bannedUserIds: string[]
    bannedTokens: string[]
}

interface ViolationRecord {
    count: number
    firstViolation: number
    lastViolation: number
}

// Configuration
const BAN_THRESHOLD = parseInt(process.env.AUTO_BAN_THRESHOLD || '5', 10) // Number of violations before ban
const VIOLATION_WINDOW_MS = parseInt(process.env.AUTO_BAN_WINDOW_MS || '10000', 10) // 1 minute default
const VIOLATION_CLEANUP_INTERVAL = 10000 // Clean up old violations every minute

console.log('Auto-ban configured with:', {
    threshold: BAN_THRESHOLD,
    window: VIOLATION_WINDOW_MS / 60000,
    cleanupInterval: VIOLATION_CLEANUP_INTERVAL / 60000
})

// In-memory violation tracking
const violations = new Map<string, ViolationRecord>()

let banList: BanList = {
    bannedIPs: [],
    bannedUserIds: [],
    bannedTokens: [],
}

/**
 * Load ban list from JSON file
 */
export function loadBanList(): BanList {
    try {
        const banListPath = join(process.cwd(), 'config', 'ban.json')
        const data = readFileSync(banListPath, 'utf-8')
        banList = JSON.parse(data)
        logger.info({
            ips: banList.bannedIPs.length,
            users: banList.bannedUserIds.length,
            tokens: banList.bannedTokens.length
        }, 'Ban list loaded')
        return banList
    } catch (error) {
        logger.error({ error }, 'Failed to load ban list')
        return banList
    }
}

/**
 * Save ban list to JSON file
 */
function saveBanList(): void {
    try {
        const banListPath = join(process.cwd(), 'config', 'ban.json')
        writeFileSync(banListPath, JSON.stringify(banList, null, 4), 'utf-8')
        logger.info('Ban list saved')
    } catch (error) {
        logger.error({ error }, 'Failed to save ban list')
    }
}

/**
 * Get current ban list
 */
export function getBanList(): BanList {
    return banList
}

/**
 * Check if an IP is banned
 */
export function isIPBanned(ip: string): boolean {
    return banList.bannedIPs.includes(ip)
}

/**
 * Check if a user ID is banned
 */
export function isUserBanned(userId: string): boolean {
    return banList.bannedUserIds.includes(userId)
}

/**
 * Check if an auth token is banned
 */
export function isTokenBanned(token: string): boolean {
    return banList.bannedTokens.includes(token)
}

/**
 * Extract IP address from request
 */
function getClientIP(c: Context): string {
    // Check forwarded headers first (for proxies)
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    const realIp = c.req.header('x-real-ip')
    if (realIp) {
        return realIp
    }

    // Fallback to connection IP (works for localhost)
    // In Node.js/Hono, we can try to get the remote address
    try {
        // @ts-ignore - accessing internal request object
        const remoteAddress = c.req.raw?.socket?.remoteAddress || c.env?.ip
        if (remoteAddress) {
            return remoteAddress
        }
    } catch (e) {
        // Ignore errors
    }

    // Last resort: use localhost identifier
    return '127.0.0.1'
}

/**
 * Extract user ID from authorization header
 */
function getUserId(c: Context): string | null {
    const authHeader = c.req.header('authorization')
    if (!authHeader) return null
    return authHeader
}

/**
 * Record a rate limit violation
 */
export function recordViolation(key: string): void {
    const now = Date.now()
    const existing = violations.get(key)

    if (existing) {
        // Check if violation is within the window
        if (now - existing.firstViolation <= VIOLATION_WINDOW_MS) {
            existing.count++
            existing.lastViolation = now
            violations.set(key, existing)

            // Check if threshold exceeded
            if (existing.count >= BAN_THRESHOLD) {
                banEntity(key)
            }
        } else {
            // Reset violation count if outside window
            violations.set(key, {
                count: 1,
                firstViolation: now,
                lastViolation: now,
            })
        }
    } else {
        // First violation
        violations.set(key, {
            count: 1,
            firstViolation: now,
            lastViolation: now,
        })
    }

    logger.debug({ key, violations: violations.get(key) }, 'Violation recorded')
}

/**
 * Ban an entity (IP, user, or token)
 */
function banEntity(key: string): void {
    const [type, value] = key.split(':', 2)
    const violationRecord = violations.get(key)

    let added = false
    if (type === 'ip' && !banList.bannedIPs.includes(value)) {
        banList.bannedIPs.push(value)
        added = true

        // Log to security.json
        securityLogger.warn({
            event: 'auto_ban',
            type: 'ip',
            ip: value,
            violations: violationRecord?.count,
            firstViolation: violationRecord?.firstViolation,
            lastViolation: violationRecord?.lastViolation
        }, 'IP auto-banned for excessive requests')

        // Also log to console
        logger.info({ ip: value, violations: violationRecord?.count }, '🚫 IP auto-banned for excessive requests')

    } else if (type === 'user' && !banList.bannedUserIds.includes(value)) {
        banList.bannedUserIds.push(value)
        added = true

        // Log to security.json
        securityLogger.warn({
            event: 'auto_ban',
            type: 'user',
            userId: value,
            violations: violationRecord?.count,
            firstViolation: violationRecord?.firstViolation,
            lastViolation: violationRecord?.lastViolation
        }, 'User auto-banned for excessive requests')

        // Also log to console
        logger.info({ userId: value, violations: violationRecord?.count }, '🚫 User auto-banned for excessive requests')

    } else if (type === 'token' && !banList.bannedTokens.includes(value)) {
        banList.bannedTokens.push(value)
        added = true

        // Log to security.json
        securityLogger.warn({
            event: 'auto_ban',
            type: 'token',
            token: value.substring(0, 20) + '...',
            violations: violationRecord?.count,
            firstViolation: violationRecord?.firstViolation,
            lastViolation: violationRecord?.lastViolation
        }, 'Token auto-banned for excessive requests')

        // Also log to console
        logger.info({ token: value.substring(0, 20) + '...', violations: violationRecord?.count }, '🚫 Token auto-banned for excessive requests')
    }

    if (added) {
        saveBanList()
        // Clear violation record after ban
        violations.delete(key)
    }
}

/**
 * Clean up old violation records
 */
function cleanupViolations(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, record] of violations.entries()) {
        if (now - record.lastViolation > VIOLATION_WINDOW_MS) {
            violations.delete(key)
            cleaned++
        }
    }

    if (cleaned > 0) {
        logger.debug({ cleaned }, 'Cleaned up old violation records')
    }
}

/**
 * Auto-ban middleware
 * Checks if request is from a banned entity
 */

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '20', 10)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10)

export async function autoBanMiddleware(c: Context, next: Next) {
    const ip = getClientIP(c)
    const authHeader = c.req.header('authorization')
    const userId = getUserId(c)
    const path = c.req.path
    const method = c.req.method

    // Generate key for rate limiting
    let key: string
    if (authHeader) {
        key = `user:${authHeader}`
    } else {
        key = `ip:${ip}`
    }

    // Check if IP is banned
    if (isIPBanned(ip)) {
        /*
        securityLogger.info({
            event: 'blocked_request',
            type: 'ip',
            ip,
            path,
            method
        }, 'Blocked request from banned IP')
        */

        // logger.info({ ip, path }, '🚫 Blocked request from banned IP')

        return c.json(
            {
                error: 'Forbidden',
                message: 'Your IP address has been banned for excessive requests',
            },
            403
        )
    }

    // Check if auth token is banned
    if (authHeader && isTokenBanned(authHeader)) {
        securityLogger.info({
            event: 'blocked_request',
            type: 'token',
            token: authHeader.substring(0, 20) + '...',
            path,
            method
        }, 'Blocked request from banned token')

        logger.info({ token: authHeader.substring(0, 20) + '...', path }, '🚫 Blocked request from banned token')

        return c.json(
            {
                error: 'Forbidden',
                message: 'Your access token has been banned for excessive requests',
            },
            403
        )
    }

    // Check if user ID is banned
    if (userId && isUserBanned(userId)) {
        securityLogger.info({
            event: 'blocked_request',
            type: 'user',
            userId,
            path,
            method
        }, 'Blocked request from banned user')

        logger.info({ userId, path }, '🚫 Blocked request from banned user')

        return c.json(
            {
                error: 'Forbidden',
                message: 'Your account has been banned for excessive requests',
            },
            403
        )
    }

    // Built-in rate limiting (since hono-rate-limiter isn't working)
    const now = Date.now()
    const record = requestCounts.get(key)

    if (record) {
        if (now < record.resetTime) {
            // Within the window
            record.count++

            if (record.count > RATE_LIMIT_MAX) {
                // Rate limit exceeded!
                console.log(`⚠️  Rate limit exceeded for ${key} (${record.count}/${RATE_LIMIT_MAX})`)
                recordViolation(key)

                return c.json(
                    {
                        error: 'Too many requests',
                        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`,
                    },
                    429
                )
            }
        } else {
            // Window expired, reset
            record.count = 1
            record.resetTime = now + RATE_LIMIT_WINDOW_MS
        }
    } else {
        // First request
        requestCounts.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS
        })
    }
    await next()
}

/**
 * Manually unban an IP
 */
export function unbanIP(ip: string): boolean {
    const index = banList.bannedIPs.indexOf(ip)
    if (index > -1) {
        banList.bannedIPs.splice(index, 1)
        saveBanList()

        securityLogger.info({
            event: 'unban',
            type: 'ip',
            ip
        }, 'IP unbanned')

        logger.info({ ip }, 'IP unbanned')
        return true
    }
    return false
}

/**
 * Manually unban a user
 */
export function unbanUser(userId: string): boolean {
    const index = banList.bannedUserIds.indexOf(userId)
    if (index > -1) {
        banList.bannedUserIds.splice(index, 1)
        saveBanList()

        securityLogger.info({
            event: 'unban',
            type: 'user',
            userId
        }, 'User unbanned')

        logger.info({ userId }, 'User unbanned')
        return true
    }
    return false
}

/**
 * Get current violation stats
 */
export function getViolationStats() {
    return {
        totalViolations: violations.size,
        violations: Array.from(violations.entries()).map(([key, record]) => ({
            key,
            ...record,
        })),
    }
}

// Load ban list on module initialization
loadBanList()

// Start cleanup interval
setInterval(cleanupViolations, VIOLATION_CLEANUP_INTERVAL)
