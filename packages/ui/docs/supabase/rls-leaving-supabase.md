# RLS (Leaving Supabase)

## Overview

Chapter in the **Leaving Supabase** series: Row-Level Security moves from Supabase's GoTrue-coupled model (`auth.uid()` + PostgREST) to **plain Postgres RLS** backed by a session variable, while keeping every existing policy intact — no rewrites, no policy drops.

**Contents**

1. **§1 — What Supabase RLS actually is** — The GoTrue coupling, what breaks when you leave.
2. **§2 — The five portability problems** — Tokens, `auth.users`, `auth.uid()`, missing roles, BYPASSRLS.
3. **§3 — The workarounds** — How each problem is solved without modifying policies.
4. **§4 — How RLS evaluates in the new architecture** — Session variable, pool separation.
5. **§5 — The `auth` schema on plain Postgres** — Minimal `auth.users`, no GoTrue.
6. **References** — Related chapters.

---

## 1. What Supabase RLS actually is

Supabase RLS is standard **Postgres Row-Level Security** — nothing proprietary — but it is wired through two Supabase-specific pieces:

### 1.1 PostgREST sets the JWT context

When a browser calls the Supabase API, PostgREST:
1. Validates the GoTrue JWT
2. Calls `SET LOCAL request.jwt.claims = '<payload>'` on the Postgres connection
3. Sets `ROLE authenticated` (or `anon`) for that transaction

Supabase then provides `auth.uid()` as a thin wrapper around that claim:

```sql
-- Supabase's actual auth.uid() implementation (GoTrue / PostgREST)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    (current_setting('request.jwt.claims', true)::jsonb ->> 'id')
  )::uuid
$$ LANGUAGE sql STABLE;
```

### 1.2 All policies reference that function

```sql
-- Typical Supabase RLS policy
CREATE POLICY "owner can read" ON public.posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### 1.3 What breaks when you leave

When you connect to Postgres directly (no PostgREST, no GoTrue JWT pipe):

| What fails | Why |
|:---|:---|
| `auth.uid()` | Function doesn't exist outside Supabase |
| `TO authenticated` | Role doesn't exist on plain Postgres |
| `REFERENCES auth.users(id)` | Schema `auth` doesn't exist |
| `\restrict` / `\unrestrict` in dumps | Supabase-custom psql tokens, unknown to standard `psql` |
| Server-side admin queries | Service user lacks `BYPASSRLS` → RLS blocks its own queries |

---

## 2. The five portability problems

### Problem 1 — `\restrict` tokens in pg_dump output

Supabase injects a security token on line 1 and the last line of every `pg_dump` file:

```
\restrict CTr7scG9HDQwlW5lApN1nPGSJZnEc9H...
...
\unrestrict CTr7scG9HDQwlW5lApN1nPGSJZnEc9H...
```

Standard `psql` doesn't recognise these meta-commands and will error.

**Fix:** strip them before restoring:

```bash
# bash
sed -i '/^\\(un\)\?restrict /d' dump.sql

# PowerShell
(Get-Content dump.sql) -replace '(?m)^\\(un)?restrict\s+\S+\s*$','' | Set-Content dump.sql
```

This is handled automatically by the backup tooling on every new dump.

---

### Problem 2 — `auth.users` doesn't exist

Every FK that references `auth.users(id)` fails during structure restore:

```
ERROR: relation "auth.users" does not exist
```

**Fix:** create a minimal `auth.users` table. The table needs all 34 columns that appear in Supabase's `pg_dump COPY` statement — all nullable or defaulted, no GoTrue functions needed.

```sql
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email                   text        UNIQUE,
    encrypted_password      text,
    -- ... 31 more GoTrue bookkeeping columns (all nullable / defaulted)
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);
```

The full definition lives in `cli-ts/schemas/auth_users.sql`.

> **Restore order:** `auth` schema + table must be created AFTER `db-import --clear` creates the database, but the `auth` schema sits outside `public` so `--clear` never touches it on subsequent restores.

---

### Problem 3 — `auth.uid()` doesn't exist

Every policy that calls `auth.uid()` fails to create:

```
ERROR: function auth.uid() does not exist
```

**Fix:** create `auth.uid()` as a real Postgres function that reads a session variable set by the server:

```sql
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;
```

The server sets this variable at the start of each request on the application pool connection:

```typescript
await db.query('SET LOCAL app.current_user_id = $1', [userId]);
```

`SET LOCAL` scopes the variable to the current transaction — automatically cleared at transaction end, no cross-request leakage.

---

### Problem 4 — `authenticated` / `anon` roles don't exist

Policies with `TO authenticated` or `TO anon` fail with:

```
ERROR: role "authenticated" does not exist
```

**Fix:** create the roles. They never need to log in — they only exist so policy DDL parses without error:

```sql
CREATE ROLE anon          NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role  NOLOGIN NOINHERIT BYPASSRLS;
```

---

### Problem 5 — service user can't read its own tables (BYPASSRLS)

This is the most subtle problem. After restore, server-side queries like `isAdmin` or role lookups return empty results even though the data is there:

```
GET /api/me/identity → { "roles": [] }   -- user_roles has rows, but RLS blocks them
```

**Why:** The server's database user (`service.polymech`) is subject to RLS. Policies on `user_roles` check `auth.uid()`. For **server-side** queries that don't represent an end-user request — `isAdmin()`, role resolution, pg-boss startup — there is no session variable set, so `auth.uid()` returns `NULL`. Every RLS policy that checks `auth.uid()` then blocks all rows.

On Supabase this never occurred because the server connected as `postgres` (superuser) which bypasses RLS unconditionally.

**Fix:** grant `BYPASSRLS` to the service user:

```sql
ALTER ROLE "service.polymech" WITH BYPASSRLS;
```

This is included automatically in the provisioning step (`db-import --create-user`). For an existing role:

```bash
psql "postgresql://root:...@host:5432/postgres" \
  -c 'ALTER ROLE "service.polymech" WITH BYPASSRLS;'
```

`BYPASSRLS` does not make the user a superuser — it only skips RLS enforcement for that role. The server still enforces authorisation at the application layer via `@polymech/acl` and middleware checks.

---

## 3. The workarounds in sequence

```
1.  db-import --clear          →  creates DB if missing, wipes public schema, restores structure + data
2.  DROP SCHEMA IF EXISTS auth CASCADE
3.  CREATE SCHEMA auth
4.  CREATE ROLE anon / authenticated / service_role
5.  CREATE FUNCTION auth.uid()   →  reads app.current_user_id
6.  CREATE FUNCTION auth.role()  →  stub
7.  CREATE FUNCTION auth.jwt()   →  stub (returns '{}')
8.  CREATE TABLE auth.users      →  34-column definition matching pg_dump COPY output
9.  COPY auth.users rows         →  real user identities from the Supabase backup
10. ALTER ROLE "service.polymech" WITH BYPASSRLS  →  (handled by --create-user in db-import)
```

After step 9, every RLS policy is live and evaluates correctly. After step 10, server-side queries work without a session variable.

---

## 4. How RLS evaluates in the new architecture

### Pool separation

The server maintains two Postgres connection pools:

| Pool | Connects as | RLS | Used for |
|:---|:---|:---|:---|
| **service pool** | `service.<site>` + `BYPASSRLS` | **Bypassed** | All server-side queries: `isAdmin`, role lookups, data reads/writes |
| **pg-boss** | `root` via `DATABASE_URL_SERVICE` | **Bypassed** (superuser) | Schema provisioning, job queue DDL |

`BYPASSRLS` on `service.<site>` gives the server the same effective privilege as Supabase's `postgres` superuser connection — without needing a superuser account for routine queries. RLS remains enforced for any direct external connection that doesn't have `BYPASSRLS`.

### Request lifecycle

```
Incoming request
  → verify Zitadel JWT (zitadel.ts)
  → resolveAppUserId(sub, email)  →  app UUID
  → SET LOCAL app.current_user_id = '<uuid>'
  → query executes
  → auth.uid() returns that UUID
  → RLS policy evaluates  →  row visible / blocked
  → transaction ends  →  app.current_user_id cleared automatically
```

For **server-internal** queries (no end-user context): `BYPASSRLS` means the policy is never evaluated — the server reads/writes freely and enforces access control at the application layer.

### Why this is equivalent to Supabase RLS

| Supabase | Plain Postgres |
|:---|:---|
| PostgREST validates GoTrue JWT | Server validates Zitadel JWT |
| `SET LOCAL request.jwt.claims = '<payload>'` | `SET LOCAL app.current_user_id = '<uuid>'` |
| `auth.uid()` reads JWT `sub` claim | `auth.uid()` reads session variable |
| `postgres` superuser bypasses RLS for server | `service.polymech` + `BYPASSRLS` bypasses RLS for server |
| `ROLE authenticated` set by PostgREST | Application pool user is always "authenticated" by definition |

---

## 5. The `auth` schema on plain Postgres

After running the compatibility setup, the `auth` schema contains:

```
auth
├── users          — plain table, 34 columns, no GoTrue triggers/functions
├── uid()          — reads current_setting('app.current_user_id', true)::uuid
├── role()         — stub, returns current_setting('app.current_role', true)
└── jwt()          — stub, returns '{}'::jsonb
```

**`auth.users` is now just a table.** No GoTrue functions, no triggers, no event hooks:
- Queried directly: `SELECT id, email FROM auth.users`
- Written directly: `INSERT INTO auth.users (id, email, ...) VALUES (...)`
- Backed up with standard `pg_dump`
- Migrated to `public.profiles` or dropped when no longer needed

### Transition path

`resolveAppUserId()` in `postgres.ts` chains through three identity paths:

1. `profiles.zitadel_sub` — Zitadel numeric `sub` (preferred, no `auth.users` needed)
2. `auth.users.email` join — legacy Supabase email match (guarded by `hasAuthUsersTable()`)
3. `profiles.username` — final fallback

As users accumulate `profiles.zitadel_sub` entries, dependency on `auth.users` fades naturally. When all active users have a `zitadel_sub`, `auth.users` can be dropped and its FKs replaced with `public.profiles(user_id)`.

---

## References

- `docs/supabase/auth-zitadel.md` — Identity migration: Supabase Auth → Zitadel OIDC
- `docs/deploy/ditch-supabase.md` — Full migration plan, phases, risk assessment
- `docs/migrate-rls.md` — Backup / restore operational runbook
- `server/src/commons/zitadel.ts` — JWT verification, `resolveAppUserId`
- `server/src/commons/postgres.ts` — Pool setup, `hasAuthUsersTable`, `isAdmin`
- `cli-ts/schemas/auth_setup.sql` — Roles + `auth.uid()` setup script
- `cli-ts/schemas/auth_users.sql` — Minimal `auth.users` table definition (34 columns)
