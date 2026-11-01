/**
 * Runnable patterns for migrating from React Router v6 → TanStack Router.
 * See `MIGRATION_EXAMPLES.md` in this folder for the phase checklist mapping.
 */
import {
  Link,
  Navigate,
  Outlet,
  createRoute,
  lazyRouteComponent,
  redirect,
  useLocation,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";

import {
  migrationSearchSchema,
  type MigrationSearch,
} from "@/examples/migration/searchSchema";
import { ScrollRestorationDemo } from "@/examples/migration/ScrollRestorationDemo";
import { WidgetSystemDemoPage } from "@/examples/widgets/WidgetSystemDemoPage";
import { FlexNodeDemoPage } from "@/examples/widgets/FlexNodeDemoPage";

export function buildMigrationExamplesBranch(rootRoute: AnyRoute) {
  function ExamplesIndex() {
    return (
      <article className="panel">
        <h2>Index</h2>
        <p>
          Pick a link above. This section mirrors the Polymech migration phases (setup,
          route mapping, hooks, loaders, scroll restoration, analytics).
        </p>
      </article>
    );
  }

  function ExamplesLayout() {
    return (
      <section className="nested">
        <h1>Migration examples</h1>
        <p className="muted">
          Static route tree (same ideas as file-based <code>post.$postId.tsx</code> +
          Vite plugin).
        </p>
        <nav className="examples-nav">
          <Link to="/examples" className="link">
            Index
          </Link>
          <Link
            to="/examples/post/$postId"
            params={{ postId: "abc123" }}
            className="link"
          >
            /post/:id
          </Link>
          <Link
            to="/examples/user/$userId"
            params={{ userId: "u-42" }}
            className="link"
          >
            /user/:userId
          </Link>
          <Link to="/examples/tags/$tag" params={{ tag: "react" }} className="link">
            /tags/:tag
          </Link>
          <Link
            to="/examples/collections/$userId/$slug"
            params={{ userId: "jane", slug: "summer-2024" }}
            className="link"
          >
            /collections/:userId/:slug
          </Link>
          <Link
            to="/examples/categories/$"
            params={{ _splat: "a/b/c" }}
            className="link"
          >
            categories/* (splat)
          </Link>
          <Link
            to="/examples/search"
            search={{ view: "grid", q: "demo" }}
            className="link"
          >
            /search?view=…
          </Link>
          <Link to="/examples/scroll-restoration" className="link">
            scroll proof
          </Link>
          <Link to="/examples/lazy-scroll-restoration" className="link">
            lazy + scroll
          </Link>
          <Link to="/examples/widgets-system" className="link">
            widgets + plugins
          </Link>
          <Link to="/examples/layout" className="link">
            layout nodes
          </Link>
          <Link to="/examples/loader-demo" className="link">
            loader
          </Link>
          <Link to="/examples/navigate-demo" className="link">
            navigate / location
          </Link>
          <Link to="/examples/redirect-me" className="link">
            redirect (beforeLoad)
          </Link>
          <Link to="/examples/login-redirect" className="link">
            Navigate component
          </Link>
          <a href="/this-path-is-not-defined" className="link">
            trigger 404
          </a>
        </nav>
        <Outlet />
      </section>
    );
  }

  const examplesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "examples",
    component: ExamplesLayout,
  });

  const examplesIndexRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "/",
    component: ExamplesIndex,
  });

  const postRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "post/$postId",
    component: function PostById() {
      const { postId } = postRoute.useParams();
      return (
        <article className="panel">
          <h2>Dynamic: /post/:id</h2>
          <p>
            React Router: <code>useParams()</code> → TanStack:{" "}
            <code>postRoute.useParams()</code>
          </p>
          <p>
            <code>postId</code>: <strong>{postId}</strong>
          </p>
        </article>
      );
    },
  });

  const userRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "user/$userId",
    component: function UserById() {
      const { userId } = userRoute.useParams();
      return (
        <article className="panel">
          <h2>Dynamic: /user/:userId</h2>
          <p>
            <code>userId</code>: <strong>{userId}</strong>
          </p>
        </article>
      );
    },
  });

  const tagRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "tags/$tag",
    component: function TagPage() {
      const { tag } = tagRoute.useParams();
      return (
        <article className="panel">
          <h2>Dynamic: /tags/:tag</h2>
          <p>
            <code>tag</code>: <strong>{tag}</strong>
          </p>
        </article>
      );
    },
  });

  const collectionRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "collections/$userId/$slug",
    component: function CollectionPage() {
      const { userId, slug } = collectionRoute.useParams();
      return (
        <article className="panel">
          <h2>Multi-segment: /collections/:userId/:slug</h2>
          <p>
            <code>userId</code>: <strong>{userId}</strong>
          </p>
          <p>
            <code>slug</code>: <strong>{slug}</strong>
          </p>
        </article>
      );
    },
  });

  const categoriesSplatRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "categories/$",
    component: function CategoriesSplat() {
      const params = categoriesSplatRoute.useParams();
      const splat = params._splat ?? "";
      return (
        <article className="panel">
          <h2>Catch-all / splat</h2>
          <p>
            Remainder path (React Router <code>{"*"}</code> style):{" "}
            <strong>{splat || "(empty)"}</strong>
          </p>
          <p>
            <code>Route.useParams()</code> exposes <code>_splat</code> (see TanStack path
            docs).
          </p>
        </article>
      );
    },
  });

  const searchRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "search",
    validateSearch: migrationSearchSchema,
    component: function SearchDemo() {
      const search = searchRoute.useSearch();
      const navigate = useNavigate({ from: "/examples/search" });

      return (
        <article className="panel">
          <h2>Typed search params (replaces useSearchParams)</h2>
          <p>
            Current URL search: <code>{JSON.stringify(search)}</code>
          </p>
          <p>
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigate({
                  search: (prev: MigrationSearch) => ({
                    ...prev,
                    view: prev.view === "grid" ? "list" : "grid",
                  }),
                })
              }
            >
              Toggle view
            </button>{" "}
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigate({
                  search: (prev: MigrationSearch) => ({
                    ...prev,
                    q: "polymech",
                  }),
                })
              }
            >
              Set q=polymech
            </button>
          </p>
        </article>
      );
    },
  });

  const scrollRestorationDemoRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "scroll-restoration",
    component: ScrollRestorationDemo,
  });

  const lazyScrollRestorationRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "lazy-scroll-restoration",
    pendingComponent: () => (
      <article className="panel">
        <p>Loading lazy route chunk…</p>
      </article>
    ),
    component: lazyRouteComponent(
      () => import("@/examples/migration/lazy/LazyScrollRestorationChunk"),
    ),
  });

  const widgetSystemDemoRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "widgets-system",
    component: WidgetSystemDemoPage,
  });

  const flexNodeDemoRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "layout",
    component: FlexNodeDemoPage,
  });

  const loaderDemoRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "loader-demo",
    loader: async () => {
      await new Promise((r) => setTimeout(r, 120));
      return { loadedAt: new Date().toISOString() };
    },
    component: function LoaderDemo() {
      const data = loaderDemoRoute.useLoaderData();
      return (
        <article className="panel">
          <h2>Loader (prefetch / data before render)</h2>
          <p>
            Data from <code>loader</code>: <strong>{data.loadedAt}</strong>
          </p>
          <p>
            Move feed/API calls here instead of only <code>useEffect</code>+useQuery to
            avoid waterfalls (Phase 4).
          </p>
        </article>
      );
    },
  });

  const navigateDemoRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "navigate-demo",
    component: function NavigateDemo() {
      const navigate = useNavigate();
      const location = useLocation();
      const pathname = useRouterState({ select: (s) => s.location.pathname });

      return (
        <article className="panel">
          <h2>useNavigate / useLocation / useRouterState</h2>
          <p>
            <code>useLocation().pathname</code>: <strong>{location.pathname}</strong>
          </p>
          <p>
            <code>useRouterState(select)</code>: <strong>{pathname}</strong>
          </p>
          <p>
            <button
              type="button"
              className="btn"
              onClick={() => void navigate({ to: "/examples" })}
            >
              Programmatic navigate to /examples
            </button>
          </p>
        </article>
      );
    },
  });

  const redirectRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "redirect-me",
    beforeLoad: () => {
      throw redirect({ to: "/examples", replace: true });
    },
    component: () => null,
  });

  const declarativeRedirectRoute = createRoute({
    getParentRoute: () => examplesRoute,
    path: "login-redirect",
    component: () => <Navigate to="/examples" replace />,
  });

  return examplesRoute.addChildren([
    examplesIndexRoute,
    postRoute,
    userRoute,
    tagRoute,
    collectionRoute,
    categoriesSplatRoute,
    searchRoute,
    scrollRestorationDemoRoute,
    lazyScrollRestorationRoute,
    widgetSystemDemoRoute,
    flexNodeDemoRoute,
    loaderDemoRoute,
    navigateDemoRoute,
    redirectRoute,
    declarativeRedirectRoute,
  ]);
}
