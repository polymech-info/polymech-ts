import type { Acl } from '../Acl.js';
export interface VfsGroup {
    name: string;
    members: string[];
}
export interface VfsAclEntry {
    /** Direct user grant */
    userId?: string;
    /** Group grant */
    group?: string;
    /** Scoped path — defaults to "/" (entire folder). */
    path?: string;
    permissions: string[];
}
export interface VfsSettings {
    owner: string;
    groups?: VfsGroup[];
    acl: VfsAclEntry[];
}
/**
 * Canonical resource name for a path inside a user's VFS folder.
 *
 *   vfsResource('aaa', '/')      → 'vfs:aaa:/'
 *   vfsResource('aaa', '/docs')  → 'vfs:aaa:/docs'
 */
export declare function vfsResource(ownerId: string, resourcePath?: string): string;
/**
 * Build the list of resources to check, from most-specific to root.
 *
 *   resourceChain('aaa', 'docs/sub/file.txt')
 *     → ['vfs:aaa:/docs/sub/file.txt', 'vfs:aaa:/docs/sub', 'vfs:aaa:/docs', 'vfs:aaa:/']
 *
 * The guard walks this chain top-down; if ANY level allows, access is granted.
 */
export declare function resourceChain(ownerId: string, subpath: string): string[];
/**
 * Load `vfs-settings.json` from a user's VFS folder and apply the ACL rules.
 *
 * - The **owner** always gets `*` on `/` (entire tree).
 * - Each ACL entry grants permissions scoped to `entry.path` (default: `/`).
 * - Group entries resolve members from the `groups[]` array.
 */
export declare function loadVfsSettings(acl: Acl, userDir: string): Promise<VfsSettings | null>;
