import * as pathUtil from 'path';
import * as fs from 'fs';
import { symlinkSync, readFileSync, createReadStream, createWriteStream } from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { sync as existsSync, async as existsASync } from './exists.js';
import { create as matcher } from './utils/matcher.js';
import { normalizeFileMode as fileMode } from './utils/mode.js';
import { sync as treeWalkerSync } from './utils/tree_walker.js';
import { validateArgument, validateOptions } from './utils/validate.js';
import { sync as writeSync } from './write.js';
import { ErrDestinationExists, ErrDoesntExists } from './errors.js';
import { ErrnoException, ENodeType, ECopyFlags, ENodeOperationStatus, EError, EInspectFlags, EResolveMode, EResolve } from './interfaces.js';
import { createItem } from './inspect.js';
import { sync as rmSync } from './remove.js';
import { promisify } from './promisify.js';
import { async as iteratorAsync } from './iterator.js';
//import { ArrayIterator } from '@polymech/core/iterator';
const promisedSymlink = promisify(fs.symlink);
const promisedReadlink = promisify(fs.readlink);
const promisedUnlink = promisify(fs.unlink);
const promisedMkdirp = promisify(mkdirp);
const CPROGRESS_THRESHOLD = 1048576 * 5; // minimum file size threshold to use write progress = 5MB
export function validateInput(methodName, from, to, options) {
    const methodSignature = methodName + '(from, to, [options])';
    validateArgument(methodSignature, 'from', from, ['string']);
    validateArgument(methodSignature, 'to', to, ['string']);
    validateOptions(methodSignature, 'options', options, {
        overwrite: ['boolean'],
        matching: ['string', 'array of string'],
        progress: ['function'],
        content: ['function'],
        writeProgress: ['function'],
        conflictCallback: ['function'],
        conflictSettings: ['object'],
        throttel: ['number'],
        debug: ['boolean'],
        flags: ['number']
    });
}
const parseOptions = (options, from) => {
    const opts = options || {};
    const parsedOptions = {};
    parsedOptions.overwrite = opts.overwrite;
    parsedOptions.progress = opts.progress;
    parsedOptions.writeProgress = opts.writeProgress;
    parsedOptions.content = opts.content;
    parsedOptions.conflictCallback = opts.conflictCallback;
    parsedOptions.conflictSettings = opts.conflictSettings;
    parsedOptions.debug = opts.debug;
    parsedOptions.throttel = opts.throttel;
    parsedOptions.renameCallback = opts.renameCallback;
    parsedOptions.flags = opts.flags || 0;
    if (opts.filter) {
        parsedOptions.filter = opts.filter;
    }
    else if (opts.matching) {
        parsedOptions.filter = matcher(from, opts.matching);
    }
    else {
        parsedOptions.filter = () => {
            return true;
        };
    }
    return parsedOptions;
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
const checksBeforeCopyingSync = (from, to, options = {}) => {
    if (!existsSync(from)) {
        throw ErrDoesntExists(from);
    }
    if (existsSync(to) && !options.overwrite) {
        throw ErrDestinationExists(to);
    }
};
async function copyFileSyncWithProgress(from, to, options = {}) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        let cbCalled = false;
        let elapsed = Date.now();
        let speed = 0;
        const done = (err) => {
            if (!cbCalled) {
                cbCalled = true;
                resolve(1);
            }
        };
        const rd = createReadStream(from).
            on('error', (err) => done(err));
        /*
        const str = progress({
            length: fs.statSync(from).size,
            time: 100
        }).on('progress', (e: any) => {
            elapsed = (Date.now() - started) / 1000;
            speed = e.transferred / elapsed;
            if (options.writeProgress) {
                options.writeProgress(from, e.transferred, e.length);
            }
        });
        */
        const wr = createWriteStream(to);
        wr.on('error', (err) => done(err));
        wr.on('close', done);
        //rd.pipe(str).pipe(wr);
    });
}
async function copyFileSync(from, to, mode, options) {
    let data = readFileSync(from);
    const writeOptions = {
        mode: mode
    };
    if (options.renameCallback) {
        const rename = options.renameCallback(from, to);
        if (rename) {
            to = rename;
        }
    }
    if (options.content) {
        data = options.content(from, data, createItem(from));
    }
    if (options && options.writeProgress) {
        await copyFileSyncWithProgress(from, to, options);
    }
    else {
        writeSync(to, data, writeOptions);
    }
}
const copySymlinkSync = (from, to) => {
    const symlinkPointsAt = fs.readlinkSync(from);
    try {
        symlinkSync(symlinkPointsAt, to);
    }
    catch (err) {
        // There is already file/symlink with this name on destination location.
        // Must erase it manually, otherwise system won't allow us to place symlink there.
        if (err.code === 'EEXIST') {
            fs.unlinkSync(to);
            // Retry...
            fs.symlinkSync(symlinkPointsAt, to);
        }
        else {
            throw err;
        }
    }
};
async function copyItemSync(from, inspectData, to, options) {
    const mode = fileMode(inspectData.mode);
    if (inspectData.type === ENodeType.DIR) {
        if (options.renameCallback) {
            const rename = options.renameCallback(from, to);
            if (rename) {
                to = rename;
            }
        }
        mkdirp(to, { mode: parseInt(mode, 8), fs: null });
    }
    else if (inspectData.type === ENodeType.FILE) {
        await copyFileSync(from, to, mode, options);
    }
    else if (inspectData.type === ENodeType.SYMLINK) {
        if (options.renameCallback) {
            const rename = options.renameCallback(from, to);
            if (rename) {
                to = rename;
            }
        }
        copySymlinkSync(from, to);
    }
}
export function sync(from, to, options) {
    const opts = parseOptions(options, from);
    checksBeforeCopyingSync(from, to, opts);
    const nodes = [];
    let sizeTotal = 0;
    if (options && options.flags & ECopyFlags.EMPTY) {
        const dstStat = fs.statSync(to);
        if (dstStat.isDirectory()) {
            rmSync(to);
        }
    }
    const visitor = (path, inspectData) => {
        if (opts.filter(path)) {
            nodes.push({
                path: path,
                item: inspectData,
                dst: pathUtil.resolve(to, pathUtil.relative(from, path))
            });
            sizeTotal += inspectData.size;
        }
    };
    treeWalkerSync(from, {
        inspectOptions: {
            mode: true,
            symlinks: true
        }
    }, visitor);
    nodes.map((item, current) => {
        copyItemSync(item.path, item.item, item.dst, options);
        if (opts.progress) {
            opts.progress(item.path, current, nodes.length, item.item, item.dst);
        }
    });
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
/**
 *
 *
 * @param {string} from
 * @param {string} to
 * @param {ICopyOptions} opts
 * @returns {(Promise<IConflictSettings | any>)}
 */
const checkAsync = (from, to, opts) => {
    return existsASync(from)
        .then(srcPathExists => {
        if (!srcPathExists) {
            throw ErrDoesntExists(from);
        }
        else {
            return existsASync(to);
        }
    })
        .then(destPathExists => {
        if (destPathExists) {
            if (opts.conflictSettings) {
                return Promise.resolve(opts.conflictSettings);
            }
            if (opts.conflictCallback) {
                const promise = opts.conflictCallback(to, createItem(to), EError.EXISTS);
                promise.then((settings) => {
                    settings.error = EError.EXISTS;
                });
                return promise;
            }
            if (!opts.overwrite) {
                throw ErrDestinationExists(to);
            }
        }
    });
};
const copyFileAsync = (from, to, mode, options, retriedAttempt) => {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(from);
        const writeStream = fs.createWriteStream(to, { mode: mode });
        readStream.on('error', reject);
        writeStream.on('error', (err) => {
            const toDirPath = pathUtil.dirname(to);
            // Force read stream to close, since write stream errored
            // read stream serves us no purpose.
            readStream.resume();
            if (err.code === EError.NOEXISTS && retriedAttempt === undefined) {
                // Some parent directory doesn't exits. Create it and retry.
                promisedMkdirp(toDirPath, null).then(() => {
                    // Make retry attempt only once to prevent vicious infinite loop
                    // (when for some obscure reason I/O will keep returning ENOENT error).
                    // Passing retriedAttempt = true.
                    copyFileAsync(from, to, mode, null, true)
                        .then(resolve)
                        .catch(reject);
                });
            }
            else {
                reject(err);
            }
        });
        writeStream.on('finish', () => {
            // feature: preserve times
            if (options && options.flags & ECopyFlags.PRESERVE_TIMES) {
                const sourceStat = fs.statSync(from);
                fs.open(to, 'w', (err, fd) => {
                    if (err) {
                        throw err;
                    }
                    fs.futimes(fd, sourceStat.atime, sourceStat.mtime, (err2) => {
                        if (err2) {
                            throw err2;
                        }
                        fs.close(fd, null);
                        resolve(1);
                    });
                });
            }
            else {
                resolve(1);
            }
        });
        const size = fs.statSync(from).size;
        let progressStream = null;
        if (options && options.writeProgress && size > CPROGRESS_THRESHOLD) {
            /*
            progressStream = progress({
                length: fs.statSync(from).size,
                time: 100 // call progress each 100 ms
            });*/
            let elapsed = Date.now();
            let speed = 0;
            const started = Date.now();
            progressStream.on('progress', (e) => {
                elapsed = (Date.now() - started) / 1000;
                speed = e.transferred / elapsed;
                options.writeProgress(from, e.transferred, e.length);
                if (options.debug) {
                    console.log('write ' + from + ' (' + e.transferred + ' of ' + e.length);
                }
            });
            readStream.pipe(progressStream).pipe(writeStream);
        }
        else {
            if (options && options.debug) {
                console.log('write ' + from + ' to ' + to);
            }
            readStream.pipe(writeStream);
        }
    });
};
export function copySymlinkAsync(from, to) {
    return promisedReadlink(from)
        .then((symlinkPointsAt) => {
        return new Promise((resolve, reject) => {
            promisedSymlink(symlinkPointsAt, to, null)
                .then(resolve)
                .catch((err) => {
                if (err.code === EError.EXISTS) {
                    // There is already file/symlink with this name on destination location.
                    // Must erase it manually, otherwise system won't allow us to place symlink there.
                    promisedUnlink(to, null)
                        // Retry...
                        .then(() => {
                        return promisedSymlink(symlinkPointsAt, to, null);
                    })
                        .then(resolve, reject);
                }
                else {
                    reject(err);
                }
            });
        });
    });
}
const copyItemAsync = (from, inspectData, to, options) => {
    const mode = fileMode(inspectData.mode);
    if (inspectData.type === ENodeType.DIR) {
        return promisedMkdirp(to, { mode: mode });
    }
    else if (inspectData.type === ENodeType.FILE) {
        return copyFileAsync(from, to, mode, options);
    }
    else if (inspectData.type === ENodeType.SYMLINK) {
        return copySymlinkAsync(from, to);
    }
    // EInspectItemType.OTHER
    return Promise.resolve();
};
// handle user side setting "THROW" and non enum values (null)
const onConflict = (from, to, options, settings) => {
    switch (settings.overwrite) {
        case EResolveMode.THROW: {
            throw ErrDestinationExists(to);
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
export function resolveConflict(from, to, options, resolveMode) {
    if (resolveMode === undefined) {
        return true;
    }
    const src = createItem(from);
    const dst = createItem(to);
    if (resolveMode === EResolveMode.SKIP) {
        return false;
    }
    else if (resolveMode === EResolveMode.IF_NEWER) {
        if (src.type === ENodeType.DIR && dst.type === ENodeType.DIR) {
            return true;
        }
        if (dst.modifyTime.getTime() > src.modifyTime.getTime()) {
            return false;
        }
    }
    else if (resolveMode === EResolveMode.IF_SIZE_DIFFERS) {
        // @TODO : not implemented: copy EInspectItemType.DIR with ECopyResolveMode.IF_SIZE_DIFFERS
        if (src.type === ENodeType.DIR && dst.type === ENodeType.DIR) {
            return true;
        }
        else if (src.type === ENodeType.FILE && dst.type === ENodeType.FILE) {
            if (src.size === dst.size) {
                return false;
            }
        }
    }
    else if (resolveMode === EResolveMode.OVERWRITE) {
        return true;
    }
    else if (resolveMode === EResolveMode.ABORT) {
        return false;
    }
}
function isDone(nodes) {
    let done = true;
    nodes.forEach((element) => {
        if (element.status !== ENodeOperationStatus.DONE) {
            done = false;
        }
    });
    return done;
}
/**
 * A callback for treeWalkerStream. This is called when a node has been found.
 *
 * @param {string} from
 * @param {string} to
 * @param {*} vars
 * @param {{ path: string, item: INode }} item
 * @returns {Promise<void>}
 */
async function visitor(from, to, vars, item) {
    const options = vars.options;
    let rel;
    let destPath;
    if (!item) {
        return;
    }
    rel = pathUtil.relative(from, item.path);
    destPath = pathUtil.resolve(to, rel);
    item.status = ENodeOperationStatus.PROCESSING;
    const done = () => {
        item.status = ENodeOperationStatus.DONE;
        if (isDone(vars.nodes)) {
            return vars.resolve(vars.result);
        }
    };
    if (isDone(vars.nodes)) {
        return vars.resolve(vars.result);
    }
    vars.filesInProgress += 1;
    // our main function after sanity checks
    const checked = (subResolveSettings) => {
        item.status = ENodeOperationStatus.CHECKED;
        // feature : report
        if (subResolveSettings && options && options.flags && options.flags & ECopyFlags.REPORT) {
            vars.result.push({
                error: subResolveSettings.error,
                node: item,
                resolved: subResolveSettings
            });
        }
        if (subResolveSettings) {
            // if the first resolve callback returned an individual resolve settings "THIS",
            // ask the user again with the same item
            const always = subResolveSettings.mode === EResolve.ALWAYS;
            if (always) {
                options.conflictSettings = subResolveSettings;
            }
            let overwriteMode = subResolveSettings.overwrite;
            overwriteMode = onConflict(item.path, destPath, options, subResolveSettings);
            if (overwriteMode === EResolveMode.ABORT) {
                vars.abort = true;
            }
            if (vars.abort) {
                return;
            }
            if (!resolveConflict(item.path, destPath, options, overwriteMode)) {
                done();
                return;
            }
        }
        item.status = ENodeOperationStatus.PROCESS;
        copyItemAsync(item.path, item.item, destPath, options).then(() => {
            vars.filesInProgress -= 1;
            if (options.progress) {
                if (options.progress(item.path, vars.filesInProgress, vars.filesInProgress, item.item) === false) {
                    vars.abort = true;
                    return vars.resolve();
                }
            }
            done();
        }).catch((err) => {
            if (options && options.conflictCallback) {
                if (err.code === EError.PERMISSION || err.code === EError.NOEXISTS) {
                    options.conflictCallback(item.path, createItem(destPath), err.code).then((errorResolveSettings) => {
                        // the user has set the conflict resolver to always, so we use the last one
                        if (vars.onCopyErrorResolveSettings) {
                            errorResolveSettings = vars.onCopyErrorResolveSettings;
                        }
                        // user said use this settings always, we track and use this last setting from now on
                        if (errorResolveSettings.mode === EResolve.ALWAYS && !vars.onCopyErrorResolveSettings) {
                            vars.onCopyErrorResolveSettings = errorResolveSettings;
                        }
                        if (errorResolveSettings.overwrite === EResolveMode.ABORT) {
                            vars.abort = true;
                            return vars.resolve();
                        }
                        if (errorResolveSettings.overwrite === EResolveMode.THROW) {
                            vars.abort = true;
                            return vars.reject(err);
                        }
                        if (errorResolveSettings.overwrite === EResolveMode.SKIP) {
                            vars.filesInProgress -= 1;
                        }
                        // user error, should never happen, unintended
                        if (errorResolveSettings.overwrite === EResolveMode.IF_NEWER ||
                            errorResolveSettings.overwrite === EResolveMode.IF_SIZE_DIFFERS ||
                            errorResolveSettings.overwrite === EResolveMode.OVERWRITE) {
                            vars.reject(new ErrnoException('settings make no sense : errorResolveSettings.overwrite = ' + errorResolveSettings.overwrite));
                        }
                    });
                }
            }
            vars.reject(err);
        });
    };
    return checkAsync(item.path, destPath, options).then(checked);
}
function next(nodes) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].status === ENodeOperationStatus.COLLECTED) {
            return nodes[i];
        }
    }
    return null;
}
/**
 * Final async copy function.
 * @export
 * @param {string} from
 * @param {string} to
 * @param {ICopyOptions} [options]
 * @returns
 */
export function async(from, to, options) {
    options = parseOptions(options, from);
    return new Promise((resolve, reject) => {
        checkAsync(from, to, options).then((resolver) => {
            if (!resolver) {
                resolver = options.conflictSettings || {
                    mode: EResolve.THIS,
                    overwrite: EResolveMode.OVERWRITE
                };
            }
            else {
                if (resolver.mode === EResolve.ALWAYS) {
                    options.conflictSettings = resolver;
                }
            }
            let overwriteMode = resolver.overwrite;
            let result = void 0;
            if (options && options.flags && options.flags & ECopyFlags.REPORT) {
                result = [];
            }
            // call onConflict to eventually throw an error
            overwriteMode = onConflict(from, to, options, resolver);
            // now evaluate the copy conflict settings and eventually abort
            if (options && options.conflictSettings && !resolveConflict(from, to, options, overwriteMode)) {
                return resolve();
            }
            // feature: clean before
            if (options && options.flags) {
                const dstStat = fs.statSync(to);
                if (dstStat.isDirectory()) {
                    rmSync(to);
                }
            }
            // walker variables
            const visitorArgs = {
                resolve: resolve,
                reject: reject,
                abort: false,
                filesInProgress: 0,
                resolveSettings: resolver,
                options: options,
                result: result,
                nodes: [],
                onCopyErrorResolveSettings: null
            };
            const nodes = visitorArgs.nodes;
            // a function called when the treeWalkerStream or visitor has been finished
            const process = function () {
                visitorArgs.nodes = nodes;
                if (isDone(nodes)) {
                    return resolve(result);
                }
                if (nodes.length) {
                    const item = next(nodes);
                    if (item) {
                        visitor(item.path, item.dst, visitorArgs, item).then(process);
                    }
                }
            };
            let flags = EInspectFlags.MODE;
            if (options && options.flags && options.flags & ECopyFlags.FOLLOW_SYMLINKS) {
                flags |= EInspectFlags.SYMLINKS;
            }
            iteratorAsync(from, {
                filter: options.filter,
                flags: flags
            }).then((it) => {
                let node;
                while (node = it.next()) {
                    nodes.push({
                        path: node.path,
                        item: node.item,
                        dst: pathUtil.resolve(to, pathUtil.relative(from, node.path)),
                        status: ENodeOperationStatus.COLLECTED
                    });
                }
                process();
            });
        }).catch(reject);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBTSxRQUFRLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3BGLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBRXhDLE9BQU8sRUFBRSxJQUFJLElBQUksVUFBVSxFQUFFLEtBQUssSUFBSSxXQUFXLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdkUsT0FBTyxFQUFFLE1BQU0sSUFBSSxPQUFPLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RCxPQUFPLEVBQUUsaUJBQWlCLElBQUksUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDaEUsT0FBTyxFQUFFLElBQUksSUFBSSxjQUFjLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUNoRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDeEUsT0FBTyxFQUFFLElBQUksSUFBSSxTQUFTLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDL0MsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQVduRSxPQUFRLEVBQ1AsY0FBYyxFQUNkLFNBQVMsRUFDVCxVQUFVLEVBQ1Ysb0JBQW9CLEVBQ3BCLE1BQU0sRUFDTixhQUFhLEVBQ2IsWUFBWSxFQUNaLFFBQVEsRUFDUixNQUFNLGlCQUFpQixDQUFDO0FBRTFCLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0Ms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