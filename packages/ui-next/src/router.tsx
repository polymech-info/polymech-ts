import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { buildMigrationExamplesBranch } from "@/examples/migration/routeTree";

const rootRoute = createRootRoute({
  component: () => (
    <div className="layout">
      <header className="header">
        <strong>ui-next POC</strong>
        <nav className="nav">
          <Link to="/" className="link">
            Home
          </Link>
          <Link to="/app" className="link">
            App
          </Link>
          <Link to="/app/settings" className="link">
            App → Settings
          </Link>
          <Link to="/examples" className="link">
            Examples
          </Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <section>
      <h1>Home</h1>
      <p>
        Nested routes live under <code>/app</code> (layout + child segments). See{" "}
        <Link to="/examples" className="link">
          /examples
        </Link>{" "}
        for React Router → TanStack migration patterns.
      </p>
    </section>
  ),
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "app",
  component: () => (
    <section className="nested">
      <h1>App shell</h1>
      <p>
        Shared layout for everything under <code>/app/*</code>.
      </p>
      <Outlet />
    </section>
  ),
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: () => (
    <article className="panel">
      <h2>App index</h2>
      <p>
        Route: <code>/app</code>
      </p>
    </article>
  ),
});

const appSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "settings",
  component: () => (
    <article className="panel">
      <h2>Settings</h2>
      <p>
        Nested route: <code>/app/settings</code>
      </p>
    </article>
  ),
});

const migrationExamplesRoute = buildMigrationExamplesBranch(rootRoute);

const routeTree = rootRoute.addChildren([
  indexRoute,
  appRoute.addChildren([appIndexRoute, appSettingsRoute]),
  migrationExamplesRoute,
]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultNotFoundComponent: () => (
    <article className="panel">
      <h1>404</h1>
      <p>Global not found — use TanStack’s not-found handling instead of a React Router catch-all route.</p>
      <p>
        <Link to="/" className="link">
          Home
        </Link>
      </p>
    </article>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
