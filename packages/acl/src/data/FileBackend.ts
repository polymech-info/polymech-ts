/**
 * @polymech/acl — File-backed storage
 *
 * Extends MemoryBackend with JSON read/write via node:fs.
 * Intended for dev/testing use, not production.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { MemoryBackend } from './MemoryBackend.js';
import type { IFileStore } from '../interfaces.js';

export class FileBackend extends MemoryBackend implements IFileStore {
    readonly #path: string;

    constructor(filePath: string) {
        super();
        this.#path = filePath;
    }

    /** Load stored ACL data from disk into memory. */
    read(path?: string): void {
        const target = path ?? this.#path;
        try {
            const raw = readFileSync(target, 'utf8');
            this.buckets = JSON.parse(raw);
        } catch (err: unknown) {
            const e = err as NodeJS.ErrnoException;
            if (e.code === 'ENOENT') {
                mkdirSync(dirname(target), { recursive: true });
                return;
            }
            if (err instanceof SyntaxError) {
                // Corrupt JSON → reset
                writeFileSync(target, '', { mode: 0o600 });
                return;
            }
            throw err;
        }
    }

    /** Persist current ACL data to disk. */
    write(path?: string): void {
        const target = path ?? this.#path;
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, JSON.stringify(this.buckets, null, 2), { mode: 0o600 });
    }
}
