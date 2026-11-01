# Leaving Supabase

## Why We're Moving On

Supabase is a compelling starting point — a managed Postgres layer with built-in auth, auto-generated REST APIs, and a slick dashboard. For prototyping, that's excellent. At scale, the cracks show.

---

## The Problems

### 1. Pricing Doesn't Scale

At **$25–$30 per project instance**, Supabase is affordable for a single project but becomes a liability in any multi-tenant or multi-environment setup. Staging, production, and regional deployments each need their own instance. There is no meaningful tier between the free plan and a per-project paid plan — you either share one instance across everything (bad isolation) or pay per environment.

By contrast, a self-hosted Postgres server on a VPS can serve many projects and environments for a flat monthly cost, with better hardware control and no artificial limits on database size, connections, or edge function invocations.

### 2. Performance Is a Layer Problem

Supabase does not give you raw Postgres access from the browser — it routes all queries through **PostgREST**, a REST-to-SQL translation layer. That layer adds latency and prevents certain query patterns entirely. Complex joins, custom functions, and anything that doesn't fit PostgREST's REST model requires workarounds (RPC calls, edge functions) that layer even more overhead on top.

Direct `pg` access from the application server — which is the standard pattern in every non-Supabase stack — is simply faster and more flexible.

### 3. "Open Source"

Supabase markets itself as open source, and the core Postgres engine is. But the features that make Supabase useful in production — **branching**, **read replicas**, **PITR (point-in-time recovery)**, **connection pooling at scale via Supavisor** — are cloud-only or require the managed platform. The self-hosted version is a constellation of services (PostgREST, GoTrue, Realtime, Storage, Kong, Studio) that you are responsible for orchestrating, upgrading, and securing. It is not a simple binary. Running it locally for development is workable; running it reliably in production is a different project entirely.

### 4. Storage and Image Processing Are a Paywall

Supabase Storage is usable at the free tier for basic uploads, but anything beyond basic file hosting typically requires **Edge Functions** — and that is where the trade-offs become much more apparent.

Image resizing (transforms) is **gated behind the Pro subscription**. There is no free or self-hosted path to on-the-fly image processing through the Supabase Storage API. For a product where image quality and delivery speed are core features, this is a non-starter.

Even with Pro access, Edge Functions run in a **constrained Deno runtime** — not standard Node.js. Any library that doesn't work in Deno, or that assumes a standard filesystem or native bindings (most image processing libraries), requires a full workaround. The execution environment is also cold-started and **noticeably slow** for the first invocation, which is exactly when a user is waiting on a thumbnail.

The practical outcome: image resizing that should be a single `sharp` call in a Node.js service becomes a Supabase Pro subscription, a Deno-compatible rewrite, and cold-start latency baked into every new session.

### 5. Switching Is Deliberately Hard

The most operationally costly aspect of Supabase is how tightly its abstractions couple your codebase to the platform:

- **`auth.uid()`** is a GoTrue-backed function that doesn't exist outside Supabase. Every RLS policy that calls it breaks the moment you connect to a plain Postgres instance.
- **`auth.users`** is a Supabase-managed table. Foreign key constraints across your entire schema point at it.
- **`TO authenticated` / `TO anon`** roles in RLS policies don't exist on vanilla Postgres — PostgREST creates them at startup.
- **JWT signing** is done by Supabase's own GoTrue service. Your application is hard-coded to trust those tokens specifically.
- **Dump files** contain Supabase-custom `psql` meta-commands (`\restrict`, `\unrestrict`) that fail on standard `psql`.

These constraints are easy to underestimate during onboarding, and they tend to become obvious only during migration work.

---

## What We're Replacing It With

The migration is covered in detail in the sibling chapters of this series. At a high level:

| Supabase Component | Replacement |
|:---|:---|
| **Auth (GoTrue)** | [Zitadel](./auth-zitadel.md) — standalone OIDC IdP, Go binary, systemd |
| **PostgREST / RLS coupling** | [Application-level auth + session-variable RLS](./rls-leaving-supabase.md) |
| **Managed Postgres** | Self-hosted Postgres, direct `pg` pool from Node.js / Rust |
| **Dashboard** | Direct psql, self-hosted tools as needed |

The migration is **non-destructive** — existing RLS policies are preserved by re-implementing the `auth.uid()` contract via a session variable, so no policies need to be rewritten or dropped. The auth schema is reduced to a minimal `auth.users` stub that satisfies foreign key constraints while GoTrue is removed entirely.

---

## For "Vibe Coders"

Supabase is attractive because it dramatically lowers the entry barrier. You can get authentication, storage, database access, and a dashboard with very little setup, which makes it especially appealing for fast prototypes and AI-assisted development.

The problem is that the easy entry hides the expensive exit. Once the product grows, you eventually hit the edges: pricing per project, performance overhead from platform layers, storage/image-processing limits, and deep coupling to Supabase-specific auth and RLS conventions. At that point, leaving or scaling no longer feels beginner-friendly; it requires fairly specialized knowledge in Postgres, authentication, RLS, infrastructure, and migration planning.

The practical conclusion is simple: if you already expect to build a serious product, **build on Postgres directly from day one**. Use standard tooling, own your database contract, and keep authentication and authorization portable. The initial setup is a bit more work, but the long-term architecture is cheaper, faster, and easier to control.

---

## Articles in This Series

- **[Auth with Zitadel](./auth-zitadel.md)** — OIDC flows, JWKS verification, Zitadel vs Keycloak vs Better Auth, configuration.
- **[RLS without Supabase](./rls-leaving-supabase.md)** — The five portability problems, workarounds, pool separation, minimal `auth` schema on plain Postgres.
- **[Migration Tooling](./migration-tooling.md)** — Reusable CLI patterns for DB backup/restore, storage export, and URL migration away from Supabase.
- **[ACL NodeJS Implementation](https://git.polymech.info/polymech/mono/src/branch/master/packages/acl)** — The application-side authorization layer that replaces dependence on platform-coupled policy helpers.
- **[In the making: home baked VFS](https://git.polymech.info/polymech/mono/src/branch/master/packages/vfs)** — The storage layer that replaces Supabase Storage object URLs with application-owned file serving.

