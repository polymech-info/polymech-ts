import * as fs from 'node:fs';
import * as pathUtil from 'node:path';
import { stat, statSync, readdirSync, readdir } from 'fs';
import { promisify } from 'util';
import { sync as removeSync, async as removeAsync } from './remove.js';
import { normalizeFileMode as modeUtil } from './utils/mode.js';
import { validateArgument, validateOptions } from './utils/validate.js';
import { ErrNoDirectory } from './errors.js';
import { EError } from './interfaces.js';
import { sync as mkdirp } from 'mkdirp';
export const validateInput = (methodName, path, options) => {
    const methodSignature = methodName + '(path, [criteria])';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateOptions(methodSignature, 'criteria', options, {
        empty: ['boolean'],
        mode: ['string', 'number']
    });
};
const defaults = (options) => {
    const result = options || {};
    if (typeof result.empty !== 'boolean') {
        result.empty = false;
    }
    if (result.mode !== undefined) {
        result.mode = modeUtil(result.mode);
    }
    return result;
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
const dirStatsSync = (path) => {
    let _stat;
    try {
        _stat = statSync(path);
    }
    catch (err) {
        // Detection if path already exists
        if (err.code !== EError.NOEXISTS) {
            throw err;
        }
    }
    if (_stat && !_stat.isDirectory()) {
        throw ErrNoDirectory(path);
    }
    return _stat;
};
function mkdirSync(path, criteria) {
    mkdirp(path, { mode: criteria.mode, fs: null });
}
function checkDirSync(path, _stat, options) {
    const check = function () {
        if (options.mode !== undefined) {
            fs.chmodSync(path, options.mode);
        }
    };
    const checkEmptiness = function () {
        let list;
        if (options.empty) {
            // Delete everything inside this directory
            list = readdirSync(path);
            list.forEach(function (filename) {
                removeSync(pathUtil.resolve(path, filename));
            });
        }
    };
    check();
    checkEmptiness();
}
export const sync = (path, options) => {
    const criteria = defaults(options);
    const _stat = dirStatsSync(path);
    if (_stat) {
        checkDirSync(path, _stat, criteria);
    }
    else {
        mkdirSync(path, criteria);
    }
};
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
const promisedStat = promisify(stat);
const promisedReaddir = promisify(readdir);
const dirStatAsync = (path) => {
    return new Promise((resolve, reject) => {
        promisedStat(path)
            .then((_stat) => {
            if (_stat.isDirectory()) {
                resolve(_stat);
            }
            else {
                reject(ErrNoDirectory(path));
            }
        })
            .catch((err) => (err.code === EError.NOEXISTS ? resolve(undefined) : reject(err)));
    });
};
// Delete all files and directores inside given directory
const emptyAsync = (path) => {
    return new Promise((resolve, reject) => {
        promisedReaddir(path)
            .then(function (list) {
            const doOne = function (index) {
                let subPath;
                if (index === list.length) {
                    resolve(1);
                }
                else {
                    subPath = pathUtil.resolve(path, list[index]);
                    removeAsync(subPath).then(() => doOne(index + 1));
                }
            };
            doOne(0);
        })
            .catch(reject);
    });
};
const checkMode = function (criteria, _stat, path) {
    if (criteria.mode !== undefined) {
        return promisify(fs.chmod)(path, criteria.mode);
    }
    return Promise.resolve(null);
};
const checkDirAsync = (path, _stat, options) => {
    return new Promise((resolve, reject) => {
        const checkEmptiness = function () {
            if (options.empty) {
                return emptyAsync(path);
            }
            return Promise.resolve();
        };
        checkMode(options, _stat, path)
            .then(checkEmptiness)
            .then(resolve, reject);
    });
};
const mkdirAsync = (path, criteria) => {
    const options = criteria || {};
    return new Promise((resolve, reject) => {
        promisify(fs.mkdir)(path, options.mode)
            .then(resolve)
            .catch((err) => {
            if (err.code === 'ENOENT') {
                // Parent directory doesn't exist. Need to create it first.
                mkdirAsync(pathUtil.dirname(path), options)
                    .then(() => {
                    // Now retry creating this directory.
                    return promisify(fs.mkdir)(path, options.mode);
                })
                    .then(resolve)
                    .catch((err2) => {
                    if (err2.code === 'EEXIST') {
                        // Hmm, something other have already created the directory?
                        // No problem for us.
                        resolve(1);
                    }
                    else {
                        reject(err2);
                    }
                });
            }
            else if (err.code === 'EEXIST') {
                // The path already exists. We're fine.
                resolve(1);
            }
            else {
                reject(err);
            }
        });
    });
};
export const async = (path, passedCriteria) => {
    const criteria = defaults(passedCriteria);
    return new Promise((resolve, reject) => {
        dirStatAsync(path)
            .then((_stat) => {
            if (_stat !== undefined) {
                return checkDirAsync(path, _stat, criteria);
            }
            return mkdirAsync(path, criteria);
        })
            .then(resolve, reject);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2Rpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQUM3QixPQUFPLEtBQUssUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQVMsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ2hFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFDaEMsT0FBTyxFQUFFLElBQUksSUFBSSxVQUFVLEVBQUUsS0FBSyxJQUFJLFdBQVcsRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUN0RSxPQUFPLEVBQUUsaUJBQWlCLElBQUksUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDL0QsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3ZFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDNUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBQ3hDLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBT3ZDLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQWtCLEVBQUUsSUFBWSxFQUFFLE9BQWtCLEVBQUUsRUFBRTtJQUNyRixNQUFNLGVBQWUsR0FBRyxVQUFVLEdBQUcsb0JBQW9CLENBQUM7SUFDMUQsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVELGVBQWUsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRTtRQUNyRCxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUM7UUFDbEIsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FB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