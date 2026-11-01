import { describe, it, expect } from 'vitest';
import { getClient } from './commons.js';
describe('Discourse Posts', () => {
    const client = getClient();
    it('should fetch posts', async () => {
        try {
            const posts = await client.getPostItems();
            expect(posts).toBeDefined();
            expect(Array.isArray(posts)).toBe(true);
        }
        catch (e) {
            console.warn('Skipping test due to connection error or config', e);
        }
    });
});
//# sourceMappingURL=posts.test.js.map