/**
 * VFS ACL — Real filesystem e2e test
 *
 * Uses AclVfsClient to perform real file I/O (write, read, mkdir, delete)
 * and verifies ACL enforcement at each path level.
 *
 * Folder structure:
 *   tests/vfs/root/<ownerId>/
 *     ├── docs/       (user ccc → read+list, user aaa → read+list from /)
 *     ├── shared/     (user ccc → read+write+list+mkdir+delete)
 *     └── private/    (only owner)
 *
 * Real files are written to a _test_sandbox/ subfolder within each dir
 * and cleaned up after the test run.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings } from '../src/vfs/vfs-acl.js';
import { AclVfsClient } from '../src/vfs/AclVfsClient.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWNER = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const READ_ONLY = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb'; // read+list on /
const FULL_SHARED = 'cccccccc-4444-5555-6666-dddddddddddd'; // full on /shared, read on /docs
const STRANGER = '99999999-0000-0000-0000-ffffffffffff';

const VFS_ROOT = resolve(import.meta.dirname!, 'vfs/root');
const USER_DIR = join(VFS_ROOT, OWNER);
const SANDBOX = '_test_sandbox';

function client(acl: Acl, callerId: string): AclVfsClient {
    return new AclVfsClient(acl, OWNER, callerId, { root: USER_DIR });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe('VFS ACL — real filesystem e2e', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());
        await loadVfsSettings(acl, USER_DIR);

        // Create sandbox dirs for write tests
        for (const sub of ['shared', 'docs', 'private', '']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (!existsSync(p)) mkdirSync(p, { recursive: true });
        }
    });

    afterAll(() => {
        for (const sub of ['shared', 'docs', 'private', '']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (existsSync(p)) rmSync(p, { recursive: true, force: true });
        }
    });

    // =====================================================================
    // Owner — full real ops on any path
    // =====================================================================

    describe('owner — real FS ops', () => {
        it('can list root directory', async () => {
            const c = client(acl, OWNER);
            const entries = await c.readdir('.');
            expect(entries.length).toBeGreaterThan(0);
        });

        it('can write and read a file in /private', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`private/${SANDBOX}/owner.txt`, 'owner wrote this');
            const content = readFileSync(join(USER_DIR, 'private', SANDBOX, 'owner.txt'), 'utf8');
            expect(content).toBe('owner wrote this');
        });

        it('can create a sub-directory in /docs', async () => {
            const c = client(acl, OWNER);
            const dir = `docs/${SANDBOX}/owner-dir`;
            await c.mkdir(dir);
            expect(existsSync(join(USER_DIR, dir))).toBe(true);
        });

        it('can delete a file in /shared', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`shared/${SANDBOX}/del.txt`, 'bye');
            await c.rmfile(`shared/${SANDBOX}/del.txt`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'del.txt'))).toBe(false);
        });
    });

    // =====================================================================
    // Read-only user — read+list on "/" → can read everywhere, write nowhere
    // =====================================================================

    describe('read-only user — real FS ops', () => {
        it('can list /docs (inherits from /)', async () => {
            const c = client(acl, READ_ONLY);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can check file existence in /shared', async () => {
            const c = client(acl, READ_ONLY);
            expect(await c.exists('shared/data.txt')).toBe(true);
        });

        it('CANNOT write a file → EACCES', async () => {
            const c = client(acl, READ_ONLY);
            await expect(c.writefile(`shared/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT create a directory → EACCES', async () => {
            const c = client(acl, READ_ONLY);
            await expect(c.mkdir(`docs/${SANDBOX}/nope`)).rejects.toThrow('EACCES');
        });

        it('CANNOT delete a file → EACCES', async () => {
            const c = client(acl, READ_ONLY);
            await expect(c.rmfile('docs/readme.txt')).rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    // Full-shared user — full on /shared, read on /docs, nothing on /private
    // =====================================================================

    describe('full-shared user — real FS ops', () => {
        it('can write a file in /shared', async () => {
            const c = client(acl, FULL_SHARED);
            await c.writefile(`shared/${SANDBOX}/granted.txt`, 'shared write');
            const content = readFileSync(join(USER_DIR, 'shared', SANDBOX, 'granted.txt'), 'utf8');
            expect(content).toBe('shared write');
        });

        it('can list /shared', async () => {
            const c = client(acl, FULL_SHARED);
            const entries = await c.readdir(`shared/${SANDBOX}`);
            expect(entries.map(e => e.name)).toContain('granted.txt');
        });

        it('can create directory in /shared', async () => {
            const c = client(acl, FULL_SHARED);
            await c.mkdir(`shared/${SANDBOX}/granted-dir`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'granted-dir'))).toBe(true);
        });

        it('can delete a file in /shared', async () => {
            const c = client(acl, FULL_SHARED);
            await c.writefile(`shared/${SANDBOX}/temp.txt`, 'tmp');
            await c.rmfile(`shared/${SANDBOX}/temp.txt`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'temp.txt'))).toBe(false);
        });

        it('can list /docs (read+list)', async () => {
            const c = client(acl, FULL_SHARED);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('CANNOT write in /docs → EACCES', async () => {
            const c = client(acl, FULL_SHARED);
            await expect(c.writefile(`docs/${SANDBOX}/x.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT list /private → EACCES', async () => {
            const c = client(acl, FULL_SHARED);
            await expect(c.readdir('private')).rejects.toThrow('EACCES');
        });

        it('CANNOT list root → EACCES', async () => {
            const c = client(acl, FULL_SHARED);
            await expect(c.readdir('.')).rejects.toThrow('EACCES');
        });

        it('CANNOT rename in /shared → EACCES', async () => {
            const c = client(acl, FULL_SHARED);
            await expect(c.rename(`shared/${SANDBOX}/granted.txt`, `shared/${SANDBOX}/renamed.txt`))
                .rejects.toThrow('EACCES');
        });

        it('CANNOT copy in /shared → EACCES', async () => {
            const c = client(acl, FULL_SHARED);
            await expect(c.copy(`shared/${SANDBOX}/granted.txt`, `shared/${SANDBOX}/copied.txt`))
                .rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    // Stranger — blocked everywhere
    // =====================================================================

    describe('stranger — everything blocked', () => {
        it('CANNOT readdir /shared → EACCES', async () => {
            const c = client(acl, STRANGER);
            await expect(c.readdir('shared')).rejects.toThrow('EACCES');
        });

        it('CANNOT exists /docs → EACCES', async () => {
            const c = client(acl, STRANGER);
            await expect(c.exists('docs/readme.txt')).rejects.toThrow('EACCES');
        });

        it('CANNOT writefile /shared → EACCES', async () => {
            const c = client(acl, STRANGER);
            await expect(c.writefile(`shared/${SANDBOX}/x.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT mkdir /private → EACCES', async () => {
            const c = client(acl, STRANGER);
            await expect(c.mkdir(`private/${SANDBOX}/x`)).rejects.toThrow('EACCES');
        });

        it('CANNOT rmfile /docs → EACCES', async () => {
            const c = client(acl, STRANGER);
            await expect(c.rmfile('docs/readme.txt')).rejects.toThrow('EACCES');
        });
    });
});
