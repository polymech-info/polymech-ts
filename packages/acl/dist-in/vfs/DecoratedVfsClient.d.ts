/**
 * ACL-Guarded VFS Client — Decorator Edition 🎭
 *
 * Same behaviour as AclVfsClient, but uses TC39 Stage-3 method decorators
 * to declare permission guards declaratively instead of imperative #guard() calls.
 *
 * Usage:
 *   @aclGuard('read')       → checks "read" permission on the first arg (path)
 *   @aclGuard('list')       → checks "list" permission
 *   @aclGuard('write')      → checks "write" permission
 *   …etc
 *
 * The decorator extracts `path` from the first argument and walks
 * the resource chain from that path up to "/" — same as AclVfsClient.
 */
import type { ReadStream } from 'node:fs';
import type { Acl } from '../Acl.js';
import type { INode } from './fs/VFS.js';
import { LocalVFS, type IDefaultParameters } from './fs/Local.js';
/**
 * Decorator-based ACL VFS client.
 *
 * Properties are public (not #private) so the decorator can access them.
 * This is the trade-off: decorators can't reach private fields.
 */
export declare class DecoratedVfsClient {
    readonly acl: Acl;
    readonly local: LocalVFS;
    readonly ownerId: string;
    readonly callerId: string;
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
    rmfile(path: string): Promise<void>;
    rmdir(path: string): Promise<void>;
    rename(from: string, to: string): Promise<void>;
    copy(from: string, to: string): Promise<void>;
}
