/**
 * Default input sanitizers for ACL.
 *
 * Reusable, pure functions — no side effects, no I/O.
 * Exported as the `DefaultSanitizers` namespace for convenient access.
 *
 * Used by:
 *   - Core Acl class (assertNonEmpty)
 *   - VFS ACL bridge (cleanUuid, cleanGroupName, normalisePath, cleanPermissions)
 *   - AclVfsClient / DecoratedVfsClient (cleanUuid, sanitizeSubpath)
 */
/**
 * Normalise a subpath for VFS use.
 *
 *   - Converts backslashes to forward slashes
 *   - Strips leading and trailing slashes
 *   - Collapses consecutive slashes
 *
 * @example cleanPath('\\docs\\sub/')  → 'docs/sub'
 * @example cleanPath('/')            → ''
 * @example cleanPath('')             → ''
 */
export function cleanPath(raw) {
    return raw
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');
}
/**
 * Split a cleaned path into individual segments.
 *
 * @example pathSegments('docs/sub/file.txt')  → ['docs', 'sub', 'file.txt']
 * @example pathSegments('')                    → []
 */
export function pathSegments(raw) {
    const clean = cleanPath(raw);
    return clean ? clean.split('/') : [];
}
/**
 * Normalise a path into its absolute VFS form (leading slash, no trailing).
 *
 * @example normalisePath('docs/sub/')   → '/docs/sub'
 * @example normalisePath('')            → '/'
 * @example normalisePath('\\a\\b')      → '/a/b'
 */
export function normalisePath(raw) {
    const clean = cleanPath(raw);
    return clean ? `/${clean}` : '/';
}
/**
 * Validate and normalise a permission name.
 *
 *  - Lowercased
 *  - Trimmed
 *  - Rejects empty strings
 *
 * @throws Error if the permission is empty after trimming.
 */
export function cleanPermission(raw) {
    const p = raw.trim().toLowerCase();
    if (!p)
        throw new Error('Permission name cannot be empty');
    return p;
}
/**
 * Validate and normalise permission arrays.
 */
export function cleanPermissions(raw) {
    return raw.map(cleanPermission);
}
// ---------------------------------------------------------------------------
// Well-known sentinel IDs
// ---------------------------------------------------------------------------
/** Sentinel userId for unauthenticated/anonymous access. */
export const ANONYMOUS_USER_ID = 'anonymous';
/** Sentinel userId for any authenticated user. */
export const AUTHENTICATED_USER_ID = 'authenticated';
// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------
/** Standard UUID v1–v5 pattern (case-insensitive, lowercased on output). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Test whether a string is a valid UUID.
 *
 * @example isUuid('3bb4cfbf-318b-44d3-a9d3-35680e738421') → true
 * @example isUuid('not-a-uuid')                            → false
 */
export function isUuid(value) {
    return UUID_RE.test(value.trim());
}
/**
 * Validate and normalise a UUID string (lowercased, trimmed).
 *
 * @throws Error if the value is not a valid UUID.
 */
export function cleanUuid(raw) {
    const id = raw.trim().toLowerCase();
    if (!UUID_RE.test(id)) {
        throw new Error(`Invalid UUID: '${raw}'`);
    }
    return id;
}
/**
 * Validate a user/owner identifier — must be a valid UUID or the
 * well-known `'anonymous'` sentinel.
 *
 * @throws Error if the identifier is not a valid UUID or 'anonymous'.
 */
export function cleanId(raw) {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === ANONYMOUS_USER_ID)
        return ANONYMOUS_USER_ID;
    if (trimmed === AUTHENTICATED_USER_ID)
        return AUTHENTICATED_USER_ID;
    return cleanUuid(raw);
}
/**
 * Validate a group name (non-empty, lowercased, no colons).
 *
 * @throws Error if the name is empty or contains reserved characters.
 */
export function cleanGroupName(raw) {
    const name = raw.trim().toLowerCase();
    if (!name)
        throw new Error('Group name cannot be empty');
    if (name.includes(':'))
        throw new Error(`Group name cannot contain ':': ${name}`);
    return name;
}
// ---------------------------------------------------------------------------
// Generic assertions (used by core Acl)
// ---------------------------------------------------------------------------
/**
 * Reject empty/whitespace-only identifiers.
 * Works with single values or arrays of values (string | number).
 *
 * @throws Error with a descriptive label if any value is empty.
 *
 * @example assertNonEmpty('admin', 'Role')       // ok
 * @example assertNonEmpty('', 'Role')             // throws "Role cannot be empty"
 * @example assertNonEmpty(['a', ''], 'Role')      // throws "Role cannot be empty"
 */
export function assertNonEmpty(value, label) {
    const arr = Array.isArray(value) ? value : [value];
    for (const v of arr) {
        const s = String(v).trim();
        if (!s)
            throw new Error(`${label} cannot be empty`);
    }
}
// ---------------------------------------------------------------------------
// Re-export path-sanitizer functions for unified access
// ---------------------------------------------------------------------------
export { sanitizeSubpath, sanitizeWritePath, sanitizeFilename } from './path-sanitizer.js';
// ---------------------------------------------------------------------------
// Namespace re-export for convenience
// ---------------------------------------------------------------------------
import { sanitizeSubpath, sanitizeWritePath, sanitizeFilename } from './path-sanitizer.js';
export const DefaultSanitizers = {
    assertNonEmpty,
    cleanPath,
    pathSegments,
    normalisePath,
    cleanPermission,
    cleanPermissions,
    isUuid,
    cleanUuid,
    cleanId,
    cleanGroupName,
    sanitizeSubpath,
    sanitizeWritePath,
    sanitizeFilename,
    ANONYMOUS_USER_ID,
    AUTHENTICATED_USER_ID,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92ZnMvc2FuaXRpemVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztHQVVHO0FBRUg7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsR0FBVztJQUNqQyxPQUFPLEdBQUc7U0FDTCxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQztTQUNuQixPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztTQUNwQixPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztTQUNuQixPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsR0FBVztJQUNwQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFXO0lBQ3JDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsR0FBVztJQUN2QyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbkMsSUFBSSxDQUFDLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDM0QsT0FB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