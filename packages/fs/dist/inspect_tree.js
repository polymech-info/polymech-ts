import { createHash } from 'node:crypto';
import * as pathUtil from 'node:path';
import { sync as inspectSync, async as inspectASync, supportedChecksumAlgorithms } from './inspect.js';
import { ENodeType } from './interfaces.js';
import { sync as listSync, async as listASync } from './list.js';
import { validateArgument, validateOptions } from './utils/validate.js';
export function validateInput(methodName, path, options) {
    const methodSignature = methodName + '(path, options)';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateOptions(methodSignature, 'options', options, {
        checksum: ['string'],
        relativePath: ['boolean']
    });
    if (options && options.checksum !== undefined
        && supportedChecksumAlgorithms.indexOf(options.checksum) === -1) {
        throw new Error('Argument "options.checksum" passed to ' + methodSignature
            + ' must have one of values: ' + supportedChecksumAlgorithms.join(', '));
    }
}
function generateTreeNodeRelativePath(parent, path) {
    if (!parent) {
        return '.';
    }
    return parent.relativePath + '/' + pathUtil.basename(path);
}
// Creates checksum of a directory by using
// checksums and names of all its children inside.
const checksumOfDir = (inspectList, algo) => {
    const hash = createHash(algo);
    inspectList.forEach(function (inspectObj) {
        hash.update(inspectObj.name + inspectObj[algo]);
    });
    return hash.digest('hex');
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
function inspectTreeNodeSync(path, options, parent) {
    const treeBranch = inspectSync(path, { checksum: options.checksum, symlinks: options.symlinks });
    if (treeBranch) {
        if (options.relativePath) {
            treeBranch.relativePath = generateTreeNodeRelativePath(parent, path);
        }
        if (treeBranch.type === ENodeType.DIR /*|| (options.symlinks && treeBranch.type === 'symlink')*/) {
            treeBranch.size = 0;
            treeBranch.children = (listSync(path) || []).map(function (filename) {
                const subBranchPath = pathUtil.join(path, filename);
                const treeSubBranch = inspectTreeNodeSync(subBranchPath, options, treeBranch);
                // Add together all childrens' size to get directory combined size.
                treeBranch.size += treeSubBranch.size || 0;
                // treeBranch.total += treeSubBranch.total;
                return treeSubBranch;
            });
            if (options.checksum) {
                treeBranch[options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
            }
        }
    }
    return treeBranch;
}
export function sync(path, options) {
    options = options || {};
    options.symlinks = true;
    return inspectTreeNodeSync(path, options, undefined);
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
function inspectTreeNodeAsync(path, options, parent) {
    return new Promise((resolve, reject) => {
        const inspectAllChildren = (treeBranch) => {
            return new Promise((resolve, reject) => {
                listASync(path).then((children) => {
                    const doNext = (index) => {
                        let subPath;
                        if (index === children.length) {
                            if (options.checksum) {
                                // We are done, but still have to calculate checksum of whole directory.
                                [options.checksum] = checksumOfDir(treeBranch.children, options.checksum);
                            }
                            resolve(1);
                        }
                        else {
                            subPath = pathUtil.join(path, children[index]);
                            inspectTreeNodeAsync(subPath, options, treeBranch)
                                .then((treeSubBranch) => {
                                children[index] = treeSubBranch;
                                treeBranch.size += treeSubBranch.size || 0;
                                doNext(index + 1);
                            })
                                .catch(reject);
                        }
                    };
                    treeBranch.children = children;
                    treeBranch.size = 0;
                    doNext(0);
                });
            });
        };
        inspectASync(path, options)
            .then((treeBranch) => {
            if (!treeBranch) {
                // Given path doesn't exist. We are done.
                resolve(treeBranch);
            }
            else {
                if (options.relativePath) {
                    treeBranch.relativePath = generateTreeNodeRelativePath(parent, path);
                }
                if (treeBranch.type !== ENodeType.DIR) {
                    resolve(treeBranch);
                }
                else {
                    inspectAllChildren(treeBranch)
                        .then(() => resolve(treeBranch))
                        .catch(reject);
                }
            }
        })
            .catch(reject);
    });
}
export function async(path, options) {
    options = options || {};
    options.symlinks = true;
    return inspectTreeNodeAsync(path, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdF90cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2luc3BlY3RfdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ3hDLE9BQU8sS0FBTSxRQUFRLE1BQU0sV0FBVyxDQUFBO0FBQ3RDLE9BQU8sRUFBRSxJQUFJLElBQUksV0FBVyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFdEcsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRzNDLE9BQU8sRUFBRSxJQUFJLElBQUksUUFBUSxFQUFFLEtBQUssSUFBSSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDaEUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBUXZFLE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxJQUFZLEVBQUUsT0FBZ0I7SUFDL0UsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLGlCQUFpQixDQUFDO0lBQ3ZELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RCxlQUFlLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUU7UUFDcEQsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO1FBQ3BCLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQztLQUN6QixDQUFDLENBQUM7SUFFSCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFNBQVM7V0FDekMsMkJBQTJCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2xFLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLEdBQUcsZUFBZTtjQUN2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