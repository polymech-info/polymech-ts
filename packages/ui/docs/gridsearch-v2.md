# GridSearch V2: Uniform Geometric Simulation to Backend Execution

## The Problem (V1)
Our V1 backend architecture iterated directly over political GADM boundary nodes (e.g., cities, municipalities) and searched their geographic centers or raw bounding boxes. This methodology had three severe drawbacks:
1. **Gaps**: Political polygons are irregular. A fixed search radius originating from a polygon's centroid inevitably missed the edges and corners of oddly-shaped areas. 
2. **Overlaps**: Densely packed suburban municipalities resulted in centroids sitting dangerously close to one another. The search radii overlapped, causing redundant API calls returning the exact same prospects.
3. **Empty Wastelands**: A single large municipality might be 80% uninhabited mountain ranges or deserts. Searching its center burned API credits on regions with zero B2B locations.

## The V2 Solution & Architecture
In V2, we relegated GADM nodes to being **clipping masks** rather than search targets. The actual API "hops" happen across a mathematically uniform geometric grid that perfectly tiles the target terrain.

This system guarantees **100% geographic coverage with 0% redundancy** and relies on a dual-stack architecture:

### 1. The Client-Side UI & Simulator (Completed)
We constructed the `GridSearchPlayground`, `GadmPicker`, and `GridSearchSimulator` to visually tune and preview search parameters in the browser:
* The user selects specific hierarchical GADM geographies.
* The simulator overlays a Turf.js generated grid (Hex or GADM-native).
* Configurable optimization parameters (Max Elevation, Min Population Density) dynamically cull the grid in real time, preventing wasted API hops in uninhabited or extreme terrain.
* The simulator visualizes the path trajectory ("snake", "zigzag", "spiral-out") representing the exact sequence of planned API calls.

### 2. The Backend Execution Engine (Next Steps)
The exact Grid generation and culling logic visually perfected in the frontend must now be translated into the Node.js API pipeline to actually execute the real GridSearches.

**Porting Requirements:**
* **Payload Ingestion:** The server must accept the optimized parameters selected by the user (target regions/polygons, grid mode, cell size, path trajectory, filters).
* **Grid Computation (Server-Side Turf.js):** The backend will replicate the Turf.js bounding box, grid generation, intersection, and sorting logic to reconstruct the exact `validCells` array the UI simulator previewed.
* **Topographical Filtering:** Recreate the logic that drops cells failing the structural constraints (e.g., average elevation > threshold, population density < threshold).
* **Sequential API Execution:** Once the valid grid is ordered matching the trajectory, the backend will iterate over the cells using a queue (or sequential loop), rate-limiting the execution of the actual Provider API calls to scrape the specified coordinates.
* **Progress Tracking & Persistence:** Emit progress updates (e.g., via WebSockets or job tracking) marking cells as 'processed', saving scraped data back to the database, and ensuring the job can resume cleanly if interrupted.

## Execution Flow Porting Plan
1. **API Design**: Define the structured endpoint payload `POST /api/locations/gridsearch/generate` capable of receiving the complex region + filter configuration.
2. **Modular Turf Utils**: Abstract the Turf.js grid logic (`turf.hexGrid`, intersections, centroid path sorting) into shared utility functions accessible by the backend worker.
3. **Workflow Integration**: Wire the resulting mathematically optimal coordinate arrays into the pre-existing grid search pipeline, effectively bridging the sophisticated V2 UI targeting with the core V1 scraping engine.
