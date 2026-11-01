import * as pathUtil from 'path';
import { sync as treeWalkerSync, stream as treeWalkerStream } from './utils/tree_walker.js';
import { sync as inspectSync, async as inspectASync } from './inspect.js';
import { create as matcher } from './utils/matcher.js';
import { validateArgument, validateOptions } from './utils/validate.js';
import { ENodeType } from './interfaces.js';
import { ErrDoesntExists, ErrIsNotDirectory } from './errors.js';
export function validateInput(methodName, path, options) {
    const methodSignature = methodName + '([path], options)';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateOptions(methodSignature, 'options', options, {
        matching: ['string', 'array of string'],
        files: ['boolean'],
        directories: ['boolean'],
        recursive: ['boolean']
    });
}
const defaults = (options) => {
    const opts = options || {};
    // defaults:
    if (opts.files === undefined) {
        opts.files = true;
    }
    if (opts.directories === undefined) {
        opts.directories = false;
    }
    if (opts.recursive === undefined) {
        opts.recursive = true;
    }
    return opts;
};
const processFoundObjects = (foundObjects, cwd) => foundObjects.map((inspectObj) => pathUtil.relative(cwd, inspectObj.absolutePath));
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export const findSync = (path, options) => processFoundObjects(findSyncEx(path, options), options.cwd);
export const findSyncEx = (path, options) => {
    const foundInspectObjects = [];
    const matchesAnyOfGlobs = matcher(path, options.matching);
    treeWalkerSync(path, {
        maxLevelsDeep: options.recursive ? Infinity : 1,
        inspectOptions: {
            absolutePath: true,
            ...options.inspectOptions || {}
        }
    }, (itemPath, item) => {
        if (itemPath !== path && matchesAnyOfGlobs(itemPath)) {
            if ((item.type === ENodeType.FILE && options.files === true)
                || (item.type === ENodeType.DIR && options.directories === true)) {
                foundInspectObjects.push(item);
            }
        }
    });
    return foundInspectObjects;
};
export function sync(path, options) {
    const entryPointInspect = inspectSync(path);
    if (entryPointInspect === undefined) {
        throw ErrDoesntExists(path);
    }
    else if (entryPointInspect.type !== 'dir') {
        throw ErrIsNotDirectory(path);
    }
    return findSync(path, defaults(options));
}
export const syncEx = (path, options) => {
    const entryPointInspect = inspectSync(path);
    if (entryPointInspect === undefined) {
        throw ErrDoesntExists(path);
    }
    else if (entryPointInspect.type !== 'dir') {
        throw ErrIsNotDirectory(path);
    }
    return findSyncEx(path, defaults(options));
};
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
const findAsync = (path, options) => {
    return new Promise((resolve, reject) => {
        const foundInspectObjects = [];
        const matchesAnyOfGlobs = matcher(path, options.matching);
        const walker = treeWalkerStream(path, {
            maxLevelsDeep: options.recursive ? Infinity : 1,
            inspectOptions: {
                absolutePath: true
            }
        }).on('readable', () => {
            const data = walker.read();
            let item;
            if (data && data.path !== path && matchesAnyOfGlobs(data.path)) {
                item = data.item;
                if ((item.type === ENodeType.FILE && options.files === true)
                    || (item.type === ENodeType.DIR && options.directories === true)) {
                    foundInspectObjects.push(item);
                }
            }
        }).on('error', reject)
            .on('end', () => {
            resolve(processFoundObjects(foundInspectObjects, options.cwd));
        });
    });
};
export function async(path, options) {
    return inspectASync(path).then(entryPointInspect => {
        if (entryPointInspect === undefined) {
            throw ErrDoesntExists(path);
        }
        else if (entryPointInspect.type !== ENodeType.DIR) {
            throw ErrIsNotDirectory(path);
        }
        return findAsync(path, defaults(options));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9maW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBTSxRQUFRLE1BQU0sTUFBTSxDQUFBO0FBQ2pDLE9BQU8sRUFBRSxJQUFJLElBQUksY0FBYyxFQUFFLE1BQU0sSUFBSSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBQzNGLE9BQU8sRUFBRSxJQUFJLElBQUksV0FBVyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFDekUsT0FBTyxFQUFFLE1BQU0sSUFBSSxPQUFPLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUN0RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDdkUsT0FBTyxFQUFTLFNBQVMsRUFBbUIsTUFBTSxpQkFBaUIsQ0FBQTtBQUNuRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sYUFBYSxDQUFBO0FBVWhFLE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxJQUFZLEVBQUUsT0FBa0I7SUFDakYsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLG1CQUFtQixDQUFDO0lBQ3pELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RCxlQUFlLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUU7UUFDcEQsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDO1FBQ3ZDLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBQztRQUNsQixXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUM7UUFDeEIsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDO0tBQ3RCLENBQUMsQ0FBQTtBQUNILENBQUM7QUFFRCxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQWtCLEVBQVksRUFB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