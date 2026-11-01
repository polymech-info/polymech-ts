import { SupabaseClient } from '@supabase/supabase-js';
import { createRouteBody } from '../routes.js';
import { z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { logger } from '../logger.js';

import { appCache } from '../../../cache.js';


// --- Category Cache ---

interface CategoryCacheState {
    categories: any[];
    relations: any[];
    categoriesMap: Map<string, any>;
    relationsMap: Map<string, { parents: any[], children: any[] }>; // id -> relationships
    loaded: boolean;
    timestamp: number;
}

const CACHE_KEY = 'categories';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const getCategoryState = async (supabase: SupabaseClient): Promise<{ state: CategoryCacheState, fromCache: boolean }> => {
    let state = await appCache.get<CategoryCacheState>(CACHE_KEY);

    const now = Date.now();
    if (state && state.loaded && (now - state.timestamp < CACHE_TTL)) {
        return { state, fromCache: true };
    }

    // Load from DB
    const [catsRes, relsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('category_relations').select('*')
    ]);

    if (catsRes.error) throw catsRes.error;
    if (relsRes.error) throw relsRes.error;

    const categories = catsRes.data || [];
    const relations = relsRes.data || [];
    const categoriesMap = new Map();
    const relationsMap = new Map();

    // Index Categories
    categories.forEach(cat => {
        categoriesMap.set(cat.id, cat);
    });

    // Index Relations
    categories.forEach(cat => {
        relationsMap.set(cat.id, { parents: [], children: [] });
    });

    relations.forEach(rel => {
        const parentEntry = relationsMap.get(rel.parent_category_id);
        const childEntry = relationsMap.get(rel.child_category_id);

        if (parentEntry) parentEntry.children.push(rel);
        if (childEntry) childEntry.parents.push(rel);
    });

    state = {
        categories,
        relations,
        categoriesMap,
        relationsMap,
        loaded: true,
        timestamp: now
    };

    await appCache.set(CACHE_KEY, state, CACHE_TTL);
    return { state, fromCache: false };
};

export const flushCategoryCache = async () => {
    await appCache.invalidate(CACHE_KEY);
};

// --- Read Functions ---

export const fetchCategoriesServer = async (supabase: SupabaseClient, options: {
    parentSlug?: string;
    includeChildren?: boolean;
    userId?: string;
}) => {
    const { state: categoryCache, fromCache } = await getCategoryState(supabase);

    let result = categoryCache.categories;

    // Filter by Parent Slug (find children of ...)
    if (options.parentSlug) {
        const parent = categoryCache.categories.find((c: any) => c.slug === options.parentSlug);
        if (!parent) return { data: [], fromCache };

        const relations = categoryCache.relationsMap.get(parent.id);
        if (!relations) return { data: [], fromCache };

        const childIds = new Set(relations.children.map((r: any) => r.child_category_id));
        result = result.filter(c => childIds.has(c.id));
    }

    // Filter to only root-level categories (those that are not children of any other category)
    if (options.includeChildren) {
        // Get all IDs that ARE children (i.e. have a parent)
        const allChildIds = new Set(categoryCache.relations.map((r: any) => r.child_category_id));
        result = result.filter(cat => !allChildIds.has(cat.id));
    }

    // Enrich with nested structure
    const enriched = result.map(cat => {
        const rels = categoryCache.relationsMap.get(cat.id);
        const childrenRels = rels?.children || [];

        const children = childrenRels.map((r: any) => {
            const childCat = categoryCache.categoriesMap.get(r.child_category_id);
            return {
                ...r,
                child: childCat
            };
        }).filter((item: any) => item.child); // Ensure child exists

        return {
            ...cat,
            children
        };
    });

    return { data: enriched, fromCache };
};

export const fetchCategoryByIdServer = async (supabase: SupabaseClient, id: string) => {
    const { state: categoryCache } = await getCategoryState(supabase);

    const cat = categoryCache.categoriesMap.get(id);
    if (!cat) return null;

    const rels = categoryCache.relationsMap.get(id);

    // Reconstruct parents
    const parents = (rels?.parents || []).map((r: any) => ({
        ...r,
        parent: categoryCache.categoriesMap.get(r.parent_category_id)
    })).filter((item: any) => item.parent);

    // Reconstruct children
    const children = (rels?.children || []).map((r: any) => ({
        ...r,
        child: categoryCache.categoriesMap.get(r.child_category_id)
    })).filter((item: any) => item.child);

    return {
        ...cat,
        parents,
        children
    };
};

export const createCategoryServer = async (supabase: SupabaseClient, category: any) => {
    // 1. Create Category
    const { data, error } = await supabase
        .from('categories')
        .insert({
            name: category.name,
            slug: category.slug,
            description: category.description,
            visibility: category.visibility,
            owner_id: category.owner_id,
            meta: category.meta || {}
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Create Parent Relation if provided
    if (category.parentId) {
        const { error: relError } = await supabase
            .from('category_relations')
            .insert({
                parent_category_id: category.parentId,
                child_category_id: data.id,
                relation_type: category.relationType || 'generalization'
            });

        if (relError) {
            // Attempt cleanup? Or just throw.
            throw relError;
        }
    }

    await flushCategoryCache();

    return data;
};

export const updateCategoryServer = async (supabase: SupabaseClient, id: string, updates: any) => {
    const { data, error } = await supabase
        .from('categories')
        .update({
            name: updates.name,
            slug: updates.slug,
            description: updates.description,
            visibility: updates.visibility,
            ...(updates.meta !== undefined && { meta: updates.meta })
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        // If not found, error code is PGRST116
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }

    await flushCategoryCache();

    return data;
};

export const deleteCategoryServer = async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;

    await flushCategoryCache();

    return true;
};

/**
 * Fetch category ancestry paths for given category IDs
 * Returns an array of paths, where each path is an array of categories from root to leaf
 */
export const fetchCategoryAncestry = async (
    supabase: SupabaseClient,
    baseCategoryIds: string[]
): Promise<any[][]> => {
    if (baseCategoryIds.length === 0) return [];

    const { state: categoryCache } = await getCategoryState(supabase);

    const resultPaths: any[][] = [];

    for (const baseId of baseCategoryIds) {
        // BFS or DFS to find all paths to roots?
        // Since a category can have multiple parents (poly-hierarchy), we need to find all paths.
        // Recursive approach with memoization might be best for small trees.

        const pathsForThisId: any[][] = [];
        const visited = new Set<string>();

        // Helper to find parents recursively
        const findPaths = (currentId: string, currentPath: any[]) => {
            const cat = categoryCache.categoriesMap.get(currentId);
            if (!cat) return; // Should not happen if data consistent

            // Check for cycles
            if (visited.has(currentId + ':' + currentPath.length)) {
                // Simple cycle check: currentId in currentPath?
                if (currentPath.some(c => c.id === currentId)) return;
            }

            // Add current node to start of path (building leaf -> root)
            const newPath = [cat, ...currentPath];

            const rels = categoryCache.relationsMap.get(currentId);
            const parentRels = rels?.parents || [];

            if (parentRels.length === 0) {
                // Root reached
                pathsForThisId.push(newPath);
            } else {
                for (const rel of parentRels) {
                    findPaths(rel.parent_category_id, newPath);
                }
            }
        };

        findPaths(baseId, []);
        resultPaths.push(...pathsForThisId);
    }

    return resultPaths;
};

/**
 * Fetch category paths for multiple pages
 * Returns a Map of pageId -> category paths
 */
export const fetchCategoryPathsForPages = async (
    supabase: SupabaseClient,
    pages: any[]
): Promise<Map<string, any[][]>> => {
    const { state: categoryCache } = await getCategoryState(supabase);

    const pageCategoryMap = new Map<string, string[]>();
    const allCategoryIds = new Set<string>();

    // Collect all category IDs from pages
    pages.forEach(page => {
        const categoryIds: string[] = [];
        if (page.meta?.categoryIds && Array.isArray(page.meta.categoryIds)) {
            categoryIds.push(...page.meta.categoryIds);
        } else if (page.meta?.categoryId) {
            categoryIds.push(page.meta.categoryId);
        }

        if (categoryIds.length > 0) {
            pageCategoryMap.set(page.id, categoryIds);
            categoryIds.forEach(id => allCategoryIds.add(id));
        }
    });

    if (allCategoryIds.size === 0) return new Map();

    const categoryPathsMap = new Map<string, any[][]>();
    // Compute paths for all unique categories
    // Optimized: Pre-calculate paths for each Category ID
    const allPaths = await fetchCategoryAncestry(supabase, Array.from(allCategoryIds));
    // Group paths by leaf ID
    const pathsByLeaf = new Map<string, any[][]>();
    allPaths.forEach(path => {
        const leaf = path[path.length - 1];
        if (leaf) {
            const existing = pathsByLeaf.get(leaf.id) || [];
            existing.push(path);
            pathsByLeaf.set(leaf.id, existing);
        }
    });

    // Map back to pages
    pageCategoryMap.forEach((categoryIds, pageId) => {
        const pagePaths: any[][] = [];
        categoryIds.forEach(catId => {
            const paths = pathsByLeaf.get(catId);
            if (paths) pagePaths.push(...paths);
        });

        if (pagePaths.length > 0) {
            categoryPathsMap.set(pageId, pagePaths);
        }
    });

    return categoryPathsMap;
};

// Route Definitions
export const getCategoriesRoute = createRouteBody(
    'get',
    '/api/categories',
    ['Categories'],
    'Get Categories',
    'Get Categories',
    {
        query: z.object({
            parentSlug: z.string().optional(),
            includeChildren: z.enum(['true', 'false']).optional()
        })
    },
    {
        200: {
            description: 'Categories List',
            content: {
                'application/json': {
                    schema: z.array(z.any())
                }
            }
        }
    },
    false // private
);

export const getCategoryRoute = createRouteBody(
    'get',
    '/api/categories/:id',
    ['Categories'],
    'Get Category',
    'Get Category',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Category Details',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        },
        404: { description: 'Category not found' }
    },
    false // private
);

export const createCategoryRoute = createRouteBody(
    'post',
    '/api/categories',
    ['Categories'],
    'Create Category',
    'Create Category',
    {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string(),
                        slug: z.string(),
                        description: z.string().optional(),
                        visibility: z.enum(['public', 'unlisted', 'private', 'internal']).optional(),
                        parentId: z.string().optional(),
                        relationType: z.enum(['generalization', 'material_usage', 'domain', 'process_step', 'standard', 'other']).optional()
                    })
                }
            }
        }
    },
    {
        200: {
            description: 'Category Created',
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

export const updateCategoryRoute = createRouteBody(
    'patch',
    '/api/categories/:id',
    ['Categories'],
    'Update Category',
    'Update Category',
    {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().optional(),
                        slug: z.string().optional(),
                        description: z.string().optional(),
                        visibility: z.enum(['public', 'unlisted', 'private', 'internal']).optional(),
                        meta: z.record(z.string(), z.any()).optional()
                    })
                }
            }
        }
    },
    {
        200: {
            description: 'Category Updated',
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

export const deleteCategoryRoute = createRouteBody(
    'delete',
    '/api/categories/:id',
    ['Categories'],
    'Delete Category',
    'Delete Category',
    {
        params: z.object({
            id: z.string()
        })
    },
    {
        200: {
            description: 'Category Deleted',
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

export async function handleGetCategories(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const parentSlug = c.req.query('parentSlug');
        const includeChildren = c.req.query('includeChildren') === 'true';

        // Extract user ID from Auth Token (if present)
        let userId: string | undefined;
        const authHeader = c.req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        const { data: categories, fromCache } = await fetchCategoriesServer(supabase, { parentSlug, includeChildren, userId });

        c.header('X-Cache', fromCache ? 'HIT' : 'MISS');
        return c.json(categories);
    } catch (err: any) {
        logger.error({ err }, 'Get Categories failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleGetCategory(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');
        const category = await fetchCategoryByIdServer(supabase, id);

        // Does fetchCategoryByIdServer support X-Cache? No, but we can infer or update if needed.
        // For now user only requested category list tests.
        // But let's assume if it returns, it was cached or fetched.
        // Actually, fetchCategoryByIdServer uses getCategoryState too, so it is cached.
        // We can update it similarly if needed, but let's stick to list for now.

        if (!category) return c.json({ error: 'Category not found' }, 404);

        // Since getCategoryState is cached, this is effectively always using the cache state 
        // (which might be fresh or stale). We don't propagate hit/miss here yet.

        return c.json(category);
    } catch (err: any) {
        logger.error({ err }, 'Get Category failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleCreateCategory(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        // Auth check usually handled by middleware if route is protected, 
        // but we need the user ID for owner_id if not provided (or to verify).
        // RLS will enforce permissions.
        const authHeader = c.req.header('Authorization');
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return c.json({ error: 'Unauthorized' }, 401);

        const body = await c.req.json();
        const categoryData = { ...body, owner_id: user.id }; // Force owner to be creator

        const newCategory = await createCategoryServer(supabase, categoryData);
        return c.json(newCategory);
    } catch (err: any) {
        logger.error({ err }, 'Create Category failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleUpdateCategory(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');
        const body = await c.req.json();

        const authHeader = c.req.header('Authorization');
        let usedSupabase = supabase; // Default to service/global client

        if (authHeader) {
            // TODO: Use authenticated client if RLS requires it
            // For now using service key but we should check ownership
        }

        const updated = await updateCategoryServer(usedSupabase, id, body);

        if (!updated) {
            return c.json({ error: 'Category not found or unauthorized' }, 404);
        }

        return c.json(updated);
    } catch (err: any) {
        logger.error({ err }, 'Update Category failed');
        return c.text('Internal Server Error', 500);
    }
}

export async function handleDeleteCategory(c: Context) {
    try {
        const { supabase } = await import('../../../commons/supabase.js');

        const id = c.req.param('id');
        await deleteCategoryServer(supabase, id);

        return c.json({ success: true });
    } catch (err: any) {
        logger.error({ err }, 'Delete Category failed');
        return c.text('Internal Server Error', 500);
    }
}
