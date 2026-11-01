import { createRoute, z } from '@hono/zod-openapi'
import { ProductSchema, ErrorSchema } from '../schemas/index.js'
import { supabase } from '../commons/supabase.js'
import type { Context } from 'hono'

export const getProductsRoute = createRoute({
    method: 'get',
    path: '/api/products',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(ProductSchema),
                },
            },
            description: 'Retrieve all products',
        },
        500: {
            content: {
                'application/json': {
                    schema: ErrorSchema,
                },
            },
            description: 'Server error',
        },
    },
})

export async function getProductsHandler(c: Context) {
    const { data, error } = await supabase
        .from('products')
        .select('*')

    if (error) {
        return c.json({ error: error.message }, 500)
    }

    return c.json(data, 200)
}
