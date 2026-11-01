import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../index'
import {
    loadBlocklist,
    getBlocklist,
    isIPBlocked,
    isUserBlocked,
    isTokenBlocked
} from '../middleware/blocklist'

describe('Blocklist Middleware', () => {
    beforeAll(() => {
        // Ensure blocklist is loaded
        loadBlocklist()
    })

    describe('Blocklist Loading', () => {
        it('should load blocklist from JSON file', () => {
            const blocklist = getBlocklist()

            expect(blocklist).toBeDefined()
            expect(blocklist).toHaveProperty('blockedIPs')
            expect(blocklist).toHaveProperty('blockedUserIds')
            expect(blocklist).toHaveProperty('blockedTokens')
        })

        it('should have blocked IPs in the list', () => {
            const blocklist = getBlocklist()

            expect(Array.isArray(blocklist.blockedIPs)).toBe(true)
            expect(blocklist.blockedIPs.length).toBeGreaterThan(0)
        })

        it('should have blocked user IDs in the list', () => {
            const blocklist = getBlocklist()

            expect(Array.isArray(blocklist.blockedUserIds)).toBe(true)
            expect(blocklist.blockedUserIds.length).toBeGreaterThan(0)
        })

        it('should have blocked tokens in the list', () => {
            const blocklist = getBlocklist()

            expect(Array.isArray(blocklist.blockedTokens)).toBe(true)
            expect(blocklist.blockedTokens.length).toBeGreaterThan(0)
        })
    })

    describe('IP Blocking', () => {
        it('should block requests from blocked IP addresses', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'x-forwarded-for': '192.168.1.100' // Blocked IP from blocklist.json
                }
            })

            expect(response.status).toBe(403)

            const data = await response.json()
            expect(data).toHaveProperty('error')
            expect(data.error).toBe('Forbidden')
            expect(data.message).toContain('IP address has been blocked')
        }, 10000)

        it('should allow requests from non-blocked IP addresses', async () => {
            const response = await app.request('/api/subscriptions', {
                headers: {
                    'x-forwarded-for': '192.168.1.1' // Non-blocked IP
                }
            })

            expect(response.status).toBe(200)
        })

        it('should check IP blocking correctly', () => {
            expect(isIPBlocked('192.168.1.100')).toBe(true)
            expect(isIPBlocked('10.0.0.50')).toBe(true)
            expect(isIPBlocked('192.168.1.1')).toBe(false)
        })
    })

    describe('User ID Blocking', () => {
        it('should block requests from blocked user IDs', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'authorization': 'user_banned_123', // Blocked user from blocklist.json
                    'x-forwarded-for': '192.168.1.1'
                }
            })

            expect(response.status).toBe(403)

            const data = await response.json()
            expect(data).toHaveProperty('error')
            expect(data.error).toBe('Forbidden')
            expect(data.message).toContain('account has been blocked')
        }, 10000)

        it('should allow requests from non-blocked users', async () => {
            const response = await app.request('/api/subscriptions', {
                headers: {
                    'authorization': 'user_valid_789',
                    'x-forwarded-for': '192.168.1.1'
                }
            })

            expect(response.status).toBe(200)
        })

        it('should check user blocking correctly', () => {
            expect(isUserBlocked('user_banned_123')).toBe(true)
            expect(isUserBlocked('user_spam_456')).toBe(true)
            expect(isUserBlocked('user_valid_789')).toBe(false)
        })
    })

    describe('Token Blocking', () => {
        it('should block requests with blocked tokens', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'authorization': 'Bearer malicious_token_xyz', // Blocked token
                    'x-forwarded-for': '192.168.1.1'
                }
            })

            expect(response.status).toBe(403)

            const data = await response.json()
            expect(data).toHaveProperty('error')
            expect(data.error).toBe('Forbidden')
            expect(data.message).toContain('access token has been blocked')
        }, 10000)

        it('should allow requests with valid tokens', async () => {
            const response = await app.request('/api/subscriptions', {
                headers: {
                    'authorization': 'Bearer valid_token_abc',
                    'x-forwarded-for': '192.168.1.1'
                }
            })

            expect(response.status).toBe(200)
        })

        it('should check token blocking correctly', () => {
            expect(isTokenBlocked('Bearer malicious_token_xyz')).toBe(true)
            expect(isTokenBlocked('Bearer valid_token_abc')).toBe(false)
        })
    })

    describe('Multiple Blocking Criteria', () => {
        it('should block if IP is blocked even with valid token', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'authorization': 'Bearer valid_token_abc',
                    'x-forwarded-for': '192.168.1.100' // Blocked IP
                }
            })

            expect(response.status).toBe(403)
            expect((await response.json()).message).toContain('IP address')
        }, 10000)

        it('should block if token is blocked even from valid IP', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'authorization': 'Bearer malicious_token_xyz', // Blocked token
                    'x-forwarded-for': '192.168.1.1' // Valid IP
                }
            })

            expect(response.status).toBe(403)
            expect((await response.json()).message).toContain('access token')
        }, 10000)
    })

    describe('Non-API Routes', () => {
        it('should not apply blocklist to non-API routes', async () => {
            // Root route should not be blocked even from blocked IP
            const response = await app.request('/', {
                headers: {
                    'x-forwarded-for': '192.168.1.100' // Blocked IP
                }
            })

            // This might still be blocked if we apply blocklist globally
            // But based on our middleware setup, only /api/* is protected
            expect(response.status).toBe(200)
        })
    })

    describe('Error Response Structure', () => {
        it('should return consistent error structure for blocked requests', async () => {
            const response = await app.request('/api/products', {
                headers: {
                    'x-forwarded-for': '192.168.1.100'
                }
            })

            expect(response.status).toBe(403)

            const data = await response.json()
            expect(data).toHaveProperty('error')
            expect(data).toHaveProperty('message')
            expect(typeof data.error).toBe('string')
            expect(typeof data.message).toBe('string')
        }, 10000)
    })

    describe('Blocklist Reload', () => {
        it('should be able to reload blocklist', () => {
            const initialBlocklist = getBlocklist()
            const reloadedBlocklist = loadBlocklist()

            expect(reloadedBlocklist).toBeDefined()
            expect(reloadedBlocklist.blockedIPs).toEqual(initialBlocklist.blockedIPs)
        })
    })
})
