import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createLogger } from '../logger.js';
import { initPostgresPools } from '../postgres.js';
import {
    getUserCached,
    flushAuthCache,
    isAdmin,
    testZitadelConnection,
    testZitadelJwksReachable,
} from '../zitadel.js';

import { ensureServersRunning, stopServers } from '../../__tests__/test-commons.js';

const apiBase = (process.env.SERVER_URL || 'http://localhost:3333').replace(/\/$/, '');
const authzDebugUrl = `${apiBase}/api/admin/authz/debug`;

const logger = createLogger('test-zitadel-e2e');
const hasZitadelIssuer = !!process.env.ZITADEL_ISSUER?.trim();

function normalizeEnvToken(raw: string | undefined): string {
    if (!raw) return '';
    return raw
        .trim()
        .replace(/^\uFEFF/, '')
        .replace(/^["']|["']$/g, '');
}

function looksLikeCompactJwt(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
}

/** From `.env` / `.env.zitadel.local` — `zitadel:token` writes both when Zitadel returns opaque access + OIDC id_token. */
const zitadelTestAccessToken = normalizeEnvToken(process.env.ZITADEL_TEST_ACCESS_TOKEN);
const zitadelTestIdToken = normalizeEnvToken(process.env.ZITADEL_TEST_ID_TOKEN);

/**
 * JWT for JWKS tests: prefer `id_token` (always JWT with openid) if access_token is opaque.
 * For id_token, set `ZITADEL_AUDIENCE` to your OIDC client_id if verification fails.
 */
const zitadelTestJwt =
    (zitadelTestIdToken && looksLikeCompactJwt(zitadelTestIdToken) ? zitadelTestIdToken : '') ||
    (zitadelTestAccessToken && looksLikeCompactJwt(zitadelTestAccessToken) ? zitadelTestAccessToken : '');

const hasTestAccessToken = !!zitadelTestAccessToken || !!zitadelTestIdToken;

/** Login name: TEST_USER / TEST_EMAIL, else SERVICE_USER_ZITADEL_* (password-grant path only). */
const testLogin =
    process.env.TEST_USER?.trim() ||
    process.env.TEST_EMAIL?.trim() ||
    process.env.SERVICE_USER_ZITADEL_EMAIL?.trim() ||
    '';
const testPassword =
    process.env.TEST_PASSWORD?.trim() ||
    process.env.SERVICE_USER_ZITADEL_PASSWORD?.trim() ||
    '';
const zitadelClientId =
    process.env.ZITADEL_OIDC_CLIENT_ID?.trim() ||
    process.env.ZITADEL_CLIENT_ID?.trim() ||
    process.env.VITE_ZITADEL_CLIENT_ID?.trim() ||
    '';

const canTestZitadelPasswordAndPgAdmin =
    hasZitadelIssuer &&
    !!testLogin &&
    !!testPassword &&
    !!zitadelClientId &&
    !!process.env.DATABASE_URL_NEXT?.trim();

const hasJwtAccessToken = !!zitadelTestJwt;

/** Auth code + PKCE JWT + Postgres admin check (read-only). */
const canTestAccessTokenAndPgAdmin =
    hasZitadelIssuer && hasJwtAccessToken && !!process.env.DATABASE_URL_NEXT?.trim();

/** Password grant is off on User Agent apps; enable only if Zitadel allows it for your client. */
const enablePasswordGrantTest =
    process.env.ZITADEL_ENABLE_PASSWORD_GRANT_TEST === '1' ||
    process.env.ZITADEL_ENABLE_PASSWORD_GRANT_TEST === 'true';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const p = token.split('.')[1];
        if (!p) return null;
        return JSON.parse(Buffer.from(p, 'base64url').toString()) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function assertGetUserCachedOk(user: Awaited<ReturnType<typeof getUserCached>>, token: string): asserts user is NonNullable<typeof user> {
    if (user) return;
    if (!looksLikeCompactJwt(token)) {
        throw new Error(
            'Need a JWT: set ZITADEL_TEST_ID_TOKEN (OIDC id_token) or a JWT access_token. ' +
                'Re-run npm run zitadel:token -- --write-local .env.zitadel.local (scope openid returns id_token).',
        );
    }
    const pl = decodeJwtPayload(token);
    const exp =
        typeof pl?.exp === 'number' ? new Date(pl.exp * 1000).toISOString() : 'n/a';
    const expired = typeof pl?.exp === 'number' && pl.exp * 1000 <= Date.now();
    throw new Error(
        `getUserCached returned null (${expired ? 'token expired' : 'JWT verify failed'}). ` +
            `iss=${JSON.stringify(pl?.iss)} aud=${JSON.stringify(pl?.aud)} exp=${exp}. ` +
            `Align ZITADEL_ISSUER / ZITADEL_AUDIENCE with the token, or run npm run zitadel:token again.`,
    );
}

function issuerBase(): string {
    return process.env.ZITADEL_ISSUER!.replace(/\/$/, '');
}

/**
 * OAuth2 resource-owner password grant against Zitadel (must be allowed on the OIDC app).
 */
async function zitadelPasswordGrant(): Promise<{ access_token: string }> {
    const body = new URLSearchParams({
        grant_type: 'password',
        username: testLogin,
        password: testPassword,
        client_id: zitadelClientId,
        scope: 'openid profile email',
    });
    const secret =
        process.env.ZITADEL_OIDC_CLIENT_SECRET?.trim() ||
        process.env.ZITADEL_CLIENT_SECRET?.trim();
    if (secret) {
        body.set('client_secret', secret);
    }
    const res = await fetch(`${issuerBase()}/oauth/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Zitadel token endpoint ${res.status}: ${text}`);
    }
    return JSON.parse(text) as { access_token: string };
}

function jwtPayload(accessToken: string): { sub?: string; email?: string } {
    try {
        const payload = accessToken.split('.')[1];
        if (!payload) return {};
        return JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
            sub?: string;
            email?: string;
        };
    } catch {
        return {};
    }
}

beforeAll(() => {
    initPostgresPools();
    if (!hasZitadelIssuer) {
        logger.warn('ZITADEL_ISSUER not set — JWKS / token tests will be skipped');
    }
    if (!hasTestAccessToken) {
        logger.warn(
            'ZITADEL_TEST_ACCESS_TOKEN not set — run npm run zitadel:token (writes .env.zitadel.local)',
        );
    } else if (!hasJwtAccessToken) {
        logger.warn(
            'No JWT for tests: add ZITADEL_TEST_ID_TOKEN (from npm run zitadel:token) or a JWT access_token — opaque API tokens need id_token for JWKS',
        );
    }
});

describe('commons/zitadel (module)', () => {
    it('getUserCached returns null for an empty token', async () => {
        expect(await getUserCached('')).toBeNull();
    });

    it('getUserCached returns null for malformed token (no valid JWT shape)', async () => {
        expect(await getUserCached('not-a-jwt')).toBeNull();
    });

    it.skipIf(!hasZitadelIssuer)(
        'testZitadelJwksReachable is true when issuer is configured',
        async () => {
            const ok = await testZitadelJwksReachable();
            expect(ok).toBe(true);
        },
    );

    it.skipIf(!hasZitadelIssuer)('testZitadelConnection reports jwksOk', async () => {
        const r = await testZitadelConnection();
        expect(r.jwksOk).toBe(true);
        expect(typeof r.dbOk).toBe('boolean');
    });

    it.skipIf(!hasZitadelIssuer || !hasJwtAccessToken)(
        'getUserCached verifies JWT (ZITADEL_TEST_ID_TOKEN or JWT access_token)',
        async () => {
            const token = zitadelTestJwt;
            flushAuthCache();
            const user = await getUserCached(token);
            assertGetUserCachedOk(user, token);
            expect(user.id).toBeTruthy();
        },
    );

    /** `zitadel:token` often writes an opaque API access_token plus a separate OIDC id_token JWT. */
    it.skipIf(!zitadelTestAccessToken || looksLikeCompactJwt(zitadelTestAccessToken))(
        'wrong credentials: opaque ZITADEL_TEST_ACCESS_TOKEN is not verified by getUserCached (not a JWT)',
        async () => {
            flushAuthCache();
            expect(await getUserCached(zitadelTestAccessToken)).toBeNull();
        },
    );

    it.skipIf(!hasZitadelIssuer || !hasJwtAccessToken)(
        'wrong credentials: tampered JWT (broken signature) → getUserCached null',
        async () => {
            const token = zitadelTestJwt;
            const [h, p] = token.split('.');
            const tampered = `${h}.${p}.invalid-signature`;
            flushAuthCache();
            expect(await getUserCached(tampered)).toBeNull();
        },
    );

    it('isAdmin returns false for a non-existent identity (random UUID + unrelated email)', async () => {
        await expect(
            isAdmin('00000000-0000-4000-8000-000000000001', 'not-a-real-user@example.com'),
        ).resolves.toBe(false);
    });
});

/**
 * Hits the real running API (no in-process `app` import). Uses ensureServersRunning so a
 * dev server is started when nothing listens on SERVER_URL.
 */
describe('GET /api/admin/authz/debug (live server)', () => {
    beforeAll(async () => {
        await ensureServersRunning();
    });

    afterAll(() => {
        stopServers();
    });

    it('returns missing_token when no Authorization or ?token=', async () => {
        const res = await fetch(authzDebugUrl, { method: 'GET' });
        expect(res.status).toBe(200);
        const body = (await res.json()) as { verified?: boolean; error?: string };
        expect(body.verified).toBe(false);
        expect(body.error).toBe('missing_token');
    });

    it('returns opaque_or_non_jwt_token for a non-JWT Bearer string', async () => {
        const res = await fetch(authzDebugUrl, {
            method: 'GET',
            headers: { Authorization: 'Bearer not-a-jwt' },
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as { verified?: boolean; error?: string };
        expect(body.verified).toBe(false);
        expect(body.error).toBe('opaque_or_non_jwt_token');
    });

    it.skipIf(!hasJwtAccessToken)(
        'authz/debug with JWT Bearer (id_token or JWT access_token from .env.zitadel.local)',
        async () => {
            const token = zitadelTestJwt;
            const res = await fetch(authzDebugUrl, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            expect(res.status).toBe(200);
            const body = (await res.json()) as {
                verified?: boolean;
                sub?: string;
                appAdmin?: boolean;
            };
            expect(body.verified).toBe(true);
            expect(body.sub).toBeTruthy();
            expect(typeof body.appAdmin).toBe('boolean');
        },
    );
});

/**
 * 1) Resource-owner password grant — proves TEST_USER/TEST_EMAIL + TEST_PASSWORD are valid in Zitadel.
 * 2) getUserCached — JWKS verification of that access token.
 * 3) Read-only pg check on DATABASE_URL_NEXT: assert user_roles already has admin for the profile email.
 *    Does not grant or mutate roles; fails if the user is not already admin in the DB.
 *
 * “Wrong credentials” for admin: use tampered JWT / opaque token tests above; `isAdmin(user.id, wrongEmail)`
 * does not go false when `sub` is a UUID and that UUID has admin (email is ignored on the UUID path).
 *
 * Requires OIDC app to allow grant_type=password; set ZITADEL_OIDC_CLIENT_ID (same as SPA client_id).
 * Requires public.profiles.email for the join (add/sync if missing).
 */
describe('Zitadel access token (.env.zitadel.local) + assert admin in Postgres (read-only)', () => {
    it.skipIf(!canTestAccessTokenAndPgAdmin)(
        'isAdmin true: JWKS + Postgres admin for this identity (JWT from .env.zitadel.local)',
        async () => {
            const jwt = zitadelTestJwt;
            expect(jwt).toBeTruthy();
            logger.info('Starting admin assertion for .env.zitadel.local JWT');

            flushAuthCache();
            const user = await getUserCached(jwt);
            assertGetUserCachedOk(user, jwt);
            expect(user.id).toBeTruthy();

            const claims = jwtPayload(jwt);
            const rawPayload = decodeJwtPayload(jwt);
            const claimSub = typeof claims.sub === 'string' ? claims.sub : undefined;
            const claimEmail = typeof claims.email === 'string' ? claims.email : undefined;
            const emailForRow =
                claimEmail ||
                user.email ||
                process.env.TEST_EMAIL?.trim() ||
                process.env.SERVICE_USER_ZITADEL_EMAIL?.trim() ||
                testLogin;
            expect(
                emailForRow,
                'JWT/email claim or TEST_EMAIL / SERVICE_USER_ZITADEL_EMAIL required to match profiles.username (non-Supabase) or auth.users.email',
            ).toBeTruthy();

            logger.info(
                {
                    userId: user.id,
                    userEmail: user.email || null,
                    claimSub: claimSub || null,
                    claimEmail: claimEmail || null,
                    chosenEmailForRow: emailForRow,
                    payloadIss:
                        typeof rawPayload?.iss === 'string' ? rawPayload.iss : null,
                    payloadAud: rawPayload?.aud ?? null,
                    payloadExp: rawPayload?.exp ?? null,
                },
                'Debug identity inputs before isAdmin',
            );

            const admin = await isAdmin(user.id, emailForRow);
            logger.info(
                {
                    userId: user.id,
                    emailForRow,
                    admin,
                },
                'isAdmin result for JWT identity',
            );

            expect(
                admin,
                'Set profiles.zitadel_sub = JWT sub, or match auth.users.email / profiles.username to JWT email (run supabase migration 20260408190000_profiles_zitadel_sub.sql)',
            ).toBe(true);
        },
    );
});

describe('Zitadel password grant + assert admin in Postgres (optional)', () => {
    it.skipIf(!canTestZitadelPasswordAndPgAdmin || !enablePasswordGrantTest)(
        'password grant + JWKS ok; Postgres shows admin for email (no role grants)',
        async () => {
            const { access_token } = await zitadelPasswordGrant();
            expect(access_token).toBeTruthy();

            flushAuthCache();
            const user = await getUserCached(access_token);
            expect(user, 'JWKS verification of password-grant token').not.toBeNull();
            if (!user) throw new Error('unreachable');
            expect(user.id).toBeTruthy();

            const claims = jwtPayload(access_token);
            const emailForRow =
                (typeof claims.email === 'string' && claims.email) ||
                user.email ||
                process.env.TEST_EMAIL?.trim() ||
                testLogin;
            expect(emailForRow).toBeTruthy();

            expect(
                await isAdmin(user.id, emailForRow),
                `admin via user_roles + email/username lookup (${emailForRow})`,
            ).toBe(true);
        },
    );
});
