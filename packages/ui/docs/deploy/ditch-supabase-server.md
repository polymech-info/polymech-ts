# Server Infrastructure Migration: Ditching Supabase (Execution Status)

> **Status**: Active Migration / Implementation
> **Target Architecture**: Self-hosted Postgres, Prisma ORM, Zitadel (Auth/Tenancy), S3-compatible Storage (MinIO or VFS)
> **Prior Reference**: `ditch-supabase.md` (initial research)

This document tracks concrete migration status and remaining work to remove Supabase dependencies from server infrastructure.

---

## 1) Database & ORM: Prisma

While Drizzle was initially highly considered, the current CLI implementation (`pm-cli-cms`) successfully validated **Prisma** (with `@prisma/adapter-pg` and `pg.Pool`) as our query layer of choice.

**Why Prisma?**
- Type safety and schema synchronization is best-in-class.
- The `schema.prisma` file serves as the definitive source of truth for the database layout.
- The CLI testbed proved we can dynamically spin up connections to different tenant databases.

### Status / Next steps:
1. **Schema Centralization**: Establish a core `schema.prisma` representing the standard tenant database.
2. **Server-Side Integration**: Replace the ~27 server files currently making PostgREST `supabase.from()` calls with Prisma queries (`prisma.posts.findMany()`, etc.).
3. **Connection Pooling**: Implement a caching/pooling mechanism in the server backend to hold active Prisma clients for each tenant (since Zitadel manages tenancy per-database).

---

## 2) Authentication & Tenancy: Zitadel

The architecture has evolved beyond simple email/password auth. We are utilizing **Zitadel** as our central Identity Provider (IdP). Zitadel is explicitly designed to handle B2B tenancy.

**Auth chapter (flows, payloads, host setup, references):** `docs/supabase/auth-zitadel.md`

**The Multi-Tenant Database Model**:
Instead of relying on Supabase Row-Level Security (RLS) to isolate tenant data inside a massive single database, we are opting for **database-per-tenant** (or schema-per-tenant) isolation mapped by Zitadel.

### Status / Next steps:
1. **API Middleware**: Replace the Supabase JWT verifiers in Hono with Zitadel token verification.
2. **Instance Provisioning**: When Zitadel registers a new application/tenant, our backend needs a Webhook/Event trigger to dynamically fire the `pm-cli-cms site-init` or equivalent workflow to provision an isolated Postgres database.
3. **Database Routing**: The server backend must extract the Tenant ID from the Zitadel JWT on incoming requests and fetch/instantiate the Prisma client bound to that specific tenant's `DATABASE_URL`.

---

## 3) Storage Migration Strategy (VFS & Mounts)

We are fully moving away from Supabase Storage (Buckets). The replacement strategy relies heavily on our mature, battle-tested **Virtual File System (VFS)** located at `server/src/products/storage/api/vfs.ts`.

**Why the VFS replaces Supabase Buckets:**
- **Native File Abstraction**: The VFS supports flexible storage mounts. We can seamlessly swap out the underlying physical backend to an S3-compatible generic provider (like MinIO) or local disk without rewriting any of our API handlers. 
- **Built-in ACL Integration**: The VFS natively integrates with `@polymech/acl` for granular permission checks (Read/Write/Delete) against file paths, meaning we no longer need Supabase bucket policies.

### Current implemented tooling:
1. **`pm-cli-cms backup-store`**
   - can export Supabase bucket files directly into local VFS images root:
   - `pm-cli-cms backup-store --source ./server --target ./server/storage/images`
   - preserves `cache/...` paths and emits picture UUID aliases under `storage/<user_id>/<picture_id>.<ext>`.
2. **`pm-cli-cms migrate-images-vfs`**
   - rewrites `pictures.image_url` to VFS URLs:
   - `<IMAGE_VFS_URL>/api/vfs/get/<IMAGE_VFS_STORE>/<user_id>/<picture_id>[.<ext>]`
   - supports direct Supabase URLs and nested `/api/images/render?url=...` wrappers.
   - resolves missing local files via hash matching and optional hydration from old URL content.
3. **Server-side image compatibility**
   - `server/src/products/images/index.ts` contains compatibility handlers for legacy thumbnail/render URL patterns during migration.

---

## 4) Authorization & Security (ACL Strategy)

**The major milestone: RLS is deprecated.**
We no longer rely on Supabase Row-Level Security (`auth.uid()`) at the database level. 

**Application-Layer Enforcement via `@polymech/acl`:**
- Our own ACL engine correctly evaluates paths, nested inheritance, and group-based hierarchies via `acl_groups` and `resource_acl`.
- Because Zitadel gives us Tenant IDs and specific roles up-front in the JWT middleware, the application layer resolves exactly what the connection session is permitted to access.
- **Done**: The core logic required to isolate access is fully complete inside the ACL module. It's strictly a matter of stripping the old RLS policies from the Postgres schemas entirely (treating the database as fully trusted by the API backend). 

---

## 5) Execution Pipeline

### Milestone 1: Data Migration Engine (Completed)
- ✅ Validated raw self-hosted Postgres (`polymech.info:5432`)
- ✅ `pg_dump` and `psql` wrapping via our CLI (`pm-cli-cms backup-site` / `db-import`).
- ✅ Stripping out Supabase-specific system schemas (`auth`, `realtime`, `storage`) from exported backups to ensure hygienic vanilla Postgres DBs.

### Milestone 2: Server ORM Cut-Over (In Progress)
- 🚧 Bootstrap `prisma/schema.prisma` matching the clean vanilla Postgres schema.
- 🚧 Systematically replace `supabase.from()` with ORM query paths in server modules.
- ✅ Added Drizzle query CLI baseline: `pm-cli-cms db-query-drizzle` with query/transaction timing metrics and report output.

### Milestone 3: Zitadel & Routing
- 🚧 Replace `@polymech/acl`'s dependency on `auth.uid()` or Supabase cookies with Zitadel JWT payload assertions.
- 🚧 Implement the dynamic database connection router to select the right Prisma instance based on the Zitadel Tenant ID.

### Milestone 4: Storage Migration Cut-Over (In Progress)
- ✅ VFS-backed image upload path implemented (`/api/images?forward=vfs`).
- ✅ CLI workflows added for file backup + URL rewrite (`backup-store`, `migrate-images-vfs`).
- 🚧 Complete migration runbooks + verification reports in production.
- 🚧 Remove temporary legacy URL compatibility code after migration is complete.
