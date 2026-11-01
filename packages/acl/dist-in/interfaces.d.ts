/**
 * @polymech/acl — Type definitions
 *
 * Pure ESM, zero external dependencies.
 * All methods are async (native Promise).
 */
export type Value = string | number;
export type Values = Value | Value[];
export type AclErrorCode = 'OK' | 'INVALID_INPUT' | 'NOT_FOUND' | 'BACKEND_ERROR';
export interface AclOk<T = void> {
    readonly ok: true;
    readonly code: 'OK';
    readonly data: T;
}
export interface AclErr {
    readonly ok: false;
    readonly code: Exclude<AclErrorCode, 'OK'>;
    readonly message: string;
}
export type AclResult<T = void> = AclOk<T> | AclErr;
export declare const ok: <T>(data: T) => AclOk<T>;
export declare const okVoid: AclOk<void>;
export declare const err: (code: AclErr["code"], message: string) => AclErr;
export interface BucketNames {
    readonly meta: string;
    readonly parents: string;
    readonly permissions: string;
    readonly resources: string;
    readonly roles: string;
    readonly users: string;
}
export interface AclOptions {
    buckets?: Partial<BucketNames>;
}
/**
 * Transaction-based storage backend.
 *
 * `T` is the transaction type (e.g. `(() => void)[]` for in-memory).
 */
export interface IBackend<T = unknown> {
    begin(): T | Promise<T>;
    end(transaction: T): Promise<void>;
    clean(): Promise<void>;
    get(bucket: string, key: Value): Promise<string[]>;
    union(bucket: string, keys: Value[]): Promise<string[]>;
    unions(buckets: string[], keys: Value[]): Promise<Record<string, string[]>>;
    add(transaction: T, bucket: string, key: Value, values: Values): void | Promise<void>;
    del(transaction: T, bucket: string, keys: Values): void | Promise<void>;
    remove(transaction: T, bucket: string, key: Value, values: Values): void | Promise<void>;
}
export interface IAcl {
    allow(roles: Values, resources: Values, permissions: Values): Promise<AclResult>;
    allow(grants: AclGrant[]): Promise<AclResult>;
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
export interface AclGrant {
    roles: Values;
    allows: AclAllow[];
}
export interface AclAllow {
    resources: Values;
    permissions: Values;
}
export interface IFileStore {
    read(path?: string): void | Promise<void>;
    write(path?: string): void | Promise<void>;
}
