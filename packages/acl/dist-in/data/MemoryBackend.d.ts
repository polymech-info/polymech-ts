/**
 * @polymech/acl — In-memory backend
 *
 * Transaction = array of deferred mutations, executed on `end()`.
 * All reads are synchronous (wrapped as async for the interface).
 */
import type { IBackend, Value, Values } from '../interfaces.js';
type Transaction = (() => void)[];
type BucketStore = Record<string, Record<string, string[]>>;
export declare class MemoryBackend implements IBackend<Transaction> {
    #private;
    /** Expose raw data (used by FileBackend for serialisation). */
    get buckets(): BucketStore;
    set buckets(data: BucketStore);
    begin(): Transaction;
    end(transaction: Transaction): Promise<void>;
    clean(): Promise<void>;
    get(bucket: string, key: Value): Promise<string[]>;
    union(bucket: string, keys: Value[]): Promise<string[]>;
    unions(buckets: string[], keys: Value[]): Promise<Record<string, string[]>>;
    add(transaction: Transaction, bucket: string, key: Value, values: Values): void;
    del(transaction: Transaction, bucket: string, keys: Values): void;
    remove(transaction: Transaction, bucket: string, key: Value, values: Values): void;
}
export {};
