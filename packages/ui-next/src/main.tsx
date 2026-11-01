import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "@/router";
import "@/styles.css";

if (import.meta.env.DEV) {
  router.subscribe("onResolved", (event) => {
    // Phase 4: replace custom route-change listeners / ScrollRestoration onRouteChange
    console.debug("[analytics]", event.toLocation.pathname);
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
