/**
 * Worker IPC utility — bridges main-thread route handlers to native worker threads.
 *
 * Uses late binding (reads nativeWorkers inside function bodies) to avoid the
 * circular import cycle: registry → images → worker-ipc → registry.
 *
 * The workers array is populated at runtime after module init, so late access is safe.
 */

import { randomUUID } from 'crypto';

// Late import — only accessed inside function bodies, never at module init time.
// This avoids: registry.ts → images → worker-ipc → registry (circular ESM cycle).
async function getWorkers() {
    const { nativeWorkers } = await import('../products/registry.js');
    return nativeWorkers;
}

/**
 * Returns true if a live worker thread exists for the given product ID.
 * Fast synchronous check — useful for the hybrid fallback decision.
 */
let _nativeWorkers: { id: string; worker: any }[] | null = null;
// Round-robin index per product to distribute load across multiple workers
const workerRoundRobin = new Map<string, number>();

async function resolveWorkers() {
    if (!_nativeWorkers) {
        const { nativeWorkers } = await import('../products/registry.js');
        _nativeWorkers = nativeWorkers;
    }
    return _nativeWorkers;
}

export async function hasWorker(productId: string): Promise<boolean> {
    const workers = await resolveWorkers();
    return workers.some(w => w.id === productId);
}

/**
 * Dispatch a job to the worker thread for a given product.
 *
 * Sends: { type: 'job', jobId, action, ...payload }
 * Expects reply: { type: 'job_result', jobId, result } or { ..., error: string }
 *
 * @param productId  - e.g. 'images'
 * @param action     - e.g. 'process_image' | 'render_image'
 * @param payload    - job-specific data (buffers should be in transferList too)
 * @param transferList - ArrayBuffers to transfer zero-copy (avoids cloning large image data)
 * @param timeoutMs  - defaults to 30s
 */
export async function dispatchToWorker<T = any>(
    productId: string,
    action: string,
    payload: Record<string, any>,
    transferList: ArrayBuffer[] = [],
    timeoutMs = 30_000,
): Promise<T> {
    const workers = await resolveWorkers();
    const productWorkers = workers.filter(w => w.id === productId);

    if (productWorkers.length === 0) {
        throw new Error(`dispatchToWorker: no live worker for product '${productId}'`);
    }

    // Round-robin selection across workers for this product
    const idx = (workerRoundRobin.get(productId) ?? 0) % productWorkers.length;
    workerRoundRobin.set(productId, idx + 1);
    const entry = productWorkers[idx];

    const jobId = randomUUID();

    return new Promise<T>((resolve, reject) => {
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            entry.worker.off('message', handler);
            reject(new Error(`Worker job '${action}' timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const handler = (msg: any) => {
            if (msg?.type !== 'job_result' || msg.jobId !== jobId) return;
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            entry.worker.off('message', handler);

            if (msg.error) {
                reject(new Error(`Worker job '${action}' failed: ${msg.error}`));
            } else {
                resolve(msg.result as T);
            }
        };

        entry.worker.on('message', handler);

        // postMessage with optional zero-copy transfer list
        entry.worker.postMessage(
            { type: 'job', jobId, action, ...payload },
            transferList,
        );
    });
}
