/**
 * @polymech/acl — In-memory backend
 *
 * Transaction = array of deferred mutations, executed on `end()`.
 * All reads are synchronous (wrapped as async for the interface).
 */
import type { IBackend, Value, Values } from '../interfaces.js';

type Transaction = (() => void)[];
type BucketStore = Record<string, Record<string, string[]>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toArray(v: Values): (string | number)[] {
    return Array.isArray(v) ? v : [v];
}

function setUnion(a: string[], b: string[]): string[] {
    return [...new Set([...a, ...b])];
}

function setDifference(a: string[], b: string[]): string[] {
    const set = new Set(b);
    return a.filter((x) => !set.has(x));
}

// ---------------------------------------------------------------------------
// MemoryBackend
// ---------------------------------------------------------------------------

export class MemoryBackend implements IBackend<Transaction> {
    #buckets: BucketStore = {};

    /** Expose raw data (used by FileBackend for serialisation). */
    get buckets(): BucketStore {
        return this.#buckets;
    }

    set buckets(data: BucketStore) {
        this.#buckets = data;
    }

    // -- Transaction lifecycle ------------------------------------------------

    begin(): Transaction {
        return [];
    }

    async end(transaction: Transaction): Promise<void> {
        for (const fn of transaction) {
            fn();
        }
    }

    async clean(): Promise<void> {
        this.#buckets = {};
    }

    // -- Reads ----------------------------------------------------------------

    async get(bucket: string, key: Value): Promise<string[]> {
        return this.#buckets[bucket]?.[key] ?? [];
    }

    async union(bucket: string, keys: Value[]): Promise<string[]> {
        const b = this.#findBucket(bucket);
        if (!b) return [];

        const result: string[] = [];
        for (const key of keys) {
            const vals = b[String(key)];
            if (vals) result.push(...vals);
        }
        return [...new Set(result)];
    }

    async unions(buckets: string[], keys: Value[]): Promise<Record<string, string[]>> {
        const result: Record<string, string[]> = {};
        for (const bucket of buckets) {
            const b = this.#buckets[bucket];
            if (!b) {
                result[bucket] = [];
                continue;
            }

            const merged: string[] = [];
            for (const key of keys) {
                const vals = b[String(key)];
                if (vals) merged.push(...vals);
            }
            result[bucket] = [...new Set(merged)];
        }
        return result;
    }

    // -- Writes (queued in transaction) ---------------------------------------

    add(transaction: Transaction, bucket: string, key: Value, values: Values): void {
        const vals = toArray(values).map(String);
        transaction.push(() => {
            this.#buckets[bucket] ??= {};
            const existing = this.#buckets[bucket]![String(key)] ?? [];
            this.#buckets[bucket]![String(key)] = setUnion(existing, vals);
        });
    }

    del(transaction: Transaction, bucket: string, keys: Values): void {
        const keysArr = toArray(keys).map(String);
        transaction.push(() => {
            const b = this.#buckets[bucket];
            if (!b) return;
            for (const k of keysArr) {
                delete b[k];
            }
        });
    }

    remove(transaction: Transaction, bucket: string, key: Value, values: Values): void {
        const vals = toArray(values).map(String);
        transaction.push(() => {
            const b = this.#buckets[bucket];
            if (!b) return;
            const old = b[String(key)];
            if (old) {
                b[String(key)] = setDifference(old, vals);
            }
        });
    }

    // -- Internal -------------------------------------------------------------

    /**
     * Find a bucket by exact name or by regex match (legacy compat).
     */
    #findBucket(name: string): Record<string, string[]> | undefined {
        if (this.#buckets[name]) return this.#buckets[name];

        for (const key of Object.keys(this.#buckets)) {
            if (new RegExp(`^${key}$`).test(name)) {
                return this.#buckets[key];
            }
        }
        return undefined;
    }
}
