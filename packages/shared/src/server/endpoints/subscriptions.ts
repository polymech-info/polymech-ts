import { createRoute, z } from '@hono/zod-openapi'
import { SubscriptionSchema } from '../schemas/index.js'
import type { Context } from 'hono'

export const getSubscriptionsRoute = createRoute({
    method: 'get',
    path: '/api/subscriptions',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(SubscriptionSchema),
                },
            },
            description: 'Retrieve subscription plans',
        },
    },
})

export function getSubscriptionsHandler(c: Context) {
    return c.json([
        { id: 1, name: 'Basic', price: 10 },
        { id: 2, name: 'Pro', price: 20 },
    ], 200)
}
