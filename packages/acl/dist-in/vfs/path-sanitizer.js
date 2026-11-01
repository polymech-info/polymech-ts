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
import { normalize } from 'path';
// --- Filename sanitization regexes ---
/** Characters illegal in filenames on most filesystems */
const ILLEGAL_CHARS_RE = /[/?<>\\:*|"]/g;
/** ASCII/Unicode control characters */
const CONTROL_CHARS_RE = /[\x00-\x1f\x80-\x9f]/g;
/** Reserved filenames: just dots (., .., ...) */
const RESERVED_DOTS_RE = /^\.+$/;
/** Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9) */
const WINDOWS_RESERVED_RE = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
/** Windows trailing dots/spaces (not allowed) */
const WINDOWS_TRAILING_RE = /[. ]+$/;
// --- Path traversal regexes ---
/** Encoded traversal sequences to decode before checking */
const DECODE_PATTERNS = [
    { regex: /%2e/gi, replacement: '.' },
    { regex: /%2f/gi, replacement: '/' },
    { regex: /%5c/gi, replacement: '\\' },
];
/** Parent directory traversal: /../, \..\, or standalone .. */
const PARENT_DIR_RE = /[/\\]\.\.[/\\]/g;
/** Characters not allowed in VFS paths */
const NOT_ALLOWED_RE = /[:$!'"`+|=]/g;
// --- Error helper ---
function forbidden(reason) {
    const err = new Error(`EFORBIDDEN: ${reason}`);
    err.code = 'EFORBIDDEN';
    throw err;
}
// --- Public API ---
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
export function sanitizeSubpath(input) {
    if (typeof input !== 'string') {
        forbidden('input must be a string');
    }
    // 0. Empty path is valid (root directory)
    if (!input || input.trim() === '')
        return '';
    // ── TAMPER DETECTION (reject immediately) ──────────────────────
    // 1. Reject null bytes immediately
    if (input.includes('\0')) {
        forbidden('null byte in path');
    }
    // 2. Reject double-encoded sequences (%25 = encoded %)
    if (/%25/i.test(input)) {
        forbidden('double-encoded path segment');
    }
    // 3. Reject home directory escape
    if (input.startsWith('~/') || input === '~') {
        forbidden('home directory access denied');
    }
    // 4. Decode traversal-encoded sequences to inspect the real intent
    let decoded = input;
    for (const { regex, replacement } of DECODE_PATTERNS) {
        decoded = decoded.replace(regex, replacement);
    }
    // 5. Strip not-allowed characters (=, $, etc.) to reveal hidden traversal
    //    e.g. ..=%5c → ..=\ → after strip = → ..\ → traversal!
    const stripped = decoded.replace(NOT_ALLOWED_RE, '');
    // 6. Normalize backslashes to forward slashes for uniform detection
    const normalized = stripped.replace(/[\\]/g, '/');
    // 7. DETECT TRAVERSAL — any ".." segment in the fully-decoded/stripped path
    //    is a tampering attempt, regardless of encoding tricks
    if (PARENT_DIR_RE.test(normalized + '/') || // /../ mid-path
        normalized.startsWith('../') || // ../ at start
        normalized === '..' || // bare ..
        normalized.endsWith('/..') || // /.. at end
        /\/\.\.\//g.test('/' + normalized + '/')) { // catch-all
        forbidden('path traversal');
    }
    // 8. Strip leading slashes (common from URL path extraction, not an attack)
    const cleaned = normalized.replace(/^\/+/, '');
    // 9. Reject absolute paths (Windows drive letters like C:\)
    if (/^[a-zA-Z]:/.test(cleaned)) {
        forbidden('absolute path');
    }
    // ── NORMALIZATION (clean paths only reach here) ────────────────
    let sanitized = cleaned;
    // 10. Collapse multiple slashes
    sanitized = sanitized.replace(/\/+/g, '/');
    // 10. Use path.normalize for OS-level normalization
    sanitized = normalize(sanitized);
    // 11. Backslash-to-forward-slash (Windows normalize may re-introduce)
    sanitized = sanitized.replace(/[\\]/g, '/');
    // 12. Strip leading/trailing slashes (must be relative)
    sanitized = sanitized.replace(/^\/+/, '').replace(/\/+$/, '');
    // 13. Handle "." result (root directory reference)
    sanitized = sanitized === '.' ? '' : sanitized;
    // 14. FINAL GUARD — if any ".." segments survived, reject
    const segments = sanitized.split('/');
    if (segments.some(s => s === '..')) {
        forbidden('path traversal survived normalization');
    }
    return sanitized;
}
// --- Write-operation name sanitization ---
/** Strip everything except alphanumeric, hyphens, underscores, spaces, @ */
const UNSAFE_CHARS_RE = /[^a-zA-Z0-9_\- @]/g;
/** Max length for a single path segment (leaves room within Windows 260-char path limit) */
const MAX_SEGMENT_LENGTH = 200;
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
export function sanitizeWritePath(subpath, opts) {
    var _a;
    if (!subpath)
        return '';
    const segments = subpath.split('/');
    const allDirs = (_a = opts === null || opts === void 0 ? void 0 : opts.isDirectory) !== null && _a !== void 0 ? _a : false;
    const cleaned = [];
    for (let i = 0; i < segments.length; i++) {
        let seg = segments[i];
        if (!seg)
            continue;
        const isLast = i === segments.length - 1;
        if (isLast && !allDirs) {
            // --- File segment: preserve last extension ---
            const lastDot = seg.lastIndexOf('.');
            if (lastDot > 0) {
                const name = seg.substring(0, lastDot).replace(UNSAFE_CHARS_RE, '').replace(/\./g, '');
                const ext = seg.substring(lastDot + 1).replace(UNSAFE_CHARS_RE, '');
                seg = ext ? `${name}.${ext}` : name;
            }
            else {
                seg = seg.replace(UNSAFE_CHARS_RE, '');
            }
        }
        else {
            // --- Directory segment: strip dots AND unsafe chars ---
            seg = seg.replace(UNSAFE_CHARS_RE, '').replace(/\./g, '');
        }
        // Trim leading/trailing whitespace
        seg = seg.trim();
        // Truncate to max length
        if (seg.length > MAX_SEGMENT_LENGTH) {
            seg = seg.substring(0, MAX_SEGMENT_LENGTH).trim();
        }
        // Skip empty segments (result of stripping all chars)
        if (seg)
            cleaned.push(seg);
    }
    return cleaned.join('/');
}
/**
 * Sanitize a single filename (not a path — no slashes allowed).
 * Strips illegal characters, control characters, Windows reserved names.
 * Returns the sanitized filename, truncated to 255 bytes.
 */
export function sanitizeFilename(input, replacement = '') {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    let sanitized = input
        .replace(ILLEGAL_CHARS_RE, replacement)
        .replace(CONTROL_CHARS_RE, replacement)
        .replace(RESERVED_DOTS_RE, replacement)
        .replace(WINDOWS_RESERVED_RE, replacement)
        .replace(WINDOWS_TRAILING_RE, replacement);
    // Truncate to 255 bytes (UTF-8 safe)
    const encoder = new TextEncoder();
    const encoded = encoder.encode(sanitized);
    if (encoded.length > 255) {
        const decoder = new TextDecoder();
        sanitized = decoder.decode(encoded.slice(0, 255));
        // Remove any truncated multi-byte char fragments
        sanitized = sanitized.replace(/\uFFFD$/, '');
    }
    return sanitized;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC1zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdmZzL3BhdGgtc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUVILE9BQU8sRUFBRSxTQUFTLEVBQVEsTUFBTSxNQUFNLENBQUM7QUFFdkMsd0NBQXdDO0FBRXhDLDBEQUEwRDtBQUMxRCxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztBQUV6Qyx1Q0FBdUM7QUFDdkMsTUFBTSxnQkFBZ0IsR0FBRyx1QkFBdUIsQ0FBQztBQUVqRCxpREFBaUQ7QUFDakQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7QUFFakMseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsK0NBQStDLENBQUM7QUFFNUUsaURBQWlEO0FBQ2pELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDO0FBRXJDLGlDQUFpQztBQUVqQyw0REFBNEQ7QUFDNUQsTUFBTSxlQUFlLEdBQUc7SUFDcEIsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7SUFDcEMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7SUFDcEMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUU7Q0FDeEMsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCxNQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQztBQUV4QywwQ0FBMEM7QUFDMUMsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDO0FBRXRDLHVCQUF1QjtBQUV2QixTQUFTLFNBQVMsQ0FBQyxNQUFjO0lBQzdCLE1BQU0sR0FBRyxHQUFRLElBQUksS0FBSyxDQUFDLGVBQWUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNwRCxHQUFHLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztJQUN4QixNQUFNLEdBQUcsQ0FBQztBQUNkLENB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