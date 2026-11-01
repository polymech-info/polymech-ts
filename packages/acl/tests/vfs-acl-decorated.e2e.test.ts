/**
 * DecoratedVfsClient — e2e test
 *
 * Verifies that the decorator-based client behaves identically
 * to the imperative AclVfsClient using the same path-scoped fixture.
 *
 * Uses: tests/vfs/root/3bb4cfbf-…/vfs-settings.json
 *   - User aaa → read+list on /
 *   - User ccc → full on /shared, read+list on /docs
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve, join } from 'node:path';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { Acl } from '../src/Acl.js';
import { MemoryBackend } from '../src/data/MemoryBackend.js';
import { loadVfsSettings } from '../src/vfs/vfs-acl.js';
import { DecoratedVfsClient } from '../src/vfs/DecoratedVfsClient.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWNER = '3bb4cfbf-318b-44d3-a9d3-35680e738421';
const READER = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const COLLAB = 'cccccccc-4444-5555-6666-dddddddddddd';
const NOBODY = '99999999-0000-0000-0000-ffffffffffff';

const USER_DIR = resolve(import.meta.dirname!, 'vfs/root', OWNER);
const SANDBOX = '_decorated_sandbox';

function client(acl: Acl, callerId: string): DecoratedVfsClient {
    return new DecoratedVfsClient(acl, OWNER, callerId, { root: USER_DIR });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DecoratedVfsClient — e2e', () => {
    let acl: Acl;

    beforeAll(async () => {
        acl = new Acl(new MemoryBackend());
        await loadVfsSettings(acl, USER_DIR);

        for (const sub of ['shared', 'docs', 'private']) {
            mkdirSync(join(USER_DIR, sub, SANDBOX), { recursive: true });
        }
    });

    afterAll(() => {
        for (const sub of ['shared', 'docs', 'private']) {
            const p = join(USER_DIR, sub, SANDBOX);
            if (existsSync(p)) rmSync(p, { recursive: true, force: true });
        }
    });

    // =====================================================================
    // Owner — full access
    // =====================================================================

    describe('owner', () => {
        it('can list /docs', async () => {
            const c = client(acl, OWNER);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can write in /private', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`private/${SANDBOX}/decorated.txt`, 'decorator works');
            expect(readFileSync(join(USER_DIR, 'private', SANDBOX, 'decorated.txt'), 'utf8'))
                .toBe('decorator works');
        });

        it('can mkdir in /shared', async () => {
            const c = client(acl, OWNER);
            await c.mkdir(`shared/${SANDBOX}/dec-dir`);
            expect(existsSync(join(USER_DIR, 'shared', SANDBOX, 'dec-dir'))).toBe(true);
        });

        it('can delete in /private', async () => {
            const c = client(acl, OWNER);
            await c.writefile(`private/${SANDBOX}/del.txt`, 'bye');
            await c.rmfile(`private/${SANDBOX}/del.txt`);
            expect(existsSync(join(USER_DIR, 'private', SANDBOX, 'del.txt'))).toBe(false);
        });
    });

    // =====================================================================
    // Reader — read+list on /
    // =====================================================================

    describe('reader (read+list on /)', () => {
        it('can list /docs', async () => {
            const c = client(acl, READER);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('can check existence in /shared', async () => {
            const c = client(acl, READER);
            expect(await c.exists('shared/data.txt')).toBe(true);
        });

        it('CANNOT write in /shared', async () => {
            const c = client(acl, READER);
            await expect(c.writefile(`shared/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT mkdir in /docs', async () => {
            const c = client(acl, READER);
            await expect(c.mkdir(`docs/${SANDBOX}/nope`)).rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    // Collaborator — full on /shared, read on /docs
    // =====================================================================

    describe('collaborator (full on /shared)', () => {
        it('can write in /shared', async () => {
            const c = client(acl, COLLAB);
            await c.writefile(`shared/${SANDBOX}/collab.txt`, 'collab');
            expect(readFileSync(join(USER_DIR, 'shared', SANDBOX, 'collab.txt'), 'utf8'))
                .toBe('collab');
        });

        it('can list /docs', async () => {
            const c = client(acl, COLLAB);
            const entries = await c.readdir('docs');
            expect(entries.map(e => e.name)).toContain('readme.txt');
        });

        it('CANNOT write in /docs', async () => {
            const c = client(acl, COLLAB);
            await expect(c.writefile(`docs/${SANDBOX}/nope.txt`, 'x')).rejects.toThrow('EACCES');
        });

        it('CANNOT list /private', async () => {
            const c = client(acl, COLLAB);
            await expect(c.readdir('private')).rejects.toThrow('EACCES');
        });
    });

    // =====================================================================
    // Stranger — blocked
    // =====================================================================

    describe('stranger — EACCES on everything', () => {
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
