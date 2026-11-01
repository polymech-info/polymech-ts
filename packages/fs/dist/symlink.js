import * as fs from 'fs';
import { mkdirp, mkdirpSync } from 'mkdirp';
import * as pathUtil from "path";
import { validateArgument } from './utils/validate.js';
const promisedSymlink = fs.promises.symlink;
export function validateInput(methodName, symlinkValue, path) {
    const methodSignature = methodName + '(symlinkValue, path)';
    validateArgument(methodSignature, 'symlinkValue', symlinkValue, ['string']);
    validateArgument(methodSignature, 'path', path, ['string']);
}
;
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export function sync(symlinkValue, path) {
    try {
        fs.symlinkSync(symlinkValue, path);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            // Parent directories don't exist. Just create them and rety.
            mkdirpSync(pathUtil.dirname(path));
            fs.symlinkSync(symlinkValue, path);
        }
        else {
            throw err;
        }
    }
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
export function async(symlinkValue, path) {
    return new Promise((resolve, reject) => {
        promisedSymlink(symlinkValue, path)
            .then(resolve)
            .catch((err) => {
            if (err.code === 'ENOENT') {
                // Parent directories don't exist. Just create them and rety.
                mkdirp(pathUtil.dirname(path))
                    .then(() => { return promisedSymlink(symlinkValue, path); })
                    .then(resolve, reject);
            }
            else {
                reject(err);
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltbGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zeW1saW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQzNDLE9BQU8sS0FBTSxRQUFRLE1BQU0sTUFBTSxDQUFBO0FBQ2pDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRXRELE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFBO0FBRTNDLE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxZQUFvQixFQUFFLElBQVk7SUFDbEYsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLHNCQUFzQixDQUFDO0lBQzVELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RSxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUFBLENBQUM7QUFDRiw0REFBNEQ7QUFDNUQsT0FBTztBQUNQLDREQUE0RDtBQUU1RCxNQUFNLFVBQVUsSUFBSSxDQUFDLFlBQW9CLEVBQUUsSUFBWTtJQUNyRCxJQUFJLENBQUM7UUFDSCxFQUFFLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMxQiw2REFBNkQ7WUFDN0QsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNuQyxFQUFFLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sR0FBRyxDQUFDO1FBQ1osQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsNERBQTREO0FBQzVELFFBQVE7QUFDUiw0REFBNEQ7QUFDNUQsTUFBTSxVQUFVLEtBQUssQ0FBQyxZQUFvQixFQUFFLElBQVk7SUFDdEQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxlQUFlLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQzthQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQ2IsS0FBSyxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUU7WUFDbEIsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMxQiw2REFBNkQ7Z0JBQzdELE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUMzQixJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsT0FBTyxlQUFlLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUMzRCxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMifQ==