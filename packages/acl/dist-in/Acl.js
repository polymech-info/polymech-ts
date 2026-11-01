var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Acl_instances, _Acl_backend, _Acl_buckets, _Acl_logger, _Acl_allowBatch, _Acl_removePermissions, _Acl_permittedResources, _Acl_rolesParents, _Acl_allRoles, _Acl_allUserRoles, _Acl_rolesResources, _Acl_resourcePermissions, _Acl_checkPermissions;
import { ok, okVoid, err } from './interfaces.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const toArray = (v) => Array.isArray(v) ? v : [v];
const allowsBucket = (resource) => `allows_${resource}`;
const keyFromAllowsBucket = (str) => str.replace(/^allows_/, '');
/** Set-based union of two arrays (deduped). */
const union = (a, b) => [...new Set([...a, ...b])];
/** Items in `a` that are not in `b`. */
const difference = (a, b) => {
    const set = new Set(b);
    return a.filter((x) => !set.has(x));
};
/** Intersection of `a` and `b`. */
const intersect = (a, b) => {
    const set = new Set(b);
    return a.filter((x) => set.has(x));
};
/**
 * Validate that none of the values are empty/whitespace-only.
 * Returns an AclErr if validation fails, otherwise undefined.
 */
const validateNonEmpty = (value, label) => {
    const arr = Array.isArray(value) ? value : [value];
    for (const v of arr) {
        const s = String(v).trim();
        if (!s)
            return err('INVALID_INPUT', `${label} cannot be empty`);
    }
    return undefined;
};
// ---------------------------------------------------------------------------
// Default bucket names
// ---------------------------------------------------------------------------
const DEFAULT_BUCKETS = {
    meta: 'meta',
    parents: 'parents',
    permissions: 'permissions',
    resources: 'resources',
    roles: 'roles',
    users: 'users',
};
// ---------------------------------------------------------------------------
// ACL
// ---------------------------------------------------------------------------
export class Acl {
    constructor(backend, logger, options) {
        _Acl_instances.add(this);
        _Acl_backend.set(this, void 0);
        _Acl_buckets.set(this, void 0);
        _Acl_logger.set(this, void 0);
        __classPrivateFieldSet(this, _Acl_backend, backend, "f");
        __classPrivateFieldSet(this, _Acl_logger, logger, "f");
        __classPrivateFieldSet(this, _Acl_buckets, { ...DEFAULT_BUCKETS, ...options === null || options === void 0 ? void 0 : options.buckets }, "f");
    }
    // -------------------------------------------------------------------------
    // allow
    // -------------------------------------------------------------------------
    async allow(rolesOrGrants, resources, permissions) {
        var _a;
        try {
            // Overload: allow(grants[])
            if (Array.isArray(rolesOrGrants) && rolesOrGrants.length > 0 && typeof rolesOrGrants[0] === 'object') {
                return __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_allowBatch).call(this, rolesOrGrants);
            }
            const roles = toArray(rolesOrGrants);
            const res = toArray(resources);
            const perms = toArray(permissions);
            const v1 = validateNonEmpty(roles, 'Role');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(res, 'Resource');
            if (v2)
                return v2;
            const v3 = validateNonEmpty(perms, 'Permission');
            if (v3)
                return v3;
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").meta, 'roles', roles);
            for (const resource of res) {
                for (const role of roles) {
                    await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, allowsBucket(String(resource)), role, perms);
                }
            }
            for (const role of roles) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").resources, role, res);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            (_a = __classPrivateFieldGet(this, _Acl_logger, "f")) === null || _a === void 0 ? void 0 : _a.debug({ roles, resources: res, permissions: perms }, 'allow');
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // User ↔ Role
    // -------------------------------------------------------------------------
    async addUserRoles(userId, roles) {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(roles, 'Role');
            if (v2)
                return v2;
            const rolesArr = toArray(roles);
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").meta, 'users', userId);
            await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").users, userId, roles);
            for (const role of rolesArr) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").roles, role, userId);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async removeUserRoles(userId, roles) {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(roles, 'Role');
            if (v2)
                return v2;
            const rolesArr = toArray(roles);
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").users, userId, roles);
            for (const role of rolesArr) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").roles, role, userId);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async userRoles(userId) {
        try {
            const data = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").users, userId);
            return ok(data);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async roleUsers(role) {
        try {
            const data = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").roles, role);
            return ok(data);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async hasRole(userId, role) {
        try {
            const result = await this.userRoles(userId);
            if (!result.ok)
                return result;
            return ok(result.data.includes(role));
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // Role hierarchy
    // -------------------------------------------------------------------------
    async addRoleParents(role, parents) {
        try {
            const v1 = validateNonEmpty(role, 'Role');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(parents, 'Parent role');
            if (v2)
                return v2;
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").meta, 'roles', role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").add(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").parents, role, parents);
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async removeRoleParents(role, parents) {
        try {
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            if (parents) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").parents, role, parents);
            }
            else {
                await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").parents, role);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async removeRole(role) {
        try {
            const v = validateNonEmpty(role, 'Role');
            if (v)
                return v;
            const resources = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").resources, role);
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            for (const resource of resources) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, allowsBucket(resource), role);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").resources, role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").parents, role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").roles, role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").meta, 'roles', role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // Resources
    // -------------------------------------------------------------------------
    async removeResource(resource) {
        try {
            const v = validateNonEmpty(resource, 'Resource');
            if (v)
                return v;
            const roles = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").meta, 'roles');
            const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
            await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, allowsBucket(resource), roles);
            for (const role of roles) {
                await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").resources, role, resource);
            }
            await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // Remove allow / permissions
    // -------------------------------------------------------------------------
    async removeAllow(role, resources, permissions) {
        try {
            const v1 = validateNonEmpty(role, 'Role');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(resources, 'Resource');
            if (v2)
                return v2;
            const res = toArray(resources);
            const perms = permissions ? toArray(permissions) : undefined;
            await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_removePermissions).call(this, role, res, perms);
            return okVoid;
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // Permission queries
    // -------------------------------------------------------------------------
    async allowedPermissions(userId, resources) {
        try {
            if (!userId)
                return ok({});
            const res = toArray(resources);
            const rolesResult = await this.userRoles(userId);
            if (!rolesResult.ok)
                return rolesResult;
            const roles = rolesResult.data;
            const result = {};
            for (const resource of res) {
                result[resource] = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_resourcePermissions).call(this, roles, resource);
            }
            return ok(result);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async isAllowed(userId, resource, permissions) {
        try {
            const v1 = validateNonEmpty(userId, 'User ID');
            if (v1)
                return v1;
            const v2 = validateNonEmpty(resource, 'Resource');
            if (v2)
                return v2;
            const v3 = validateNonEmpty(permissions, 'Permission');
            if (v3)
                return v3;
            const roles = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").users, userId);
            if (roles.length === 0)
                return ok(false);
            return this.areAnyRolesAllowed(roles, resource, permissions);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    async areAnyRolesAllowed(roles, resource, permissions) {
        try {
            const rolesArr = toArray(roles);
            if (rolesArr.length === 0)
                return ok(false);
            const permsArr = toArray(permissions);
            const allowed = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_checkPermissions).call(this, rolesArr, resource, permsArr);
            return ok(allowed);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
    // -------------------------------------------------------------------------
    // What resources
    // -------------------------------------------------------------------------
    async whatResources(roles, permissions) {
        try {
            const rolesArr = toArray(roles);
            const permsArr = permissions ? toArray(permissions) : undefined;
            const data = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_permittedResources).call(this, rolesArr, permsArr);
            return ok(data);
        }
        catch (e) {
            return err('BACKEND_ERROR', e.message);
        }
    }
}
_Acl_backend = new WeakMap(), _Acl_buckets = new WeakMap(), _Acl_logger = new WeakMap(), _Acl_instances = new WeakSet(), _Acl_allowBatch = async function _Acl_allowBatch(grants) {
    for (const g of grants) {
        for (const a of g.allows) {
            const result = await this.allow(g.roles, a.resources, a.permissions);
            if (!result.ok)
                return result;
        }
    }
    return okVoid;
}, _Acl_removePermissions = async function _Acl_removePermissions(role, resources, permissions) {
    const tx = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
    for (const resource of resources) {
        const bucket = allowsBucket(resource);
        if (permissions) {
            await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, bucket, role, permissions);
        }
        else {
            await __classPrivateFieldGet(this, _Acl_backend, "f").del(tx, bucket, role);
            await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx, __classPrivateFieldGet(this, _Acl_buckets, "f").resources, role, resource);
        }
    }
    await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx);
    // Clean up resources with empty permission sets (not fully atomic)
    const tx2 = await __classPrivateFieldGet(this, _Acl_backend, "f").begin();
    for (const resource of resources) {
        const bucket = allowsBucket(resource);
        const remaining = await __classPrivateFieldGet(this, _Acl_backend, "f").get(bucket, role);
        if (remaining.length === 0) {
            await __classPrivateFieldGet(this, _Acl_backend, "f").remove(tx2, __classPrivateFieldGet(this, _Acl_buckets, "f").resources, role, resource);
        }
    }
    await __classPrivateFieldGet(this, _Acl_backend, "f").end(tx2);
}, _Acl_permittedResources = async function _Acl_permittedResources(roles, permissions) {
    const resources = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_rolesResources).call(this, roles);
    if (!permissions) {
        const result = {};
        for (const resource of resources) {
            result[resource] = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_resourcePermissions).call(this, roles, resource);
        }
        return result;
    }
    const result = [];
    for (const resource of resources) {
        const perms = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_resourcePermissions).call(this, roles, resource);
        if (intersect(permissions, perms).length > 0) {
            result.push(resource);
        }
    }
    return result;
}, _Acl_rolesParents = 
// -------------------------------------------------------------------------
// Private helpers
// -------------------------------------------------------------------------
async function _Acl_rolesParents(roles) {
    return __classPrivateFieldGet(this, _Acl_backend, "f").union(__classPrivateFieldGet(this, _Acl_buckets, "f").parents, roles);
}, _Acl_allRoles = async function _Acl_allRoles(roleNames) {
    const parents = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_rolesParents).call(this, roleNames);
    if (parents.length > 0) {
        const parentRoles = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_allRoles).call(this, parents);
        return union(roleNames, parentRoles);
    }
    return roleNames;
}, _Acl_allUserRoles = async function _Acl_allUserRoles(userId) {
    const result = await this.userRoles(userId);
    const roles = result.ok ? result.data : [];
    if (roles.length > 0) {
        return __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_allRoles).call(this, roles);
    }
    return [];
}, _Acl_rolesResources = async function _Acl_rolesResources(roles) {
    const allRoles = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_allRoles).call(this, roles);
    let result = [];
    for (const role of allRoles) {
        const resources = await __classPrivateFieldGet(this, _Acl_backend, "f").get(__classPrivateFieldGet(this, _Acl_buckets, "f").resources, role);
        result = result.concat(resources);
    }
    return [...new Set(result)];
}, _Acl_resourcePermissions = async function _Acl_resourcePermissions(roles, resource) {
    if (roles.length === 0)
        return [];
    const perms = await __classPrivateFieldGet(this, _Acl_backend, "f").union(allowsBucket(resource), roles);
    const parents = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_rolesParents).call(this, roles);
    if (parents.length > 0) {
        const parentPerms = await __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_resourcePermissions).call(this, parents, resource);
        return union(perms, parentPerms);
    }
    return perms;
}, _Acl_checkPermissions = 
/**
 * Recursively checks whether the given roles satisfy ALL requested permissions
 * for a resource, walking up the parent hierarchy.
 *
 * NOTE: Does not handle circular parent graphs — will infinite-loop.
 */
async function _Acl_checkPermissions(roles, resource, permissions) {
    const resourcePerms = await __classPrivateFieldGet(this, _Acl_backend, "f").union(allowsBucket(resource), roles);
    if (resourcePerms.includes('*'))
        return true;
    const remaining = difference(permissions, resourcePerms);
    if (remaining.length === 0)
        return true;
    const parents = await __classPrivateFieldGet(this, _Acl_backend, "f").union(__classPrivateFieldGet(this, _Acl_buckets, "f").parents, roles);
    if (parents.length > 0) {
        return __classPrivateFieldGet(this, _Acl_instances, "m", _Acl_checkPermissions).call(this, parents, resource, remaining);
    }
    return false;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0FjbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFrQkEsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFbEQsOEVBQThFO0FBQzlFLFVBQVU7QUFDViw4RUFBOEU7QUFFOUUsTUFBTSxPQUFPLEdBQUcsQ0FBSSxDQUFVLEVBQU8sRUFBRSxDQUNuQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFL0IsTUFBTSxZQUFZLEdBQUcsQ0FBQyxRQUFnQixFQUFVLEVBQUUsQ0FDOUMsVUFBVSxRQUFRLEVBQUUsQ0FBQztBQUV6QixNQUFNLG1CQUFtQixHQUFHLENBQUMsR0FBVyxFQUFVLEVBQUUsQ0FDaEQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFaEMsK0NBQStDO0FBQy9DLE1BQU0sS0FBSyxHQUFHLENBQUksQ0FBTSxFQUFFLENBQU0sRUFBTyxFQUFFLENBQ3JDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRS9CLHdDQUF3QztBQUN4QyxNQUFNLFVBQVUsR0FBRyxDQUFJLENBQU0sRUFBRSxDQUFNLEVBQU8sRUFBRTtJQUMxQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQztBQUVGLG1DQUFtQztBQUNuQyxNQUFN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