import { Context, Next } from 'hono'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getClientIpFromHono } from './ip.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Blocklist {
    blockedIPs: string[]
    blockedUserIds: string[]
    blockedTokens: string[]
}

let blocklist: Blocklist = {
    blockedIPs: [],
    blockedUserIds: [],
    blockedTokens: [],
}

/**
 * Load blocklist from JSON file
 */
export function loadBlocklist(): Blocklist {
    try {
        const blocklistPath = join(process.cwd(), 'config', 'blocklist.json')
        const data = readFileSync(blocklistPath, 'utf-8')
        blocklist = JSON.parse(data)
        return blocklist
    } catch (error) {
        console.error('Failed to load blocklist:', error)
        return blocklist
    }
}

/**
 * Get current blocklist
 */
export function getBlocklist(): Blocklist {
    return blocklist
}

/**
 * Check if an IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
    return blocklist.blockedIPs.includes(ip)
}

/**
 * Check if a user ID is blocked
 */
export function isUserBlocked(userId: string): boolean {
    return blocklist.blockedUserIds.includes(userId)
}

/**
 * Check if an auth token is blocked
 */
export function isTokenBlocked(token: string): boolean {
    return blocklist.blockedTokens.includes(token)
}

/**
 * Extract IP address from request (delegates to hardened ip.ts module)
 */
function getClientIP(c: Context): string {
    return getClientIpFromHono(c) || 'unknown'
}

/**
 * Extract user ID from authorization header
 * This is a simple implementation - adjust based on your auth strategy
 */
function getUserId(c: Context): string | null {
    const authHeader = c.req.header('authorization')
    if (!authHeader) return null

    // Simple extraction - in production, you'd decode JWT or validate token
    // For now, we'll use the auth header as-is for blocklist checking
    return authHeader
}

/**
 * Blocklist middleware
 * Blocks requests from blacklisted IPs, users, or tokens
 */
export async function blocklistMiddleware(c: Context, next: Next) {
    const ip = getClientIP(c)
    const authHeader = c.req.header('authorization')
    const userId = getUserId(c)

    // Check if IP is blocked
    if (isIPBlocked(ip)) {
        return c.json(
            {
                error: 'Forbidden',
                message: 'Your IP address has been blocked',
            },
            403
        )
    }

    // Check if auth token is blocked
    if (authHeader && isTokenBlocked(authHeader)) {
        return c.json(
            {
                error: 'Forbidden',
                message: 'Your access token has been blocked',
            },
            403
        )
    }

    // Check if user ID is blocked
    if (userId && isUserBlocked(userId)) {
        return c.json(
            {
                error: 'Forbidden',
                message: 'Your account has been blocked',
            },
            403
        )
    }

    await next()
}

// Load blocklist on module initialization
loadBlocklist()
