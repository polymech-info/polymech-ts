import { Pool } from 'pg';
import { logger } from '@/commons/logger.js';

export type PostgresPoolRole = 'service' | 'application';

/**
 * When `USE_NEXT=true` the pools connect to `DATABASE_URL_NEXT` (new standalone Postgres).
 * Without the flag they fall back to `DATABASE_URL` (current Supabase Postgres) so that
 * migrated `-pg.ts` callers can be tested against the existing DB before cutting over.
 */
export const USE_NEXT = process.env.USE_NEXT === 'true' || process.env.USE_NEXT === '1';

function getRoleDsn(role: PostgresPoolRole): string | undefined {
    const serviceDsn = USE_NEXT
        ? (process.env.DATABASE_URL_NEXT?.trim() || process.env.DATABASE_URL?.trim())
        : (process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_NEXT?.trim());
    const applicationDsn = (USE_NEXT ? process.env.DATABASE_URL_NEXT_APP?.trim() : undefined) || serviceDsn;
    return role === 'service' ? serviceDsn : applicationDsn;
}

const pools = new Map<PostgresPoolRole, Pool>();
let poolsInitialized = false;

function ensureDsn(role: PostgresPoolRole): string {
    const dsn = getRoleDsn(role);
    if (dsn) return dsn;
    logger.error(
        {
            role,
            hasDatabaseUrlNext: !!process.env.DATABASE_URL_NEXT,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasDatabaseUrlNextApp: !!process.env.DATABASE_URL_NEXT_APP,
            env: process.env.NODE_ENV,
        },
        'Missing database URL for Postgres pool',
    );
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw new Error('Missing DATABASE_URL_NEXT or role-specific database URL');
}

export function getPool(role: PostgresPoolRole = 'service'): Pool {
    if (!poolsInitialized) {
        throw new Error(
            'Postgres pools are not initialized. Call initPostgresPools() from the server entrypoint before handling requests.',
        );
    }
    const p = pools.get(role);
    if (!p) {
        throw new Error(`Postgres pool for role "${role}" was not initialized`);
    }
    return p;
}

export function getServicePool(): Pool {
    return getPool('service');
}

export function getApplicationPool(): Pool {
    return getPool('application');
}

/** Service-user pool for privileged operations. */
export const pool = new Proxy({} as Pool, {
    get(_target, prop) {
        const p = getServicePool() as unknown as Record<PropertyKey, unknown>;
        const value = p[prop];
        if (typeof value === 'function') return (value as Function).bind(p);
        return value;
    },
});

/** Less privileged pool for ordinary app tasks. */
export const applicationPool = new Proxy({} as Pool, {
    get(_target, prop) {
        const p = getApplicationPool() as unknown as Record<PropertyKey, unknown>;
        const value = p[prop];
        if (typeof value === 'function') return (value as Function).bind(p);
        return value;
    },
});

/** Initialize role-based Postgres pools once at process startup. */
export function initPostgresPools(): void {
    if (poolsInitialized) return;
    logger.info(
        { useNext: USE_NEXT, dsn: USE_NEXT ? 'DATABASE_URL_NEXT' : 'DATABASE_URL' },
        'Initializing Postgres pools',
    );
    const ssl = { rejectUnauthorized: false };
    pools.set('service', new Pool({ connectionString: ensureDsn('service'), ssl }));
    pools.set('application', new Pool({ connectionString: ensureDsn('application'), ssl }));
    poolsInitialized = true;
}

/**
 * Returns the default (service) pool and verifies connectivity.
 * Throws on connection failure so callers can fail fast during startup.
 */
export async function defaultPool(): Promise<Pool> {
    const p = getServicePool();
    await p.query('SELECT 1 AS ok');
    return p;
}

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * True when this database has Supabase-style `auth.users`. Some `DATABASE_URL_NEXT` targets are
 * app-schema only and omit the `auth` schema; email then cannot be joined from auth.
 */
export async function hasAuthUsersTable(): Promise<boolean> {
    try {
        const r = await pool.query<{ exists: boolean }>(
            `SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'auth' AND table_name = 'users'
            ) AS exists`,
        );
        return Boolean(r.rows[0]?.exists);
    } catch {
        return false;
    }
}

/**
 * App admin via `user_roles` + optional `profiles.zitadel_sub` for non-UUID OIDC subjects.
 */
export const isAdmin = async (userId: string, email?: string | null): Promise<boolean> => {
    try {
        if (UUID_RE.test(userId)) {
            const r = await pool.query(
                `SELECT 1 FROM public.user_roles WHERE user_id = $1::uuid AND role = $2::public.app_role LIMIT 1`,
                [userId, 'admin'],
            );
            return (r.rowCount ?? 0) > 0;
        }
        try {
            const rs = await pool.query(
                `SELECT 1
                 FROM public.user_roles ur
                 INNER JOIN public.profiles p ON p.user_id = ur.user_id
                 WHERE ur.role = 'admin'::public.app_role
                   AND p.zitadel_sub = $1
                 LIMIT 1`,
                [userId],
            );
            if ((rs.rowCount ?? 0) > 0) return true;
        } catch (e: unknown) {
            const code = (e as { code?: string }).code;
            if (code !== '42703') throw e;
        }
        const em = email?.trim();
        if (em) {
            try {
                const r = await pool.query(
                    `SELECT 1
                     FROM public.user_roles ur
                     INNER JOIN public.profiles p ON p.user_id = ur.user_id
                     INNER JOIN auth.users au ON au.id = p.user_id
                     WHERE ur.role = 'admin'::public.app_role
                       AND lower(trim(au.email)) = lower(trim($1))
                     LIMIT 1`,
                    [em],
                );
                return (r.rowCount ?? 0) > 0;
            } catch (e: unknown) {
                const code = (e as { code?: string }).code;
                if (code !== '42P01' && code !== '42703') throw e;
            }
            const r2 = await pool.query(
                `SELECT 1
                 FROM public.user_roles ur
                 INNER JOIN public.profiles p ON p.user_id = ur.user_id
                 WHERE ur.role = 'admin'::public.app_role
                   AND lower(trim(p.username)) = lower(trim($1))
                 LIMIT 1`,
                [em],
            );
            return (r2.rowCount ?? 0) > 0;
        }
        return false;
    } catch (err) {
        logger.error({ err, userId }, 'isAdmin query failed');
        return false;
    }
};

/**
 * Map OIDC `sub` (+ optional email) to app `profiles.user_id` UUID for `DATABASE_URL_NEXT` / `DATABASE_URL`.
 * Mirrors the identity paths used by `isAdmin` (UUID sub, `profiles.zitadel_sub`, email, username).
 */
export async function resolveAppUserId(oidcSub: string, email: string | null): Promise<string | null> {
    try {
        if (UUID_RE.test(oidcSub)) return oidcSub;
        try {
            const rs = await pool.query(
                `SELECT p.user_id::text AS uid FROM public.profiles p WHERE p.zitadel_sub = $1 LIMIT 1`,
                [oidcSub],
            );
            if (rs.rows[0]?.uid) return rs.rows[0].uid as string;
        } catch (e: unknown) {
            const code = (e as { code?: string }).code;
            if (code !== '42703') throw e;
        }
        const em = email?.trim();
        if (em) {
            try {
                const r = await pool.query(
                    `SELECT p.user_id::text AS uid FROM public.profiles p
                     INNER JOIN auth.users au ON au.id = p.user_id
                     WHERE lower(trim(au.email)) = lower(trim($1)) LIMIT 1`,
                    [em],
                );
                if (r.rows[0]?.uid) return r.rows[0].uid as string;
            } catch (e: unknown) {
                const code = (e as { code?: string }).code;
                if (code !== '42P01' && code !== '42703') throw e;
            }
            const r2 = await pool.query(
                `SELECT user_id::text AS uid FROM public.profiles WHERE lower(trim(username)) = lower(trim($1)) LIMIT 1`,
                [em],
            );
            if (r2.rows[0]?.uid) return r2.rows[0].uid as string;
        }
        return null;
    } catch (err) {
        logger.error({ err, oidcSub }, 'resolveAppUserId failed');
        return null;
    }
}

/** Full `user_secrets.settings` JSONB row for the resolved app user (Postgres on service pool). */
export async function fetchUserSecretsByIdentity(
    oidcSub: string,
    email: string | null,
): Promise<{ resolvedUserId: string | null; settings: unknown | null }> {
    const uid = await resolveAppUserId(oidcSub, email);
    if (!uid) return { resolvedUserId: null, settings: null };
    const r = await pool.query(`SELECT settings FROM public.user_secrets WHERE user_id = $1::uuid LIMIT 1`, [uid]);
    return { resolvedUserId: uid, settings: r.rows[0]?.settings ?? null };
}

/** Ping Postgres (no specific table required). */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const r = await pool.query('SELECT 1 AS ok');
        return r.rows.length > 0;
    } catch {
        return false;
    }
}

/** @deprecated Use `testDatabaseConnection`; kept for callers that still use the old name. */
export const testSupabaseConnection = testDatabaseConnection;
