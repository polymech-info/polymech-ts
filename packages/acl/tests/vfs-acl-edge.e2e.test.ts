/**
 * VFS ACL — Edge cases
 *
 * Fixture: tests/vfs/root/edge-cases/vfs-settings.json
 *
 *   1. Empty group  — "empty-group" has members: [] → full on /shared
 *      Nobody should get access, but the loader must not crash.
 *
 *   2. Undefined group ref — "ghost-group" is referenced in ACL
 *      but NOT defined in groups[]. Loader should handle gracefully.
 *
 *   3. Multi-group user — user "aaa" is in both "multi-a" and "multi-b".
 *      "multi-a" grants read+list on /shared.
 *      "multi-b" grants write+mkdir on /shared and read+list on /docs.
 *      User should get the UNION: read+list+write+mkdir on /shared AND read+list on /docs.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings, vfsResource } from '../src/vfs/vfs-acl.js';
import { AclVfsClient } from '../src/vfs/AclVfsClient.js';
import type { AclResult } from '../src/interfaces.js';

/** Unwrap AclResult — asserts ok and returns data. */
function d<T>(result: AclResult<T>): T {
    if (!result.ok) throw new Error(`Expected ok, got ${result.code}: ${result.message}`);
    return result.data;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWNER = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const USER_A = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb'; // in multi-a + multi-b
const NOBODY = '99999999-0000-0000-0000-ffffffffffff';

const USER_DIR = resolve(import.meta.dirname!, 'vfs/root/edge-cases');
const SANDBOX = '_edge_sandbox';

const SHARED = vfsResource(OWNER, '/shared');
const DOCS = vfsResource(OWNER, '/docs');

function client(acl: Acl, callerId: string): AclVfsClient {
    return new AclVfsClient(acl, OWNER, callerId, { root: USER_DIR });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VFS ACL — edge cases', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());

        // Create folder structure + seed files
        for (const sub of ['shared', 'docs']) {
            mkdirSync(join(USER_DIR, sub, SANDBOX), { recursive: true });
        }
        writeFileSync(join(USER_DIR, 'shared', 'data.txt'), 'shared');
        writeFileSync(join(USER_DIR, 'docs', 'readme.txt'), 'docs');

        await loadVfsSettings(acl, USER_DIR);
    });

    afterAll(() => {
        for (const sub of ['shared', 'docs']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (existsSync(p)) rmSync(p, { recursive: true, force: true });
        }
        for (const f of ['shared/data.txt', 'docs/readme.txt']) {
            const p = join(USER_DIR, f);
            if (existsSync(p)) rmSync(p);
        }
    });

    // =================================================================
    // 1. Empty group — members: []
    // =================================================================

    describe('empty group — nobody gets access', () => {
        it('loader does not crash', () => {
            // If we got here, loadVfsSettings succeeded
            expect(true).toBe(true);
        });

        it('stranger has no access to /shared (despite empty group having full perms)', async () => {
            expect(d(await acl.isAllowed(NOBODY, SHARED, 'read'))).toBe(false);
            expect(d(await acl.isAllowed(NOBODY, SHARED, 'write'))).toBe(false);
        });

        it('stranger cannot list /shared via client', async () => {
            const c = client(acl, NOBODY);
            await expect(c.readdir('shared')).rejects.toThrow('EACCES');
        });
    });

    // =================================================================
    // 2. Undefined group ref — "ghost-group" not in groups[]
    // =================================================================

    describe('undefined group ref — graceful handling', () => {
        it('loader does not crash on unknown group name', () => {
            expect(true).toBe(true);
        });

        it('nobody gets the ghost-group permissions on /docs', async () => {
            // The ghost-group granted read+list on /docs, but has no members
            expect(d(await acl.isAllowed(NOBODY, DOCS, 'read'))).toBe(false);
        });
    });

    // =================================================================
    // 3. Multi-group user — permissions merge
    // =================================================================

    describe('multi-group user (aaa) — permissions merge across groups', () => {
        // From multi-a: read + list on /shared
        // From multi-b: write + mkdir on /shared, read + list on /docs

        it('has read on /shared (from multi-a)', async () => {
            expect(d(await acl.isAllowed(USER_A, SHARED, 'read'))).toBe(true);
        });

        it('has list on /shared (from multi-a)', async () => {
            expect(d(await acl.isAllowed(USER_A, SHARED, 'list'))).toBe(true);
        });

        it('has write on /shared (from multi-b)', async () => {
            expect(d(await acl.isAllowed(USER_A, SHARED, 'write'))).toBe(true);
        });

        it('has mkdir on /shared (from multi-b)', async () => {
            expect(d(await acl.isAllowed(USER_A, SHARED, 'mkdir'))).toBe(true);
        });

        it('does NOT have delete on /shared (neither group grants it)', async () => {
            expect(d(await acl.isAllowed(USER_A, SHARED, 'delete'))).toBe(false);
        });

        it('has read+list on /docs (from multi-b)', async () => {
            expect(d(await acl.isAllowed(USER_A, DOCS, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(USER_A, DOCS, 'list'))).toBe(true);
        });

        it('does NOT have write on /docs', async () => {
            expect(d(await acl.isAllowed(USER_A, DOCS, 'write'))).toBe(false);
        });

        // Real FS ops
        it('can list /shared via client', async () => {
            const c = client(acl, USER_A);
            const entries = await c.readdir('shared');
            expect(entries.map(e => e.name)).toContain('data.txt');
        });

        it('can write in /shared via client', async () => {
            const c = client(acl, USER_A);
            await c.writefile(`shared/${SANDBOX}/merged.txt`, 'from both groups');
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'merged.txt'))).toBe(true);
        });

        it('can mkdir in /shared via client', async () => {
            const c = client(acl, USER_A);
            await c.mkdir(`shared/${SANDBOX}/merged-dir`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'merged-dir'))).toBe(true);
        });

        it('CANNOT delete in /shared via client', async () => {
            const c = client(acl, USER_A);
            await expect(c.rmfile(`shared/${SANDBOX}/merged.txt`)).rejects.toThrow('EACCES');
        });

        it('can list /docs via client', async () => {
            const c = client(acl, USER_A);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('CANNOT write in /docs via client', async () => {
            const c = client(acl, USER_A);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });
    });
});
