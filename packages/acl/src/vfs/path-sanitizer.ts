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

import { normalize, join } from 'path';

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

function forbidden(reason: string): never {
    const err: any = new Error(`EFORBIDDEN: ${reason}`);
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
export function sanitizeSubpath(input: string): string {
    if (typeof input !== 'string') {
        forbidden('input must be a string');
    }

    // 0. Empty path is valid (root directory)
    if (!input || input.trim() === '') return '';

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
    if (PARENT_DIR_RE.test(normalized + '/') ||          // /../ mid-path
        normalized.startsWith('../') ||                   // ../ at start
        normalized === '..' ||                            // bare ..
        normalized.endsWith('/..') ||                     // /.. at end
        /\/\.\.\//g.test('/' + normalized + '/')) {       // catch-all
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
export function sanitizeWritePath(subpath: string, opts?: { isDirectory?: boolean }): string {
    if (!subpath) return '';

    const segments = subpath.split('/');
    const allDirs = opts?.isDirectory ?? false;
    const cleaned: string[] = [];

    for (let i = 0; i < segments.length; i++) {
        let seg = segments[i];
        if (!seg) continue;

        const isLast = i === segments.length - 1;

        if (isLast && !allDirs) {
            // --- File segment: preserve last extension ---
            const lastDot = seg.lastIndexOf('.');
            if (lastDot > 0) {
                const name = seg.substring(0, lastDot).replace(UNSAFE_CHARS_RE, '').replace(/\./g, '');
                const ext = seg.substring(lastDot + 1).replace(UNSAFE_CHARS_RE, '');
                seg = ext ? `${name}.${ext}` : name;
            } else {
                seg = seg.replace(UNSAFE_CHARS_RE, '');
            }
        } else {
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
        if (seg) cleaned.push(seg);
    }

    return cleaned.join('/');
}

/**
 * Sanitize a single filename (not a path — no slashes allowed).
 * Strips illegal characters, control characters, Windows reserved names.
 * Returns the sanitized filename, truncated to 255 bytes.
 */
export function sanitizeFilename(input: string, replacement = ''): string {
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
