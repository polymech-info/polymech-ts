import { createRoute, z } from '@hono/zod-openapi'
import { ImageSchema, ImageResponseSchema, ErrorSchema } from '../../schemas/index.js'
import type { Context } from 'hono'

const tags = ['Images']

export const getImagesRoute = createRoute({
    method: 'get',
    path: '/api/images/get',
    tags,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ImageResponseSchema,
                },
            },
            description: 'Retrieve images',
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

export const postImagesRoute = createRoute({
    method: 'post',
    path: '/api/images/post',
    tags,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ImageResponseSchema,
                },
            },
            description: 'Create image',
        },
    },
})

export const putImagesRoute = createRoute({
    method: 'put',
    path: '/api/images/put',
    tags,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ImageResponseSchema,
                },
            },
            description: 'Put image',
        },
    },
})

export const updateImagesRoute = createRoute({
    method: 'patch', // Using patch for update as is common, though user said 'update' which isn't a method.
    // Wait, user said endpoints: /api/images/get,put,post,update
    // 'update' is likely the path, not the method.
    // I will assume POST or PATCH to /api/images/update. Let's use POST for 'update' path to be safe or PATCH.
    // Actually, let's stick to standard methods for the paths if possible, but the paths are explicit.
    // Let's use PATCH method for /api/images/update path.
    path: '/api/images/update',
    tags,
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: ImageResponseSchema,
                },
            },
            description: 'Update image',
        },
    },
})


// Stubbed data
const stubbedImages = [
    {
        idx: 0,
        id: 6,
        name: "images",
        slug: "images",
        description: "fcghdfgh",
        price: "10.00",
        variants: "[]",
        created_at: "2025-11-22 10:46:09.77718+00",
        updated_at: "2025-11-22 10:46:09.77718+00"
    }
]

export async function getImagesHandler(c: Context) {
    return c.json({
        message: 'Get images success',
        data: stubbedImages
    }, 200)
}

export async function postImagesHandler(c: Context) {
    return c.json({
        message: 'Post images success',
        data: stubbedImages
    }, 200)
}

export async function putImagesHandler(c: Context) {
    return c.json({
        message: 'Put images success',
        data: stubbedImages
    }, 200)
}

export async function updateImagesHandler(c: Context) {
    return c.json({
        message: 'Update images success',
        data: stubbedImages
    }, 200)
}
