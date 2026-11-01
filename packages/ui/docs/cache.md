# Polymech Cache Invalidation & Mirroring

This document outlines the architecture for caching data on the Polymech platform, specifically how mutations invalidate Server/Client state and mirror those invalidations to secondary servers (e.g. from local to production instances).

## Core Mechanisms

Cache logic splits into:
1. **Server-Side Cache** (`redis` or `memory` via `getCache()`): Used in API routes to hold heavy queries and `pages`.
2. **Client-Side Cache** (`@tanstack/react-query`): The frontend data store holding currently loaded application state.
3. **Server-Sent Events (SSE)**: Event streams connecting the frontend clients to the backend to get real-time cache mutations.
4. **Cache Mirroring**: HTTP Broadcasts mapping local actions outwards to production domains using Service Accounts.

## Flow of a Cache Invalidation

When a user modifies data (e.g. Updating a Post) locally:

1. **Mutation**: A request is sent to an API endpoint (e.g. `PATCH /api/posts/:id`).
2. **Local Invalidation**: 
   - The handler calls `appCache.invalidate('post')` inside `[server/src/cache.ts](../server/src/cache.ts)`.
   - The Cache clears the specific entities and walks the dependency tree (e.g., `post` depends on `pictures` and `categories`).
3. **SSE Broadcast**:
   - The handler issues `appCache.notify('post', id, 'update')`.
   - The backend pushes an SSE `app-update` down the wire.
4. **Client-Side Reset**:
   - The React frontend listens to the stream in `[src/components/StreamInvalidator.tsx](../src/components/StreamInvalidator.tsx)` via `[src/contexts/StreamContext.tsx](../src/contexts/StreamContext.tsx)`.
   - Depending on the entity, `StreamInvalidator` resets the specific `post` ID in React Query, and forcefully refetches the overarching `posts`, `pages`, and `feed` caches.
5. **Mirror Broadcast**:
   - During `appCache.invalidate()`, if mirroring isn't explicitly disabled, `[server/src/mirror.ts](../server/src/mirror.ts)` takes the `type` and broadcasts it to the domains listed in `.env` under `CACHE_MIRRORS`.
   - It acquires a JWT token utilizing `SERVICE_EMAIL` and `SERVICE_PASSWORD` (or `TEST_EMAIL`).
   - A `POST` goes out to `https://service.polymech.info/api/cache/invalidate` including `mirror: false` in the payload (to prevent an infinite broadcast loop).
6. **Remote Revalidation**:
   - The remote (e.g., Production) instance receives the `invalidate` request at `[server/src/products/serving/index.ts](../server/src/products/serving/index.ts)`.
   - It internally invalidates its own Redis/Memory cache utilizing `appCache.invalidate(type, true /* preventMirror */)`.
   - It issues an SSE to all *its* connected clients `appCache.notify(type, null, 'update')`, which triggers Step 4 for public visitors!

## Dependency Graph Configuration

In `[server/src/cache.ts](../server/src/cache.ts)`, dependencies orchestrate cascade invalidation:

```typescript
private static DEPENDENCIES: Record<string, string[]> = {
    'posts': ['categories', 'pictures'], // Changing a picture/category invalidates posts
    'pages': ['categories', 'pictures', 'translations'],
    'categories': ['types'],
    'translations': [], 
    'feed': ['posts', 'pages', 'categories'],
    'auth': []
};
```

## Adding a New Mirrored Cache Endpoint

1. If it represents a new domain model, add it to `DEPENDENCIES` in `AppCache`.
2. Add its alias/hook inside `[src/components/StreamInvalidator.tsx](../src/components/StreamInvalidator.tsx)`.
   Note: The mirror sends pluralized definitions (`pages`, `types`, `posts`) whereas standard CRUD routes may notify singularly (`page`, `type`, `post`). Map both aliases to the same React Query keys.
3. Utilize `appCache.invalidate('entityName')` inside your API logic. Mirroring happens automatically!

## Debugging

Mirroring successes and errors are not logged to `stdout`. All `mirror.ts` and `cache.ts` activities are strictly written to:
`[server/logs/cache.json](../server/logs/cache.json)` using the internal pino `cacheLogger`.