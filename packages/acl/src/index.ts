/**
 * @polymech/acl — Public API
 */
export { Acl } from './Acl.js';
export { MemoryBackend } from './data/MemoryBackend.js';
export { FileBackend } from './data/FileBackend.js';
export type {
    IAcl,
    IBackend,
    IFileStore,
    AclGrant,
    AclAllow,
    AclOptions,
    AclErrorCode,
    AclOk,
    AclErr,
    AclResult,
    BucketNames,
    Value,
    Values,
} from './interfaces.js';
export { ok, okVoid, err } from './interfaces.js';

// VFS
export { AclVfsClient } from './vfs/AclVfsClient.js';
export { DecoratedVfsClient } from './vfs/DecoratedVfsClient.js';
export { loadVfsSettings, vfsResource, resourceChain } from './vfs/vfs-acl.js';
export type { VfsSettings, VfsAclEntry, VfsGroup } from './vfs/vfs-acl.js';
export { DefaultSanitizers } from './vfs/sanitizers.js';
export {
    assertNonEmpty,
    cleanPath, pathSegments, normalisePath,
    cleanPermission, cleanPermissions,
    isUuid, cleanUuid, cleanId, cleanGroupName,
    sanitizeSubpath, sanitizeWritePath, sanitizeFilename,
    ANONYMOUS_USER_ID,
    AUTHENTICATED_USER_ID,
} from './vfs/sanitizers.js';
