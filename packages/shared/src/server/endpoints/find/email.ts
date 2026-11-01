import { createRoute, RouteHandler, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../../schemas/index.js'
import { supabase } from '../../commons/supabase.js'
import { getLocationByPlaceId } from '../competitors/getLocationByPlaceId.js'
import { logger } from '../../commons/logger.js'
import { findEmailEach, parseHtml, Page, LocationSiteMeta } from '@polymech/search'

const tags = ['Find']

// Email metadata schema
const EmailMetadataSchema = z.object({
    email: z.string().email(),
    source: z.string().url(),
    foundAt: z.string().datetime(),
    tool: z.string()
})

// Response schema
const FindEmailResponseSchema = z.object({
    job_id: z.string().nullable(),
    place_id: z.string(),
    emails: z.array(EmailMetadataSchema),
    status: z.enum(['cached', 'processing', 'completed', 'failed']),
    message: z.string()
})

export const getFindEmailRoute = createRoute({
    method: 'get',
    path: '/api/find/email/{place_id}',
    tags,
    request: {
        params: z.object({
            place_id: z.string(),
            cache: z.boolean().optional().default(false),
        }),
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: FindEmailResponseSchema,
                },
            },
            description: 'Email finding results',
        },
        401: {
            content: {
                'application/json': {
                    schema: ErrorSchema,
                },
            },
            description: 'Unauthorized',
        },
        404: {
            content: {
                'application/json': {
                    schema: ErrorSchema,
                },
            },
            description: 'Location not found',
        },
        429: {
            content: {
                'application/json': {
                    schema: ErrorSchema,
                },
            },
            description: 'Too many active jobs',
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

export const getFindEmailHandler: any = async (c: any) => {
    const { place_id, cache } = c.req.valid('param')
    const jobId = c.get('jobId') as string | undefined
    const userId = c.get('userId') as string | undefined

    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    logger.info(`[FindEmail] Starting email finding for ${place_id} - User: ${userId} - JobId: ${jobId}`)

    try {
        // 1. Fetch location details
        const location = await getLocationByPlaceId(place_id)

        if (!location) {
            return c.json({ error: 'Location not found' }, 404)
        }

        // 2. Check for existing emails in metadata
        const existingEmails = location.meta?.emails || []

        if (existingEmails.length > 0 && !cache) {
            logger.info(`[FindEmail] Returning cached emails for ${place_id}`)
            return c.json({
                job_id: jobId || null,
                place_id,
                emails: existingEmails,
                status: 'cached' as const,
                message: 'Emails already found (cached)'
            }, 200)
        }

        // 3. Check if location has a website
        if (!location.website) {
            return c.json({
                job_id: jobId || null,
                place_id,
                emails: [],
                status: 'completed' as const,
                message: 'No website available for this location'
            }, 200)
        }

        // 4. Get timeout from environment (already fetched above)

        // 5. Ensure Meta Data
        if (!location.meta || !location.meta.pages || !cache) {
            logger.info(`[FindEmail] Meta missing for ${place_id}, fetching...`)
            try {
                const meta = await parseHtml(location.website, null, {
                    headless: true,
                    timeout: 1000 * 60
                })

                if (meta) {
                    location.meta = { ...location.meta, ...meta } as any
                    // Update DB with initial meta
                    const { error: updateError } = await supabase.from('locations').update({ meta: location.meta }).eq('place_id', place_id)
                    if (updateError) {
                        logger.error({ err: updateError }, `[FindEmail] Error updating initial meta for ${place_id}`)
                    }
                }
            } catch (err) {
                logger.error({ err }, `[FindEmail] Error fetching meta for ${place_id}`)
            }
        }

        // 6. Execute Iterative Scraping
        logger.info(`[FindEmail] Starting iterative email search for ${place_id}`)

        const foundEmails: string[] = []
        let isTimedOut = false
        const timeoutMs = 60 * 1000
        const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => {
                isTimedOut = true
                reject(new Error('Timeout'))
            }, timeoutMs)
        })

        const searchPromise = findEmailEach(location, {
            headless: true,
            searchFrom: 'api',
        }, async (page: Page) => {
            if (isTimedOut) return

            // Progress Callback: Update DB
            logger.info(`[FindEmail] Scraped ${page.url}, status: ${page.status}`)

            const { error: progressError } = await supabase.from('locations').update({
                meta: location.meta
            }).eq('place_id', place_id)

            if (progressError) {
                logger.error({ err: progressError }, `[FindEmail] Error updating progress meta for ${place_id}`)
            }
        })

        try {
            await Promise.race([searchPromise, timeoutPromise])
        } catch (error: any) {
            if (error.message === 'Timeout') {
                logger.warn(`[FindEmail] Timeout exceeded for ${place_id}`)
            } else {
                throw error
            }
        }

        const emails = (await searchPromise) || []

        // Format emails
        const emailsWithMetadata = emails.map((email) => ({
            email,
            source: location.website || '',
            foundAt: new Date().toISOString(),
            tool: 'puppeteer'
        }))

        // Merge and Update
        const allEmails = [...existingEmails, ...emailsWithMetadata]

        // Deduplicate
        const uniqueEmails = Array.from(new Map(allEmails.map(item => [item.email, item])).values());

        const { error: finalUpdateError } = await supabase
            .from('locations')
            .update({
                meta: {
                    ...location.meta,
                    emails: uniqueEmails
                },
                updated_at: new Date().toISOString()
            })
            .eq('place_id', place_id)

        if (finalUpdateError) {
            logger.error({ err: finalUpdateError }, `[FindEmail] Error saving emails for ${place_id}`)
        }

        return c.json({
            job_id: jobId || null,
            place_id,
            emails: uniqueEmails,
            status: isTimedOut ? 'completed' : 'completed',
            message: isTimedOut ? 'Search timed out, returning partial results' : `Found ${emails.length} new email(s)`
        }, 200)

    } catch (error: any) {
        logger.error({ err: error }, '[FindEmail] Error')
        return c.json({ error: error.message || 'Internal Server Error' }, 500)
    }
}