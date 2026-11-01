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
var _AclVfsClient_instances, _AclVfsClient_acl, _AclVfsClient_local, _AclVfsClient_ownerId, _AclVfsClient_callerId, _AclVfsClient_guard;
import { LocalVFS } from './fs/Local.js';
import { resourceChain } from './vfs-acl.js';
import { cleanUuid, cleanId, sanitizeSubpath, ANONYMOUS_USER_ID, AUTHENTICATED_USER_ID } from './sanitizers.js';
export class AclVfsClient {
    /**
     * @param acl       Populated Acl instance (call `loadVfsSettings` first)
     * @param ownerId   UUID of the folder owner
     * @param callerId  UUID of the user performing the operation, or 'anonymous'
     * @param fsOpts    LocalVFS options (must include `root`)
     */
    constructor(acl, ownerId, callerId, fsOpts) {
        _AclVfsClient_instances.add(this);
        _AclVfsClient_acl.set(this, void 0);
        _AclVfsClient_local.set(this, void 0);
        _AclVfsClient_ownerId.set(this, void 0);
        _AclVfsClient_callerId.set(this, void 0);
        __classPrivateFieldSet(this, _AclVfsClient_acl, acl, "f");
        __classPrivateFieldSet(this, _AclVfsClient_local, new LocalVFS(fsOpts), "f");
        __classPrivateFieldSet(this, _AclVfsClient_ownerId, cleanUuid(ownerId), "f");
        __classPrivateFieldSet(this, _AclVfsClient_callerId, cleanId(callerId), "f");
    }
    // ── Read operations ─────────────────────────────────────────────
    async stat(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'read', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").stat(path);
    }
    async readdir(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'list', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").readdir(path);
    }
    async readfile(path, options) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'read', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").readfile(path, options);
    }
    async exists(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'read', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").exists(path);
    }
    // ── Write operations ────────────────────────────────────────────
    async writefile(path, content, options) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'write', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").writefile(path, content, options);
    }
    async mkfile(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'write', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").mkfile(path);
    }
    async mkdir(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'mkdir', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").mkdir(path, { recursive: true });
    }
    async mkdirP(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'write', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").mkdirP(path);
    }
    // ── Delete operations ───────────────────────────────────────────
    async rmfile(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'delete', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").rmfile(path);
    }
    async rmdir(path) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'delete', path);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").rmdir(path);
    }
    // ── Move / Copy ─────────────────────────────────────────────────
    async rename(from, to) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'rename', from);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").rename(from, to);
    }
    async copy(from, to) {
        await __classPrivateFieldGet(this, _AclVfsClient_instances, "m", _AclVfsClient_guard).call(this, 'copy', from);
        return __classPrivateFieldGet(this, _AclVfsClient_local, "f").copy(from, to);
    }
}
_AclVfsClient_acl = new WeakMap(), _AclVfsClient_local = new WeakMap(), _AclVfsClient_ownerId = new WeakMap(), _AclVfsClient_callerId = new WeakMap(), _AclVfsClient_instances = new WeakSet(), _AclVfsClient_guard = 
// ── Guards ──────────────────────────────────────────────────────
/**
 * Walk the resource chain from most-specific path to root.
 * If ANY level grants the permission, access is allowed.
 * This means a grant on `/` covers the entire tree.
 *
 * For non-anonymous callers, also checks grants given to the
 * `'authenticated'` sentinel, so a single grant can cover all
 * logged-in users.
 */
async function _AclVfsClient_guard(permission, path) {
    const safePath = sanitizeSubpath(path);
    const chain = resourceChain(__classPrivateFieldGet(this, _AclVfsClient_ownerId, "f"), safePath);
    // 1. Check caller-specific grants
    for (const resource of chain) {
        const result = await __classPrivateFieldGet(this, _AclVfsClient_acl, "f").isAllowed(__classPrivateFieldGet(this, _AclVfsClient_callerId, "f"), resource, permission);
        if (result.ok && result.data)
            return;
    }
    // 2. For non-anonymous callers, check 'authenticated' group grants
    if (__classPrivateFieldGet(this, _AclVfsClient_callerId, "f") !== ANONYMOUS_USER_ID) {
        for (const resource of chain) {
            const result = await __classPrivateFieldGet(this, _AclVfsClient_acl, "f").isAllowed(AUTHENTICATED_USER_ID, resource, permission);
            if (result.ok && result.data)
                return;
        }
    }
    const err = new Error(`EACCES: user '${__classPrivateFieldGet(this, _AclVfsClient_callerId, "f")}' lacks '${permission}' on path '${path}'`);
    err.code = 'EACCES';
    throw err;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNsVmZzQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Zmcy9BY2xWZnNDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBcUJBLE9BQU8sRUFBRSxRQUFRLEVBQTJCLE1BQU0sZUFBZSxDQUFDO0FBQ2xFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFaEgsTUFBTSxPQUFPLFlBQVk7SUFNckI7Ozs7O09BS0c7SUFDSCxZQUFZLEdBQVEsRUFBRSxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxNQUEwQjs7UUFYMUUsb0NBQVU7UUFDVixzQ0FBaUI7UUFDakIsd0NBQWlCO1FBQ2pCLHlDQUFrQjtRQVN2Qix1QkFBQSxJQUFJLHFCQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2hCLHVCQUFBLElBQUksdUJBQVUsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQUEsQ0FBQztRQUNuQyx1QkFBQSxJQUFJLHlCQUFZLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBQSxDQUFDO1FBQ25DLHVCQUFBLElBQUksMEJBQWEsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFBLENBQUM7SUFDdkMsQ0FBQztJQXNDRCxtRUFBbUU7SUFFbkUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFZO1FBQ25CLE1BQU0sdUJBQUEsSUFBSSxvREFBTyxNQUFYLElBQUksRUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyx1QkFBQSxJQUFJLDJCQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVk7UUFDdEIsTUFBTSx1QkFBQSxJQUFJLG9EQUFPLE1BQVgsSUFBSSxFQUFRLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxPQUFPLHVCQUFBLElBQUksMkJBQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBWSxFQUFFLE9BQWlDO1FBQzFELE1BQU0sdUJBQUEsSUFBSSxvREFBTyxNQUFYLElBQUksRUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyx1QkFBQSxJQUFJLDJCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZO1FBQ3JCLE1BQU0sdUJBQUEsSUFBSSxvREFBTyxNQUFYLElBQUksRUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyx1QkFBQSxJQUFJLDJCQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxtRUFBbUU7SUFFbkUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFZLEVBQUUsT0FBd0IsRUFBRSxPQUFpQztRQUNyRixNQUFNLHVCQUFBLElBQUksb0RBQU8sTUFBWCxJQUFJLEVBQVEsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sdUJBQUEsSUFBSSwyQkFBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVk7UUFDckIsTUFBTSx1QkFBQSxJQUFJLG9EQUFPLE1BQVgsSUFBSSxFQUFRLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxPQUFPLHVCQUFBLElBQUksMkJBQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBWTtRQUNwQixNQUFNLHVCQUFBLElBQUksb0RBQU8sTUFBWCxJQUFJLEVBQVEsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sdUJBQUEsSUFBSSwyQkFBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsbUVBQW1FO0lBRW5FLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUNyQixNQUFNLHVCQUFBLElBQUksb0RBQU8sTUFBWCxJQUFJLEVBQVEsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sdUJBQUEsSUFBSSwyQkFBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFZO1FBQ3BCLE1BQU0sdUJBQUEsSUFBSSxvREFBTyxNQUFYLElBQUksRUFBUSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsT0FBTyx1QkFBQSxJQUFJLDJCQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxtRUFBbUU7SUFFbkUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZLEVBQUUsRUFBVTtRQUNqQyxNQUFNLHVCQUFBLElBQUksb0RBQU8sTUFBWCxJQUFJLEVBQVEsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sdUJBQUEsSUFBSSwyQkFBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWSxFQUFFLEVBQVU7UUFDL0IsTUFBTSx1QkFBQSxJQUFJLG9EQUFPLE1BQVgsSUFBSSxFQUFRLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxPQUFPLHVCQUFBLElBQUksMkJBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7Q0FDSjs7QUFsR0csbUVBQW1FO0FBRW5FOzs7Ozs7OztHQVFHO0FBQ0gsS0FBSyw4QkFBUSxVQUFrQixFQUFFLElBQVk7SUFDekMsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyx1QkFBQSxJQUFJLDZCQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFckQsa0NBQWtDO0lBQ2xDLEtBQUssTUFBTSxRQUFRLElBQUksS0FBSyxFQUFFLENBQUM7UUFDM0IsTUFBTSxNQUFNLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHlCQUFLLENBQUMsU0FBUyxDQUFDLHVCQUFBLElBQUksOEJBQVUsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDL0UsSUFBSSxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJO1lBQUUsT0FBTztJQUN6QyxDQUFDO0lBRUQsbUVBQW1FO0lBQ25FLElBQUksdUJBQUEsSUFBSSw4QkFBVSxLQUFLLGlCQUFpQixFQUFFLENBQUM7UUFDdkMsS0FBSyxNQUFNLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUMzQixNQUFNLE1BQU0sR0FBRyxNQUFNLHVCQUFBLElBQUkseUJBQUssQ0FBQyxTQUFTLENBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RGLElBQUksTUFBTSxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSTtnQkFBRSxPQUFPO1FBQ3pDLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxLQUFLLENBQ2pCLGlCQUFpQix1QkFBQSxJQUFJLDhCQUFVLFlBQVksVUFBVSxjQUFjLElBQUksR0FBRyxDQUM3RSxDQUFDO0lBQ0QsR0FBNkIsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQy9DLE1BQU0sR0FBRyxDQUFDO0FBQ2QsQ0FBQyJ9