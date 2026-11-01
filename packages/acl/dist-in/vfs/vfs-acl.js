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
import { pathSegments, normalisePath, cleanGroupName, cleanId, cleanPermissions } from './sanitizers.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Canonical resource name for a path inside a user's VFS folder.
 *
 *   vfsResource('aaa', '/')      → 'vfs:aaa:/'
 *   vfsResource('aaa', '/docs')  → 'vfs:aaa:/docs'
 */
export function vfsResource(ownerId, resourcePath = '/') {
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
export function resourceChain(ownerId, subpath) {
    const segments = pathSegments(subpath);
    const chain = [];
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
export async function loadVfsSettings(acl, userDir) {
    var _a, _b, _c;
    const settingsPath = join(userDir, 'vfs-settings.json');
    if (!existsSync(settingsPath))
        return null;
    const raw = readFileSync(settingsPath, 'utf8').trim();
    if (!raw)
        return null;
    let settings;
    try {
        settings = JSON.parse(raw);
    }
    catch {
        return null;
    }
    // Validate owner
    const safeOwner = cleanId(settings.owner);
    // Helper: unwrap result or throw
    const unwrap = (result) => {
        if (!result.ok)
            throw new Error(result.message);
    };
    // Owner role — full access on entire tree
    const ownerRole = `owner:${safeOwner}`;
    unwrap(await acl.allow(ownerRole, vfsResource(safeOwner, '/'), '*'));
    unwrap(await acl.addUserRoles(safeOwner, ownerRole));
    // Index groups (validate member IDs)
    const groupMembers = new Map();
    for (const group of (_a = settings.groups) !== null && _a !== void 0 ? _a : []) {
        const safeName = cleanGroupName(group.name);
        const safeMembers = group.members.map(m => cleanId(m));
        groupMembers.set(safeName, safeMembers);
    }
    // Process ACL entries
    for (const entry of settings.acl) {
        const resourcePath = normalisePath((_b = entry.path) !== null && _b !== void 0 ? _b : '/');
        const resource = vfsResource(safeOwner, resourcePath);
        const safePerms = cleanPermissions(entry.permissions);
        if (entry.group) {
            // Group grant
            const safeGroup = cleanGroupName(entry.group);
            const groupRole = `group:${safeOwner}:${safeGroup}`;
            unwrap(await acl.allow(groupRole, resource, safePerms));
            const members = (_c = groupMembers.get(safeGroup)) !== null && _c !== void 0 ? _c : [];
            for (const memberId of members) {
                unwrap(await acl.addUserRoles(memberId, groupRole));
            }
        }
        else if (entry.userId) {
            // Direct user grant
            const safeId = cleanId(entry.userId);
            const grantRole = `vfs-grant:${safeOwner}:${safeId}:${resourcePath}`;
            unwrap(await acl.allow(grantRole, resource, safePerms));
            unwrap(await acl.addUserRoles(safeId, grantRole));
        }
    }
    return settings;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzLWFjbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92ZnMvdmZzLWFjbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsT0FBTyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDbkQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVqQyxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFxQixNQUFNLGlCQUFpQixDQUFDO0FBMkI1SCw4RUFBOEU7QUFDOUUsVUFBVTtBQUNWLDhFQUE4RTtBQUU5RTs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBZSxFQUFFLFlBQVksR0FBRyxHQUFHO0lBQzNELE9BQU8sT0FBTyxPQUFPLElBQUksYUFBYSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLE9BQWUsRUFBRSxPQUFlO0lBQzFELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2QyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7SUFFM0IsNkNBQTZDO0lBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFX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