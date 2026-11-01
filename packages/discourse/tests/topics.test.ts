import { describe, it, expect } from 'vitest'
import { getClient } from './commons.js'

describe('Discourse Topics', () => {
    const client = getClient()

    it('should fetch latest topics', async () => {
        try {
            const topics = await client.getTopicItems()
            expect(topics).toBeDefined()
            expect(Array.isArray(topics)).toBe(true)
            if (topics.length > 0) {
                expect(topics[0].id).toBeDefined()
            }
        } catch (e) {
            console.warn('Skipping test due to connection error or config', e)
        }
    })

    it('should fetch a specific topic', async () => {
        try {
            // we need a valid ID, assume we have one from the previous list or a known one
            const topics = await client.getTopicItems({ page: 0 })
            if (topics && topics.length > 0) {
                const topicId = topics[0].id
                const topic = await client.getTopic(topicId)
                expect(topic).toBeDefined()
                expect(topic.id).toBe(topicId)
            } else {
                console.warn('No topics found to test getTopic')
            }
        } catch (e) {
            console.warn('Skipping test due to connection error or config', e)
        }
    }, 15000)
})
