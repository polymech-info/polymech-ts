import * as fs from 'node:fs'
import { Stats, readlinkSync, statSync, lstatSync, readFileSync } from 'node:fs'

import pkg from 'mime';
const { getType } = pkg;

import * as  pathUtil from 'node:path'
import { createHash } from 'node:crypto'
import { validateArgument, validateOptions } from './utils/validate.js'
import { ENodeType, INode, IInspectOptions } from './interfaces.js'

export const supportedChecksumAlgorithms: string[] = ['md5', 'sha1', 'sha256', 'sha512']

export function DefaultInspectOptions(): IInspectOptions {
	return {
		times: true,
		mode: true
	};
}
export function validateInput(methodName: string, path: string, options?: IInspectOptions): void {
	const methodSignature: string = methodName + '(path, [options])';
	validateArgument(methodSignature, 'path', path, ['string']);
	validateOptions(methodSignature, 'options', options, {
		checksum: ['string'],
		mode: ['boolean'],
		times: ['boolean'],
		absolutePath: ['boolean'],
		symlinks: ['boolean'],
		size: 'number',
		mime: 'string'
	});

	if (options && options.checksum !== undefined
		&& !supportedChecksumAlgorithms.includes(options.checksum)) {
		throw new Error('Argument "options.checksum" passed to ' + methodSignature
			+ ' must have one of values: ' + supportedChecksumAlgorithms.join(', '));
	}
}

const createInspectObj = (path: string, options: IInspectOptions, stat: fs.Stats): INode => {
	const obj: INode = {} as INode
	obj.name = pathUtil.basename(path)
	if (stat.isFile()) {
		obj.type = ENodeType.FILE;
		obj.size = stat.size;
	} else if (stat.isDirectory()) {
		obj.type = ENodeType.DIR;
	} else if (stat.isSymbolicLink()) {
		obj.type = ENodeType.SYMLINK;
	} else {
		obj.type = ENodeType.OTHER;
	}
	if (options.mode) {
		obj.mode = stat.mode;
	}
	if (options.mime) {
		if (stat.isDirectory()) {
			obj.mime = 'inode/directory';
		} else if (stat.isBlockDevice()) {
			obj.mime = 'inode/blockdevice';
		} else if (stat.isCharacterDevice()) {
			obj.mime = 'inode/chardevice';
		} else if (stat.isSymbolicLink()) {
			obj.mime = 'inode/symlink';
		} else if (stat.isFIFO()) {
			obj.mime = 'inode/fifo';
		} else if (stat.isSocket()) {
			obj.mime = 'inode/socket';
		} else {
			obj.mime = getType(path);
		}
	}

	if (options.times) {
		obj.accessTime = stat.atime
		obj.modifyTime = stat.mtime
		obj.changeTime = stat.ctime
		obj.birthTime = stat.birthtime
	}

	if (options.absolutePath) {
		obj.absolutePath = path;
	}
	return obj;
};
export function createItem(path: string, options?: IInspectOptions): INode {
	options = options || DefaultInspectOptions();
	const stat = (options.symlinks ? lstatSync : statSync)(path);
	return createInspectObj(path, options, stat);
}
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
const fileChecksum = (path: string, algo: string): string => {
	const hash = createHash(algo)
	const data = readFileSync(path)
	hash.update(data)
	return hash.digest('hex')
};

const addExtraFieldsSync = (path: string, inspectObj: any, options: IInspectOptions): INode => {
	if (inspectObj.type === ENodeType.FILE && options.checksum) {
		inspectObj[options.checksum] = fileChecksum(path, options.checksum);
	} else if (inspectObj.type === ENodeType.SYMLINK) {
		inspectObj.pointsAt = readlinkSync(path);
	}
	return inspectObj;
};

export function sync(path: string, options?: IInspectOptions): INode {
	let statOperation = fs.lstatSync
	let stat
	const opts = options || {}

	if (opts.symlinks === "follow") {
		statOperation = fs.statSync
	}

	try {
		stat = statOperation(path)
	} catch (err) {
		// Detection if path exists
		if (err.code === "ENOENT") {
			// Doesn't exist. Return undefined instead of throwing.
			return undefined;
		}
		throw err;
	}

	const inspectObj = createInspectObj(path, opts, stat)
	addExtraFieldsSync(path, inspectObj, opts)

	return inspectObj
}

export const async = async (path: string, options?: IInspectOptions): Promise<INode> => {
	options = options || {} as IInspectOptions;
	const stat = await (options.symlinks ? fs.promises.lstat : fs.promises.statfs)(path)
	return addExtraFieldsSync(path, createInspectObj(path, options, stat as Stats), options)
}
