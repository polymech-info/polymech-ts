/**
 * @polymech/acl — Core ACL class
 *
 * Zend_ACL-inspired role-based access control.
 * Pure ESM, async/await, zero lodash/bluebird.
 */
import type { Logger } from 'pino';
import type {
    AclErr,
    AclGrant,
    AclOptions,
    AclResult,
    BucketNames,
    IBackend,
    IAcl,
    Value,
    Values,
} from './interfaces.js';
import { ok, okVoid, err } from './interfaces.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toArray = <T>(v: T | T[]): T[] =>
    Array.isArray(v) ? v : [v];

const allowsBucket = (resource: string): string =>
    `allows_${resource}`;

const keyFromAllowsBucket = (str: string): string =>
    str.replace(/^allows_/, '');

/** Set-based union of two arrays (deduped). */
const union = <T>(a: T[], b: T[]): T[] =>
    [...new Set([...a, ...b])];

/** Items in `a` that are not in `b`. */
const difference = <T>(a: T[], b: T[]): T[] => {
    const set = new Set(b);
    return a.filter((x) => !set.has(x));
};

/** Intersection of `a` and `b`. */
const intersect = <T>(a: T[], b: T[]): T[] => {
    const set = new Set(b);
    return a.filter((x) => set.has(x));
};

/**
 * Validate that none of the values are empty/whitespace-only.
 * Returns an AclErr if validation fails, otherwise undefined.
 */
const validateNonEmpty = (value: Value | Values, label: string): AclErr | undefined => {
    const arr = Array.isArray(value) ? value : [value];
    for (const v of arr) {
        const s = String(v).trim();
        if (!s) return err('INVALID_INPUT', `${label} cannot be empty`);
    }
    return undefined;
};

// ---------------------------------------------------------------------------
// Default bucket names
// ---------------------------------------------------------------------------

const DEFAULT_BUCKETS: BucketNames = {
    meta: 'meta',
    parents: 'parents',
    permissions: 'permissions',
    resources: 'resources',
    roles: 'roles',
    users: 'users',
} as const;

// ---------------------------------------------------------------------------
// ACL
// ---------------------------------------------------------------------------

export class Acl implements IAcl {
    readonly #backend: IBackend<unknown>;
    readonly #buckets: BucketNames;
    readonly #logger: Logger | undefined;

    constructor(backend: IBackend<unknown>, logger?: Logger, options?: AclOptions) {
        this.#backend = backend;
        this.#logger = logger;
        this.#buckets = { ...DEFAULT_BUCKETS, ...options?.buckets };
    }

    // -------------------------------------------------------------------------
    // allow
    // -------------------------------------------------------------------------

    async allow(rolesOrGrants: Values | AclGrant[], resources?: Values, permissions?: Values): Promise<AclResult> {
        try {
            // Overload: allow(grants[])
            if (Array.isArray(rolesOrGrants) && rolesOrGrants.length > 0 && typeof rolesOrGrants[0] === 'object') {
                return this.#allowBatch(rolesOrGrants as AclGrant[]);
            }

            const roles = toArray(rolesOrGrants as Values) as string[];
            const res = toArray(resources!);
            const perms = toArray(permissions!);

            const v1 = validateNonEmpty(roles, 'Role');
            if (v1) return v1;
            const v2 = validateNonEmpty(res, 'Resource');
            if (v2) return v2;
            const v3 = validateNonEmpty(perms, 'Permission');
            if (v3) return v3;

            const tx = await this.#backend.begin();
            await this.#backend.add(tx, this.#buckets.meta, 'roles', roles);

            for (const resource of res) {
                for (const role of roles) {
                    await this.#backend.add(tx, allowsBucket(String(resource)), role, perms);
                }
            }
            for (const role of roles) {
                await this.#backend.add(tx, this.#buckets.resources, role, res);
            }

            await this.#backend.end(tx);
            this.#logger?.debug({ roles, resources: res, permissions: perms }, 'allow');
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async #allowBatch(grants: AclGrant[]): Promise<AclResult> {
        for (const g of grants) {
            for (const a of g.allows) {
                const result = await this.allow(g.roles, a.resources, a.permissions);
                if (!result.ok) return result;
            }
        }
        return okVoid;
    }

    // -------------------------------------------------------------------------
    // User ↔ Role
    // -------------------------------------------------------------------------

    async addUserRoles(userId: Value, roles: Values): Promise<AclResult> {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1) return v1;
            const v2 = validateNonEmpty(roles, 'Role');
            if (v2) return v2;

            const rolesArr = toArray(roles);
            const tx = await this.#backend.begin();
            await this.#backend.add(tx, this.#buckets.meta, 'users', userId);
            await this.#backend.add(tx, this.#buckets.users, userId, roles);

            for (const role of rolesArr) {
                await this.#backend.add(tx, this.#buckets.roles, role, userId);
            }
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async removeUserRoles(userId: Value, roles: Values): Promise<AclResult> {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1) return v1;
            const v2 = validateNonEmpty(roles, 'Role');
            if (v2) return v2;

            const rolesArr = toArray(roles);
            const tx = await this.#backend.begin();
            await this.#backend.remove(tx, this.#buckets.users, userId, roles);

            for (const role of rolesArr) {
                await this.#backend.remove(tx, this.#buckets.roles, role, userId);
            }
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async userRoles(userId: Value): Promise<AclResult<string[]>> {
        try {
            const data = await this.#backend.get(this.#buckets.users, userId);
            return ok(data);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async roleUsers(role: Value): Promise<AclResult<string[]>> {
        try {
            const data = await this.#backend.get(this.#buckets.roles, role);
            return ok(data);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async hasRole(userId: Value, role: string): Promise<AclResult<boolean>> {
        try {
            const result = await this.userRoles(userId);
            if (!result.ok) return result;
            return ok(result.data.includes(role));
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    // -------------------------------------------------------------------------
    // Role hierarchy
    // -------------------------------------------------------------------------

    async addRoleParents(role: string, parents: Values): Promise<AclResult> {
        try {
            const v1 = validateNonEmpty(role, 'Role');
            if (v1) return v1;
            const v2 = validateNonEmpty(parents, 'Parent role');
            if (v2) return v2;

            const tx = await this.#backend.begin();
            await this.#backend.add(tx, this.#buckets.meta, 'roles', role);
            await this.#backend.add(tx, this.#buckets.parents, role, parents);
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async removeRoleParents(role: string, parents?: Values): Promise<AclResult> {
        try {
            const tx = await this.#backend.begin();
            if (parents) {
                await this.#backend.remove(tx, this.#buckets.parents, role, parents);
            } else {
                await this.#backend.del(tx, this.#buckets.parents, role);
            }
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async removeRole(role: string): Promise<AclResult> {
        try {
            const v = validateNonEmpty(role, 'Role');
            if (v) return v;

            const resources = await this.#backend.get(this.#buckets.resources, role);

            const tx = await this.#backend.begin();
            for (const resource of resources) {
                await this.#backend.del(tx, allowsBucket(resource), role);
            }
            await this.#backend.del(tx, this.#buckets.resources, role);
            await this.#backend.del(tx, this.#buckets.parents, role);
            await this.#backend.del(tx, this.#buckets.roles, role);
            await this.#backend.remove(tx, this.#buckets.meta, 'roles', role);
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    // -------------------------------------------------------------------------
    // Resources
    // -------------------------------------------------------------------------

    async removeResource(resource: string): Promise<AclResult> {
        try {
            const v = validateNonEmpty(resource, 'Resource');
            if (v) return v;

            const roles = await this.#backend.get(this.#buckets.meta, 'roles');
            const tx = await this.#backend.begin();
            await this.#backend.del(tx, allowsBucket(resource), roles);
            for (const role of roles) {
                await this.#backend.remove(tx, this.#buckets.resources, role, resource);
            }
            await this.#backend.end(tx);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    // -------------------------------------------------------------------------
    // Remove allow / permissions
    // -------------------------------------------------------------------------

    async removeAllow(role: string, resources: Values, permissions?: Values): Promise<AclResult> {
        try {
            const v1 = validateNonEmpty(role, 'Role');
            if (v1) return v1;
            const v2 = validateNonEmpty(resources, 'Resource');
            if (v2) return v2;

            const res = toArray(resources);
            const perms = permissions ? toArray(permissions) : undefined;
            await this.#removePermissions(role, res as string[], perms as string[] | undefined);
            return okVoid;
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async #removePermissions(role: string, resources: string[], permissions?: string[]): Promise<void> {
        const tx = await this.#backend.begin();
        for (const resource of resources) {
            const bucket = allowsBucket(resource);
            if (permissions) {
                await this.#backend.remove(tx, bucket, role, permissions);
            } else {
                await this.#backend.del(tx, bucket, role);
                await this.#backend.remove(tx, this.#buckets.resources, role, resource);
            }
        }
        await this.#backend.end(tx);

        // Clean up resources with empty permission sets (not fully atomic)
        const tx2 = await this.#backend.begin();
        for (const resource of resources) {
            const bucket = allowsBucket(resource);
            const remaining = await this.#backend.get(bucket, role);
            if (remaining.length === 0) {
                await this.#backend.remove(tx2, this.#buckets.resources, role, resource);
            }
        }
        await this.#backend.end(tx2);
    }

    // -------------------------------------------------------------------------
    // Permission queries
    // -------------------------------------------------------------------------

    async allowedPermissions(userId: Value, resources: Values): Promise<AclResult<Record<string, string[]>>> {
        try {
            if (!userId) return ok({});

            const res = toArray(resources) as string[];
            const rolesResult = await this.userRoles(userId);
            if (!rolesResult.ok) return rolesResult;

            const roles = rolesResult.data;
            const result: Record<string, string[]> = {};

            for (const resource of res) {
                result[resource] = await this.#resourcePermissions(roles, resource);
            }
            return ok(result);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async isAllowed(userId: Value, resource: string, permissions: Values): Promise<AclResult<boolean>> {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1) return v1;
            const v2 = validateNonEmpty(resource, 'Resource');
            if (v2) return v2;
            const v3 = validateNonEmpty(permissions, 'Permission');
            if (v3) return v3;

            const roles = await this.#backend.get(this.#buckets.users, userId);
            if (roles.length === 0) return ok(false);
            return this.areAnyRolesAllowed(roles, resource, permissions);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async areAnyRolesAllowed(roles: Values, resource: string, permissions: Values): Promise<AclResult<boolean>> {
        try {
            const rolesArr = toArray(roles) as string[];
            if (rolesArr.length === 0) return ok(false);
            const permsArr = toArray(permissions) as string[];
            const allowed = await this.#checkPermissions(rolesArr, resource, permsArr);
            return ok(allowed);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    // -------------------------------------------------------------------------
    // What resources
    // -------------------------------------------------------------------------

    async whatResources(roles: Values, permissions?: Values): Promise<AclResult<Record<string, string[]> | string[]>> {
        try {
            const rolesArr = toArray(roles) as string[];
            const permsArr = permissions ? toArray(permissions) as string[] : undefined;
            const data = await this.#permittedResources(rolesArr, permsArr);
            return ok(data);
        } catch (e) {
            return err('BACKEND_ERROR', (e as Error).message);
        }
    }

    async #permittedResources(roles: string[], permissions?: string[]): Promise<Record<string, string[]> | string[]> {
        const resources = await this.#rolesResources(roles);

        if (!permissions) {
            const result: Record<string, string[]> = {};
            for (const resource of resources) {
                result[resource] = await this.#resourcePermissions(roles, resource);
            }
            return result;
        }

        const result: string[] = [];
        for (const resource of resources) {
            const perms = await this.#resourcePermissions(roles, resource);
            if (intersect(permissions, perms).length > 0) {
                result.push(resource);
            }
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    async #rolesParents(roles: string[]): Promise<string[]> {
        return this.#backend.union(this.#buckets.parents, roles);
    }

    async #allRoles(roleNames: string[]): Promise<string[]> {
        const parents = await this.#rolesParents(roleNames);
        if (parents.length > 0) {
            const parentRoles = await this.#allRoles(parents);
            return union(roleNames, parentRoles);
        }
        return roleNames;
    }

    async #allUserRoles(userId: Value): Promise<string[]> {
        const result = await this.userRoles(userId);
        const roles = result.ok ? result.data : [];
        if (roles.length > 0) {
            return this.#allRoles(roles);
        }
        return [];
    }

    async #rolesResources(roles: string[]): Promise<string[]> {
        const allRoles = await this.#allRoles(roles);
        let result: string[] = [];
        for (const role of allRoles) {
            const resources = await this.#backend.get(this.#buckets.resources, role);
            result = result.concat(resources);
        }
        return [...new Set(result)];
    }

    async #resourcePermissions(roles: string[], resource: string): Promise<string[]> {
        if (roles.length === 0) return [];
        const perms = await this.#backend.union(allowsBucket(resource), roles);
        const parents = await this.#rolesParents(roles);
        if (parents.length > 0) {
            const parentPerms = await this.#resourcePermissions(parents, resource);
            return union(perms, parentPerms);
        }
        return perms;
    }

    /**
     * Recursively checks whether the given roles satisfy ALL requested permissions
     * for a resource, walking up the parent hierarchy.
     *
     * NOTE: Does not handle circular parent graphs — will infinite-loop.
     */
    async #checkPermissions(roles: string[], resource: string, permissions: string[]): Promise<boolean> {
        const resourcePerms = await this.#backend.union(allowsBucket(resource), roles);

        if (resourcePerms.includes('*')) return true;

        const remaining = difference(permissions, resourcePerms);
        if (remaining.length === 0) return true;

        const parents = await this.#backend.union(this.#buckets.parents, roles);
        if (parents.length > 0) {
            return this.#checkPermissions(parents, resource, remaining);
        }
        return false;
    }
}
