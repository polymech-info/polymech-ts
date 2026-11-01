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
var _FileBackend_path;
/**
 * @polymech/acl — File-backed storage
 *
 * Extends MemoryBackend with JSON read/write via node:fs.
 * Intended for dev/testing use, not production.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MemoryBackend } from './MemoryBackend.js';
export class FileBackend extends MemoryBackend {
    constructor(filePath) {
        super();
        _FileBackend_path.set(this, void 0);
        __classPrivateFieldSet(this, _FileBackend_path, filePath, "f");
    }
    /** Load stored ACL data from disk into memory. */
    read(path) {
        const target = path !== null && path !== void 0 ? path : __classPrivateFieldGet(this, _FileBackend_path, "f");
        try {
            const raw = readFileSync(target, 'utf8');
            this.buckets = JSON.parse(raw);
        }
        catch (err) {
            const e = err;
            if (e.code === 'ENOENT') {
                mkdirSync(dirname(target), { recursive: true });
                return;
            }
            if (err instanceof SyntaxError) {
                // Corrupt JSON → reset
                writeFileSync(target, '', { mode: 0o600 });
                return;
            }
            throw err;
        }
    }
    /** Persist current ACL data to disk. */
    write(path) {
        const target = path !== null && path !== void 0 ? path : __classPrivateFieldGet(this, _FileBackend_path, "f");
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, JSON.stringify(this.buckets, null, 2), { mode: 0o600 });
    }
}
_FileBackend_path = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZUJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZGF0YS9GaWxlQmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBYyxNQUFNLFNBQVMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUduRCxNQUFNLE9BQU8sV0FBWSxTQUFRLGFBQWE7SUFHMUMsWUFBWSxRQUFnQjtRQUN4QixLQUFLLEVBQUUsQ0FBQztRQUhILG9DQUFjO1FBSW5CLHVCQUFBLElBQUkscUJBQVMsUUFBUSxNQUFBLENBQUM7SUFDMUIsQ0FBQztJQUVELGtEQUFrRDtJQUNsRCxJQUFJLENBQUMsSUFBYTtRQUNkLE1BQU0sTUFBTSxHQUFHLElBQUksYUFBSixJQUFJLGNBQUosSUFBSSxHQUFJLHVCQUFBLElBQUkseUJBQU0sQ0FBQztRQUNsQyxJQUFJLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQUMsT0FBTyxHQUFZLEVBQUUsQ0FBQztZQUNwQixNQUFNLENBQUMsR0FBRyxHQUE0QixDQUFDO1lBQ3ZDLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPO1lBQ1gsQ0FBQztZQUNELElBQUksR0FBRyxZQUFZLFdBQVcsRUFBRSxDQUFDO2dCQUM3Qix1QkFBdUI7Z0JBQ3ZCLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQzNDLE9BQU87WUFDWCxDQUFDO1lBQ0QsTUFBTSxHQUFHLENBQUM7UUFDZCxDQUFDO0lBQ0wsQ0FBQztJQUVELHdDQUF3QztJQUN4QyxLQUFLLENBQUMsSUFBYTtRQUNmLE1BQU0sTUFBTSxHQUFHLElBQUksYUFBSixJQUFJLGNBQUosSUFBSSxHQUFJLHVCQUFBLElBQUkseUJBQU0sQ0FBQztRQUNsQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEQsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDbEYsQ0FBQztDQUNKIn0=