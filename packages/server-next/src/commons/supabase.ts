import { logger } from '@/commons/logger.js'
import { createClient as createSupabaseClient, SupabaseClient, User } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    logger.error({
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        env: process.env.NODE_ENV
    }, 'Missing Supabase environment variables');
    // process.exit(1) // Don't exit in test mode, throw instead
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw new Error('Missing Supabase environment variables: URL or Key is undefined');
}
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey)
export const client = async (): Promise<SupabaseClient> => createSupabaseClient(supabaseUrl, supabaseKey)
export const createClient = (url: string, key: string): SupabaseClient => createSupabaseClient(url, key);
export const isAdmin = async (userId: string): Promise<boolean> => {
    const c = await client();
    const { data } = await c.from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
    return !!data;
}

// --- Auth Cache (in-process Map for speed) ---

const AUTH_CACHE_TTL = process.env.AUTH_CACHE_TTL ? parseInt(process.env.AUTH_CACHE_TTL) : 1000 * 30; // Default 30 seconds

type AuthCacheEntry = { user: User | null; timestamp: number };
const authMap = new Map<string, AuthCacheEntry>();

/** Decode JWT exp claim without verification (validation is done by Supabase API). */
function getJwtExp(token: string): number | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
        return typeof decoded.exp === 'number' ? decoded.exp : null;
    } catch {
        return null;
    }
}

export const getUserCached = async (token: string): Promise<User | null> => {
    if (!token) return null;

    const now = Date.now();

    // Fast-path: reject obviously expired JWTs without hitting cache or API
    const exp = getJwtExp(token);
    if (exp !== null && exp * 1000 <= now) {
        authMap.delete(token);
        return null;
    }

    const cached = authMap.get(token);
    if (cached && (now - cached.timestamp < AUTH_CACHE_TTL)) {
        return cached.user;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            authMap.set(token, { user: null, timestamp: now });
            return null;
        }

        authMap.set(token, { user, timestamp: now });
        return user;
    } catch (err) {
        logger.error({ err }, 'Auth Cache Error');
        return null;
    }
};

/** Clear in-process auth cache (call after admin user ops, role changes, etc.) */
export const flushAuthCache = (userId?: string) => {
    if (!userId) {
        authMap.clear();
        return;
    }
    // Remove entries for a specific user
    for (const [token, entry] of authMap) {
        if (entry.user?.id === userId) authMap.delete(token);
    }
};

/**
 * Test Supabase connection by attempting a simple query
 */
export async function testSupabaseConnection(): Promise<boolean> {
    try {
        const { error } = await supabase.from('products').select('id').limit(1)
        return !error
    } catch {
        return false
    }
}
