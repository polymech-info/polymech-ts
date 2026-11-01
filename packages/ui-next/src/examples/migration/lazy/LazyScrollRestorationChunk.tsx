import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";

/**
 * Default export is loaded only when the user hits `/examples/lazy-scroll-restoration`
 * (`lazyRouteComponent` + dynamic `import()`). Vite emits a separate JS chunk — check Network.
 * Scroll restoration for this route is unchanged: use Back after visiting another page.
 */
export default function LazyScrollRestorationChunk() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(Math.round(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="scroll-hud" aria-live="polite">
        <div>
          <strong>window.scrollY</strong> = {scrollY}px
        </div>
        <div className="scroll-hud-hint">
          Lazy route: scroll, go to{" "}
          <Link to="/examples/loader-demo" className="link">
            loader demo
          </Link>
          , then <strong>Back</strong> — position should restore like the non-lazy scroll
          demo.
        </div>
      </div>

      <article className="panel scroll-demo-intro lazy-chunk-intro">
        <h2>Lazy route + scroll restoration</h2>
        <p>
          This screen is the <strong>default export</strong> of a dynamically imported
          module (
          <code>
            {`lazyRouteComponent(() => import("…/LazyScrollRestorationChunk"))`}
          </code>
          ). It is not in the main bundle; DevTools → Network should show a separate script
          when you first open this URL.
        </p>
        <p>
          <code>{`createRouter({ scrollRestoration: true })`}</code> in{" "}
          <code>src/router.tsx</code> still caches scroll for this entry — code splitting
          does not disable restoration.
        </p>
      </article>

      <div className="scroll-demo-blocks" aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="scroll-demo-block" id={`lazy-section-${i + 1}`}>
            Lazy chunk · block {i + 1}
          </div>
        ))}
      </div>
    </>
  );
}
