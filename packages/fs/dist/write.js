import * as pathUtil from 'path';
import * as fs from 'fs';
import { writeFileSync } from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { json, file } from './imports.js';
import { validateArgument, validateOptions } from './utils/validate.js';
import { promisify } from './promisify.js';
const newExt = '.__new__';
export function validateInput(methodName, path, data, options) {
    const methodSignature = methodName + '(path, data, [options])';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateArgument(methodSignature, 'data', data, ['string', 'buffer', 'object', 'array']);
    validateOptions(methodSignature, 'options', options, {
        atomic: ['boolean'],
        jsonIndent: ['number'],
        progress: ['function']
    });
}
const toJson = (data, jsonIndent) => {
    if (typeof data === 'object'
        && !Buffer.isBuffer(data)
        && data !== null) {
        return json.serialize(data, null, typeof jsonIndent !== 'number' ? 2 : jsonIndent);
    }
    return data;
};
// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------
const _writeFileSync = (path, data, options) => {
    try {
        writeFileSync(path, data, options);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            // Means parent directory doesn't exist, so create it and try again.
            mkdirp(pathUtil.dirname(path));
            fs.writeFileSync(path, data, options);
        }
        else {
            throw err;
        }
    }
};
const writeAtomicSync = (path, data, options) => {
    return file.write_atomic(path + newExt, data, options, function () { });
};
export function sync(path, data, options) {
    const opts = options || {};
    const processedData = toJson(data, opts.jsonIndent);
    const writeStrategy = opts.atomic ? writeAtomicSync : _writeFileSync;
    writeStrategy(path, processedData, { mode: opts.mode });
}
// ---------------------------------------------------------
// ASYNC
// ---------------------------------------------------------
const promisedWriteFile = fs.promises.writeFile;
const promisedAtomic = promisify(writeAtomicSync);
function writeFileAsync(path, data, options) {
    return new Promise((resolve, reject) => {
        promisedWriteFile(path, data, options)
            .then(resolve)
            .catch((err) => {
            // First attempt to write a file ended with error.
            // Check if this is not due to nonexistent parent directory.
            if (err.code === 'ENOENT') {
                // Parent directory doesn't exist, so create it and try again.
                mkdirp(pathUtil.dirname(path));
                promisedWriteFile(path, data, options);
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
export function async(path, data, options) {
    const opts = options || {};
    const processedData = toJson(data, opts.jsonIndent);
    return (opts.atomic ? promisedAtomic : writeFileAsync)(path, processedData, { mode: opts.mode });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvd3JpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLFFBQVEsTUFBTSxNQUFNLENBQUE7QUFDaEMsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUE7QUFDeEIsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLElBQUksQ0FBQTtBQUNsQyxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLFFBQVEsQ0FBQTtBQUN2QyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUV6QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDdkUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQzFDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQTtBQUV6QixNQUFNLFVBQVUsYUFBYSxDQUFDLFVBQWtCLEVBQUUsSUFBWSxFQUFFLElBQXVCLEVBQUUsT0FBc0I7SUFDOUcsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLHlCQUF5QixDQUFDO0lBQy9ELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RCxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDekYsZUFBZSxDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFO1FBQ3BELE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQztRQUNuQixVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDdEIsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDO0tBQ3RCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFN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