/**
 * VFS ACL — Per-path e2e test with real filesystem operations
 *
 * Folder structure under tests/vfs/root/<ownerId>/:
 *
 *   ├── vfs-settings.json     ACL config
 *   ├── docs/
 *   │   └── readme.txt        "hello docs"
 *   ├── shared/
 *   │   └── data.txt          "shared file"
 *   └── private/
 *       └── secret.txt        "top secret"
 *
 * Settings:
 *   - user aaa... → read+list on "/" (global)
 *   - user ccc... → read+write+list+mkdir+delete on "/shared"
 *   - user ccc... → read+list on "/docs"
 *   - nobody gets access to "/private" except the owner
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings, resourceChain, vfsResource } from '../src/vfs/vfs-acl.js';
import { AclVfsClient } from '../src/vfs/AclVfsClient.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWNER = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const READER = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';  // read+list on /
const COLLAB = 'cccccccc-4444-5555-6666-dddddddddddd';  // full on /shared, read on /docs
const NOBODY = '99999999-0000-0000-0000-ffffffffffff';

const VFS_ROOT = resolve(import.meta.dirname!, 'vfs/root');
const USER_DIR = join(VFS_ROOT, OWNER);
const SANDBOX = '_path_sandbox';

function client(acl: Acl, callerId: string): AclVfsClient {
    return new AclVfsClient(acl, OWNER, callerId, { root: USER_DIR });
}

// ---------------------------------------------------------------------------
// Unit: resourceChain
// ---------------------------------------------------------------------------

describe('resourceChain helper', () => {
    it('builds chain from deep path to root', () => {
        const chain = resourceChain('x', 'a/b/c.txt');
        expect(chain).toEqual([
            'vfs:x:/a/b/c.txt',
            'vfs:x:/a/b',
            'vfs:x:/a',
            'vfs:x:/',
        ]);
    });

    it('handles root path', () => {
        expect(resourceChain('x', '')).toEqual(['vfs:x:/']);
        expect(resourceChain('x', '.')).toEqual(['vfs:x:/.', 'vfs:x:/']);
        expect(resourceChain('x', '/')).toEqual(['vfs:x:/']);
    });

    it('normalises backslashes and trailing slashes', () => {
        const chain = resourceChain('x', 'a\\b/');
        expect(chain).toEqual(['vfs:x:/a/b', 'vfs:x:/a', 'vfs:x:/']);
    });
});

// ---------------------------------------------------------------------------
// Real filesystem tests
// ---------------------------------------------------------------------------

describe('VFS ACL — per-path e2e', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());
        await loadVfsSettings(acl, USER_DIR);

        // Create sandbox dirs for write tests
        for (const sub of ['shared', 'docs', 'private']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (!existsSync(p)) mkdirSync(p, { recursive: true });
        }
    });

    afterAll(() => {
        for (const sub of ['shared', 'docs', 'private']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (existsSync(p)) rmSync(p, { recursive: true, force: true });
        }
    });

    // =====================================================================
    //  OWNER — wildcard on "/"  → full access everywhere
    // =====================================================================

    describe('owner — wildcard on every path', () => {
        it('can list /docs', async () => {
            const c = client(acl, OWNER);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can write inside /private', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`private/${SANDBOX}/owner.txt`, 'ok');
            expect(readFileSync(join(USER_DIR, 'private', SANDBOX, 'owner.txt'), 'utf8')).toBe('ok');
        });

        it('can delete inside /private', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`private/${SANDBOX}/del.txt`, 'bye');
            await c.rmfile(`private/${SANDBOX}/del.txt`);
            expect(existsSync(join(USER_DIR, 'private', SANDBOX, 'del.txt'))).toBe(false);
        });
    });

    // =====================================================================
    //  READER — read+list on "/" → can read everything, write nothing
    // =====================================================================

    describe('reader (read+list on /) — global read-only', () => {
        it('can list /docs', async () => {
            const c = client(acl, READER);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can list /shared', async () => {
            const c = client(acl, READER);
            const entries = await c.readdir('shared');
            expect(entries.length).toBeGreaterThan(0);
        });

        it('can check existence in /private (inherits read from /)', async () => {
            const c = client(acl, READER);
            const exists = await c.exists('private/secret.txt');
            expect(exists).toBe(true);
        });

        it('CANNOT write in /docs', async () => {
            const c = client(acl, READER);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT write in /shared', async () => {
            const c = client(acl, READER);
            await expect(c.writefile(`shared/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT mkdir in /private', async () => {
            const c = client(acl, READER);
            await expect(c.mkdir(`private/${SANDBOX}/nope`)).rejects.toThrow('EACCES');
        });

        it('CANNOT delete in /private', async () => {
            const c = client(acl, READER);
            await expect(c.rmfile('private/secret.txt')).rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    //  COLLAB — full on "/shared", read+list on "/docs", nothing on "/private"
    // =====================================================================

    describe('collaborator — per-folder permissions', () => {
        // --- /shared — full access ---

        it('can list /shared', async () => {
            const c = client(acl, COLLAB);
            const entries = await c.readdir('shared');
            expect(entries.map(e => e.name)).toContain('data.txt');
        });

        it('can write inside /shared', async () => {
            const c = client(acl, COLLAB);
            await c.writefile(`shared/${SANDBOX}/collab.txt`, 'hi from collab');
            expect(readFileSync(join(USER_DIR, 'shared', SANDBOX, 'collab.txt'), 'utf8')).toBe('hi from collab');
        });

        it('can mkdir inside /shared', async () => {
            const c = client(acl, COLLAB);
            await c.mkdir(`shared/${SANDBOX}/newdir`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'newdir'))).toBe(true);
        });

        it('can delete inside /shared', async () => {
            const c = client(acl, COLLAB);
            await c.writefile(`shared/${SANDBOX}/temp.txt`, 'tmp');
            await c.rmfile(`shared/${SANDBOX}/temp.txt`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'temp.txt'))).toBe(false);
        });

        it('can read nested path /shared/sub/deep (inherits from /shared)', async () => {
            const c = client(acl, COLLAB);
            // Write as owner first
            const ownerClient = client(acl, OWNER);
            await ownerClient.writefile(`shared/${SANDBOX}/deep.txt`, 'deep content');
            // Collab reads
            const exists = await c.exists(`shared/${SANDBOX}/deep.txt`);
            expect(exists).toBe(true);
        });

        // --- /docs — read + list only ---

        it('can list /docs', async () => {
            const c = client(acl, COLLAB);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can check existence in /docs', async () => {
            const c = client(acl, COLLAB);
            expect(await c.exists('docs/readme.txt')).toBe(true);
        });

        it('CANNOT write in /docs', async () => {
            const c = client(acl, COLLAB);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT delete in /docs', async () => {
            const c = client(acl, COLLAB);
            await expect(c.rmfile('docs/readme.txt')).rejects.toThrow('EACCES');
        });

        it('CANNOT mkdir in /docs', async () => {
            const c = client(acl, COLLAB);
            await expect(c.mkdir(`docs/${SANDBOX}/nope`)).rejects.toThrow('EACCES');
        });

        // --- /private — no access at all ---

        it('CANNOT list /private', async () => {
            const c = client(acl, COLLAB);
            await expect(c.readdir('private')).rejects.toThrow('EACCES');
        });

        it('CANNOT read /private', async () => {
            const c = client(acl, COLLAB);
            await expect(c.exists('private/secret.txt')).rejects.toThrow('EACCES');
        });

        it('CANNOT write in /private', async () => {
            const c = client(acl, COLLAB);
            await expect(c.writefile(`private/${SANDBOX}/x.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT mkdir in /private', async () => {
            const c = client(acl, COLLAB);
            await expect(c.mkdir(`private/${SANDBOX}/x`)).rejects.toThrow('EACCES');
        });

        // --- root "/" — no access (no root grant for collab) ---

        it('CANNOT list root "/"', async () => {
            const c = client(acl, COLLAB);
            await expect(c.readdir('.')).rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    //  NOBODY — zero grants → blocked everywhere
    // =====================================================================

    describe('stranger — blocked everywhere', () => {
        const paths = ['docs', 'shared', 'private', '.'] as const;

        for (const p of paths) {
            it(`CANNOT list /${p}`, async () => {
                const c = client(acl, NOBODY);
                await expect(c.readdir(p)).rejects.toThrow('EACCES');
            });
        }

        it('CANNOT read /shared/data.txt', async () => {
            const c = client(acl, NOBODY);
            await expect(c.exists('shared/data.txt')).rejects.toThrow('EACCES');
        });

        it('CANNOT write /shared/x.txt', async () => {
            const c = client(acl, NOBODY);
            await expect(c.writefile(`shared/${SANDBOX}/x.txt`, 'x')).rejects.toThrow('EACCES');
        });
    });
});
