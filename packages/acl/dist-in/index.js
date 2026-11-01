/**
 * @polymech/acl — Public API
 */
export { Acl } from './Acl.js';
export { MemoryBackend } from './data/MemoryBackend.js';
export { FileBackend } from './data/FileBackend.js';
export { ok, okVoid, err } from './interfaces.js';
// VFS
export { AclVfsClient } from './vfs/AclVfsClient.js';
export { DecoratedVfsClient } from './vfs/DecoratedVfsClient.js';
export { loadVfsSettings, vfsResource, resourceChain } from './vfs/vfs-acl.js';
export { DefaultSanitizers } from './vfs/sanitizers.js';
export { assertNonEmpty, cleanPath, pathSegments, normalisePath, cleanPermission, cleanPermissions, isUuid, cleanUuid, cleanId, cleanGroupName, sanitizeSubpath, sanitizeWritePath, sanitizeFilename, ANONYMOUS_USER_ID, AUTHENTICATED_USER_ID, } from './vfs/sanitizers.js';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFDSCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQy9CLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFnQnBELE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRWxELE1BQU07QUFDTixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFL0UsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDeEQsT0FBTyxFQUNILGNBQWMsRUFDZCxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFDdEMsZUFBZSxFQUFFLGdCQUFnQixFQUNqQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQzFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFDcEQsaUJBQWlCLEVBQ2pCLHFCQUFxQixHQUN4QixNQUFNLHFCQUFxQixDQUFDIn0=