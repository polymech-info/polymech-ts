var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { LocalVFS } from './fs/Local.js';
import { resourceChain } from './vfs-acl.js';
import { cleanUuid, sanitizeSubpath } from './sanitizers.js';
// ---------------------------------------------------------------------------
// Decorator factory
// ---------------------------------------------------------------------------
/**
 * TC39 Stage-3 method decorator.
 *
 * Intercepts the method call, extracts the first argument as `path`,
 * walks the resource chain, and throws EACCES if denied.
 */
function aclGuard(permission) {
    return function (target, context) {
        const methodName = String(context.name);
        return async function (...args) {
            const path = sanitizeSubpath(args[0]);
            const chain = resourceChain(this.ownerId, path);
            for (const resource of chain) {
                const result = await this.acl.isAllowed(this.callerId, resource, permission);
                if (result.ok && result.data) {
                    return target.call(this, ...args);
                }
            }
            const err = new Error(`EACCES: user '${this.callerId}' lacks '${permission}' on path '${path}' [${methodName}]`);
            err.code = 'EACCES';
            throw err;
        };
    };
}
// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
/**
 * Decorator-based ACL VFS client.
 *
 * Properties are public (not #private) so the decorator can access them.
 * This is the trade-off: decorators can't reach private fields.
 */
let DecoratedVfsClient = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _stat_decorators;
    let _readdir_decorators;
    let _readfile_decorators;
    let _exists_decorators;
    let _writefile_decorators;
    let _mkfile_decorators;
    let _mkdir_decorators;
    let _rmfile_decorators;
    let _rmdir_decorators;
    let _rename_decorators;
    let _copy_decorators;
    return _a = class DecoratedVfsClient {
            constructor(acl, ownerId, callerId, fsOpts) {
                this.acl = __runInitializers(this, _instanceExtraInitializers);
                this.acl = acl;
                this.local = new LocalVFS(fsOpts);
                this.ownerId = cleanUuid(ownerId);
                this.callerId = cleanUuid(callerId);
            }
            // ── Read ────────────────────────────────────────────────────────
            async stat(path) {
                return this.local.stat(path);
            }
            async readdir(path) {
                return this.local.readdir(path);
            }
            async readfile(path, options) {
                return this.local.readfile(path, options);
            }
            async exists(path) {
                return this.local.exists(path);
            }
            // ── Write ───────────────────────────────────────────────────────
            async writefile(path, content, options) {
                return this.local.writefile(path, content, options);
            }
            async mkfile(path) {
                return this.local.mkfile(path);
            }
            async mkdir(path) {
                return this.local.mkdir(path, { recursive: true });
            }
            // ── Delete ──────────────────────────────────────────────────────
            async rmfile(path) {
                return this.local.rmfile(path);
            }
            async rmdir(path) {
                return this.local.rmdir(path);
            }
            // ── Move / Copy ─────────────────────────────────────────────────
            async rename(from, to) {
                return this.local.rename(from, to);
            }
            async copy(from, to) {
                return this.local.copy(from, to);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _stat_decorators = [aclGuard('read')];
            _readdir_decorators = [aclGuard('list')];
            _readfile_decorators = [aclGuard('read')];
            _exists_decorators = [aclGuard('read')];
            _writefile_decorators = [aclGuard('write')];
            _mkfile_decorators = [aclGuard('write')];
            _mkdir_decorators = [aclGuard('mkdir')];
            _rmfile_decorators = [aclGuard('delete')];
            _rmdir_decorators = [aclGuard('delete')];
            _rename_decorators = [aclGuard('rename')];
            _copy_decorators = [aclGuard('copy')];
            __esDecorate(_a, null, _stat_decorators, { kind: "method", name: "stat", static: false, private: false, access: { has: obj => "stat" in obj, get: obj => obj.stat }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _readdir_decorators, { kind: "method", name: "readdir", static: false, private: false, access: { has: obj => "readdir" in obj, get: obj => obj.readdir }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _readfile_decorators, { kind: "method", name: "readfile", static: false, private: false, access: { has: obj => "readfile" in obj, get: obj => obj.readfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _exists_decorators, { kind: "method", name: "exists", static: false, private: false, access: { has: obj => "exists" in obj, get: obj => obj.exists }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _writefile_decorators, { kind: "method", name: "writefile", static: false, private: false, access: { has: obj => "writefile" in obj, get: obj => obj.writefile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _mkfile_decorators, { kind: "method", name: "mkfile", static: false, private: false, access: { has: obj => "mkfile" in obj, get: obj => obj.mkfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _mkdir_decorators, { kind: "method", name: "mkdir", static: false, private: false, access: { has: obj => "mkdir" in obj, get: obj => obj.mkdir }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _rmfile_decorators, { kind: "method", name: "rmfile", static: false, private: false, access: { has: obj => "rmfile" in obj, get: obj => obj.rmfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _rmdir_decorators, { kind: "method", name: "rmdir", static: false, private: false, access: { has: obj => "rmdir" in obj, get: obj => obj.rmdir }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _rename_decorators, { kind: "method", name: "rename", static: false, private: false, access: { has: obj => "rename" in obj, get: obj => obj.rename }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _copy_decorators, { kind: "method", name: "copy", static: false, private: false, access: { has: obj => "copy" in obj, get: obj => obj.copy }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { DecoratedVfsClient };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVjb3JhdGVkVmZzQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Zmcy9EZWNvcmF0ZWRWZnNDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxPQUFPLEVBQUUsUUFBUSxFQUEyQixNQUFNLGVBQWUsQ0FBQztBQUNsRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFN0QsOEVBQThFO0FBQzlFLG9CQUFvQjtBQUNwQiw4RUFBOEU7QUFFOUU7Ozs7O0dBS0c7QUFDSCxTQUFTLFFBQVEsQ0FBQyxVQUFrQjtJQUNoQyxPQUFPLFVBQ0gsTUFBMkMsRUFDM0MsT0FBNEU7UUFFNUUsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QyxPQUFPLEtBQUssV0FBb0IsR0FBRyxJQUFPO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVoRCxLQUFLLE1BQU0sUUFBUSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMzQixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLE1BQU0sQ0FBQyxFQUFFLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUMzQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ3RD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