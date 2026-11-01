/**
 * @polymech/acl — Core ACL class
 *
 * Zend_ACL-inspired role-based access control.
 * Pure ESM, async/await, zero lodash/bluebird.
 */
import type { Logger } from 'pino';
import type { AclGrant, AclOptions, AclResult, IBackend, IAcl, Value, Values } from './interfaces.js';
export declare class Acl implements IAcl {
    #private;
    constructor(backend: IBackend<unknown>, logger?: Logger, options?: AclOptions);
    allow(rolesOrGrants: Values | AclGrant[], resources?: Values, permissions?: Values): Promise<AclResult>;
    addUserRoles(userId: Value, roles: Values): Promise<AclResult>;
    removeUserRoles(userId: Value, roles: Values): Promise<AclResult>;
    userRoles(userId: Value): Promise<AclResult<string[]>>;
    roleUsers(role: Value): Promise<AclResult<string[]>>;
    hasRole(userId: Value, role: string): Promise<AclResult<boolean>>;
    addRoleParents(role: string, parents: Values): Promise<AclResult>;
    removeRoleParents(role: string, parents?: Values): Promise<AclResult>;
    removeRole(role: string): Promise<AclResult>;
    removeResource(resource: string): Promise<AclResult>;
    removeAllow(role: string, resources: Values, permissions?: Values): Promise<AclResult>;
    allowedPermissions(userId: Value, resources: Values): Promise<AclResult<Record<string, string[]>>>;
    isAllowed(userId: Value, resource: string, permissions: Values): Promise<AclResult<boolean>>;
    areAnyRolesAllowed(roles: Values, resource: string, permissions: Values): Promise<AclResult<boolean>>;
    whatResources(roles: Values, permissions?: Values): Promise<AclResult<Record<string, string[]> | string[]>>;
}
