import { validateArgument } from './utils/validate.js';
import { sync as inspectSync } from './inspect.js';
import { async as listAsync, sync as listSync } from './list.js';
import * as pathUtil from 'path';
import { rmdir, unlink, rmdirSync, unlinkSync } from 'fs';
import { ErrNoFileOrDir } from './errors.js';
import { ErrnoException } from './interfaces.js';
import { create as matcher } from './utils/matcher.js';
import { ENodeOperationStatus, EDeleteFlags, EResolve, EResolveMode } from './interfaces.js';
import { createItem } from './inspect.js';
import { async as iteratorAsync } from './iterator.js';
import { ErrCantDelete } from './errors.js';
export function validateInput(methodName, path) {
    const methodSignature = methodName + '([path])';
    validateArgument(methodSignature, 'path', path, ['string', 'undefined']);
}
const parseOptions = (options, path) => {
    const opts = options || {};
    const parsedOptions = {};
    parsedOptions.progress = opts.progress;
    parsedOptions.conflictCallback = opts.conflictCallback;
    parsedOptions.conflictSettings = opts.conflictSettings;
    parsedOptions.debug = opts.debug;
    parsedOptions.matching = opts.matching;
    if (!opts.filter) {
        if (opts.matching) {
            parsedOptions.filter = matcher(path, opts.matching);
        }
        else {
            parsedOptions.filter = () => {
                return true;
            };
        }
    }
    return parsedOptions;
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export function sync(path, options) {
    const inspectedFile = inspectSync(path, { symlinks: true });
    if (inspectedFile === undefined) {
        // The path already doesn't exits. Nothing to do here.
    }
    else if (inspectedFile.type === 'dir') {
        listSync(path).forEach((filename) => {
            sync(pathUtil.join(path, filename));
        });
        rmdirSync(path);
    }
    else if (inspectedFile.type === 'file' || inspectedFile.type === 'symlink') {
        unlinkSync(path);
    }
    else {
        throw ErrNoFileOrDir(path);
    }
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
const rmASync = (path, options) => {
    return new Promise((resolve, reject) => {
        unlink(path, (err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
const isDone = (nodes) => {
    let done = true;
    nodes.forEach((element) => {
        if (element.status !== ENodeOperationStatus.DONE) {
            done = false;
        }
    });
    return done;
};
const next = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].status === ENodeOperationStatus.COLLECTED) {
            return nodes[i];
        }
    }
    return null;
};
// handle user side setting "THROW" and non enum values (null)
const onConflict = (from, options, settings) => {
    switch (settings.overwrite) {
        case EResolveMode.THROW: {
            throw ErrCantDelete(from);
        }
        case EResolveMode.OVERWRITE:
        case EResolveMode.APPEND:
        case EResolveMode.IF_NEWER:
        case EResolveMode.ABORT:
        case EResolveMode.IF_SIZE_DIFFERS:
        case EResolveMode.SKIP: {
            return settings.overwrite;
        }
        default: {
            return undefined;
        }
    }
};
export function resolveConflict(path, resolveMode) {
    if (resolveMode === undefined) {
        return true;
    }
    if (resolveMode === EResolveMode.SKIP) {
        return false;
    }
    else if (resolveMode === EResolveMode.ABORT) {
        return false;
    }
    else if (resolveMode === EResolveMode.RETRY) {
        return true;
    }
    return false;
}
const visitor = (path, vars, item) => {
    const options = vars.options;
    if (!item) {
        return;
    }
    item.status = ENodeOperationStatus.PROCESSING;
    const done = () => {
        item.status = ENodeOperationStatus.DONE;
        if (isDone(vars.nodes)) {
            return vars.resolve(vars.result);
        }
        else {
            if (vars.nodes.length) {
                const itemInner = next(vars.nodes);
                if (itemInner) {
                    visitor(itemInner.path, vars, itemInner);
                }
                else {
                    vars.resolve(vars.result);
                }
            }
        }
    };
    if (isDone(vars.nodes)) {
        return vars.resolve(vars.result);
    }
    vars.filesInProgress += 1;
    rmASync(path, options)
        .then((res) => {
        done();
    })
        .catch((err) => {
        if (err.code === 'EACCES' || err.code === 'EPERM' || err.code === 'EISDIR' || err.code === 'ENOTEMPTY') {
            const resolved = (settings) => {
                settings.error = err.code;
                // feature : report
                if (settings && options && options.flags && options.flags & EDeleteFlags.REPORT) {
                    vars.result.push({
                        error: settings.error,
                        node: item,
                        resolved: settings
                    });
                }
                if (settings) {
                    // if the first resolve callback returned an individual resolve settings "THIS",
                    // ask the user again with the same item
                    const always = settings.mode === EResolve.ALWAYS;
                    if (always) {
                        options.conflictSettings = settings;
                    }
                    let how = settings.overwrite;
                    how = onConflict(item.path, options, settings);
                    if (how === EResolveMode.ABORT) {
                        vars.abort = true;
                    }
                    if (vars.abort) {
                        done();
                        return;
                    }
                    if (!resolveConflict(item.path, how)) {
                        done();
                        return;
                    }
                    item.status = ENodeOperationStatus.PROCESS;
                    if (settings.overwrite === EResolveMode.RETRY) {
                        item.status = ENodeOperationStatus.COLLECTED;
                        visitor(path, vars, item);
                    }
                }
            };
            if (!options.conflictSettings) {
                const promise = options.conflictCallback(path, createItem(path), err.code);
                promise.then(resolved);
            }
            else {
                resolved(options.conflictSettings);
            }
        }
    });
};
async function collect(path, options) {
    return new Promise((resolve, reject) => {
        const all = [];
        iteratorAsync(path, {
            filter: options.filter
        }).then((it) => {
            let node;
            while (node = it.next()) {
                all.push({
                    path: node.path,
                    item: node.item,
                    status: ENodeOperationStatus.COLLECTED
                });
            }
            resolve(all);
        }).catch((err) => {
            console.error('read error', err);
        });
    });
}
export async function async(path, options) {
    options = parseOptions(options, path);
    const onError = (err, resolve, reject, nodes) => {
        if (err.code === 'EPERM' || err.code === 'EISDIR' || err.code === 'ENOTEMPTY') {
            const proceed = () => {
                // It's not a file, it's a directory.
                // Must delete everything inside first.
                listAsync(path).then((filenamesInsideDir) => {
                    const promises = filenamesInsideDir.map((filename) => {
                        return async(pathUtil.join(path, filename), options);
                    });
                    return Promise.all(promises);
                }).then(() => {
                    // Everything inside directory has been removed,
                    // it's safe now to go for the directory itself.
                    return rmdir(path, (err2) => {
                        if (err2) {
                            reject(err2);
                        }
                    });
                })
                    .then(resolve, reject);
            };
            // we have a user conflict callback,
            // collect nodes and start asking
            if (options.conflictCallback) {
                const result = void 0;
                // walker variables
                const visitorArgs = {
                    resolve: resolve,
                    reject: reject,
                    abort: false,
                    filesInProgress: 0,
                    resolveSettings: null,
                    options: options,
                    result: result,
                    nodes: nodes || []
                };
                const process = () => {
                    visitorArgs.nodes = nodes;
                    if (isDone(nodes)) {
                        return resolve(result);
                    }
                    if (nodes.length) {
                        const item = next(nodes);
                        if (item) {
                            visitor(item.path, visitorArgs, item);
                        }
                    }
                };
                if (!nodes) {
                    const _nodes = visitorArgs.nodes;
                    iteratorAsync(path, {
                        filter: options.filter
                    }).then((it) => {
                        let node;
                        while (node = it.next()) {
                            _nodes.push({
                                path: node.path,
                                item: node.item,
                                status: ENodeOperationStatus.COLLECTED
                            });
                        }
                        process();
                    }).catch((err2) => {
                        console.error('read error', err2);
                    });
                }
                else {
                    process();
                }
            }
            else {
                proceed();
            }
        }
        else if (err.code === 'ENOENT') {
            // File already doesn't exist. We're done.
            resolve();
        }
        else {
            // Something unexpected happened. Rethrow original error.
            reject(err);
        }
    };
    // if matching is set, its like rm somePath/*.ext
    // in this case, we collect the inner matching nodes and proceed as it
    // would be an error
    if (options.matching) {
        const nodes = await collect(path, options);
        const err = new ErrnoException('dummy');
        err.code = 'ENOTEMPTY';
        return new Promise((resolve, reject) => {
            onError(err, resolve, reject, nodes);
        });
    }
    else {
        return new Promise((resolve, reject) => {
            // Assume the path is a file or directory and just try to remove it.
            rmASync(path, options)
                .then((res) => resolve())
                .catch((err) => {
                onError(err, resolve, reject);
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlbW92ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUN0RCxPQUFPLEVBQUUsSUFBSSxJQUFJLFdBQVcsRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsS0FBSyxJQUFJLFNBQVMsRUFBRSxJQUFJLElBQUksUUFBUSxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBQ2hFLE9BQU8sS0FBSyxRQUFRLE1BQU0sTUFBTSxDQUFBO0FBQ2hDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUE7QUFDekQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUM1QyxPQUFPLEVBQW1DLGNBQWMsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBQ2pGLE9BQU8sRUFBRSxNQUFNLElBQUksT0FBTyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDdEQsT0FBTyxFQUFxQixvQkFBb0IsRUFBOEIsWUFBWSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUMzSSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBQ3pDLE9BQU8sRUFBRSxLQUFLLElBQUksYUFBYSxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBQ3RELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFM0MsTUFBTSxVQUFVLGFBQWEsQ0FBQyxVQUFrQixFQUFFLElBQVk7SUFDN0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUNoRCxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7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