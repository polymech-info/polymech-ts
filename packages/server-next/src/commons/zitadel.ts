import { logger } from '@/commons/logger.js';
import type { User } from '@polymech/shared';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import 'dotenv/config';
import { testDatabaseConnection, resolveAppUserId } from './postgres.js';
export {
    pool,
    applicationPool,
    getPool,
    hasAuthUsersTable,
    isAdmin,
    resolveAppUserId,
    fetchUserSecretsByIdentity,
    testDatabaseConnection,
    testSupabaseConnection,
} from './postgres.js';

/**
 * Zitadel-backed commons: JWT verification via OIDC JWKS; app data via direct Postgres (`pg`).
 *
 * Env:
 * - `DATABASE_URL_NEXT` — preferred connection string for the new DB (falls back to `DATABASE_URL`).
 * - `ZITADEL_ISSUER` — e.g. `https://auth.polymech.info`.
 * - `ZITADEL_JWKS_URL` — optional; default `{issuer}/oauth/v2/keys`.
 * - `ZITADEL_AUDIENCE` — optional; comma-separated `aud` values for access tokens.
 *
 * Admin: UUID `sub` → `user_roles.user_id`. OIDC numeric `sub` → optional `profiles.zitadel_sub`, else
 * email: same `email` claim as the SPA sees (`react-oidc-context` `user.profile.email` on AuthZ).
 */


const AUTH_CACHE_TTL = process.env.AUTH_CACHE_TTL ? parseInt(process.env.AUTH_CACHE_TTL, 10) : 1000 * 30;

type AuthCacheEntry = { user: User | null; timestamp: number };
const authMap = new Map<string, AuthCacheEntry>();

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

function looksLikeCompactJwt(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
}

function normalizeIssuer(raw: string): string {
    return raw.replace(/\/$/, '');
}

function getZitadelIssuer(): string | null {
    const raw = process.env.ZITADEL_ISSUER?.trim();
    if (!raw) return null;
    return normalizeIssuer(raw);
}

function getJwksUrl(): URL {
    const issuer = getZitadelIssuer();
    if (!issuer) {
        throw new Error('ZITADEL_ISSUER is not set');
    }
    const explicit = process.env.ZITADEL_JWKS_URL?.trim();
    if (explicit) {
        return new URL(explicit);
    }
    return new URL(`${issuer}/oauth/v2/keys`);
}

let jwksRemote: ReturnType<typeof createRemoteJWKSet> | undefined;

function getRemoteJwks(): ReturnType<typeof createRemoteJWKSet> {
    if (!jwksRemote) {
        jwksRemote = createRemoteJWKSet(getJwksUrl());
    }
    return jwksRemote;
}

function audToString(aud: JWTPayload['aud']): string {
    if (typeof aud === 'string') return aud;
    if (Array.isArray(aud) && typeof aud[0] === 'string') return aud[0];
    return '';
}

/** Maps JWT claims to `User`; `email` matches OIDC ID token / AuthZ `profile.email` when scopes include email. */
function claimsToUser(payload: JWTPayload): User {
    const sub = payload.sub;
    if (!sub) {
        throw new Error('JWT missing sub');
    }
    const email =
        (typeof payload.email === 'string' && payload.email) ||
        (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
        '';
    const now = new Date().toISOString();
    return {
        id: sub,
        aud: audToString(payload.aud),
        app_metadata: {},
        user_metadata: {},
        email,
        phone: '',
        created_at: now,
        updated_at: now,
        is_anonymous: false,
    } as User;
}

async function verifyZitadelAccessToken(token: string): Promise<User | null> {
    const issuer = getZitadelIssuer();
    if (!issuer) {
        return null;
    }
    if (!looksLikeCompactJwt(token)) {
        return null;
    }
    const audiences = process.env.ZITADEL_AUDIENCE?.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const JWKS = getRemoteJwks();
    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer,
            ...(audiences?.length ? { audience: audiences } : {}),
            clockTolerance: '30s',
        });
        return claimsToUser(payload);
    } catch (err) {
        logger.warn({ err }, 'Zitadel JWT verification failed');
        return null;
    }
}

export const getUserCached = async (token: string): Promise<User | null> => {
    if (!token) return null;

    const now = Date.now();

    const exp = getJwtExp(token);
    if (exp !== null && exp * 1000 <= now) {
        authMap.delete(token);
        return null;
    }

    const cached = authMap.get(token);
    if (cached && now - cached.timestamp < AUTH_CACHE_TTL) {
        return cached.user;
    }

    try {
        const zitadelUser = await verifyZitadelAccessToken(token);
        if (!zitadelUser) {
            authMap.set(token, { user: null, timestamp: now });
            return null;
        }

        // Resolve Zitadel numeric sub → app UUID (profiles.user_id).
        // Falls back to the original sub when the column/row doesn't exist yet.
        let user = zitadelUser;
        try {
            const appUuid = await resolveAppUserId(zitadelUser.id, zitadelUser.email || null);
            if (appUuid && appUuid !== zitadelUser.id) {
                user = {
                    ...zitadelUser,
                    id: appUuid,
                    // Keep original sub accessible for endpoints that need it
                    user_metadata: { ...zitadelUser.user_metadata, zitadel_sub: zitadelUser.id },
                };
            }
        } catch (resolveErr) {
            logger.warn({ resolveErr, sub: zitadelUser.id }, 'resolveAppUserId failed — using raw sub as user id');
        }

        authMap.set(token, { user, timestamp: now });
        return user;
    } catch (err) {
        logger.error({ err }, 'Auth Cache Error');
        return null;
    }
};

export const flushAuthCache = (userId?: string) => {
    if (!userId) {
        authMap.clear();
        jwksRemote = undefined;
        return;
    }
    for (const [token, entry] of authMap) {
        if (entry.user?.id === userId) authMap.delete(token);
    }
};

/** Fetches JWKS URL (no JWT required). */
export async function testZitadelJwksReachable(): Promise<boolean> {
    const issuer = getZitadelIssuer();
    if (!issuer) return false;
    try {
        const res = await fetch(getJwksUrl(), { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}

/** JWKS reachability + DB ping. */
export async function testZitadelConnection(): Promise<{ jwksOk: boolean; dbOk: boolean }> {
    const jwksOk = await testZitadelJwksReachable();
    const dbOk = await testDatabaseConnection();
    return { jwksOk, dbOk };
}
