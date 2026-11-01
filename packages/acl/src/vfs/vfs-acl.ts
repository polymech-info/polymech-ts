/**
 * VFS ACL Bridge
 *
 * Reads per-user `vfs-settings.json` files and populates an Acl instance
 * with fine-grained, path-scoped permissions for each user's VFS folder.
 *
 * Supports:
 *   - Direct user grants:  { userId, path, permissions }
 *   - Group grants:        { group, path, permissions }
 *
 * Resource naming: `vfs:<ownerId>:<path>` — e.g. `vfs:3bb4cfbf-...:/docs`
 *
 * Permissions: read | write | list | mkdir | delete | rename | copy
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Acl } from '../Acl.js';
import { pathSegments, normalisePath, cleanGroupName, cleanId, cleanPermissions, ANONYMOUS_USER_ID } from './sanitizers.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical resource name for a path inside a user's VFS folder.
 *
 *   vfsResource('aaa', '/')      → 'vfs:aaa:/'
 *   vfsResource('aaa', '/docs')  → 'vfs:aaa:/docs'
 */
export function vfsResource(ownerId: string, resourcePath = '/'): string {
    return `vfs:${ownerId}:${normalisePath(resourcePath)}`;
}

/**
 * Build the list of resources to check, from most-specific to root.
 *
 *   resourceChain('aaa', 'docs/sub/file.txt')
 *     → ['vfs:aaa:/docs/sub/file.txt', 'vfs:aaa:/docs/sub', 'vfs:aaa:/docs', 'vfs:aaa:/']
 *
 * The guard walks this chain top-down; if ANY level allows, access is granted.
 */
export function resourceChain(ownerId: string, subpath: string): string[] {
    const segments = pathSegments(subpath);

    const chain: string[] = [];

    // Build from most-specific to least-specific
    for (let i = segments.length; i > 0; i--) {
        chain.push(vfsResource(ownerId, '/' + segments.slice(0, i).join('/')));
    }

    // Always include root
    chain.push(vfsResource(ownerId, '/'));

    return chain;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Load `vfs-settings.json` from a user's VFS folder and apply the ACL rules.
 *
 * - The **owner** always gets `*` on `/` (entire tree).
 * - Each ACL entry grants permissions scoped to `entry.path` (default: `/`).
 * - Group entries resolve members from the `groups[]` array.
 */
export async function loadVfsSettings(acl: Acl, userDir: string): Promise<VfsSettings | null> {
    const settingsPath = join(userDir, 'vfs-settings.json');
    if (!existsSync(settingsPath)) return null;

    const raw = readFileSync(settingsPath, 'utf8').trim();
    if (!raw) return null;

    let settings: VfsSettings;
    try {
        settings = JSON.parse(raw);
    } catch {
        return null;
    }

    // Validate owner
    const safeOwner = cleanId(settings.owner);

    // Helper: unwrap result or throw
    const unwrap = (result: { ok: boolean; message?: string }): void => {
        if (!result.ok) throw new Error((result as { message: string }).message);
    };

    // Owner role — full access on entire tree
    const ownerRole = `owner:${safeOwner}`;
    unwrap(await acl.allow(ownerRole, vfsResource(safeOwner, '/'), '*'));
    unwrap(await acl.addUserRoles(safeOwner, ownerRole));

    // Index groups (validate member IDs)
    const groupMembers = new Map<string, string[]>();
    for (const group of settings.groups ?? []) {
        const safeName = cleanGroupName(group.name);
        const safeMembers = group.members.map(m => cleanId(m));
        groupMembers.set(safeName, safeMembers);
    }

    // Process ACL entries
    for (const entry of settings.acl) {
        const resourcePath = normalisePath(entry.path ?? '/');
        const resource = vfsResource(safeOwner, resourcePath);
        const safePerms = cleanPermissions(entry.permissions);

        if (entry.group) {
            // Group grant
            const safeGroup = cleanGroupName(entry.group);
            const groupRole = `group:${safeOwner}:${safeGroup}`;
            unwrap(await acl.allow(groupRole, resource, safePerms));

            const members = groupMembers.get(safeGroup) ?? [];
            for (const memberId of members) {
                unwrap(await acl.addUserRoles(memberId, groupRole));
            }
        } else if (entry.userId) {
            // Direct user grant
            const safeId = cleanId(entry.userId);
            const grantRole = `vfs-grant:${safeOwner}:${safeId}:${resourcePath}`;
            unwrap(await acl.allow(grantRole, resource, safePerms));
            unwrap(await acl.addUserRoles(safeId, grantRole));
        }
    }

    return settings;
}
