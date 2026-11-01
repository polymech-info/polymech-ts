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
export function cleanPath(raw: string): string {
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
export function pathSegments(raw: string): string[] {
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
export function normalisePath(raw: string): string {
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
export function cleanPermission(raw: string): string {
    const p = raw.trim().toLowerCase();
    if (!p) throw new Error('Permission name cannot be empty');
    return p;
}

/**
 * Validate and normalise permission arrays.
 */
export function cleanPermissions(raw: string[]): string[] {
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
export function isUuid(value: string): boolean {
    return UUID_RE.test(value.trim());
}

/**
 * Validate and normalise a UUID string (lowercased, trimmed).
 *
 * @throws Error if the value is not a valid UUID.
 */
export function cleanUuid(raw: string): string {
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
export function cleanId(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === ANONYMOUS_USER_ID) return ANONYMOUS_USER_ID;
    if (trimmed === AUTHENTICATED_USER_ID) return AUTHENTICATED_USER_ID;
    return cleanUuid(raw);
}

/**
 * Validate a group name (non-empty, lowercased, no colons).
 *
 * @throws Error if the name is empty or contains reserved characters.
 */
export function cleanGroupName(raw: string): string {
    const name = raw.trim().toLowerCase();
    if (!name) throw new Error('Group name cannot be empty');
    if (name.includes(':')) throw new Error(`Group name cannot contain ':': ${name}`);
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
export function assertNonEmpty(value: string | number | (string | number)[], label: string): void {
    const arr = Array.isArray(value) ? value : [value];
    for (const v of arr) {
        const s = String(v).trim();
        if (!s) throw new Error(`${label} cannot be empty`);
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
} as const;
