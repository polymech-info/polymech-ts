/**
 * VFS ACL — Groups e2e test
 *
 * Fixture: tests/vfs/root/groups-test/vfs-settings.json
 *
 *   Groups:
 *     "team"    → [aaa, ccc]
 *     "viewers" → [ddd, fff]
 *
 *   ACL:
 *     group:"team"    → /shared  → read, write, list, mkdir, delete
 *     group:"team"    → /docs    → read, list
 *     group:"viewers" → /docs    → read, list
 *     userId: fff     → /shared  → read, list  (direct override for one viewer)
 *
 *   Expected:
 *     - aaa (team member): full on /shared, read on /docs, nothing on /private
 *     - ccc (team member): same as aaa
 *     - ddd (viewer only): read /docs, nothing on /shared, nothing on /private
 *     - fff (viewer + direct): read /docs, read+list /shared (via direct), nothing on /private
 *     - stranger: nothing anywhere
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
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
const TEAM_A = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const TEAM_C = 'cccccccc-4444-5555-6666-dddddddddddd';
const VIEW_D = 'dddddddd-7777-8888-9999-eeeeeeeeeeee';
const VIEW_F = 'ffffffff-aaaa-bbbb-cccc-111111111111'; // also has direct grant
const NOBODY = '99999999-0000-0000-0000-ffffffffffff';

const USER_DIR = resolve(import.meta.dirname!, 'vfs/root/groups-test');
const SANDBOX = '_group_sandbox';

function client(acl: Acl, callerId: string): AclVfsClient {
    return new AclVfsClient(acl, OWNER, callerId, { root: USER_DIR });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VFS ACL — Groups e2e', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());

        // Create folder structure
        for (const sub of ['shared', 'docs', 'private']) {
            mkdirSync(join(USER_DIR, sub, SANDBOX), { recursive: true });
        }

        // Seed files
        const fs = await import('node:fs');
        fs.writeFileSync(join(USER_DIR, 'docs', 'readme.txt'), 'hello docs');
        fs.writeFileSync(join(USER_DIR, 'shared', 'data.txt'), 'shared data');
        fs.writeFileSync(join(USER_DIR, 'private', 'secret.txt'), 'top secret');

        await loadVfsSettings(acl, USER_DIR);
    });

    afterAll(() => {
        for (const sub of ['shared', 'docs', 'private']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (existsSync(p)) rmSync(p, { recursive: true, force: true });
        }
        // Clean seeded files
        for (const f of ['docs/readme.txt', 'shared/data.txt', 'private/secret.txt']) {
            const p = join(USER_DIR, f);
            if (existsSync(p)) rmSync(p);
        }
    });

    // =================================================================
    // Raw ACL checks (permission boundary)
    // =================================================================

    describe('raw ACL checks', () => {
        const SHARED = vfsResource(OWNER, '/shared');
        const DOCS = vfsResource(OWNER, '/docs');
        const PRIVATE = vfsResource(OWNER, '/private');
        const ROOT = vfsResource(OWNER, '/');

        it('owner has wildcard on everything', async () => {
            expect(d(await acl.isAllowed(OWNER, ROOT, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER, ROOT, 'write'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER, ROOT, 'delete'))).toBe(true);
            expect(d(await acl.isAllowed(OWNER, ROOT, 'some-future-perm'))).toBe(true);
        });

        it('team member (aaa) — full on /shared', async () => {
            expect(d(await acl.isAllowed(TEAM_A, SHARED, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, SHARED, 'write'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, SHARED, 'list'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, SHARED, 'mkdir'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, SHARED, 'delete'))).toBe(true);
        });

        it('team member (aaa) — read+list on /docs', async () => {
            expect(d(await acl.isAllowed(TEAM_A, DOCS, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, DOCS, 'list'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_A, DOCS, 'write'))).toBe(false);
        });

        it('team member (aaa) — no access to /private', async () => {
            expect(d(await acl.isAllowed(TEAM_A, PRIVATE, 'read'))).toBe(false);
        });

        it('team member (ccc) — same as aaa', async () => {
            expect(d(await acl.isAllowed(TEAM_C, SHARED, 'write'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_C, DOCS, 'list'))).toBe(true);
            expect(d(await acl.isAllowed(TEAM_C, PRIVATE, 'read'))).toBe(false);
        });

        it('viewer (ddd) — read+list on /docs only', async () => {
            expect(d(await acl.isAllowed(VIEW_D, DOCS, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(VIEW_D, DOCS, 'list'))).toBe(true);
            expect(d(await acl.isAllowed(VIEW_D, DOCS, 'write'))).toBe(false);
            expect(d(await acl.isAllowed(VIEW_D, SHARED, 'read'))).toBe(false);
            expect(d(await acl.isAllowed(VIEW_D, PRIVATE, 'read'))).toBe(false);
        });

        it('viewer+direct (fff) — read /docs via group + read+list /shared via direct', async () => {
            // From viewers group
            expect(d(await acl.isAllowed(VIEW_F, DOCS, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(VIEW_F, DOCS, 'list'))).toBe(true);
            // From direct grant
            expect(d(await acl.isAllowed(VIEW_F, SHARED, 'read'))).toBe(true);
            expect(d(await acl.isAllowed(VIEW_F, SHARED, 'list'))).toBe(true);
            // Not granted
            expect(d(await acl.isAllowed(VIEW_F, SHARED, 'write'))).toBe(false);
            expect(d(await acl.isAllowed(VIEW_F, PRIVATE, 'read'))).toBe(false);
        });

        it('stranger — nothing anywhere', async () => {
            expect(d(await acl.isAllowed(NOBODY, SHARED, 'read'))).toBe(false);
            expect(d(await acl.isAllowed(NOBODY, DOCS, 'list'))).toBe(false);
            expect(d(await acl.isAllowed(NOBODY, PRIVATE, 'read'))).toBe(false);
            expect(d(await acl.isAllowed(NOBODY, ROOT, 'read'))).toBe(false);
        });
    });

    // =================================================================
    // Real filesystem through AclVfsClient
    // =================================================================

    describe('team member (aaa) — real FS ops', () => {
        it('can list /shared', async () => {
            const c = client(acl, TEAM_A);
            const entries = await c.readdir('shared');
            expect(entries.map(e => e.name)).toContain('data.txt');
        });

        it('can write in /shared', async () => {
            const c = client(acl, TEAM_A);
            await c.writefile(`shared/${SANDBOX}/team.txt`, 'from team');
            expect(readFileSync(join(USER_DIR, 'shared', SANDBOX, 'team.txt'), 'utf8')).toBe('from team');
        });

        it('can mkdir in /shared', async () => {
            const c = client(acl, TEAM_A);
            await c.mkdir(`shared/${SANDBOX}/team-dir`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'team-dir'))).toBe(true);
        });

        it('can delete in /shared', async () => {
            const c = client(acl, TEAM_A);
            await c.writefile(`shared/${SANDBOX}/del.txt`, 'bye');
            await c.rmfile(`shared/${SANDBOX}/del.txt`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'del.txt'))).toBe(false);
        });

        it('can list /docs (read-only)', async () => {
            const c = client(acl, TEAM_A);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('CANNOT write in /docs', async () => {
            const c = client(acl, TEAM_A);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT list /private', async () => {
            const c = client(acl, TEAM_A);
            await expect(c.readdir('private')).rejects.toThrow('EACCES');
        });
    });

    describe('viewer (ddd) — real FS ops', () => {
        it('can list /docs', async () => {
            const c = client(acl, VIEW_D);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can check existence in /docs', async () => {
            const c = client(acl, VIEW_D);
            expect(await c.exists('docs/readme.txt')).toBe(true);
        });

        it('CANNOT list /shared', async () => {
            const c = client(acl, VIEW_D);
            await expect(c.readdir('shared')).rejects.toThrow('EACCES');
        });

        it('CANNOT write in /docs', async () => {
            const c = client(acl, VIEW_D);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });
    });

    describe('viewer+direct (fff) — mixed grants FS ops', () => {
        it('can list /docs (from group)', async () => {
            const c = client(acl, VIEW_F);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can list /shared (from direct grant)', async () => {
            const c = client(acl, VIEW_F);
            const entries = await c.readdir('shared');
            expect(entries.map(e => e.name)).toContain('data.txt');
        });

        it('can check existence in /shared (from direct grant)', async () => {
            const c = client(acl, VIEW_F);
            expect(await c.exists('shared/data.txt')).toBe(true);
        });

        it('CANNOT write in /shared (direct only grants read+list)', async () => {
            const c = client(acl, VIEW_F);
            await expect(c.writefile(`shared/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT access /private', async () => {
            const c = client(acl, VIEW_F);
            await expect(c.readdir('private')).rejects.toThrow('EACCES');
        });
    });

    describe('stranger — blocked on everything', () => {
        it('CANNOT list /shared', async () => {
            const c = client(acl, NOBODY);
            await expect(c.readdir('shared')).rejects.toThrow('EACCES');
        });

        it('CANNOT read /docs', async () => {
            const c = client(acl, NOBODY);
            await expect(c.exists('docs/readme.txt')).rejects.toThrow('EACCES');
        });

        it('CANNOT write anywhere', async () => {
            const c = client(acl, NOBODY);
            await expect(c.writefile(`shared/${SANDBOX}/x.txt`, 'x')).rejects.toThrow('EACCES');
        });
    });
});
