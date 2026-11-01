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
import { LocalVFS, type IDefaultParameters } from './fs/Local.js';
import { resourceChain } from './vfs-acl.js';
import { cleanUuid, cleanId, sanitizeSubpath, ANONYMOUS_USER_ID, AUTHENTICATED_USER_ID } from './sanitizers.js';

export class AclVfsClient {
    readonly #acl: Acl;
    readonly #local: LocalVFS;
    readonly #ownerId: string;
    readonly #callerId: string;

    /**
     * @param acl       Populated Acl instance (call `loadVfsSettings` first)
     * @param ownerId   UUID of the folder owner
     * @param callerId  UUID of the user performing the operation, or 'anonymous'
     * @param fsOpts    LocalVFS options (must include `root`)
     */
    constructor(acl: Acl, ownerId: string, callerId: string, fsOpts: IDefaultParameters) {
        this.#acl = acl;
        this.#local = new LocalVFS(fsOpts);
        this.#ownerId = cleanUuid(ownerId);
        this.#callerId = cleanId(callerId);
    }

    // ── Guards ──────────────────────────────────────────────────────

    /**
     * Walk the resource chain from most-specific path to root.
     * If ANY level grants the permission, access is allowed.
     * This means a grant on `/` covers the entire tree.
     *
     * For non-anonymous callers, also checks grants given to the
     * `'authenticated'` sentinel, so a single grant can cover all
     * logged-in users.
     */
    async #guard(permission: string, path: string): Promise<void> {
        const safePath = sanitizeSubpath(path);
        const chain = resourceChain(this.#ownerId, safePath);

        // 1. Check caller-specific grants
        for (const resource of chain) {
            const result = await this.#acl.isAllowed(this.#callerId, resource, permission);
            if (result.ok && result.data) return;
        }

        // 2. For non-anonymous callers, check 'authenticated' group grants
        if (this.#callerId !== ANONYMOUS_USER_ID) {
            for (const resource of chain) {
                const result = await this.#acl.isAllowed(AUTHENTICATED_USER_ID, resource, permission);
                if (result.ok && result.data) return;
            }
        }

        const err = new Error(
            `EACCES: user '${this.#callerId}' lacks '${permission}' on path '${path}'`,
        );
        (err as NodeJS.ErrnoException).code = 'EACCES';
        throw err;
    }

    // ── Read operations ─────────────────────────────────────────────

    async stat(path: string): Promise<INode> {
        await this.#guard('read', path);
        return this.#local.stat(path);
    }

    async readdir(path: string): Promise<INode[]> {
        await this.#guard('list', path);
        return this.#local.readdir(path);
    }

    async readfile(path: string, options?: Record<string, unknown>): Promise<{ stream: ReadStream; meta: unknown }> {
        await this.#guard('read', path);
        return this.#local.readfile(path, options);
    }

    async exists(path: string): Promise<boolean> {
        await this.#guard('read', path);
        return this.#local.exists(path);
    }

    // ── Write operations ────────────────────────────────────────────

    async writefile(path: string, content: string | Buffer, options?: Record<string, unknown>): Promise<void> {
        await this.#guard('write', path);
        return this.#local.writefile(path, content, options);
    }

    async mkfile(path: string): Promise<void> {
        await this.#guard('write', path);
        return this.#local.mkfile(path);
    }

    async mkdir(path: string): Promise<void> {
        await this.#guard('mkdir', path);
        return this.#local.mkdir(path, { recursive: true });
    }

    /** Parents of a file write. Authorized as write, same as writefile. */
    async mkdirP(path: string): Promise<void> {
        await this.#guard('write', path);
        return this.#local.mkdirP(path);
    }

    // ── Delete operations ───────────────────────────────────────────

    async rmfile(path: string): Promise<void> {
        await this.#guard('delete', path);
        return this.#local.rmfile(path);
    }

    async rmdir(path: string): Promise<void> {
        await this.#guard('delete', path);
        return this.#local.rmdir(path);
    }

    // ── Move / Copy ─────────────────────────────────────────────────

    async rename(from: string, to: string): Promise<void> {
        await this.#guard('rename', from);
        return this.#local.rename(from, to);
    }

    async copy(from: string, to: string): Promise<void> {
        await this.#guard('copy', from);
        return this.#local.copy(from, to);
    }
}
