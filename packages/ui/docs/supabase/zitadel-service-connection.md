# Zitadel Service Connection (M2M)

How the **pm-pics server** authenticates to Zitadel as a machine principal — for background jobs, management-API calls, and server-side E2E tests — without a browser or a human user.

For the human OIDC/PKCE flow (SPA login, `id_token`) see [`auth-zitadel.md`](./auth-zitadel.md).  
For the `ZITADEL_SERVER_ACCESS_TOKEN` quick-reference see [`server/docs/zitadel-server-token.md`](../../server/docs/zitadel-server-token.md).

---

## How it works

```
Server                         Zitadel (auth.polymech.info)
  |                                  |
  |-- JWT assertion ----------------->|  POST /oauth/v2/token
  |   (signed with service key)       |  grant_type=jwt-bearer
  |<-- access_token (JWT) -----------|
  |
  |   OR simply:
  |   ZITADEL_SERVER_ACCESS_TOKEN (PAT pre-issued in Zitadel console)
  |
  |-- Bearer <access_token> -------->|  JWKS verification (same as human user)
```

There are **two ways** to get a service JWT. Priority order in `getServiceAccessToken()`:

| Priority | Method | Set up via | Token lifetime |
|---|---|---|---|
| **1 — PAT** | Personal Access Token from Zitadel console | `ZITADEL_SERVER_ACCESS_TOKEN` | Days–months (Zitadel policy) |
| **2 — JWT assertion** | Server signs a JWT with its private key; Zitadel exchanges it (RFC 7523) | `ZITADEL_SERVICE_KEY_JSON` | ~36 h per exchange; key valid until `expirationDate` |

The resulting access token is a **Zitadel-issued JWT** — it JWKS-verifies exactly like a human user token, so `getUserCached()` and all downstream middleware work identically.

---

## Registered service identity

| Field | Value |
|---|---|
| Zitadel machine user `sub` | `368155730978537473` |
| Zitadel key ID (`kid`) | `368190655136006145` |
| Key expiry | `2026-06-11` |
| DB `profiles.user_id` | `fe6c94a9-aeec-40db-be63-07618e502585` |
| DB role | `admin` (`public.user_roles`) |
| `aud` in issued access tokens | `["service"]` |

---

## Environment variables

All live in `server/.env.zitadel.local` (git-ignored; loaded with `override: true` in vitest so it wins over `.env`).

```env
# ── Service identity (required for test:zitadel and test:zitadel:server) ───────
# The same token is used by both test suites. Refresh with:
#   npm run zitadel:write-service-token
ZITADEL_SERVER_ACCESS_TOKEN='eyJ...'

# ── Option B: JWT assertion key (used by zitadel:write-service-token itself) ───
# Download: Zitadel console → Service Users → <user> → Keys → Download JSON
# The public key must be uploaded to Zitadel before this works.
# Verify:   npm run zitadel:key-inspect
ZITADEL_SERVICE_KEY_JSON='{"type":"serviceaccount","keyId":"368190655136006145","key":"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n","expirationDate":"2026-06-11T22:00:00Z","userId":"368155730978537473"}'

# ── Human PKCE flow (optional, for testing with a human user token) ─────────────
# Set only when running npm run zitadel:token (browser OIDC login).
# zitadel.e2e.test.ts falls back to this when ZITADEL_SERVER_ACCESS_TOKEN is absent.
ZITADEL_TEST_ID_TOKEN='eyJ...'
```

Persistent values in `server/.env`:

```env
ZITADEL_ISSUER=https://auth.polymech.info
# ZITADEL_AUDIENCE intentionally unset — service token aud ["service"] is accepted
# because verifyZitadelAccessToken() skips audience validation when not configured
```

> **`ZITADEL_TEST_ACCESS_TOKEN` is removed.** It was a redundant copy of `ZITADEL_SERVER_ACCESS_TOKEN` written by the old `zitadel:write-service-token` script. Both test suites now read `ZITADEL_SERVER_ACCESS_TOKEN` directly.

---

## Production CLI (no `tsx` required)

The webpack bundle (`dist/server.js`) doubles as a CLI. Any recognised sub-command runs the operation and exits; no sub-command starts the HTTP server as normal.

```bash
# Dev (tsx source)
npm run cli:register-service-admin -- --sub 368155730978537473
npm run cli:refresh-service-token
npm run cli:verify-admin

# Production bundle (systemd / Docker exec / any shell with node)
node dist/server.js register-service-admin --sub 368155730978537473
node dist/server.js refresh-service-token
node dist/server.js verify-admin
node dist/server.js --help   # list all commands
```

| Command | What it does |
|---|---|
| `register-service-admin --sub <sub> [--role admin]` | Upserts `profiles.zitadel_sub` row + grants role in `user_roles`. Idempotent. |
| `refresh-service-token` | Runs JWT-assertion exchange, prints claims (`sub`, `iss`, `aud`, `exp`). No file write. |
| `verify-admin` | Reads `ZITADEL_SERVER_ACCESS_TOKEN`, verifies via JWKS, asserts `isAdmin()` in Postgres. |

All commands share the same env-load order as the HTTP server (`.env` → `.env.zitadel.local` → `.env-db`), so no extra setup is needed.

---

## Scripts

```bash
# ── Token refresh (run whenever service tokens expire, ~36 h) ─────────────────
npm run zitadel:write-service-token
# Uses ZITADEL_SERVICE_KEY_JSON → JWT assertion → fresh access token →
# writes ZITADEL_SERVER_ACCESS_TOKEN into .env.zitadel.local (merges, preserves other keys).

npm run zitadel:m2m
# Same exchange but prints token + decoded payload to stdout only (no file write).
# Use to inspect a fresh token without committing it anywhere.

# ── Diagnostics ───────────────────────────────────────────────────────────────
npm run zitadel:key-inspect
# Extracts public key PEM from ZITADEL_SERVICE_KEY_JSON, runs a live token
# exchange, and prints the result. "500 Errors.Internal" = key not registered.
# Also prints step-by-step Zitadel console upload instructions.

npm run verify:admin
# Reads ZITADEL_SERVER_ACCESS_TOKEN from .env.zitadel.local, verifies the JWT
# via JWKS, then checks isAdmin() against DATABASE_URL. Quick sanity check that
# the service identity is correctly wired end-to-end.

# ── One-time DB setup ─────────────────────────────────────────────────────────
npx tsx scripts/register-service-admin.ts --sub 368155730978537473
# Creates profiles row + admin user_roles entry for the machine user. Idempotent.

# ── Human PKCE flow (optional) ────────────────────────────────────────────────
npm run zitadel:token
# Opens browser → OIDC PKCE login → merges ZITADEL_TEST_ID_TOKEN into .env.zitadel.local.

npm run zitadel:token:password
# Password grant (no browser) → same file write. Requires ROPC enabled on the OIDC app.
```

---

## E2E test suites

```bash
npm run test:zitadel:server   # zitadel-service.e2e.test.ts — service JWT + DB admin
npm run test:zitadel          # zitadel.e2e.test.ts          — same service JWT + DB admin
```

Both suites read `ZITADEL_SERVER_ACCESS_TOKEN`. `test:zitadel` falls back to `ZITADEL_TEST_ID_TOKEN` when the service token is absent (human PKCE flow).

**Expected result when everything is set up:**

```
Test Files  2 passed (2)
     Tests  18 passed | 1 skipped (19)
```

The skipped test is the password-grant test (requires `ZITADEL_ENABLE_PASSWORD_GRANT_TEST=1`).

### `test:zitadel:server`

Reads `ZITADEL_SERVER_ACCESS_TOKEN`. If absent, `beforeAll` calls `getServiceAccessToken()` via `ZITADEL_SERVICE_KEY_JSON` as a fallback. Tests:

1. `getUserCached(serviceJwt)` → non-null user (JWKS verification)
2. Tampered JWT is rejected
3. `GET /api/admin/authz/debug` with Bearer → `{ verified: true, sub: "..." }`
4. `getUserCached` + `isAdmin` → `true` (service user is admin in DB)
5. JWT payload has `sub`, `iss`, `aud`
6. `jwtVerify` (jose) against JWKS passes

### `test:zitadel`

Reads `ZITADEL_SERVER_ACCESS_TOKEN` (preferred) or `ZITADEL_TEST_ID_TOKEN`. Tests JWKS reachability, `getUserCached`, `authz/debug`, and `isAdmin`.

---

## How JWT assertion works internally

When `ZITADEL_SERVER_ACCESS_TOKEN` is absent or expired, `getServiceAccessToken()` does RFC 7523:

```
1. Parse ZITADEL_SERVICE_KEY_JSON
     clientId  = keyConfig.userId  ("368155730978537473")
     keyId     = keyConfig.keyId   ("368190655136006145")
     privateKey = RSA PEM

2. Sign an assertion JWT:
     Header:  { alg: "RS256", kid: keyId }
     Payload: { iss: clientId, sub: clientId, aud: ZITADEL_ISSUER,
                iat: now, exp: now+3600, jti: random }

3. POST https://auth.polymech.info/oauth/v2/token
     grant_type = urn:ietf:params:oauth:grant-type:jwt-bearer
     assertion  = <signed JWT>
     scope      = openid profile email

4. Zitadel verifies signature against the registered public key →
     returns { access_token (JWT), expires_in, token_type: "Bearer" }

5. Token is cached with a 1-min safety buffer before exp
```

> **Why `500 Errors.Internal`?** This is Zitadel's response when the `kid` doesn't match any key registered for that user. The JSON file alone is not enough — the **public key must be uploaded to Zitadel first**. Run `npm run zitadel:key-inspect` to get the PEM and exact console steps.

---

## Service token payload

Machine user tokens have `aud: ["service"]` and **no `email` claim**:

```json
{
  "iss": "https://auth.polymech.info",
  "sub": "368155730978537473",
  "aud": ["service"],
  "exp": 1776086012,
  "iat": 1775956412,
  "client_id": "service"
}
```

Since `ZITADEL_AUDIENCE` is unset, `verifyZitadelAccessToken()` skips audience validation and the token verifies cleanly via JWKS. `claimsToUser()` sets `email: ''`. `isAdmin` resolves correctly via the app UUID (`fe6c94a9-...`) which has an `admin` row in `user_roles`.

---

## One-time DB registration

```bash
npx tsx scripts/register-service-admin.ts --sub 368155730978537473
```

What it does:
1. Checks `profiles.zitadel_sub = '368155730978537473'` — creates row if missing (`gen_random_uuid()` for `user_id`)
2. Grants `role = 'admin'` in `user_roles` if not already present

After registration: `resolveAppUserId('368155730978537473', null)` → `fe6c94a9-...` → `isAdmin(uuid, '')` → `true`.

---

## One-time key registration in Zitadel

If you have `ZITADEL_SERVICE_KEY_JSON` but get `500 Errors.Internal`:

```bash
npm run zitadel:key-inspect   # prints public key PEM + exact console steps
```

Manual steps:
1. Open `https://auth.polymech.info/ui/console`
2. Service Users → user ID `368155730978537473`
3. Keys → Add Key → paste the public key PEM → confirm key ID is `368190655136006145`

---

## Day-to-day workflow

```
First time only (dev):
  npm run cli:register-service-admin -- --sub 368155730978537473
  npm run zitadel:key-inspect        # verify key is registered in Zitadel

First time only (production):
  node dist/server.js register-service-admin --sub 368155730978537473

When tokens expire (~36 h) — dev:
  npm run zitadel:write-service-token
  npm run verify:admin               # quick sanity check: JWKS + isAdmin

When tokens expire (~36 h) — production:
  node dist/server.js refresh-service-token   # confirm exchange works
  node dist/server.js verify-admin            # JWKS + isAdmin

Run tests:
  npm run test:zitadel:server
  npm run test:zitadel
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `500 Errors.Internal` at token endpoint | Public key not registered in Zitadel | `npm run zitadel:key-inspect` → upload PEM |
| `getUserCached` returns null | Token expired | `npm run zitadel:write-service-token` |
| `isAdmin` returns false | Service user not in DB | `npx tsx scripts/register-service-admin.ts --sub 368155730978537473` |
| `test:zitadel` shows "token expired" despite fresh `.env.zitadel.local` | Expired token in `.env` wins (no override) | `.env.zitadel.local` uses `override: true` in vitest — make sure the key exists in the local file, not just `.env` |
| `zitadel:write-service-token` fails "credentials missing" | `ZITADEL_SERVICE_KEY_JSON` not in env | Restore `.env.zitadel.local` with the service key JSON |
