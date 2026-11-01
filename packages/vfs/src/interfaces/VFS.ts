import { IObjectLiteral } from './index';
/**
 * Node types
 *
 * @export
 * @enum {string}
 */
export enum ENodeType {
	FILE = <any> 'file',
	DIR = <any> 'dir',
	SYMLINK = <any> 'symlink',
	OTHER = <any> 'other',
	BLOCK = <any> 'block'
}
/**
 * General features of a VFS
 *
 * @export
 * @enum {number}
 */
export enum ECapabilties {
	VERSIONED, // VCS
	CHANGE_MESSAGE, // changes require additional comments
	META, // more meta data per node
	MIME, // VFS has native methods to determine the mime type
	AUTHORS, // VFS nodes can have different owners/authors, used by VCS
	META_TREE, // VFS has non INode tree nodes (VCS branches, tags, commits,..)
	ROOT,  // VFS can have an root path prefix, eg. the user's home directory,
	REMOTE_CONNECTION // VFS has a remote connection
}
/**
 * Supported file operations
 *
 * @export
 * @enum {number}
 */
export enum EOperations {
	LS,
	RENAME,
	COPY,
	DELETE,
	MOVE,
	GET,
	SET
}

/**
 * General presentation structure for clients
 *
 * @export
 * @interface INode
 */
export interface INode {
	name: string;
	path: string;
	size: number;
	mtime?: number;
	mime: string;
	parent: string;
	mount?: string;
	children?: INode[];
	// back compat props for xfile@0.x series
	owner?: IObjectLiteral;
	_EX?: boolean;
	isDir?: boolean;
	directory?: boolean;
	fileType?: string;
	sizeBytes?: number;
	type: string;
}

export type INodeEx = INode & {
	err: any;
	linkStatErr: any | null;
	link: null;
	linkErr: null;
	linkStat: null;
};

// tslint:disable-next-line:interface-name
export interface VFS_PATH {
	mount: string;
	path: string;
}

export interface IVFSConfig {
	configPath: string;
	relativeVariables: any;
	absoluteVariables: any;
}

/**
 *
 * These flags are used to build the result, adaptive.
 * @TODO: sync with dgrid#configureColumn
 * @export
 * @enum {number}
 */
export enum NODE_FIELDS {
	SHOW_ISDIR = 1602,
	SHOW_OWNER = 1604,
	SHOW_MIME = 1608,
	SHOW_SIZE = 1616,
	SHOW_PERMISSIONS = 1632,
	SHOW_TIME = 1633,
	// @TODO: re-impl. du -ahs/x for windows
	SHOW_FOLDER_SIZE = 1634,
	SHOW_FOLDER_HIDDEN = 1635,
	SHOW_TYPE = 1636,
	SHOW_MEDIA_INFO = 1637
}
