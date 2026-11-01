/**
 * VFS ACL — End-to-end test (permission-boundary checks)
 *
 * Verifies raw ACL permission checks against path-scoped resources.
 *
 * Uses the real vfs-settings.json fixture under tests/vfs/root/<ownerId>/:
 *   - Owner  → wildcard on "/" (entire tree)
 *   - User aaa → read+list on "/" (global)
 *   - User ccc → read+write+list+mkdir+delete on "/shared"
 *   - User ccc → read+list on "/docs"
 *   - Stranger → nothing
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings, vfsResource } from '../src/vfs/vfs-acl.js';
import type { AclResult } from '../src/interfaces.js';

/** Unwrap AclResult — asserts ok and returns data. */
function d<T>(result: AclResult<T>): T {
    if (!result.ok) throw new Error(`Expected ok, got ${result.code}: ${result.message}`);
    return result.data;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWNER_ID = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const READ_ONLY_USER = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const FULL_GRANT_USER = 'cccccccc-4444-5555-6666-dddddddddddd';
const STRANGER_USER = '99999999-0000-0000-0000-ffffffffffff';

// Path-scoped resources
const ROOT = vfsResource(OWNER_ID, '/');
const SHARED = vfsResource(OWNER_ID, '/shared');
const DOCS = vfsResource(OWNER_ID, '/docs');
const PRIVATE = vfsResource(OWNER_ID, '/private');

const USER_DIR = resolve(import.meta.dirname!, 'vfs/root', OWNER_ID);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VFS ACL — e2e', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());
        const settings = await loadVfsSettings(acl, USER_DIR);
        expect(settings).not.toBeNull();
        expect(settings!.owner).toBe(OWNER_ID);
    });

    // =====================================================================
    // Owner — wildcard on "/" → full access on every resource
    // =====================================================================

    describe(`owner (${OWNER_ID})`, () => {
        it('can do anything on /', async () => {
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'write'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'list'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'mkdir'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'delete'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'rename'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER_ID, ROOT, 'copy'))).toBe(true);
        });
    });

    // =====================================================================
    // Read-only user — read + list on "/" (global)
    // =====================================================================

    describe(`read-only user (${READ_ONLY_USER})`, () => {
        it('can read on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'read'))).toBe(true);
        });

        it('can list on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'list'))).toBe(true);
        });

        it('CANNOT write on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'write'))).toBe(false);
        });

        it('CANNOT mkdir on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'mkdir'))).toBe(false);
        });

        it('CANNOT delete on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'delete'))).toBe(false);
        });

        it('CANNOT rename on /', async () => {
            expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'rename'))).toBe(false);
        });
    });

    // =====================================================================
    // Full-grant user — per-path grants
    //   /shared → read, write, list, mkdir, delete
    //   /docs   → read, list
    //   /       → nothing
    // =====================================================================

    describe(`full-grant user (${FULL_GRANT_USER})`, () => {
        it('can read on /shared', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'read'))).toBe(true);
        });

        it('can write on /shared', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'write'))).toBe(true);
        });

        it('can list on /shared', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'list'))).toBe(true);
        });

        it('can mkdir on /shared', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'mkdir'))).toBe(true);
        });

        it('can delete on /shared', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'delete'))).toBe(true);
        });

        it('CANNOT rename on /shared (not granted)', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'rename'))).toBe(false);
        });

        it('CANNOT copy on /shared (not granted)', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, SHARED, 'copy'))).toBe(false);
        });

        // /docs — read + list only

        it('can read on /docs', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, DOCS, 'read'))).toBe(true);
        });

        it('can list on /docs', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, DOCS, 'list'))).toBe(true);
        });

        it('CANNOT write on /docs', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, DOCS, 'write'))).toBe(false);
        });

        // /private — no grant at all

        it('CANNOT read on /private', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, PRIVATE, 'read'))).toBe(false);
        });

        it('CANNOT list on /private', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, PRIVATE, 'list'))).toBe(false);
        });

        // root "/" — no grant

        it('CANNOT read on / (no root grant)', async () => {
            expect(d(await acl.isAllowed(FULL_GRANT_USER, ROOT, 'read'))).toBe(false);
        });
    });

    // =====================================================================
    // Stranger — no access at all
    // =====================================================================

    describe(`stranger (${STRANGER_USER})`, () => {
        for (const res of [ROOT, SHARED, DOCS, PRIVATE]) {
            it(`CANNOT read on ${res}`, async () => {
                expect(d(await acl.isAllowed(STRANGER_USER, res, 'read'))).toBe(false);
            });
        }

        it('CANNOT write on /shared', async () => {
            expect(d(await acl.isAllowed(STRANGER_USER, SHARED, 'write'))).toBe(false);
        });

        it('CANNOT list on /docs', async () => {
            expect(d(await acl.isAllowed(STRANGER_USER, DOCS, 'list'))).toBe(false);
        });
    });
});
