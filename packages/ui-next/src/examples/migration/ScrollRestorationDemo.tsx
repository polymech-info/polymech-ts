import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";

/**
 * Proof harness for `createRouter({ scrollRestoration: true })` in `src/router.tsx`.
 * TanStack restores `window` scroll for this route when you leave and return via history.
 */
export function ScrollRestorationDemo() {
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
          Scroll down, note the value, open another example, then use the browser{" "}
          <strong>Back</strong> button — the pixel value should return (TanStack scroll
          cache + <code>history.scrollRestoration = &apos;manual&apos;</code>).
        </div>
      </div>

      <article className="panel scroll-demo-intro">
        <h2>Scroll restoration (evidence)</h2>
        <p>
          Router option: <code>scrollRestoration: true</code> in{" "}
          <code>src/router.tsx</code> (replaces a bespoke <code>ScrollRestoration.tsx</code>{" "}
          in many apps).
        </p>
        <ol className="scroll-demo-steps">
          <li>Scroll until <strong>Section 25</strong> is visible and remember the HUD value.</li>
          <li>
            Click{" "}
            <Link to="/examples/loader-demo" className="link">
              loader demo
            </Link>{" "}
            (or Home in the site header).
          </li>
          <li>
            Press the browser <strong>Back</strong> button to return here.
          </li>
          <li>
            The HUD should show the same ballpark <code>scrollY</code> as before — not{" "}
            <code>0</code>.
          </li>
        </ol>
        <p className="muted">
          Forward navigation to a new URL still scrolls to top by default; restoration is
          for same-route revisit via history (Back/Forward).
        </p>
      </article>

      <div className="scroll-demo-blocks" aria-hidden>
        {Array.from({ length: 48 }, (_, i) => (
          <div key={i} className="scroll-demo-block" id={`section-${i + 1}`}>
            Section {i + 1}
          </div>
        ))}
      </div>
    </>
  );
}
