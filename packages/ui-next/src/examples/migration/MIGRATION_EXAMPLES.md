# React Router v6 → TanStack Router: mapping for Polymech

This folder is a **runnable** slice of the migration plan. It shows *why* TanStack Router helps Polymech: **typed routes**, **loaders instead of effect waterfalls**, **first-class search validation**, **scroll restoration**, and **router-level subscriptions** for analytics.

## Why switch (tied to product goals)

| Goal | TanStack Router lever | Where it lives here |
|------|------------------------|---------------------|
| Fewer broken links at compile time | Route tree + typed `Link`/`navigate` | `src/router.tsx`, `routeTree.tsx` |
| Replace ad-hoc URL parsing | `validateSearch` + Zod | `searchSchema.ts`, `/examples/search` |
| Fewer data waterfalls | `loader` + `useLoaderData` | `/examples/loader-demo` |
| Replace custom scroll restoration | `createRouter({ scrollRestoration: true })` | `src/router.tsx` + proof: `/examples/scroll-restoration` and lazy + scroll: `/examples/lazy-scroll-restoration` |
| Centralize analytics on navigation | `router.subscribe('onResolved', …)` | `src/main.tsx` |
| Global 404 | `defaultNotFoundComponent` | `src/router.tsx` |
| Deep links / nested apps | Nested layout + splat `_splat` | `/examples/categories/...` |

## Phase checklist → code

### Phase 1: Setup and basic configuration

- **Dependencies**: `package.json` lists `@tanstack/react-router` and `zod`. In the host app, also add `@tanstack/router-vite-plugin` when you move to file-based routes under `src/routes/`.
- **Vite**: see the comment in `vite.config.ts` for `TanStackRouterVite` (plugin is optional while this POC uses a **static** route tree).
- **Root layout**: global shell is the root route component in `src/router.tsx` (analogous to moving `AppWrapper` into `__root.tsx`).
- **Router init**: `createRouter` + `RouterProvider` — `src/router.tsx` + `src/main.tsx`.

### Phase 2: Route declaration and mapping

| React Router v6 idea | TanStack pattern in this POC |
|----------------------|------------------------------|
| `/post/:id` | `/examples/post/$postId` |
| `/user/:userId` | `/examples/user/$userId` |
| `/tags/:tag` | `/examples/tags/$tag` |
| `/collections/:userId/:slug` | `/examples/collections/$userId/$slug` |
| Wildcard / nested app | `/examples/categories/$` → `_splat` in `Route.useParams()` |
| Not found (global) | `defaultNotFoundComponent` in `createRouter` — try link “trigger 404” |

### Phase 3: Component refactoring (hooks)

| React Router | TanStack (this POC) |
|--------------|---------------------|
| `useParams()` | `myRoute.useParams()` on the route object |
| `useNavigate()` | `useNavigate()` from `@tanstack/react-router` |
| `useLocation()` | `useLocation()` + `useRouterState` |
| `useSearchParams` | `validateSearch` + `Route.useSearch()` |
| `<Navigate />` | `<Navigate />` from `@tanstack/react-router` or `redirect()` in `beforeLoad` |

### Phase 4: Enhancements

- **Loaders**: `/examples/loader-demo`.
- **Scroll restoration** (prove it yourself):
  1. Open **`/examples/scroll-restoration`**. A fixed HUD shows live **`window.scrollY`**.
  2. Scroll well past the first panel (e.g. until **Section 25** is on screen) and note the pixel value.
  3. Navigate away with an in-app link (e.g. **loader demo** or **Home** in the header).
  4. Use the browser **Back** button (not a fresh reload). The HUD should return to about the **same `scrollY`**, not `0` — that is TanStack’s scroll cache with `scrollRestoration: true` (the browser’s native position is overridden via `history.scrollRestoration = 'manual'` inside the router).
  5. **Contrast**: a full page reload on this URL always starts at the top; restoration is tied to **history navigation** for the same entries, which is what you want when replacing a custom `ScrollRestoration` tied to route changes.
- **Lazy route + same scroll behavior**: **`/examples/lazy-scroll-restoration`** uses `lazyRouteComponent(() => import('…/LazyScrollRestorationChunk'))` with `pendingComponent` while the chunk loads. The page content is a **separate Vite chunk** (verify in Network). Repeat the scroll → navigate away → **Back** test: restoration still applies; splitting the route module does not turn off scroll caching.
- **Analytics**: `router.subscribe('onResolved', …)` in `src/main.tsx` (dev-only `console.debug` — swap for your analytics client).

## `@polymech/ecommerce` / standalone bundles

Host apps should inject navigation via props or context, or migrate the bundle to TanStack Router APIs so `useLocation` / `matchPath` / `Navigate` are not hard-coded to `react-router-dom`. This POC does not include that package; use the hook table above when refactoring `EcommerceBundle.tsx`.

## File map

| File | Role |
|------|------|
| `src/router.tsx` | Root route, app shell, `createRouter`, `scrollRestoration`, `defaultNotFoundComponent` |
| `src/main.tsx` | `RouterProvider`, `router.subscribe` analytics stub |
| `src/examples/migration/routeTree.tsx` | All migration demos under `/examples/*` |
| `src/examples/migration/ScrollRestorationDemo.tsx` | Long page + HUD for scroll restoration verification |
| `src/examples/migration/lazy/LazyScrollRestorationChunk.tsx` | Default export loaded via `lazyRouteComponent` + dynamic `import()` (code-split) |
| `src/examples/migration/searchSchema.ts` | Zod search schema shared with `/examples/search` |
