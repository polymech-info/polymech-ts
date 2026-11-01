/**
 * @polymech/acl — Functional tests
 *
 * Exercises the full ACL API against the MemoryBackend.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Acl } from './Acl.js';
import { MemoryBackend } from './data/MemoryBackend.js';
import type { AclResult } from './interfaces.js';

/** Unwrap AclResult — asserts ok and returns data. */
function d<T>(result: AclResult<T>): T {
    if (!result.ok) throw new Error(`Expected ok result, got ${result.code}: ${result.message}`);
    return result.data;
}

describe('Acl (MemoryBackend)', () => {
    let acl: Acl;

    beforeEach(async () => {
        const backend = new MemoryBackend();
        acl = new Acl(backend);
    });

    // -------------------------------------------------------------------------
    // Roles ↔ Users
    // -------------------------------------------------------------------------

    describe('addUserRoles / userRoles', () => {
        it('assigns a single role to a user', async () => {
            await acl.addUserRoles('user1', 'admin');
            const roles = d(await acl.userRoles('user1'));
            expect(roles).toContain('admin');
        });

        it('assigns multiple roles', async () => {
            await acl.addUserRoles('user2', ['editor', 'viewer']);
            const roles = d(await acl.userRoles('user2'));
            expect(roles).toEqual(expect.arrayContaining(['editor', 'viewer']));
        });
    });

    describe('removeUserRoles', () => {
        it('removes a role from a user', async () => {
            await acl.addUserRoles('user1', ['admin', 'editor']);
            await acl.removeUserRoles('user1', 'admin');
            const roles = d(await acl.userRoles('user1'));
            expect(roles).not.toContain('admin');
            expect(roles).toContain('editor');
        });
    });

    describe('roleUsers', () => {
        it('returns users for a given role', async () => {
            await acl.addUserRoles('u1', 'admin');
            await acl.addUserRoles('u2', 'admin');
            const users = d(await acl.roleUsers('admin'));
            expect(users).toEqual(expect.arrayContaining(['u1', 'u2']));
        });
    });

    describe('hasRole', () => {
        it('returns true when user has the role', async () => {
            await acl.addUserRoles('u1', 'admin');
            expect(d(await acl.hasRole('u1', 'admin'))).toBe(true);
        });

        it('returns false when user lacks the role', async () => {
            await acl.addUserRoles('u1', 'editor');
            expect(d(await acl.hasRole('u1', 'admin'))).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Permissions
    // -------------------------------------------------------------------------

    describe('allow / isAllowed', () => {
        it('grants and checks a simple permission', async () => {
            await acl.addUserRoles('u1', 'editor');
            await acl.allow('editor', 'posts', 'edit');

            expect(d(await acl.isAllowed('u1', 'posts', 'edit'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'posts', 'delete'))).toBe(false);
        });

        it('grants multiple permissions at once', async () => {
            await acl.addUserRoles('u1', 'admin');
            await acl.allow('admin', 'posts', ['create', 'edit', 'delete']);

            expect(d(await acl.isAllowed('u1', 'posts', 'create'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'posts', 'delete'))).toBe(true);
        });

        it('supports wildcard * permission', async () => {
            await acl.addUserRoles('u1', 'superadmin');
            await acl.allow('superadmin', 'everything', '*');

            expect(d(await acl.isAllowed('u1', 'everything', 'anything'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'everything', 'whatever'))).toBe(true);
        });
    });

    describe('allow — batch grant syntax', () => {
        it('grants via AclGrant[] array', async () => {
            await acl.addUserRoles('u1', 'member');
            await acl.allow([
                {
                    roles: 'member',
                    allows: [
                        { resources: 'profile', permissions: ['read', 'update'] },
                        { resources: 'feed', permissions: 'read' },
                    ],
                },
            ]);

            expect(d(await acl.isAllowed('u1', 'profile', 'read'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'profile', 'update'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'feed', 'read'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'feed', 'write'))).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Role hierarchy
    // -------------------------------------------------------------------------

    describe('addRoleParents — hierarchical permissions', () => {
        it('inherits permissions from parent roles', async () => {
            await acl.allow('viewer', 'docs', 'read');
            await acl.allow('editor', 'docs', 'write');
            await acl.addRoleParents('editor', 'viewer');
            await acl.addUserRoles('u1', 'editor');

            // editor can write (own) AND read (inherited from viewer)
            expect(d(await acl.isAllowed('u1', 'docs', 'write'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'docs', 'read'))).toBe(true);
        });

        it('supports multi-level hierarchy', async () => {
            await acl.allow('base', 'res', 'read');
            await acl.allow('mid', 'res', 'write');
            await acl.allow('top', 'res', 'admin');
            await acl.addRoleParents('mid', 'base');
            await acl.addRoleParents('top', 'mid');
            await acl.addUserRoles('u1', 'top');

            expect(d(await acl.isAllowed('u1', 'res', 'admin'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'res', 'write'))).toBe(true);
            expect(d(await acl.isAllowed('u1', 'res', 'read'))).toBe(true);
        });
    });

    describe('removeRoleParents', () => {
        it('cuts parent inheritance', async () => {
            await acl.allow('viewer', 'docs', 'read');
            await acl.allow('editor', 'docs', 'write');
            await acl.addRoleParents('editor', 'viewer');
            await acl.addUserRoles('u1', 'editor');

            // Before removal: editor inherits viewer's read
            expect(d(await acl.isAllowed('u1', 'docs', 'read'))).toBe(true);

            await acl.removeRoleParents('editor', 'viewer');

            // After removal: editor only has write
            expect(d(await acl.isAllowed('u1', 'docs', 'read'))).toBe(false);
            expect(d(await acl.isAllowed('u1', 'docs', 'write'))).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // Removal
    // -------------------------------------------------------------------------

    describe('removeRole', () => {
        it('removes the role and its permissions', async () => {
            await acl.allow('temp', 'stuff', 'do');
            await acl.addUserRoles('u1', 'temp');
            expect(d(await acl.isAllowed('u1', 'stuff', 'do'))).toBe(true);

            await acl.removeRole('temp');
            // areAnyRolesAllowed should fail now for 'temp'
            expect(d(await acl.areAnyRolesAllowed('temp', 'stuff', 'do'))).toBe(false);
        });
    });

    describe('removeAllow', () => {
        it('removes specific permissions', async () => {
            await acl.allow('editor', 'posts', ['read', 'write', 'delete']);
            await acl.addUserRoles('u1', 'editor');

            await acl.removeAllow('editor', 'posts', 'delete');
            expect(d(await acl.isAllowed('u1', 'posts', 'delete'))).toBe(false);
            expect(d(await acl.isAllowed('u1', 'posts', 'read'))).toBe(true);
        });

        it('removes all permissions for a resource when no perms specified', async () => {
            await acl.allow('editor', 'posts', ['read', 'write']);
            await acl.addUserRoles('u1', 'editor');

            await acl.removeAllow('editor', 'posts');
            expect(d(await acl.isAllowed('u1', 'posts', 'read'))).toBe(false);
            expect(d(await acl.isAllowed('u1', 'posts', 'write'))).toBe(false);
        });
    });

    describe('removeResource', () => {
        it('removes the resource from all roles', async () => {
            await acl.allow('admin', 'secrets', 'read');
            await acl.addUserRoles('u1', 'admin');
            expect(d(await acl.isAllowed('u1', 'secrets', 'read'))).toBe(true);

            await acl.removeResource('secrets');
            expect(d(await acl.isAllowed('u1', 'secrets', 'read'))).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    describe('allowedPermissions', () => {
        it('returns a map of resource → permissions', async () => {
            await acl.addUserRoles('u1', 'editor');
            await acl.allow('editor', 'posts', ['read', 'write']);
            await acl.allow('editor', 'comments', 'moderate');

            const perms = d(await acl.allowedPermissions('u1', ['posts', 'comments', 'settings']));
            expect(perms['posts']).toEqual(expect.arrayContaining(['read', 'write']));
            expect(perms['comments']).toContain('moderate');
            expect(perms['settings']).toEqual([]);
        });

        it('returns {} for falsy userId', async () => {
            const perms = d(await acl.allowedPermissions('', ['posts']));
            expect(perms).toEqual({});
        });
    });

    describe('areAnyRolesAllowed', () => {
        it('returns true if at least one role has the permission', async () => {
            await acl.allow('a', 'res', 'read');
            expect(d(await acl.areAnyRolesAllowed(['a', 'b'], 'res', 'read'))).toBe(true);
        });

        it('returns false for empty roles', async () => {
            expect(d(await acl.areAnyRolesAllowed([], 'res', 'read'))).toBe(false);
        });
    });

    describe('whatResources', () => {
        it('without permissions — returns resource→permissions map', async () => {
            await acl.allow('editor', 'posts', ['read', 'write']);
            await acl.allow('editor', 'pages', 'read');

            const result = d(await acl.whatResources('editor')) as Record<string, string[]>;
            expect(Object.keys(result)).toEqual(expect.arrayContaining(['posts', 'pages']));
            expect(result['posts']).toEqual(expect.arrayContaining(['read', 'write']));
        });

        it('with permissions — returns matching resource names', async () => {
            await acl.allow('editor', 'posts', ['read', 'write']);
            await acl.allow('editor', 'pages', 'read');

            const result = d(await acl.whatResources('editor', 'write')) as string[];
            expect(result).toContain('posts');
            expect(result).not.toContain('pages');
        });
    });
});
