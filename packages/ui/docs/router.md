# Migration Plan: React Router v6 to TanStack Router

Migrating a large, dynamic application like Polymech from React Router DOM to TanStack Router requires a phased approach. TanStack Router offers superior type safety, built-in scroll restoration, and powerful data loading capabilities, but fundamentally changes how routing is configured (moving away from JSX `<Route>` trees to a static route tree).

## Phase 1: Setup and Basic Configuration

- [ ] **Install Dependencies**
  - Run `npm install @tanstack/react-router @tanstack/router-vite-plugin` in `pm-pics`.
  - Also install in `@polymech/ecommerce` if needed, or handle it as a peer dependency.
- [ ] **Vite Configuration**
  - Add `TanStackRouterVite` to `vite.config.ts`. This enables file-based routing generation or static tree compilation.
- [ ] **Define the Root Route**
  - Create `src/routes/__root.tsx`.
  - Migrate the layout shell from `AppWrapper` into the Root Route, including:
    - `<GlobalDragDrop>`
    - `<TopNavigation>` and `<Footer>`
    - Context Providers (can stay in `App.tsx` surrounding the router provider, or move to the Root Route context).
- [ ] **Initialize the Router**
  - In `src/App.tsx`, remove `<BrowserRouter>` and initialize `const router = createRouter({ routeTree })`.
  - Render with `<RouterProvider router={router} />`.

## Phase 2: Route Declaration and Mapping

- [ ] **Convert Static Routes**
  - Convert basic pages like `/auth`, `/profile`, `/settings/providers`, `/playground/*`.
  - Create route files (e.g., `src/routes/auth.tsx`) or define them in a static route tree file.
- [ ] **Convert Dynamic Routes**
  - Map dynamic segments:
    - `/post/:id` -> `src/routes/post.$id.tsx`
    - `/user/:userId` -> `src/routes/user.$userId.tsx`
    - `/tags/:tag` -> `src/routes/tags.$tag.tsx`
    - `/collections/:userId/:slug` -> `src/routes/collections.$userId.$slug.tsx`
  - Re-wire path parameter extraction from `useParams()` to TanStack's `Route.useParams()`.
- [ ] **Convert Catch-All / Wildcard Routes (Deeply Nested Apps)**
  - Routes like `/categories/*` or `/app/filebrowser/*` will need to use TanStack's splat routing (e.g., creating a `$.tsx` file).
  - Inside the component, use `Route.useParams()` to grab the `_splat` variable which contains the remaining path string.
  - *Refactor Opportunity*: Consider converting deeply nested paths in nested apps (like mount/file/path) into strictly typed Search Parameters (e.g., `?mount=local&path=foo`) leveraging TanStack's built-in Zod validation.
- [ ] **Handle Global Not Found (404)**
  - `*` (Not Found) needs to be handled via TanStack Router's built-in `NotFoundRoute` or router configuration, not a standard route definition.
- [ ] **Migrate Standalone Packages**
  - `@polymech/ecommerce` (`EcommerceBundle.tsx`) relies on `react-router-dom` (`useLocation`, `matchPath`, `Navigate`).
  - It needs to be refactored either entirely to TanStack Router, or decoupled so the host app injects the routing logic.

## Phase 3: Component Refactoring (The Long Tail)

- [ ] **Replace `useNavigate`**
  - Find all instances of `useNavigate()` from `react-router-dom`.
  - Replace with `useNavigate()` from `@tanstack/react-router`.
  - **Crucial**: TanStack requires paths to match the route definitions strictly, which will catch broken links but requires updating all link definitions.
- [ ] **Replace `<Link>`**
  - Update all `react-router-dom` `<Link to="...">` with TanStack's `<Link to="...">`.
- [ ] **Replace `useLocation` and `useSearchParams`**
  - TanStack has robust typed search parameters. If `useSearchParams` is used for view modes, filtering, or tabs, define the search params schema on the Route level.
- [ ] **Replace `<Navigate>` components**
  - Change programmatic `<Navigate to="..."/>` to TanStack's equivalent or throw a redirect inside a route loader.

## Phase 4: Enhancements (Optional but Recommended)

- [ ] **Implement Pre-fetching**
  - Move API calls currently wrapped in `useQuery` inside `useEffect` (like home feed loading) into TanStack's `loader` functions. This eliminates waterfalls.
- [ ] **Configure Scroll Restoration**
  - Remove the custom `ScrollRestoration.tsx`.
  - Enable `<ScrollRestoration />` provided by TanStack in the Root Route.
- [ ] **Analytics Interception**
  - Hook analytics into the router context directly (e.g., `router.subscribe`), replacing the `onRouteChange` prop we added to the custom restorer.

## Risk Assessment
- **Huge API surface change**: Touches roughly 30-50 files.
- **Ecommerce Package**: The `@polymech/ecommerce` bundle must be updated carefully so it still functions if imported independently.
- **Type errors**: Prepare for hundreds of TypeScript errors regarding route typings immediately after enabling the Vite plugin.
