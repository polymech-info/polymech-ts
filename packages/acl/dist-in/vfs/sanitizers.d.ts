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
export declare function cleanPath(raw: string): string;
/**
 * Split a cleaned path into individual segments.
 *
 * @example pathSegments('docs/sub/file.txt')  → ['docs', 'sub', 'file.txt']
 * @example pathSegments('')                    → []
 */
export declare function pathSegments(raw: string): string[];
/**
 * Normalise a path into its absolute VFS form (leading slash, no trailing).
 *
 * @example normalisePath('docs/sub/')   → '/docs/sub'
 * @example normalisePath('')            → '/'
 * @example normalisePath('\\a\\b')      → '/a/b'
 */
export declare function normalisePath(raw: string): string;
/**
 * Validate and normalise a permission name.
 *
 *  - Lowercased
 *  - Trimmed
 *  - Rejects empty strings
 *
 * @throws Error if the permission is empty after trimming.
 */
export declare function cleanPermission(raw: string): string;
/**
 * Validate and normalise permission arrays.
 */
export declare function cleanPermissions(raw: string[]): string[];
/** Sentinel userId for unauthenticated/anonymous access. */
export declare const ANONYMOUS_USER_ID = "anonymous";
/** Sentinel userId for any authenticated user. */
export declare const AUTHENTICATED_USER_ID = "authenticated";
/**
 * Test whether a string is a valid UUID.
 *
 * @example isUuid('3bb4cfbf-318b-44d3-a9d3-35680e738421') → true
 * @example isUuid('not-a-uuid')                            → false
 */
export declare function isUuid(value: string): boolean;
/**
 * Validate and normalise a UUID string (lowercased, trimmed).
 *
 * @throws Error if the value is not a valid UUID.
 */
export declare function cleanUuid(raw: string): string;
/**
 * Validate a user/owner identifier — must be a valid UUID or the
 * well-known `'anonymous'` sentinel.
 *
 * @throws Error if the identifier is not a valid UUID or 'anonymous'.
 */
export declare function cleanId(raw: string): string;
/**
 * Validate a group name (non-empty, lowercased, no colons).
 *
 * @throws Error if the name is empty or contains reserved characters.
 */
export declare function cleanGroupName(raw: string): string;
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
export declare function assertNonEmpty(value: string | number | (string | number)[], label: string): void;
export { sanitizeSubpath, sanitizeWritePath, sanitizeFilename } from './path-sanitizer.js';
import { sanitizeSubpath, sanitizeWritePath, sanitizeFilename } from './path-sanitizer.js';
export declare const DefaultSanitizers: {
    readonly assertNonEmpty: typeof assertNonEmpty;
    readonly cleanPath: typeof cleanPath;
    readonly pathSegments: typeof pathSegments;
    readonly normalisePath: typeof normalisePath;
    readonly cleanPermission: typeof cleanPermission;
    readonly cleanPermissions: typeof cleanPermissions;
    readonly isUuid: typeof isUuid;
    readonly cleanUuid: typeof cleanUuid;
    readonly cleanId: typeof cleanId;
    readonly cleanGroupName: typeof cleanGroupName;
    readonly sanitizeSubpath: typeof sanitizeSubpath;
    readonly sanitizeWritePath: typeof sanitizeWritePath;
    readonly sanitizeFilename: typeof sanitizeFilename;
    readonly ANONYMOUS_USER_ID: "anonymous";
    readonly AUTHENTICATED_USER_ID: "authenticated";
};
