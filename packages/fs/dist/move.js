import * as pathUtil from 'path';
import { rename, renameSync } from 'fs';
import { async as existsAsync, sync as existsSync } from './exists.js';
import { validateArgument } from './utils/validate.js';
import { ErrDoesntExists } from './errors.js';
import { EError } from './interfaces.js';
import { sync as copySync } from './copy.js';
import { sync as removeSync } from './remove.js';
import { promisify } from 'util';
import { async as mkdirAsync, sync as dirSync } from './dir.js';
export const validateInput = (methodName, from, to) => {
    const methodSignature = methodName + '(from, to)';
    validateArgument(methodSignature, 'from', from, ['string']);
    validateArgument(methodSignature, 'to', to, ['string']);
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export const sync = (from, to) => {
    try {
        renameSync(from, to);
    }
    catch (err) {
        // not the same device, rename doesnt work here
        if (err.code === EError.CROSS_DEVICE) {
            try {
                copySync(from, to);
            }
            catch (e) {
                throw e;
            }
            try {
                removeSync(from);
            }
            catch (e) {
                throw e;
            }
            return;
        }
        if (err.code !== EError.NOEXISTS) {
            // We can't make sense of this error. Rethrow it.
            throw err;
        }
        else {
            // Ok, source or destination path doesn't exist.
            // Must do more investigation.
            if (!existsSync(from)) {
                throw ErrDoesntExists(from);
            }
            if (!existsSync(to)) {
                // Some parent directory doesn't exist. Create it.
                dirSync(pathUtil.dirname(to));
                // Retry the attempt
                renameSync(from, to);
            }
        }
    }
};
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
const ensureDestinationPathExistsAsync = (to) => {
    return new Promise((resolve, reject) => {
        const destDir = pathUtil.dirname(to);
        existsAsync(destDir)
            .then(dstExists => {
            if (!dstExists) {
                mkdirAsync(destDir).then(resolve, reject);
            }
            else {
                // Hah, no idea.
                reject();
            }
        })
            .catch(reject);
    });
};
export const async = (from, to) => {
    return new Promise((resolve, reject) => {
        promisify(rename)(from, to)
            .then(resolve)
            .catch(err => {
            if (err.code !== EError.NOEXISTS) {
                // Something unknown. Rethrow original error.
                reject(err);
            }
            else {
                // Ok, source or destination path doesn't exist.
                // Must do more investigation.
                existsAsync(from)
                    .then(srcExists => {
                    if (!srcExists) {
                        reject(ErrDoesntExists(from));
                    }
                    else {
                        ensureDestinationPathExistsAsync(to)
                            // Retry the attempt
                            .then(() => promisify(rename)(from, to))
                            .then(resolve, reject);
                    }
                })
                    .catch(reject);
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb3ZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBTSxRQUFRLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxLQUFLLElBQUksV0FBVyxFQUFFLElBQUksSUFBSSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdkUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDdkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM5QyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLElBQUksSUFBSSxRQUFRLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDN0MsT0FBTyxFQUFFLElBQUksSUFBSSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDakQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNqQyxPQUFPLEVBQUUsS0FBSyxJQUFJLFVBQVUsRUFBRSxJQUFJLElBQUksT0FBTyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRWhFLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQWtCLEVBQUUsSUFBWSxFQUFFLEVBQVUsRUFBRSxFQUFFO0lBQzdFLE1BQU0sZUFBZSxHQUFXLFVBQVUsR0FBRyxZQUFZLENBQUM7SUFDMUQsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDLENBQUM7QUFDRiw0REFBNEQ7QUFDNUQsT0FBTztBQUNQ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