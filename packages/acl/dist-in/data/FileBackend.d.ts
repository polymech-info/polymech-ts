import { MemoryBackend } from './MemoryBackend.js';
import type { IFileStore } from '../interfaces.js';
export declare class FileBackend extends MemoryBackend implements IFileStore {
    #private;
    constructor(filePath: string);
    /** Load stored ACL data from disk into memory. */
    read(path?: string): void;
    /** Persist current ACL data to disk. */
    write(path?: string): void;
}
