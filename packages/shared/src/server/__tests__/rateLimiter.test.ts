import { describe, it, expect } from 'vitest'
import { app } from '../index'

describe('Rate Limiting', () => {
    // Helper to make multiple requests sequentially
    async function makeSequentialRequests(path: string, count: number, ip?: string) {
        const responses = []
        for (let i = 0; i < count; i++) {
            const headers: Record<string, string> = {}
            if (ip) {
                headers['x-forwarded-for'] = ip
            }
            const response = await app.request(path, { headers })
            responses.push(response)
        }
        return responses
    }

    // Helper to make multiple requests concurrently
    async function makeRequests(path: string, count: number, ip?: string) {
        const requests = []
        for (let i = 0; i < count; i++) {
            const headers: Record<string, string> = {}
            if (ip) {
                headers['x-forwarded-for'] = ip
            }
            requests.push(app.request(path, { headers }))
        }
        return Promise.all(requests)
    }

    describe('API Rate Limiting', () => {
        it('should allow requests within rate limit', async () => {
            // Make 2 requests sequentially (limit is 2 per 100ms)
            const responses = await makeSequentialRequests('/api/subscriptions', 2, '192.168.2.1')

            // Both requests should succeed
            expect(responses[0].status).toBe(200)
            expect(responses[1].status).toBe(200)
        })

        it('should block requests exceeding rate limit', async () => {
            // Make 3 requests quickly from same IP
            const responses = await makeSequentialRequests('/api/subscriptions', 3, '192.168.2.2')

            // First 2 should succeed
            expect(responses[0].status).toBe(200)
            expect(responses[1].status).toBe(200)

            // Third should be rate limited
            expect(responses[2].status).toBe(429)

            const errorData = await responses[2].json()
            expect(errorData).toHaveProperty('error')
            expect(errorData.error).toBe('Too many requests')
        })

        it('should include rate limit headers', async () => {
            const response = await app.request('/api/products', {
                headers: { 'x-forwarded-for': '192.168.2.3' }
            })

            // Check for rate limit headers
            const headers = response.headers
            expect(headers.get('ratelimit-limit')).toBeDefined()
            expect(headers.get('ratelimit-remaining')).toBeDefined()
        }, 10000)

        it('should track different IPs separately', async () => {
            // Make 2 requests from IP 1
            const ip1Responses = await makeRequests('/api/subscriptions', 2, '192.168.2.4')

            // Make 2 requests from IP 2
            const ip2Responses = await makeRequests('/api/subscriptions', 2, '192.168.2.5')

            // All should succeed as they're from different IPs
            expect(ip1Responses[0].status).toBe(200)
            expect(ip1Responses[1].status).toBe(200)
            expect(ip2Responses[0].status).toBe(200)
            expect(ip2Responses[1].status).toBe(200)
        })

        it('should track authenticated users separately from IP', async () => {
            // Request with auth header
            const authResponse = await app.request('/api/subscriptions', {
                headers: {
                    'authorization': 'Bearer user123',
                    'x-forwarded-for': '192.168.2.6'
                }
            })

            // Request from same IP but no auth
            const noAuthResponse = await app.request('/api/subscriptions', {
                headers: {
                    'x-forwarded-for': '192.168.2.6'
                }
            })

            // Both should succeed as they're tracked separately
            expect(authResponse.status).toBe(200)
            expect(noAuthResponse.status).toBe(200)
        })

        it('should reset rate limit after time window', async () => {
            // Make 2 requests (hit the limit)
            const firstBatch = await makeSequentialRequests('/api/subscriptions', 2, '192.168.2.7')
            expect(firstBatch[0].status).toBe(200)
            expect(firstBatch[1].status).toBe(200)

            // Wait for the time window to pass (100ms + buffer)
            await new Promise(resolve => setTimeout(resolve, 150))

            // Should be able to make requests again
            const response = await app.request('/api/subscriptions', {
                headers: { 'x-forwarded-for': '192.168.2.7' }
            })
            expect(response.status).toBe(200)
        }, 15000)

        it('should not rate limit non-API routes', async () => {
            // Root route should not be rate limited
            const responses = await makeRequests('/', 5, '192.168.2.8')

            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200)
            })
        })
    })

    describe('Rate Limit Error Response', () => {
        it('should return proper error structure when rate limited', async () => {
            // Exceed rate limit
            const responses = await makeSequentialRequests('/api/subscriptions', 3, '192.168.2.9')

            const errorResponse = responses[2]
            expect(errorResponse.status).toBe(429)

            const errorData = await errorResponse.json()
            expect(errorData).toHaveProperty('error')
            expect(errorData).toHaveProperty('message')
            expect(errorData.message).toContain('Rate limit exceeded')
        })
    })
})
