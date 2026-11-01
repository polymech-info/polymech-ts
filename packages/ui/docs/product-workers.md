# Polymech Product Worker Architecture

The Polymech server uses a hybrid architecture that delegates heavy CPU-bound tasks or isolated background processing (like queues) to dedicated native Node.js **Worker Threads**, while keeping the main event loop responsive for HTTP handling.

This document details how the worker thread system is configured, initialized, and integrated via IPC.

---

## 1. Configuration & Registry (`[config/products.json](../server/config/products.json)`)

Worker threads are defined in `config/products.json`. Each product specifies the number of dedicated threads it requires under the `workers` property.

```json
{
  "images": {
    "enabled": true,
    "workers": 1,
    "routes": true
  }
}
```

The boot sequence is managed by `[src/products/registry.ts](../server/src/products/registry.ts)`:
1. It reads `products.json`.
2. For every product with `workers > 0`, it spawns up to that many `Worker` instances.
3. The instantiated worker receives `workerData: { productName: 'images' }` so it knows which product it is responsible for.
4. The main thread maintains an in-memory array exported as `nativeWorkers` representing live worker threads.

---

## 2. The Development Wrapper (`[worker_wrapper.mjs](../server/src/worker_wrapper.mjs)`)

Because the project runs in development mode via `tsx watch` (or `vite-node`), natively spawned `Worker` threads lose the TypeScript transpilation context of the main thread.

To fix this, `registry.ts` boots workers using a hybrid wrapper approach depending on the environment:

- **Production**: Boots directly into `dist-server/worker.js`.
- **Development**: Boots into `src/worker_wrapper.mjs` instead of `worker.ts`.

`worker_wrapper.mjs` manually sets up a `vite-node` API server inside the worker context to transpile `worker.ts` on the fly, and explicitly maps path aliases (like `@/*` to `src/*`) to resolve imports exactly like the main thread.

---

## 3. The Worker Entrypoint (`[src/worker.ts](../server/src/worker.ts)`)

Once `worker.ts` executes, it acts purely as an agnostic bootstrap layer. It performs no business logic of its own.

Its responsibilities are:
1. Validate `workerData.productName`.
2. Instantiate the matched `AbstractProduct` subclass (e.g., `new ImagesProduct()`).
3. Set up the IPC event listener on `parentPort`.
4. Optionally boot PG-Boss (if the product requires queue management).
5. Call `instance.start()`.

**IPC Routing:**
When `worker.ts` receives `{ type: 'job' }` messages from the main thread, it delegates the work directly back to the active product instance:

```typescript
// inside worker.ts
if (msg.type === 'job') {
    const { action, jobId } = msg;
    try {
        const result = await instance.handleJob(action, msg);
        parentPort?.postMessage({ type: 'job_result', jobId, result });
    } catch (err) {
        parentPort?.postMessage({ type: 'job_result', jobId, error: err.message });
    }
}
```

---

## 4. Main-to-Worker IPC (`[src/commons/worker-ipc.ts](../server/src/commons/worker-ipc.ts)`)

To communicate with the worker, the main thread uses the `worker-ipc.ts` utility. 
This file provides two critical functions:

1. `hasWorker(productId: string)` — A fast, synchronous check to see if a specific product (e.g., 'images') has an active native worker.
2. `dispatchToWorker(productId, action, payload, transferList?)` — Wraps the internal Node.js `postMessage` architecture inside an easy-to-use Promise interface.

### Important: Late Binding

To avoid circular dependency cycles (`registry → images → worker-ipc → registry`), the IPC module does **not** import `nativeWorkers` at the top level. Instead, it dynamically imports it inside the function body (`await import('../products/registry.js')`).

### Important: Zero-Copy Transfers

When dispatching heavy workloads (like raw image ArrayBuffers), pass the buffer in the optional 4th parameter `transferList`. This effectively *moves* the memory block to the worker thread without taking the massive performance hit of serializing/cloning it over the IPC bridge.

---

## 5. Domain Encapsulation (`[ImagesProduct.ts](../server/src/products/images/index.ts)`)

To prevent `worker.ts` from becoming a bloated monolith, all business logic lives strictly inside the individual product classes (e.g., `ImagesProduct.ts`).

Products running in hybrid mode override the `handleJob(action, msg)` method exposed by `AbstractProduct`.

```typescript
// inside ImagesProduct.ts
async handleJob(action: string, msg: any): Promise<any> {
    if (action === 'process_image') {
        // Runs inside the isolated worker thread
        return await this.performProcessImage(...);
    }
    return super.handleJob(action, msg);
}
```

## 6. Hybrid Fallback (`[ImagesProduct.ts](../server/src/products/images/index.ts)`)

Because the route handlers run on the *main thread*, they must account for scenarios where a worker has failed to boot, crashed, or was disabled in `config/products.json`.

Route handlers implement a Graceful Fallback Pattern using `hasWorker()`:

```typescript
// inside ImagesProduct.ts -> handlePostImage()
if (await hasWorker('images')) {
    // 1. ArrayBuffer sent to worker (zero-copy)
    await dispatchToWorker('images', 'process_image', { buffer, ... }, [buffer]);
    // 2. Pick up the file the worker wrote to disk 
    processedBuffer = await fs.readFile(filepath);
} else {
    // 1. Worker unavailable or disabled. Process synchronously inline.
    await this.performProcessImage(inputBuffer, filepath, ...);
    processedBuffer = await fs.readFile(filepath);
}
```

By ensuring that `performProcessImage` is a standalone class method, both the worker thread (`handleJob`) and the main thread fallback path execute the exact same, DRY codebase.

---

## 7. Telemetry & Real-Time Admin Monitoring

The admin interface provides live, deep telemetry into the performance and load of the native worker threads. This ensures developers can monitor memory consumption, CPU utilization, and task concurrency without external tools.

**1. Task Concurrency (`activeJobs`)**  
Inside `[src/worker.ts](../server/src/worker.ts)`, every incoming `'job'` IPC event increments an `activeJobs` internal counter. A `finally` block ensures this decrements when the job resolves or crashes. When the main thread requests a health check ping via `{ type: 'ping' }`, the worker thread replies with `{ type: 'pong', activeJobs }`.

**2. Node.js Native Worker Metrics**  
During periodic polling instances in `[src/endpoints/admin.ts](../server/src/endpoints/admin.ts)`, the main thread queries internal V8 and Node performance APIs for each running worker:
- **`getHeapStatistics()`**: Collects exact V8 heap memory usage (`heapUsedMB`, `heapTotalMB`).
- **`cpuUsage()`**: Produces microsecond-level CPU deltas which can be calculated into a real-time `cpuPercent`.
- **`performance.eventLoopUtilization()`**: Returns the fractional idle-vs-busy processing ratio for the worker thread, calculated into `eluPercent`.

**3. WebSocket Push Broadcasting (`sys-stats`)**  
Rather than relying on heavy REST API polling inside the Admin frontend UI, the backend uses a generic interval loop inside `admin.ts` to actively grab `getSystemInfo()` and `getWorkerPings()`. This aggregated telemetry is pushed automatically over WebSockets to all connected clients under the event `sys-stats` using `[src/commons/websocket.ts](../server/src/commons/websocket.ts)`. 

On the frontend, the `SystemStats` and `WorkerThreadStats` UI components simply tap into a global `useWebSocket` React Context Hook to listen for updates, updating visuals instantly with zero repetitive HTTP overhead.
