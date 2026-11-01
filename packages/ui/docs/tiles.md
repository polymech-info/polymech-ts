# GridSearch Polygon Rendering & Server Freeze Mitigation

## The Problem
When dealing with GridSearches containing over 5,000+ polygons (e.g., all towns in Spain), querying `better-sqlite3`, parsing GeoPackage WKB into JS objects, putting them into an array, and then running `JSON.stringify()` on a 100MB+ object tree freezes the V8 JavaScript engine. The garbage collector natively blocks the main event loop while traversing this massive JS object. 

Even with asynchronous yields (e.g., `setTimeout(resolve, 0)`), constructing massive JavaScript arrays of multi-polygons will lock up the Node.js thread and cause other API requests to timeout.

## Architectural Options

### 1. Raw String Streaming (Lowest Effort, High Impact)
Skip building the 100MB+ V8 object tree entirely.
- **How:** Query SQLite geometries and stream the raw JSON strings directly into the HTTP response (e.g. `c.streamText()`).
- **Pros:** Peak memory drops from 500MB+ to ~1MB. The V8 engine never builds the massive object tree, preventing the GC freeze.
- **Cons:** The browser still has to download and parse a massive JSON file at once, which may freeze the frontend map rendering momentarily.

### 2. Pre-generate Static `.geojson` Files (Best Performance)
Instead of asking the database for polygons *every time* a map requests them, generate the full polygons file once.
- **How:** When `gs.enumerate()` creates a search, it also writes a `{basename}-polygons.json` file to the `searches/` directory. The UI fetches this static file directly.
- **Pros:** Perfectly zero-cost for the Node backend at request-time. NGINX or Hono streams the file instantly without touching the heavy event loop.
- **Cons:** Increases disk usage. The initial file generation still freezes the server briefly (unless offloaded to a background task like PgBoss).

### 3. Native Worker Threads (`worker_threads`)
Offload the synchronous SQLite querying to a separate Node.js thread.
- **How:** Spin up a `piscina` worker pool. The worker thread opens a separate `better-sqlite3` connection, does the parsing, stringifies it, and passes the buffer back.
- **Pros:** Main event loop remains 100% responsive.
- **Cons:** Significant architectural overhead. Transferring 100MB strings via `postMessage` still incurs a minor memory/serialization hit.

### 4. Vector Tiles / .mvt & Lazy Loading (The "Proper" GIS Way)
Maplibre GL natively supports loading data in Vector Tiles (zoom + X + Y bounding boxes) rather than pulling all 5,000 geometries at once.
- **How:** The UI requests data via `/api/locations/gridsearch/tiles/{z}/{x}/{y}`. The backend dynamically queries `better-sqlite3` strictly for polygons intersecting that tile envelope.
- **Pros:** Infinitely scalable. 5 million polygons won't freeze the server or the browser.
- **Cons:** Highest effort. Requires implementing an MVT generation proxy (using `geojson-vt` or PostGIS equivalents) and pagination in the client.

## Current Mitigation
Currently, a temporary fix uses `await new Promise(r => setTimeout(r, 0))` in the `/api/locations/gridsearch/polygons` endpoint every 50 iterations to yield to the event loop. However, moving towards **Option 2** (Static generation) or **Option 4** (Vector tiles) is strongly recommended for production stability.
