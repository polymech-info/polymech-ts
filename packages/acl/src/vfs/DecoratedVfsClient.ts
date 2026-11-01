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
import { resourceChain } from './vfs-acl.js';
import { cleanUuid, sanitizeSubpath } from './sanitizers.js';

// ---------------------------------------------------------------------------
// Decorator factory
// ---------------------------------------------------------------------------

/**
 * TC39 Stage-3 method decorator.
 *
 * Intercepts the method call, extracts the first argument as `path`,
 * walks the resource chain, and throws EACCES if denied.
 */
function aclGuard(permission: string) {
    return function <T extends DecoratedVfsClient, A extends [string, ...unknown[]], R>(
        target: (this: T, ...args: A) => Promise<R>,
        context: ClassMethodDecoratorContext<T, (this: T, ...args: A) => Promise<R>>,
    ) {
        const methodName = String(context.name);

        return async function (this: T, ...args: A): Promise<R> {
            const path = sanitizeSubpath(args[0]);
            const chain = resourceChain(this.ownerId, path);

            for (const resource of chain) {
                const result = await this.acl.isAllowed(this.callerId, resource, permission);
                if (result.ok && result.data) {
                    return target.call(this, ...args);
                }
            }

            const err = new Error(
                `EACCES: user '${this.callerId}' lacks '${permission}' on path '${path}' [${methodName}]`,
            );
            (err as NodeJS.ErrnoException).code = 'EACCES';
            throw err;
        };
    };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Decorator-based ACL VFS client.
 *
 * Properties are public (not #private) so the decorator can access them.
 * This is the trade-off: decorators can't reach private fields.
 */
export class DecoratedVfsClient {
    readonly acl: Acl;
    readonly local: LocalVFS;
    readonly ownerId: string;
    readonly callerId: string;

    constructor(acl: Acl, ownerId: string, callerId: string, fsOpts: IDefaultParameters) {
        this.acl = acl;
        this.local = new LocalVFS(fsOpts);
        this.ownerId = cleanUuid(ownerId);
        this.callerId = cleanUuid(callerId);
    }

    // ── Read ────────────────────────────────────────────────────────

    @aclGuard('read')
    async stat(path: string): Promise<INode> {
        return this.local.stat(path);
    }

    @aclGuard('list')
    async readdir(path: string): Promise<INode[]> {
        return this.local.readdir(path);
    }

    @aclGuard('read')
    async readfile(path: string, options?: Record<string, unknown>): Promise<{ stream: ReadStream; meta: unknown }> {
        return this.local.readfile(path, options);
    }

    @aclGuard('read')
    async exists(path: string): Promise<boolean> {
        return this.local.exists(path);
    }

    // ── Write ───────────────────────────────────────────────────────

    @aclGuard('write')
    async writefile(path: string, content: string | Buffer, options?: Record<string, unknown>): Promise<void> {
        return this.local.writefile(path, content, options);
    }

    @aclGuard('write')
    async mkfile(path: string): Promise<void> {
        return this.local.mkfile(path);
    }

    @aclGuard('mkdir')
    async mkdir(path: string): Promise<void> {
        return this.local.mkdir(path, { recursive: true });
    }

    // ── Delete ──────────────────────────────────────────────────────

    @aclGuard('delete')
    async rmfile(path: string): Promise<void> {
        return this.local.rmfile(path);
    }

    @aclGuard('delete')
    async rmdir(path: string): Promise<void> {
        return this.local.rmdir(path);
    }

    // ── Move / Copy ─────────────────────────────────────────────────

    @aclGuard('rename')
    async rename(from: string, to: string): Promise<void> {
        return this.local.rename(from, to);
    }

    @aclGuard('copy')
    async copy(from: string, to: string): Promise<void> {
        return this.local.copy(from, to);
    }
}
