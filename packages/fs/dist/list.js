import { readdirSync, readdir } from 'fs';
import { validateArgument } from './utils/validate.js';
import { isMacintosh } from './utils/platform.js';
import { normalizeNFC } from './utils/strings.js';
export function validateInput(methodName, path) {
    const methodSignature = methodName + '(path)';
    validateArgument(methodSignature, 'path', path, ['string', 'undefined']);
}
export function _readdirSync(path) {
    // Mac: uses NFD unicode form on disk, but we want NFC
    // See also https://github.com/nodejs/node/issues/2165
    if (isMacintosh) {
        return readdirSync(path).map(c => normalizeNFC(c));
    }
    return readdirSync(path);
}
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export function sync(path) {
    try {
        return _readdirSync(path);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            // Doesn't exist. Return undefined instead of throwing.
            return undefined;
        }
        throw err;
    }
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
function readdirASync(path) {
    // export function readdir(path: string | Buffer, callback?: (err: NodeJS.ErrnoException, files: string[]) => void): void;
    // Mac: uses NFD unicode form on disk, but we want NFC
    // See also https://github.com/nodejs/node/issues/2165
    return new Promise((resolve, reject) => {
        if (isMacintosh) {
            readdir(path, (err, files) => {
                if (err) {
                    reject(err);
                }
                resolve(files);
            });
        }
        readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files);
        });
    });
}
export function async(path) {
    return new Promise((resolve, reject) => {
        readdirASync(path)
            .then((list) => resolve(list))
            .catch(err => (err.code === 'ENOENT' ? resolve(undefined) : reject(err)));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFbEQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxVQUFrQixFQUFFLElBQVk7SUFDN0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLFFBQVEsQ0FBQztJQUM5QyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQVk7SUFDeEMsc0RBQXNEO0lBQ3RELHNEQUFzRDtJQUN0RCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2pCLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBQ0QsNERBQTREO0FBQzVELE9BQU87QUFDUCw0REFBNEQ7QUFDNUQsTUFBTSxVQUFVLElBQUksQ0FBQyxJQUFZO0lBQ2hDLElBQUksQ0FBQztRQUNKLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzNCLHVEQUF1RDtZQUN2RCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxHQUFHLENBQUM7SUFDWCxDQUFDO0FBQ0YsQ0FBQztBQUVELDREQUE0RDtBQUM1RCxRQUFRO0FBQ1IsNERBQTREO0FBQzVELFNBQVMsWUFBWSxDQUFDLElBQVk7SUFDakMsMEhBQTBIO0lBQzFILHNEQUFzRDtJQUN0RCxzREFBc0Q7SUFFdEQsT0FBTyxJQUFJLE9BQU8sQ0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNoRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUEwQixFQUFFLEtBQWUsRUFBRSxFQUFFO2dCQUM3RCxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixDQUFDO2dCQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBMEIsRUFBRSxLQUFlLEVBQUUsRUFBRTtZQUM3RCxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFDRCxNQUFNLFVBQVUsS0FBSyxDQUFDLElBQVk7SUFDakMsT0FBTyxJQUFJLE9BQU8sQ0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNoRCxZQUFZLENBQUMsSUFBSSxDQUFDO2FBQ2hCLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzdCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMifQ==