import { SupabaseClient } from '@supabase/supabase-js';
import { createRouteBody } from '../routes.js';
import { z } from '@hono/zod-openapi';
import { logger } from '../logger.js';
import { Context } from 'hono';

// Schema Definitions
const LayoutVisibilityEnum = z.enum(['public', 'private', 'listed', 'custom']);

const LayoutSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(255),
    owner_id: z.string().uuid(),
    layout_json: z.any(), // JSONB - can be any valid JSON
    type: z.string().optional().default('canvas'),
    visibility: LayoutVisibilityEnum.optional().default('private'),
    meta: z.any().optional(), // JSONB for categories, tags, etc.
    is_predefined: z.boolean().optional().default(false),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
});

const CreateLayoutSchema = LayoutSchema.omit({ id: true, created_at: true, updated_at: true });
const UpdateLayoutSchema = LayoutSchema.partial().omit({ id: true, owner_id: true, created_at: true, updated_at: true });

// Route Definitions
export const getLayoutsRoute = createRouteBody(
    'get',
    '/api/layouts',
    ['Layouts'],
    'Get Layouts',
    'Get all layouts for the authenticated user or public layouts',
    {
        query: z.object({
            visibility: LayoutVisibilityEnum.optional(),
            type: z.string().optional(),
            limit: z.string().optional(),
            offset: z.string().optional()
        })
    },
    {
        200: {
            description: 'List of layouts',
            content: {
                'application/json': {
                    schema: z.array(LayoutSchema)
                }
            }
        }
    },
    false // Requires authentication
);

export const getLayoutRoute = createRouteBody(
    'get',
    '/api/layouts/:id',
    ['Layouts'],
    'Get Layout',
    'Get a specific layout by ID',
    {
        params: z.object({
            id: z.string().uuid()
        })
    },
    {
        200: {
            description: 'Layout details',
            content: {
                'application/json': {
                    schema: LayoutSchema
                }
            }
        },
        404: {
            description: 'Layout not found'
        }
    },
    false
);

export const createLayoutRoute = createRouteBody(
    'post',
    '/api/layouts',
    ['Layouts'],
    'Create Layout',
    'Create a new layout',
    {
        body: {
            content: {
                'application/json': {
                    schema: CreateLayoutSchema
                }
            }
        }
    },
    {
        201: {
            description: 'Layout created',
            content: {
                'application/json': {
                    schema: LayoutSchema
                }
            }
        },
        400: {
            description: 'Invalid request'
        }
    },
    false
);

export const updateLayoutRoute = createRouteBody(
    'patch',
    '/api/layouts/:id',
    ['Layouts'],
    'Update Layout',
    'Update an existing layout',
    {
        params: z.object({
            id: z.string().uuid()
        }),
        body: {
            content: {
                'application/json': {
                    schema: UpdateLayoutSchema
                }
            }
        }
    },
    {
        200: {
            description: 'Layout updated',
            content: {
                'application/json': {
                    schema: LayoutSchema
                }
            }
        },
        404: {
            description: 'Layout not found'
        }
    },
    false
);

export const deleteLayoutRoute = createRouteBody(
    'delete',
    '/api/layouts/:id',
    ['Layouts'],
    'Delete Layout',
    'Delete a layout',
    {
        params: z.object({
            id: z.string().uuid()
        })
    },
    {
        204: {
            description: 'Layout deleted'
        },
        404: {
            description: 'Layout not found'
        }
    },
    false
);

// Handlers
export async function handleGetLayouts(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        // Extract user ID from Auth Token
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Query parameters
        const visibility = c.req.query('visibility');
        const type = c.req.query('type');
        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');

        // Build query
        let query = supabase
            .from('layouts')
            .select('*')
            .or(`owner_id.eq.${user.id},visibility.eq.public,visibility.eq.listed`)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (visibility) {
            query = query.eq('visibility', visibility);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            logger.error({ err: error }, 'Failed to fetch layouts');
            return c.json({ error: 'Failed to fetch layouts' }, 500);
        }

        return c.json(data);
    } catch (err: any) {
        logger.error({ err }, 'Get layouts failed');
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleGetLayout(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');
        const id = c.req.param('id');

        // Extract user ID from Auth Token (optional for public layouts)
        let userId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        const { data, error } = await supabase
            .from('layouts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return c.json({ error: 'Layout not found' }, 404);
        }

        // Check access permissions
        const isOwner = userId === data.owner_id;
        const isPublic = data.visibility === 'public' || data.visibility === 'listed';

        if (!isOwner && !isPublic) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        return c.json(data);
    } catch (err: any) {
        logger.error({ err }, 'Get layout failed');
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleCreateLayout(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        // Extract user ID from Auth Token
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const body = await c.req.json();

        // Validate and parse body
        const validatedData = CreateLayoutSchema.parse(body);

        // Ensure owner_id matches authenticated user
        const layoutData = {
            ...validatedData,
            owner_id: user.id
        };

        const { data, error } = await supabase
            .from('layouts')
            .insert(layoutData)
            .select()
            .single();

        if (error) {
            logger.error({ err: error }, 'Failed to create layout');
            return c.json({ error: 'Failed to create layout' }, 500);
        }

        return c.json(data, 201);
    } catch (err: any) {
        if (err.name === 'ZodError') {
            return c.json({ error: 'Invalid request data', details: err.errors }, 400);
        }
        logger.error({ err }, 'Create layout failed');
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleUpdateLayout(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');
        const id = c.req.param('id');

        // Extract user ID from Auth Token
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const body = await c.req.json();

        // Validate and parse body
        const validatedData = UpdateLayoutSchema.parse(body);

        // Update only if user is the owner (RLS will enforce this too)
        const { data, error } = await supabase
            .from('layouts')
            .update(validatedData)
            .eq('id', id)
            .eq('owner_id', user.id)
            .select()
            .single();

        if (error || !data) {
            logger.error({ err: error }, 'Failed to update layout');
            return c.json({ error: 'Layout not found or unauthorized' }, 404);
        }

        return c.json(data);
    } catch (err: any) {
        if (err.name === 'ZodError') {
            return c.json({ error: 'Invalid request data', details: err.errors }, 400);
        }
        logger.error({ err }, 'Update layout failed');
        return c.json({ error: 'Internal server error' }, 500);
    }
}

export async function handleDeleteLayout(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');
        const id = c.req.param('id');

        // Extract user ID from Auth Token
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Delete only if user is the owner (RLS will enforce this too)
        const { error } = await supabase
            .from('layouts')
            .delete()
            .eq('id', id)
            .eq('owner_id', user.id);

        if (error) {
            logger.error({ err: error }, 'Failed to delete layout');
            return c.json({ error: 'Layout not found or unauthorized' }, 404);
        }

        return c.body(null, 204);
    } catch (err: any) {
        logger.error({ err }, 'Delete layout failed');
        return c.json({ error: 'Internal server error' }, 500);
    }
}
