import * as  pathUtil from 'path'
import { sync as treeWalkerSync, stream as treeWalkerStream } from './utils/tree_walker.js'
import { sync as inspectSync, async as inspectASync } from './inspect.js'
import { create as matcher } from './utils/matcher.js'
import { validateArgument, validateOptions } from './utils/validate.js'
import { INode, ENodeType, IInspectOptions } from './interfaces.js'
import { ErrDoesntExists, ErrIsNotDirectory } from './errors.js'

export interface IOptions {
	matching?: string[]
	files?: boolean
	directories?: boolean
	recursive?: boolean
	cwd?: string
	inspectOptions?: IInspectOptions
}
export function validateInput(methodName: string, path: string, options?: IOptions): void {
	const methodSignature = methodName + '([path], options)';
	validateArgument(methodSignature, 'path', path, ['string']);
	validateOptions(methodSignature, 'options', options, {
		matching: ['string', 'array of string'],
		files: ['boolean'],
		directories: ['boolean'],
		recursive: ['boolean']
	})
}

const defaults = (options?: IOptions): IOptions => {
	const opts = options || {} as IOptions;
	// defaults:
	if (opts.files === undefined) {
		opts.files = true
	}
	if (opts.directories === undefined) {
		opts.directories = false
	}
	if (opts.recursive === undefined) {
		opts.recursive = true
	}
	return opts
}

const processFoundObjects = (foundObjects: any, cwd: string): string[] =>
	foundObjects.map((inspectObj: INode) => pathUtil.relative(cwd, inspectObj.absolutePath))

// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export const findSync = (path: string, options: IOptions): string[] =>
	processFoundObjects(findSyncEx(path, options), options.cwd)


export const findSyncEx = (path: string, options: IOptions): INode[] => {
	const foundInspectObjects: INode[] = [];
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
				foundInspectObjects.push(item)
			}
		}
	})
	return foundInspectObjects
}

export function sync(path: string, options: IOptions): string[] {
	const entryPointInspect = inspectSync(path)
	if (entryPointInspect === undefined) {
		throw ErrDoesntExists(path)
	} else if (entryPointInspect.type !== 'dir') {
		throw ErrIsNotDirectory(path)
	}
	return findSync(path, defaults(options))
}

export const syncEx = (path: string, options: IOptions): INode[] => {
	const entryPointInspect = inspectSync(path)
	if (entryPointInspect === undefined) {
		throw ErrDoesntExists(path)
	} else if (entryPointInspect.type !== 'dir') {
		throw ErrIsNotDirectory(path)
	}
	return findSyncEx(path, defaults(options))
}

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------

const findAsync = (path: string, options: IOptions): Promise<string[]> => {
	return new Promise<string[]>((resolve, reject) => {
		const foundInspectObjects: INode[] = [];
		const matchesAnyOfGlobs = matcher(path, options.matching);
		const walker = treeWalkerStream(path, {
			maxLevelsDeep: options.recursive ? Infinity : 1,
			inspectOptions: {
				absolutePath: true
			}
		}).on('readable', () => {
			const data = walker.read()
			let item: INode
			if (data && data.path !== path && matchesAnyOfGlobs(data.path)) {
				item = data.item
				if ((item.type === ENodeType.FILE && options.files === true)
					|| (item.type === ENodeType.DIR && options.directories === true)) {
					foundInspectObjects.push(item)
				}
			}
		}).on('error', reject)
			.on('end', () => {
				resolve(processFoundObjects(foundInspectObjects, options.cwd))
			})
	});
}

export function async(path: string, options: IOptions): Promise<string[]> {
	return inspectASync(path).then(entryPointInspect => {
			if (entryPointInspect === undefined) {
				throw ErrDoesntExists(path)
			} else if ((entryPointInspect as any).type !== ENodeType.DIR) {
				throw ErrIsNotDirectory(path)
			}
			return findAsync(path, defaults(options))
		})
}
