import { describe, it, expect } from 'vitest'
import { app } from '../index'

// Helper to generate unique IP for each test to avoid rate limiting
let ipCounter = 0
function getUniqueIP() {
    return `10.0.${Math.floor(ipCounter / 255)}.${ipCounter++ % 255}`
}

describe('API Endpoints', () => {
    describe('GET /', () => {
        it('should return welcome message', async () => {
            const res = await app.request('/')
            expect(res.status).toBe(200)

            const text = await res.text()
            expect(text).toBe('Hello Hono + Supabase + Swagger!')
        })
    })

    describe('GET /api/products', () => {
        it('should return products array', async () => {
            const res = await app.request('/api/products', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(Array.isArray(data)).toBe(true)
        }, 10000)

        it('should have correct content-type header', async () => {
            const res = await app.request('/api/products', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            expect(res.headers.get('content-type')).toContain('application/json')
        }, 10000)
    })

    describe('GET /api/subscriptions', () => {
        it('should return subscriptions array', async () => {
            const res = await app.request('/api/subscriptions', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(Array.isArray(data)).toBe(true)
            expect(data.length).toBeGreaterThan(0)
        })

        it('should return valid subscription objects', async () => {
            const res = await app.request('/api/subscriptions', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            const data = await res.json()

            expect(data[0]).toHaveProperty('id')
            expect(data[0]).toHaveProperty('name')
            expect(data[0]).toHaveProperty('price')
            expect(typeof data[0].price).toBe('number')
        })
    })

    describe('GET /api/admin/stats', () => {
        it('should return stats object', async () => {
            const res = await app.request('/api/admin/stats', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(data).toHaveProperty('users')
            expect(data).toHaveProperty('revenue')
        })

        it('should return numeric values for stats', async () => {
            const res = await app.request('/api/admin/stats', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            const data = await res.json()

            expect(typeof data.users).toBe('number')
            expect(typeof data.revenue).toBe('number')
            expect(data.users).toBeGreaterThanOrEqual(0)
            expect(data.revenue).toBeGreaterThanOrEqual(0)
        })
    })

    describe('OpenAPI Documentation', () => {
        it('should serve OpenAPI spec at /doc', async () => {
            const res = await app.request('/doc')
            expect(res.status).toBe(200)

            const spec = await res.json()
            expect(spec).toHaveProperty('openapi')
            expect(spec).toHaveProperty('info')
            expect(spec.info.title).toBe('SaaS API')
        })

        it('should serve Swagger UI at /ui', async () => {
            const res = await app.request('/ui')
            expect(res.status).toBe(200)
        })

        it('should serve Scalar reference at /reference', async () => {
            const res = await app.request('/reference')
            expect(res.status).toBe(200)
        })
    })

    describe('CORS', () => {
        it('should have CORS headers enabled', async () => {
            const res = await app.request('/api/products', {
                headers: { 'x-forwarded-for': getUniqueIP() }
            })
            expect(res.headers.get('access-control-allow-origin')).toBeDefined()
        }, 10000)
    })
})
