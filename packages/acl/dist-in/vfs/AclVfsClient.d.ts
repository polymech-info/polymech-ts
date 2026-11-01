/**
 * ACL-Guarded VFS Client
 *
 * Wraps `LocalVFS` and checks every operation against an `Acl` instance
 * before delegating. Throws EACCES if the caller lacks the required permission.
 *
 * Path-aware: walks the resource chain from the target path up to the root
 * and grants access if ANY ancestor resource allows the permission.
 *
 * Permission mapping:
 *   readfile / stat   → "read"
 *   readdir           → "list"
 *   writefile / mkfile → "write"
 *   mkdir / mkdirP    → "mkdir"
 *   rmfile / rmdir    → "delete"
 *   rename            → "rename"
 *   copy              → "copy"
 */
import type { ReadStream } from 'node:fs';
import type { Acl } from '../Acl.js';
import type { INode } from './fs/VFS.js';
import { type IDefaultParameters } from './fs/Local.js';
export declare class AclVfsClient {
    #private;
    /**
     * @param acl       Populated Acl instance (call `loadVfsSettings` first)
     * @param ownerId   UUID of the folder owner
     * @param callerId  UUID of the user performing the operation, or 'anonymous'
     * @param fsOpts    LocalVFS options (must include `root`)
     */
    constructor(acl: Acl, ownerId: string, callerId: string, fsOpts: IDefaultParameters);
    stat(path: string): Promise<INode>;
    readdir(path: string): Promise<INode[]>;
    readfile(path: string, options?: Record<string, unknown>): Promise<{
        stream: ReadStream;
        meta: unknown;
    }>;
    exists(path: string): Promise<boolean>;
    writefile(path: string, content: string | Buffer, options?: Record<string, unknown>): Promise<void>;
    mkfile(path: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    mkdirP(path: string): Promise<void>;
    rmfile(path: string): Promise<void>;
    rmdir(path: string): Promise<void>;
    rename(from: string, to: string): Promise<void>;
    copy(from: string, to: string): Promise<void>;
}
