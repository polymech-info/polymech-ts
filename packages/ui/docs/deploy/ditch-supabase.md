# Ditching Supabase — Research & Migration Plan

> **Status**: Research / RFC  
> **Constraints**: No Docker. Postgres only. Future Rust/C++ server possible.

---

## 1. Current Supabase Usage Audit

### 1.1 What We Actually Use

| Feature | Used? | Where | Migration Effort |
|:---|:---:|:---|:---:|
| **Auth (GoTrue)** | ✅ Heavy | `useAuth.tsx`, `server/commons/supabase.ts` | 🔴 High |
| **PostgREST query builder** (`.from().select()`) | ✅ Heavy | ~27 server files, 1 client file (`db.ts`) | 🟡 Medium |
| **Supabase JS client** (token get, session mgmt) | ✅ Heavy | ~46 `supabase.auth.getSession()` calls across client modules | 🟡 Medium |
| **OAuth (GitHub, Google)** | ✅ | `useAuth.tsx` | 🟡 Medium |
| **Email/Password auth** | ✅ | `useAuth.tsx` | 🟡 Medium |
| **Password reset flow** | ✅ | `useAuth.tsx` | 🟡 Medium |
| **Token refresh / session persistence** | ✅ | `supabase/client.ts` | 🟡 Medium |
| **RLS** | ⚠️ Enabled on tables | Migration SQL files | 🟢 Low |
| **Realtime** (`supabase.channel`) | ❌ | Not used (SSE via our server instead) | — |
| **Storage** (`supabase.storage`) | ❌ | Not used (VFS on our server) | — |
| **Edge Functions** | ❌ | Not used | — |
| **Supabase CLI / Migrations** | ✅ | `supabase/migrations/`, `supabase db push` | 🟢 Low |
| **Type generation** | ✅ | `supabase gen types` → `types.ts` | 🟢 Low |

### 1.2 Server-Side Supabase Dependency Map

**`server/src/commons/supabase.ts`** — central hub, exports:
- `supabase` — service-role client used as a PostgREST query builder
- `getUserCached(token)` — validates JWT via `supabase.auth.getUser(token)`
- `isAdmin(userId)` — queries `user_roles` table via PostgREST
- `flushAuthCache()` — in-process auth cache management
- `testSupabaseConnection()` — health check

**~27 server files** import `supabase` and call `.from('table').select/insert/update/delete`.

**`server/src/commons/auth.ts`** — test auth helper, calls `supabase.auth.signInWithPassword`.

### 1.3 Client-Side Supabase Dependency Map

**`src/integrations/supabase/client.ts`** — creates the anon-key client (hardcoded URL + key).

**`src/hooks/useAuth.tsx`** — the auth context. Uses:
- `supabase.auth.onAuthStateChange` — session listener
- `supabase.auth.getSession` / `getUser`
- `supabase.auth.signUp` / `signInWithPassword` / `signInWithOAuth` / `signOut`
- `supabase.auth.resetPasswordForEmail` / `updateUser`

**`src/lib/db.ts`** — `getAuthToken()` calls `supabase.auth.getSession()` to extract the access token, then passes it as `Bearer` header to our own Hono server.

**~46 other client files** call `supabase.auth.getSession()` solely to extract the Bearer token for API calls to our server.

### 1.4 Key Insight: We Don't Query Supabase From Client

The client **never** calls `supabase.from()` for data. All data goes through our Hono API server. The only client-side Supabase usage is:
1. **Auth flows** (login/signup/OAuth/session)
2. **Token extraction** (to send as Bearer to our Hono server)

This is excellent news — it means the client only needs an auth replacement, not a data layer replacement.

---

## 2. Auth Stack Replacement

### 2.1 Option A: **Better Auth** ⭐ RECOMMENDED

[better-auth.com](https://www.better-auth.com/) — TypeScript-first, framework-agnostic auth library.

**Why it fits perfectly:**
- ✅ Framework-agnostic — works with Hono out of the box
- ✅ First-class Postgres support (Drizzle adapter or raw pg)
- ✅ Email/Password, OAuth (GitHub, Google), 2FA, Passkeys
- ✅ Session management built-in (cookie or Bearer token)
- ✅ No Docker, no external service — runs in your Node.js process
- ✅ React client library for frontend integration
- ✅ **Future-proof**: auth logic is just Postgres tables + JWT signing — trivially portable to Rust/C++
- ✅ Generates its own DB tables via CLI (`npx @better-auth/cli generate`)

**Hono integration:**
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        github: { clientId: ENV.GITHUB_CLIENT_ID, clientSecret: ENV.GITHUB_CLIENT_SECRET },
        google: { clientId: ENV.GOOGLE_CLIENT_ID, clientSecret: ENV.GOOGLE_CLIENT_SECRET },
    },
});

// Mount in Hono
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

**Client-side:**
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_SERVER_URL, // your Hono server
});

// Usage in React — replaces useAuth.tsx
const { data: session } = authClient.useSession();
await authClient.signIn.email({ email, password });
await authClient.signIn.social({ provider: "github" });
await authClient.signOut();
```

**Migration effort for `useAuth.tsx`:**
- Replace `supabase.auth.*` calls with `authClient.*` equivalents
- Session shape changes: `session.user` instead of Supabase's `User` type
- `getAuthToken()` in `db.ts` changes to reading from Better Auth's session (cookie-based or token-based)

---

### 2.2 Option B: **Auth.js (NextAuth.js v5)**

- Mature, widely used
- ❌ Tightly coupled to Next.js — can work with Hono but requires adapters
- ❌ Session model is different (server-side sessions via DB by default)
- Not ideal for a future Rust/C++ server migration

### 2.3 Option C: **Custom Auth (DIY)**

Roll your own with `jose` (JWT) + `argon2` (password hashing) + Postgres.

- ✅ Maximum control, trivially portable to Rust/C++
- ✅ No dependency on any auth library
- ❌ You own all the security surface area (password reset flows, OAuth dance, CSRF, session rotation)
- ❌ Significant engineering effort to get right

**Verdict:** Only if you need extreme customization. Better Auth gives you 95% of this with 10% of the effort.

### 2.4 Option D: **SuperTokens (self-hosted)**

- Requires running a "SuperTokens Core" (Java process) — though it can run without Docker
- ❌ Extra process to manage
- ❌ Heavier than Better Auth for your use case

---

### Auth Recommendation: **Better Auth**

| Criteria | Better Auth | Auth.js | DIY | SuperTokens |
|:---|:---:|:---:|:---:|:---:|
| TypeScript-first | ✅ | ✅ | ✅ | ⚠️ |
| Hono support | ✅ native | ❌ adapter | ✅ | ⚠️ |
| No Docker | ✅ | ✅ | ✅ | ⚠️ |
| OAuth (GitHub/Google) | ✅ | ✅ | 🔨 DIY | ✅ |
| Postgres-native | ✅ | ✅ | ✅ | ✅ |
| Rust/C++ portability | ✅ data is standard | ⚠️ | ✅ | ❌ |
| Maintenance burden | Low | Low | High | Medium |

---

## 3. Database Query Layer: Replacing `supabase.from()`

### 3.1 Current Pattern (server)

```typescript
// All 27+ server files do this:
import { supabase } from '../commons/supabase.js';
const { data, error } = await supabase.from('posts').select('*').eq('user_id', userId);
```

This uses the Supabase JS client as a PostgREST HTTP client to query the **remote Supabase-hosted Postgres** over HTTPS.

### 3.2 Options

#### A. **Drizzle ORM** ⭐ RECOMMENDED

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Query
const posts = await db.select().from(postsTable).where(eq(postsTable.userId, userId));
```

**Pros:**
- ✅ TypeScript-first, schemas are TS code
- ✅ Full SQL power — joins, transactions, CTEs, raw SQL escape hatch
- ✅ Direct connection to Postgres (no PostgREST middleman)
- ✅ `drizzle-kit pull` can introspect your existing schema
- ✅ `drizzle-kit generate` + `drizzle-kit migrate` for migrations (replaces `supabase db push`)
- ✅ Lightweight — no code generation step for types
- ✅ Works with any Postgres (raw, managed, self-hosted)

**Cons:**
- API differs from `supabase.from().select().eq()` syntax — requires rewriting queries
- Schema definition is manual (but `drizzle-kit pull` bootstraps it)

#### B. **Kysely** (query builder, no ORM)

```typescript
const posts = await db.selectFrom('posts').where('user_id', '=', userId).selectAll().execute();
```

- ✅ Closer to raw SQL feel, minimal abstraction
- ✅ Great TypeScript inference
- ❌ Less ecosystem (fewer adapters, plugins)
- ⚠️ Schema types are inferred from DB, but requires manual or generated type definitions

#### C. **postgrest-js standalone** (keep the same API)

```bash
npm install @supabase/postgrest-js
```

```typescript
import { PostgrestClient } from '@supabase/postgrest-js';
const postgrest = new PostgrestClient('https://your-self-hosted-postgrest:3000');
const { data } = await postgrest.from('posts').select('*').eq('user_id', userId);
```

- ✅ **Zero code changes** in your server — same `.from().select().eq()` API
- ❌ Requires running PostgREST as a separate process (it's a Haskell binary, ~5MB)
- ❌ PostgREST is still an HTTP layer between your server and DB (latency)
- ❌ No transactions, limited join support
- ⚠️ PostgREST is what Supabase runs under the hood

#### D. **Keep using `@supabase/supabase-js`** (just change the URL)

You can point `createClient()` at your own PostgREST or even continue using Supabase's Postgres, just swapping out auth.

- ✅ Literally zero code changes to queries
- ❌ Still depends on PostgREST (whether Supabase-hosted or self-hosted)
- ❌ Still coupled to `@supabase/supabase-js` package
- ⚠️ Not a real "ditch" — you're just self-hostinga dependency

### Query Layer Recommendation: **Drizzle ORM**

The server has ~27 files with `supabase.from()` calls. The migration is mechanical:

| Supabase PostgREST | Drizzle ORM |
|:---|:---|
| `supabase.from('posts').select('*')` | `db.select().from(posts)` |
| `.eq('user_id', id)` | `.where(eq(posts.userId, id))` |
| `.insert({ ... })` | `db.insert(posts).values({ ... })` |
| `.update({ ... }).eq('id', id)` | `db.update(posts).set({ ... }).where(eq(posts.id, id))` |
| `.delete().eq('id', id)` | `db.delete(posts).where(eq(posts.id, id))` |
| `.order('created_at', { ascending: false })` | `.orderBy(desc(posts.createdAt))` |
| `.maybeSingle()` | `.limit(1)` + `[0] \|\| null` |

---

## 4. RLS (Row-Level Security) — and the `@polymech/acl` Angle

### 4.1 Situation: What is currently doing authorization?

**Two separate systems run in parallel today:**

**System A — Supabase RLS (database-layer)**
- Enabled on Postgres tables via migration SQL
- Policies reference `auth.uid()` — a Supabase/PostgREST JWT function
- Currently **not the enforcing layer** because the client never hits PostgREST directly
- Will break the moment you swap the auth provider (no `auth.uid()` without GoTrue)

**System B — `@polymech/acl` (application-layer)**
- The `Acl` engine from `@polymech/acl` (MemoryBackend) already runs inside `db-acl.ts`
- Drives `productAclMiddleware`, the `/api/acl/*` route suite, and VFS permissions
- Backed by `db-acl-db.ts` → `resource_acl` + `acl_groups` + `acl_group_members` tables
- Supports: users, groups with inheritance, path-scoped grants, wildcard `*`
- Already has **175 passing tests** and a published Postgres RLS integration guide

**Conclusion: System B is already your real authorization layer. System A (Supabase RLS) is dead weight post-migration.**

---

### 4.2 What `@polymech/acl` covers today

```
server/src/acl/
├── db-acl.ts        ← orchestrator: evaluateAcl(), fetchAclSettings(),
│                      grantAcl(), revokeAcl(), fetchUserEffectiveGroups()
└── db-acl-db.ts     ← IAclBackend: reads/writes resource_acl table via supabase.from()
```

The `evaluateAcl()` function in `db-acl.ts` already:
1. Resolves virtual roles (`anonymous`, `authenticated`, `admin`)
2. Loads DB group memberships from `acl_group_members` (with parent inheritance)
3. Loads path-scoped grants from `AclSettings`
4. Runs `@polymech/acl` in-memory to check permissions with path-upward walk

The `IAclBackend` interface (`db-acl.ts`) makes the storage pluggable — currently two backends:
- `DbAclBackend` (default) → `resource_acl` table via `supabase.from()`
- VFS file backend → `vfs-settings.json` on disk

---

### 4.3 The only Supabase coupling in the ACL layer

The ACL system uses `supabase.from()` in exactly **4 places** inside `db-acl.ts` and `db-acl-db.ts`:

| Location | Query |
|:---|:---|
| `db-acl-db.ts` `read()` | `supabase.from('resource_acl').select('*').eq(...)` |
| `db-acl-db.ts` `write()` | `supabase.from('resource_acl').delete()` + `.insert()` |
| `db-acl.ts` `fetchGlobalGroups()` | `supabase.from('acl_groups').select('*')` |
| `db-acl.ts` `putGlobalGroup()` | `supabase.from('acl_groups').upsert/insert` |
| `db-acl.ts` `deleteGlobalGroup()` | `supabase.from('acl_groups').delete()` |
| `db-acl.ts` `fetchGroupMembers()` | `supabase.from('acl_group_members').select(...)` |
| `db-acl.ts` `addUserToGroup()` | `supabase.from('acl_group_members').upsert()` |
| `db-acl.ts` `removeUserFromGroup()` | `supabase.from('acl_group_members').delete()` |
| `db-acl.ts` `fetchUserEffectiveGroups()` | `supabase.from('acl_group_members').select(...)` + parent traverse |
| `db-acl.ts` `isUserAdmin()` | `supabase.from('user_roles').select('role').eq(...)` |
| `endpoints/acl.ts` `handleListUserGroups()` | `supabase.from('acl_group_members').select(...)` |
| `endpoints/acl.ts` `handleListUserEffectiveGroups()` | `supabase.from('acl_groups').select(...)` parent traverse |
| `endpoints/acl.ts` `handleListAclResources()` | `supabase.from('resource_acl').select(...)` |

**All of these are mechanical Drizzle replacements** — no logic changes at all.

Also: `requireAuthUser()` in `db-acl.ts` calls `getUserCached(token)` from `supabase.ts`. After the auth migration, this becomes a Better Auth session lookup.

---

### 4.4 `@polymech/acl` as the RLS replacement for Postgres tables

The ACL package already ships a documented, tested pattern for this in:
> `packages/acl/docs/postgres-rls-vfs.md`

The approach: instead of Supabase's `auth.uid()` RLS at the DB level, use `@polymech/acl` at the **application layer** with Postgres `LISTEN/NOTIFY` for cache invalidation.

**Architecture after migration:**

```
Request → Hono auth middleware (Better Auth JWT)
        → productAclMiddleware → evaluateAcl() → @polymech/acl MemoryBackend
                                                    ↑ loaded from Postgres tables
                                                    ↑ invalidated via LISTEN/NOTIFY
        → Route handler (Drizzle queries, no RLS)
```

**What to do with Supabase RLS policies:**

| Table | Decision | Reason |
|:---|:---|:---|
| `resource_acl` | Drop RLS | ACL engine itself manages access; server is the only writer |
| `acl_groups` | Drop RLS | Admin-only via middleware |
| `acl_group_members` | Drop RLS | Admin-only via middleware |
| `user_roles` | Drop RLS | `isUserAdmin()` runs server-side with cached result |
| `user_secrets` | Keep RLS or move to app-layer | Sensitive — consider Option B below |
| `profiles` | Drop RLS | Filtered by userId in route handlers |
| `posts`, `pictures`, `pages` | Drop RLS | Filtered by userId in route handlers |
| `vfs_index`, `vfs_mounts` | Drop RLS | VFS uses `@polymech/acl` AclVfsClient already |

**Option B for sensitive tables** — if you want defense-in-depth on `user_secrets`:
```sql
-- Replace auth.uid() with custom session variable
CREATE POLICY "user_secrets_isolation" ON user_secrets
  USING (user_id = current_setting('app.current_user_id', true)::uuid);
```
Server sets via Drizzle at start of request:
```typescript
await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
```
Per `packages/acl/docs/postgres-rls-vfs.md` — this is the documented Supabase-free RLS pattern.

---

### 4.5 Adding Postgres LISTEN/NOTIFY to the ACL cache

The `db-acl.ts` currently uses `appCache` with a 5-minute TTL. The ACL package's Postgres guide shows how to replace polling with push invalidation — add a trigger + LISTEN in the existing pg-boss connection:

```sql
-- migration: add NOTIFY trigger to acl tables
CREATE OR REPLACE FUNCTION notify_acl_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('acl_changed', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER acl_groups_notify
  AFTER INSERT OR UPDATE OR DELETE ON acl_groups
  FOR EACH ROW EXECUTE FUNCTION notify_acl_change();

CREATE TRIGGER acl_group_members_notify
  AFTER INSERT OR UPDATE OR DELETE ON acl_group_members
  FOR EACH ROW EXECUTE FUNCTION notify_acl_change();

CREATE TRIGGER resource_acl_notify
  AFTER INSERT OR UPDATE OR DELETE ON resource_acl
  FOR EACH ROW EXECUTE FUNCTION notify_acl_change();
```

```typescript
// server/src/acl/acl-listener.ts (new file)
import { Client } from 'pg';
import { appCache } from '@/cache.js';

export async function startAclListener() {
    const listener = new Client({ connectionString: process.env.DATABASE_URL });
    await listener.connect();
    await listener.query('LISTEN acl_changed');
    listener.on('notification', async () => {
        await appCache.flush('acl-*');
        await appCache.flush('user-groups-*');
        await appCache.flush('user-admin-*');
    });
}
```

This replaces the 5-minute TTL with instant invalidation — same pattern used by the VFS layer.

---

### 4.6 Summary: RLS options ranked

| Option | Effort | Safety | Rust-portable |
|:---|:---:|:---:|:---:|
| **A. Drop RLS, rely on `@polymech/acl` + middleware** | 🟢 Low | ✅ Strong (175-test engine) | ✅ |
| **B. Hybrid — `@polymech/acl` + `SET LOCAL` RLS on secrets only** | 🟡 Medium | ✅✅ Defense in depth | ✅ |
| **C. Keep full Supabase RLS, port to `app.current_user_id`** | 🔴 High | ✅✅ Defense in depth | ⚠️ |

**Recommendation: Option A with LISTEN/NOTIFY invalidation.**

`@polymech/acl` already implements the access control model at the right layer with proper test coverage. Dropping Supabase RLS removes ~50 lines of SQL policy maintenance while the actual enforcement is already handled by the engine you own.

---

## 5. Can We Keep Using `@supabase/supabase-js`?

**Short answer:** Partially, but it's not worth it.

### What the client currently does with it:
1. **Auth** → Being replaced entirely (by Better Auth)
2. **Token extraction for API calls** → Replaced by Better Auth's session
3. **Type imports** (`User`, `Session`) → Replace with Better Auth's types
4. **One data query** (`checkLikeStatus` in `db.ts`) → Move to server API

### What the server currently does with it:
1. **Auth validation** (`getUser(token)`) → Replaced by Better Auth
2. **PostgREST queries** (`.from().select()`) → Replaced by Drizzle

**Verdict:** After migration, there's nothing left to justify the `@supabase/supabase-js` dependency. Remove it.

---

## 6. Migration to Self-Hosted Postgres

### 6.1 Database Hosting Options (No Docker)

| Option | Cost | Effort | Notes |
|:---|:---|:---|:---|
| **Keep Supabase-hosted Postgres** | Free tier / $25/mo | None | Just stop using their JS client. Connect via `DATABASE_URL` directly. |
| **Neon** (serverless Postgres) | Free tier | Low | Great DX, branching, no Docker |
| **Railway** | $5/mo | Low | Managed Postgres, simple |
| **Render** | Free tier | Low | Managed Postgres |
| **Raw VPS (Hetzner/OVH)** | ~$5/mo | Medium | Install Postgres on your server via apt |
| **Any managed Postgres** | Varies | Low | AWS RDS, DigitalOcean, etc. |

**Recommendation:** Phase 1 — keep Supabase-hosted Postgres (free tier), just connect via `DATABASE_URL`. Your data stays where it is. Phase 2 — migrate DB to your VPS or Neon when ready.

### 6.2 Migrations Tooling Replacement

| Current (Supabase CLI) | Replacement |
|:---|:---|
| `npx supabase migration new` | `npx drizzle-kit generate` |
| `npx supabase db push` | `npx drizzle-kit migrate` |
| `npx supabase gen types` | Built-in with Drizzle (schema IS the types) |
| `supabase/migrations/*.sql` | `drizzle/*.sql` (or keep both during transition) |

---

## 7. Rust/C++ Server Portability

### Auth data portability
Better Auth stores users in standard Postgres tables (`user`, `session`, `account`). A Rust server (e.g., Axum) can:
- Read sessions from the same `session` table
- Validate JWTs using the same `BETTER_AUTH_SECRET`
- Use `jsonwebtoken` crate for JWT validation

### Query layer portability
Drizzle schemas are TypeScript — but the underlying Postgres schema is the same. Rust alternatives:
- **SQLx** (compile-time checked SQL)
- **Diesel** (Rust ORM)
- **SeaORM** (async Rust ORM)

The Postgres schema + migrations carry over regardless of ORM.

---

## 8. Migration Plan (Phases)

### Phase 0: Preparation
- [ ] Add `DATABASE_URL` to env (Supabase's direct connection string)
- [ ] Install Drizzle: `npm install drizzle-orm postgres` + `npm install -D drizzle-kit`
- [ ] Install Better Auth: `npm install better-auth`
- [ ] Run `npx drizzle-kit pull` to generate schema from existing DB
- [ ] Run `npx @better-auth/cli generate` to create auth tables

### Phase 1: Auth Migration (Server)
- [ ] Set up Better Auth with Hono (`/api/auth/*` routes)
- [ ] Create auth middleware that validates Better Auth sessions instead of `supabase.auth.getUser()`
- [ ] Migrate `getUserCached()` to use Better Auth's `auth.api.getSession()`
- [ ] Migrate `isAdmin()` to query `user_roles` via Drizzle instead of PostgREST
- [ ] Update `loginAdminUser()` test helper
- [ ] Keep both auth systems running in parallel during transition

### Phase 2: Auth Migration (Client)
- [ ] Replace `src/integrations/supabase/client.ts` with Better Auth client
- [ ] Rewrite `useAuth.tsx` using Better Auth React hooks
- [ ] Update `getAuthToken()` in `db.ts` to use Better Auth session
- [ ] Update all ~46 files that call `supabase.auth.getSession()` for token extraction
  - Most of these should already use `getAuthToken()` from `db.ts` — centralize the rest
- [ ] Update `UpdatePassword.tsx` to use Better Auth's password update
- [ ] Test OAuth flows (GitHub, Google) end-to-end

### Phase 3: Query Layer Migration (Server)
- [ ] Create `server/src/db/index.ts` with Drizzle client
- [ ] Create `server/src/db/schema.ts` from `drizzle-kit pull` output
- [ ] Migrate server files **one module at a time**:
  - `db-posts.ts` → Drizzle
  - `db-pictures.ts` → Drizzle
  - `db-types.ts` → Drizzle
  - `db-categories.ts` → Drizzle
  - `db-i18n.ts` → Drizzle
  - `db-user.ts` → Drizzle
  - `db-layouts.ts` → Drizzle
  - `db-search.ts` → Drizzle
  - `vfs.ts` → Drizzle
  - `places/db.ts` → Drizzle
  - `contacts/index.ts` → Drizzle
  - `campaigns/index.ts` → Drizzle
  - ... (remaining files)
- [ ] Each file: replace `supabase.from()` calls with Drizzle equivalents
- [ ] Run E2E tests after each module migration

### Phase 4: Cleanup
- [ ] Remove `@supabase/supabase-js` from both `package.json` files
- [ ] Remove `src/integrations/supabase/` directory
- [ ] Remove `server/src/commons/supabase.ts`
- [ ] Drop RLS policies (or rewrite without `auth.uid()`)
- [ ] Remove `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_PUBLISHABLE_KEY` from env
- [ ] Update migration tooling to use Drizzle Kit
- [ ] Move `checkLikeStatus` from client-side Supabase query to server API

### Phase 5: Database Migration (Optional, Later)
- [ ] Export data from Supabase Postgres (`pg_dump`)
- [ ] Import into self-hosted Postgres or Neon
- [ ] Update `DATABASE_URL`
- [ ] Verify all connections work

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|:---|:---|:---|
| Auth migration breaks login | 🔴 High | Run both auth systems in parallel. Feature flag. |
| OAuth redirect URIs change | 🟡 Medium | Update GitHub/Google OAuth app settings |
| Existing user sessions invalidated | 🟡 Medium | Plan a "re-login required" release |
| Drizzle query bugs | 🟡 Medium | Migrate one module at a time, run E2E tests |
| RLS removal exposes data | 🟢 Low | Your middleware already handles authz |
| `supabase gen types` gone | 🟢 Low | Drizzle schema IS the types |

---

## 10. Summary

| Layer | Current | Target | Effort |
|:---|:---|:---|:---|
| **Auth** | Supabase GoTrue + JS client | **Better Auth** (Hono + React) | 🔴 High |
| **Query Builder** | `@supabase/supabase-js` PostgREST | **Drizzle ORM** (direct pg) | 🟡 Medium |
| **Migrations** | `supabase db push` | **Drizzle Kit** | 🟢 Low |
| **Type Gen** | `supabase gen types` | **Drizzle schema** (TS-native) | 🟢 Low |
| **RLS** | Supabase `auth.uid()` policies | **Drop** (middleware handles authz) | 🟢 Low |
| **Database** | Supabase-hosted Postgres | Keep same, migrate later | — |
| **Realtime** | Not used | N/A | — |
| **Storage** | Not used (own VFS) | N/A | — |

**Total estimated effort:** 2–3 weeks for a full migration, done incrementally.  
**Biggest single task:** Rewriting ~27 server files from PostgREST to Drizzle.  
**Highest risk:** Auth migration — must run both systems in parallel during transition.
