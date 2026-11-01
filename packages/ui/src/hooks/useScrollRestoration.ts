import { useEffect, useRef } from 'react';

/**
 * In-memory scroll position cache for SPA navigation.
 * Survives across component mounts within the same session.
 */
const scrollCache = new Map<string, number>();

// Disable browser's built-in scroll restoration — we manage it ourselves.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

/**
 * Track whether the last navigation was a popstate (back/forward)
 * vs. a pushState/replaceState (forward click).
 */
let lastNavWasPopstate = false;
window.addEventListener('popstate', () => { lastNavWasPopstate = true; });

// Patch pushState/replaceState to clear the flag
const origPush = history.pushState.bind(history);
const origReplace = history.replaceState.bind(history);
history.pushState = (...args) => { lastNavWasPopstate = false; return origPush(...args); };
history.replaceState = (...args) => { lastNavWasPopstate = false; return origReplace(...args); };

/** Retry scrollTo until the document is tall enough or we give up. */
function scrollToWithRetry(target: number, maxAttempts = 20, interval = 100) {
  let attempts = 0;
  const tryScroll = () => {
    window.scrollTo(0, target);
    attempts++;
    if (Math.abs(window.scrollY - target) > 50 && attempts < maxAttempts) {
      setTimeout(tryScroll, interval);
    }
  };
  requestAnimationFrame(tryScroll);
}

/**
 * Save/restore **window** scroll position keyed by a route-derived string.
 * - Forward navigation (link click) → always scroll to top
 * - Back/forward navigation (popstate) → restore cached position
 */
export function useScrollRestoration(key: string) {
  const prevKeyRef = useRef<string>(key);
  const scrollYRef = useRef(0);

  // ── Handle key change (navigation) ──────────────────────────────────
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      // Save outgoing page
      scrollCache.set(prevKeyRef.current, scrollYRef.current);
      prevKeyRef.current = key;

      // Hash navigation → let browser handle anchor scroll
      if (window.location.hash) {
        return;
      }

      if (lastNavWasPopstate) {
        const cached = scrollCache.get(key);
        if (cached != null && cached > 0) {
          scrollToWithRetry(cached);
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        // Forward nav → always top (retry to fight lazy content shifts)
        scrollToWithRetry(0);
      }
    }
  }, [key]);

  // ── Track window scroll (debounced) ─────────────────────────────────
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        scrollYRef.current = window.scrollY;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [key]);

  // ── Handle initial mount ─────────────────────────────────────────────
  useEffect(() => {
    // If URL has a hash, let the browser handle anchor scroll natively
    if (window.location.hash) {
      return;
    }

    if (lastNavWasPopstate) {
      const cached = scrollCache.get(key);
      if (cached != null && cached > 0) {
        scrollToWithRetry(cached);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Forward nav mount → scroll to top (retry to fight lazy content)
      scrollToWithRetry(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      scrollCache.set(key, scrollYRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
