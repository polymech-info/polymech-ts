/**
 * VFS ACL — Anonymous user e2e test
 *
 * Verifies that the well-known 'anonymous' userId works through the
 * ACL pipeline: loadVfsSettings populates grants, and isAllowed checks
 * pass/fail correctly for anonymous callers.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings, vfsResource } from '../src/vfs/vfs-acl.js';
import { ANONYMOUS_USER_ID } from '../src/vfs/sanitizers.js';
import type { AclResult } from '../src/interfaces.js';

/** Unwrap AclResult — asserts ok and returns data. */
function d<T>(result: AclResult<T>): T {
    if (!result.ok) throw new Error(`Expected ok, got ${result.code}: ${result.message}`);
    return result.data;
}

const OWNER_ID = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const READ_ONLY_USER = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const STRANGER_USER = '99999999-0000-0000-0000-ffffffffffff';

const ROOT = vfsResource(OWNER_ID, '/');
const SHARED = vfsResource(OWNER_ID, '/shared');

const USER_DIR = resolve(import.meta.dirname!, 'vfs/root/anon-test');

describe('VFS ACL — anonymous user', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());
        const settings = await loadVfsSettings(acl, USER_DIR);
        expect(settings).not.toBeNull();
        expect(settings!.owner).toBe(OWNER_ID);
    });

    // Anonymous gets read+list on /
    it('anonymous can read on /', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, ROOT, 'read'))).toBe(true);
    });

    it('anonymous can list on /', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, ROOT, 'list'))).toBe(true);
    });

    // Direct isAllowed on /shared returns false — the grant is on "/" only.
    // AclVfsClient.#guard walks the resource chain, but raw acl.isAllowed does not.
    it('anonymous direct check on /shared returns false (grant is on /)', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, SHARED, 'read'))).toBe(false);
    });

    // Anonymous CANNOT write
    it('anonymous CANNOT write on /', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, ROOT, 'write'))).toBe(false);
    });

    it('anonymous CANNOT delete on /', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, ROOT, 'delete'))).toBe(false);
    });

    it('anonymous CANNOT mkdir on /', async () => {
        expect(d(await acl.isAllowed(ANONYMOUS_USER_ID, ROOT, 'mkdir'))).toBe(false);
    });

    // Other users still work alongside anonymous
    it('read-only user can still read on /', async () => {
        expect(d(await acl.isAllowed(READ_ONLY_USER, ROOT, 'read'))).toBe(true);
    });

    // Stranger (no grant) is still denied
    it('stranger CANNOT read on /', async () => {
        expect(d(await acl.isAllowed(STRANGER_USER, ROOT, 'read'))).toBe(false);
    });
});
