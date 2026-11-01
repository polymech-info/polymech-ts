import { SupabaseClient } from '@supabase/supabase-js';
import { createRouteBody } from '../routes.js';
import { z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { logger } from '../logger.js';
import { appCache } from '../../../cache.js';

// --- Type Cache ---

interface TypeCacheState {
    types: any[];
    structureFields: any[];
    enumValues: any[];
    flagValues: any[];
    casts: any[];
    typesMap: Map<string, any>; // id -> type with enriched fields
    structureFieldsMap: Map<string, any[]>; // structure_type_id -> fields[]
    enumValuesMap: Map<string, any[]>; // type_id -> values[]
    flagValuesMap: Map<string, any[]>; // type_id -> values[]
    loaded: boolean;
    timestamp: number;
}

const CACHE_KEY = 'types';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const getTypeState = async (supabase: SupabaseClient): Promise<{ state: TypeCacheState, fromCache: boolean }> => {
    let state = await appCache.get<TypeCacheState>(CACHE_KEY);

    const now = Date.now();
    if (state && state.loaded && (now - state.timestamp < CACHE_TTL)) {
        return { state, fromCache: true };
    }

    // Load from DB
    const [typesRes, fieldsRes, enumsRes, flagsRes, castsRes] = await Promise.all([
        supabase.from('types').select('*').order('name'),
        supabase.from('type_structure_fields').select('*').order('order', { ascending: true }),
        supabase.from('type_enum_values').select('*').order('order', { ascending: true }),
        supabase.from('type_flag_values').select('*'),
        supabase.from('type_casts').select('*')
    ]);

    if (typesRes.error) throw typesRes.error;
    if (fieldsRes.error) throw fieldsRes.error;
    if (enumsRes.error) throw enumsRes.error;
    if (flagsRes.error) throw flagsRes.error;
    if (castsRes.error) throw castsRes.error;

    const types = typesRes.data || [];
    const structureFields = fieldsRes.data || [];
    const enumValues = enumsRes.data || [];
    const flagValues = flagsRes.data || [];
    const casts = castsRes.data || [];

    // Build Indices
    const typesMap = new Map();
    const structureFieldsMap = new Map<string, any[]>();
    const enumValuesMap = new Map<string, any[]>();
    const flagValuesMap = new Map<string, any[]>();

    // 1. Group Children
    structureFields.forEach(f => {
        if (!structureFieldsMap.has(f.structure_type_id)) structureFieldsMap.set(f.structure_type_id, []);
        structureFieldsMap.get(f.structure_type_id)?.push(f);
    });

    enumValues.forEach(e => {
        if (!enumValuesMap.has(e.type_id)) enumValuesMap.set(e.type_id, []);
        enumValuesMap.get(e.type_id)?.push(e);
    });

    flagValues.forEach(f => {
        if (!flagValuesMap.has(f.type_id)) flagValuesMap.set(f.type_id, []);
        flagValuesMap.get(f.type_id)?.push(f);
    });

    // 2. Build Enriched Objects (shallow enrichment for map)
    types.forEach(t => {
        const enriched = {
            ...t,
            structure_fields: structureFieldsMap.get(t.id) || [],
            enum_values: enumValuesMap.get(t.id) || [],
            flag_values: flagValuesMap.get(t.id) || [],
            // Casts are a bit more complex (from/to), maybe just attach raw list if needed
            // For now, let's keep it simple.
        };
        typesMap.set(t.id, enriched);
    });

    state = {
        types,
        structureFields,
        enumValues,
        flagValues,
        casts,
        typesMap,
        structureFieldsMap,
        enumValuesMap,
        flagValuesMap,
        loaded: true,
        timestamp: now
    };

    await appCache.set(CACHE_KEY, state, CACHE_TTL);
    return { state, fromCache: false };
};

export const flushTypeCache = async () => {
    await appCache.invalidate(CACHE_KEY);
};

export const fetchTypesServer = async (supabase: SupabaseClient, options: {
    kind?: string;
    parentTypeId?: string;
    visibility?: string;
    userId?: string;
}) => {
    const { state, fromCache } = await getTypeState(supabase);

    let result = Array.from(state.typesMap.values());

    if (options.kind) {
        result = result.filter(t => t.kind === options.kind);
    }

    if (options.parentTypeId) {
        result = result.filter(t => t.parent_type_id === options.parentTypeId);
    }

    if (options.visibility) {
        result = result.filter(t => t.visibility === options.visibility);
    }

    // Sort by name (already sorted in DB query, but good to ensure if maps mess up order)
    result.sort((a, b) => a.name.localeCompare(b.name));

    return { data: result, fromCache };
};

export const fetchTypeByIdServer = async (supabase: SupabaseClient, id: string) => {
    const { state, fromCache } = await getTypeState(supabase);
    const type = state.typesMap.get(id);
    return type || null; // Return null if not found
};

export const createTypeServer = async (supabase: SupabaseClient, typeData: any) => {
    // 1. Create the Type record
    const { data: type, error } = await supabase
        .from('types')
        .insert({
            name: typeData.name,
            kind: typeData.kind,
            parent_type_id: typeData.parent_type_id,
            description: typeData.description,
            json_schema: typeData.jsonSchema,
            owner_id: typeData.ownerId, // Optional, RLS/Trigger might set defaults or validate
            visibility: typeData.visibility || 'public',
            meta: typeData.meta,
            settings: typeData.settings
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Handle specific kind data (Enums, Flags, Structures)
    // Note: This matches the atomic creation need. Transaction would be ideal.
    // Supabase JS doesn't do transactions easily without RPC, but we can do sequential inserts.
    // If failures happen, we might have partial state (orphan type), but that's acceptable for now.

    if (type.kind === 'enum' && typeData.enumValues && Array.isArray(typeData.enumValues)) {
        const values = typeData.enumValues.map((v: any, idx: number) => ({
            type_id: type.id,
            value: v.value,
            label: v.label,
            order: v.order ?? idx
        }));

        if (values.length > 0) {
            const { error: enumError } = await supabase.from('type_enum_values').insert(values);
            if (enumError) throw enumError; // Should we delete the type? For now just throw.
        }
    }

    if (type.kind === 'flags' && typeData.flagValues && Array.isArray(typeData.flagValues)) {
        const values = typeData.flagValues.map((v: any) => ({
            type_id: type.id,
            name: v.name,
            bit: v.bit
        }));

        if (values.length > 0) {
            const { error: flagError } = await supabase.from('type_flag_values').insert(values);
            if (flagError) throw flagError;
        }
    }

    if (type.kind === 'structure' && typeData.structure_fields && Array.isArray(typeData.structure_fields)) {
        const values = typeData.structure_fields.map((v: any, idx: number) => ({
            structure_type_id: type.id,
            field_name: v.field_name,
            field_type_id: v.field_type_id,
            required: v.required ?? false,
            default_value: v.default_value,
            order: v.order ?? idx
        }));

        if (values.length > 0) {
            const { error: structError } = await supabase.from('type_structure_fields').insert(values);
            if (structError) throw structError;
        }
    }

    await flushTypeCache();
    return fetchTypeByIdServer(supabase, type.id); // Return full object
};

export const updateTypeServer = async (supabase: SupabaseClient, id: string, updates: any) => {
    // 1. Update Core Type
    const { data: type, error } = await supabase
        .from('types')
        .update({
            name: updates.name,
            description: updates.description,
            json_schema: updates.jsonSchema,
            visibility: updates.visibility,
            meta: updates.meta,
            settings: updates.settings
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // 2. Update Children
    if (updates.structure_fields && Array.isArray(updates.structure_fields)) {
        // Replace strategy: Delete all existing fields for this type and insert new ones
        const { error: deleteError } = await supabase
            .from('type_structure_fields')
            .delete()
            .eq('structure_type_id', id);

        if (deleteError) throw deleteError;

        const values = updates.structure_fields.map((v: any, idx: number) => ({
            structure_type_id: id,
            field_name: v.field_name,
            field_type_id: v.field_type_id,
            required: v.required ?? false,
            default_value: v.default_value,
            order: v.order ?? idx
        }));

        if (values.length > 0) {
            const { error: insertError } = await supabase.from('type_structure_fields').insert(values);
            if (insertError) throw insertError;
        }
    }

    // 3. Delete orphaned field types (after structure update to avoid FK constraint violations)
    if (updates.fieldsToDelete && Array.isArray(updates.fieldsToDelete) && updates.fieldsToDelete.length > 0) {
        for (const fieldTypeId of updates.fieldsToDelete) {
            await deleteTypeServer(supabase, fieldTypeId);
        }
    }

    await flushTypeCache();
    return fetchTypeByIdServer(supabase, id);
};

export const deleteTypeServer = async (supabase: SupabaseClient, id: string) => {
    // First, get the type to check if it's a structure and collect field type IDs
    const { data: typeToDelete, error: fetchError } = await supabase
        .from('types')
        .select('kind, structure_fields:type_structure_fields!type_structure_fields_structure_type_id_fkey(field_type_id)')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    // Collect field type IDs before deleting the structure
    let fieldTypeIds: string[] = [];
    if (typeToDelete?.kind === 'structure' && typeToDelete.structure_fields) {
        fieldTypeIds = typeToDelete.structure_fields
            .map((f: any) => f.field_type_id)
            .filter(Boolean);
    }

    // Delete the structure first (CASCADE will delete type_structure_fields entries)
    const { error } = await supabase
        .from('types')
        .delete()
        .eq('id', id);

    if (error) throw error;

    // Now delete the orphaned field types (no longer referenced by type_structure_fields)
    if (fieldTypeIds.length > 0) {
        const { error: fieldDeleteError } = await supabase
            .from('types')
            .delete()
            .in('id', fieldTypeIds);

        if (fieldDeleteError) {
            console.error('Failed to delete field types:', fieldDeleteError);
            // Don't throw here - the main type is already deleted
        }
    }

    await flushTypeCache();
    return true;
};

// Route Definitions

export const getTypesRoute = createRouteBody(
    'get',
    '/api/types',
    ['Types'],
    'Get Types',
    'Get Types',
    {
        query: z.object({
            kind: z.enum(['primitive', 'enum', 'flags', 'structure', 'alias', 'field']).optional(),
            parentTypeId: z.string().optional(),
            visibility: z.enum(['public', 'private', 'custom']).optional()
        })
    },
    {
        200: {
            description: 'Types List',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    },
    false
);

export const getTypeRoute = createRouteBody(
    'get',
    '/api/types/:id',
    ['Types'],
    'Get Type Details',
    'Get Type Details',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Type Details',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        404: { description: 'Type not found' }
    },
    false
);

export const createTypeRoute = createRouteBody(
    'post',
    '/api/types',
    ['Types'],
    'Create Type',
    'Create Type',
    {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string(),
                        kind: z.enum(['primitive', 'enum', 'flags', 'structure', 'alias', 'field']),
                        parent_type_id: z.string().optional().nullable(),
                        description: z.string().optional(),
                        jsonSchema: z.any().optional(),
                        visibility: z.enum(['public', 'private', 'custom']).optional(),
                        meta: z.any().optional(),
                        settings: z.any().optional(),
                        // Children data for creation
                        enumValues: z.array(z.object({
                            value: z.string(),
                            label: z.string(),
                            order: z.number().optional()
                        })).optional(),
                        flagValues: z.array(z.object({
                            name: z.string(),
                            bit: z.number()
                        })).optional(),
                        structure_fields: z.array(z.object({
                            field_name: z.string(),
                            field_type_id: z.string(),
                            required: z.boolean().optional(),
                            default_value: z.any().optional(),
                            order: z.number().optional()
                        })).optional()
                    })
                }
            }
        }
    },
    {
        200: {
            description: 'Type Created',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        401: { description: 'Unauthorized' }
    },
    false
);

export const updateTypeRoute = createRouteBody(
    'patch',
    '/api/types/:id',
    ['Types'],
    'Update Type',
    'Update Type',
    {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().optional(),
                        description: z.string().optional(),
                        jsonSchema: z.any().optional(),
                        visibility: z.enum(['public', 'private', 'custom']).optional(),
                        meta: z.any().optional(),
                        settings: z.any().optional(),
                        structure_fields: z.array(z.object({
                            field_name: z.string(),
                            field_type_id: z.string(),
                            required: z.boolean().optional(),
                            default_value: z.any().optional(),
                            order: z.number().optional()
                        })).optional(),
                        fieldsToDelete: z.array(z.string()).optional()
                    })
                }
            }
        }
    },
    {
        200: {
            description: 'Type Updated',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        401: { description: 'Unauthorized' }
    },
    false
);

export const deleteTypeRoute = createRouteBody(
    'delete',
    '/api/types/:id',
    ['Types'],
    'Delete Type',
    'Delete Type',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Type Deleted',
            content: {
                'application/json': {
                    schema: z.object({ success: z.boolean() })
                }
            }
        },
        401: { description: 'Unauthorized' }
    },
    false
);

// --- Handlers ---

export async function handleGetTypes(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const kind = c.req.query('kind');
        const parentTypeId = c.req.query('parentTypeId');
        const visibility = c.req.query('visibility');

        // Extract user ID from Auth Token (if present)
        let userId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        const { data: types, fromCache } = await fetchTypesServer(supabase, { kind, parentTypeId, visibility, userId });
        c.header('X-Cache', fromCache ? 'HIT' : 'MISS');
        return c.json(types);
    } catch (err: any) {
        logger.error({ err }, 'Get Types failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetType(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');
        const type = await fetchTypeByIdServer(supabase, id);

        if (!type) return c.json({ error: 'Type not found' }, 404);
        return c.json(type);
    } catch (err: any) {
        logger.error({ err }, 'Get Type failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleCreateType(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const body = await c.req.json();

        // Validate owner via Auth
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                body.ownerId = user.id;
            }
        }

        const newType = await createTypeServer(supabase, body);
        return c.json(newType);
    } catch (err: any) {
        logger.error({ err }, 'Create Type failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleUpdateType(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');
        const body = await c.req.json();

        const updatedType = await updateTypeServer(supabase, id, body);
        return c.json(updatedType);
    } catch (err: any) {
        logger.error({ err }, 'Update Type failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleDeleteType(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');

        await deleteTypeServer(supabase, id);
        return c.json({ success: true });
    } catch (err: any) {
        logger.error({ err }, 'Delete Type failed');
        return c.text('Internal Server Error', 500);
    }
}
