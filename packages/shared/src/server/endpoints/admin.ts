
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { logger } from '../commons/logger.js'
import { getBanList, unbanIP, unbanUser, getViolationStats } from '../middleware/autoBan.js'

export const restartRoute = createRoute({
    method: 'post',
    path: '/api/admin/system/restart',
    tags: ['Admin'],
    summary: 'Restart the server',
    description: 'Exits the process with code 0, relying on systemd to restart it.',
    responses: {
        200: {
            description: 'Restart initiated',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                        pid: z.number()
                    })
                }
            }
        }
    }
})

export const restartHandler = async (c: any) => {
    const pid = process.pid
    // Use a slight delay to allow the response to be sent
    setTimeout(() => {
        logger.info('Exiting process for restart...')
        process.exit(0)
    }, 1000)

    return c.json({
        message: 'Server is restarting...',
        pid
    })
}

// Ban List Routes
export const getBanListRoute = createRoute({
    method: 'get',
    path: '/api/admin/bans',
    tags: ['Admin'],
    summary: 'Get current ban list',
    description: 'Returns all auto-banned IPs, users, and tokens',
    responses: {
        200: {
            description: 'Ban list retrieved',
            content: {
                'application/json': {
                    schema: z.object({
                        bannedIPs: z.array(z.string()),
                        bannedUserIds: z.array(z.string()),
                        bannedTokens: z.array(z.string())
                    })
                }
            }
        }
    }
})

export const getBanListHandler = async (c: any) => {
    const banList = getBanList()
    logger.info({ user: c.get('user') }, 'Admin retrieved ban list')
    return c.json(banList)
}

export const unbanIPRoute = createRoute({
    method: 'post',
    path: '/api/admin/bans/unban-ip',
    tags: ['Admin'],
    summary: 'Unban an IP address',
    description: 'Removes an IP from the auto-ban list',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        ip: z.string()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'IP unbanned successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
})

export const unbanIPHandler = async (c: any) => {
    const { ip } = await c.req.json()
    const success = unbanIP(ip)
    logger.info({ user: c.get('user'), ip, success }, 'Admin attempted to unban IP')

    return c.json({
        success,
        message: success ? `IP ${ip} has been unbanned` : `IP ${ip} was not found in ban list`
    })
}

export const unbanUserRoute = createRoute({
    method: 'post',
    path: '/api/admin/bans/unban-user',
    tags: ['Admin'],
    summary: 'Unban a user',
    description: 'Removes a user from the auto-ban list',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        userId: z.string()
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'User unbanned successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        }
    }
})

export const unbanUserHandler = async (c: any) => {
    const { userId } = await c.req.json()
    const success = unbanUser(userId)
    logger.info({ user: c.get('user'), userId, success }, 'Admin attempted to unban user')

    return c.json({
        success,
        message: success ? `User ${userId} has been unbanned` : `User ${userId} was not found in ban list`
    })
}

export const getViolationStatsRoute = createRoute({
    method: 'get',
    path: '/api/admin/bans/violations',
    tags: ['Admin'],
    summary: 'Get violation statistics',
    description: 'Returns current violation tracking data',
    responses: {
        200: {
            description: 'Violation stats retrieved',
            content: {
                'application/json': {
                    schema: z.object({
                        totalViolations: z.number(),
                        violations: z.array(z.object({
                            key: z.string(),
                            count: z.number(),
                            firstViolation: z.number(),
                            lastViolation: z.number()
                        }))
                    })
                }
            }
        }
    }
})

export const getViolationStatsHandler = async (c: any) => {
    const stats = getViolationStats()
    return c.json(stats)
}

export const registerAdminRoutes = (app: OpenAPIHono) => {
    app.openapi(restartRoute, restartHandler)
    app.openapi(getBanListRoute, getBanListHandler)
    app.openapi(unbanIPRoute, unbanIPHandler)
    app.openapi(unbanUserRoute, unbanUserHandler)
    app.openapi(getViolationStatsRoute, getViolationStatsHandler)
}
