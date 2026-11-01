import { z } from '@hono/zod-openapi'

export const ErrorSchema = z.object({
    error: z.string(),
})
export const ImageSchema = z.object({
    idx: z.number().openapi({ example: 0 }),
    id: z.number().openapi({ example: 6 }),
    name: z.string().openapi({ example: 'images' }),
    slug: z.string().openapi({ example: 'images' }),
    description: z.string().openapi({ example: 'fcghdfgh' }),
    price: z.string().openapi({ example: '10.00' }),
    variants: z.string().openapi({ example: '[]' }),
    created_at: z.string().openapi({ example: '2025-11-22 10:46:09.77718+00' }),
    updated_at: z.string().openapi({ example: '2025-11-22 10:46:09.77718+00' }),
})

export const ImageResponseSchema = z.object({
    message: z.string().openapi({ example: 'Success' }),
    data: z.array(ImageSchema).optional(),
})

