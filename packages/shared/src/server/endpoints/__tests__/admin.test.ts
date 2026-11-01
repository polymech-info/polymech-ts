
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../index.js' // Adjust path if needed
import { AdminEndpointRegistry } from '../../commons/registry.js'

describe('Admin Restart Endpoint', () => {
    beforeEach(() => {
        // Mock process.exit to prevent killing the test runner
        vi.spyOn(process, 'exit').mockImplementation((code) => {
            // console.log(`Mock process.exit(${code}) called`)
            return undefined as never
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should be registered as an admin endpoint', () => {
        expect(AdminEndpointRegistry.isAdmin('/api/admin/system/restart', 'POST')).toBe(true)
    })

    it('should return 401 if unauthenticated', async () => {
        const res = await app.request('/api/admin/system/restart', { method: 'POST' })
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body).toEqual({ error: 'Unauthorized - Authentication required' })
    })

    // Mocking a full admin user flow is complex without mocking Supabase, 
    // but verifying 401 proves that the middleware is intercepting the request.
})
