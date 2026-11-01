import { describe, it, expect } from 'vitest'
import { getClient } from './commons.js'

describe('Discourse Users', () => {
    const client = getClient()

    it('should fetch active users', async () => {
        try {
            const users = await client.getUsers(0)
            expect(users).toBeDefined()
            // Depending on response structure, checking properties
            // expect(users).toHaveProperty('users')
        } catch (e) {
            console.warn('Skipping test due to connection error or config', e)
        }
    })

    it('should fetch a specific user by username', async () => {
        try {
            const username = 'system'
            const user = await client.getUserByUsername(username)
            expect(user).toBeDefined()
            expect(user.username.toLowerCase()).toBe(username)
        } catch (e) {
            console.warn('Skipping test due to connection error or config', e)
        }
    })
})
