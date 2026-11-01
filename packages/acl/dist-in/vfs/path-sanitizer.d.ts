/**
 * VFS Path Sanitizer — Defense-in-depth path validation.
 *
 * Combines filename sanitization (illegal chars, Windows reserved names, control chars)
 * with path traversal prevention (encoded traversal, parent directory escape, null bytes,
 * home directory escape, absolute path injection, double-encoding attacks).
 *
 * Usage:
 *   import { sanitizeSubpath, sanitizeFilename } from './path-sanitizer.js';
 *
 *   // For VFS subpaths (relative paths from mount root)
 *   const safe = sanitizeSubpath(userInput); // throws on violation
 *
 *   // For individual filenames
 *   const name = sanitizeFilename(userInput); // strips illegal chars
 */
/**
 * Sanitize and validate a VFS subpath (relative path from mount root).
 * Rejects or strips dangerous patterns. Returns a clean, normalized relative path.
 *
 * Throws EFORBIDDEN on:
 *  - Null bytes
 *  - Double-encoded sequences (%25)
 *  - Home directory escape (~/)
 *  - Absolute paths (/foo, C:\foo)
 *  - Path traversal after full normalization
 */
export declare function sanitizeSubpath(input: string): string;
/**
 * Sanitize every segment of a write-path by stripping unsafe characters and
 * truncating overly long names.
 *
 * **Allowed characters**: `a-z  A-Z  0-9  _  -  (space)`
 *
 * Rules:
 *  - All characters outside the allowlist are stripped.
 *  - Directory segments have dots stripped entirely.
 *  - File segments (last) preserve the **last** dot + extension; extra dots are stripped.
 *  - Each segment is truncated to {@link MAX_SEGMENT_LENGTH} characters.
 *  - When `isDirectory` is true, ALL segments are treated as directories (no dots).
 *
 * Call this AFTER sanitizeSubpath — operates on the already-cleaned relative path.
 * Returns the sanitized path (may differ from input).
 */
export declare function sanitizeWritePath(subpath: string, opts?: {
    isDirectory?: boolean;
}): string;
/**
 * Sanitize a single filename (not a path — no slashes allowed).
 * Strips illegal characters, control characters, Windows reserved names.
 * Returns the sanitized filename, truncated to 255 bytes.
 */
export declare function sanitizeFilename(input: string, replacement?: string): string;
