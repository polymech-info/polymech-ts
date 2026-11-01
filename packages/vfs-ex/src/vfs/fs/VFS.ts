
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
	VERSIONED = 0, // VCS
	CHANGE_MESSAGE = 1, // changes require additional comments
	META = 2, // more meta data per node
	MIME = 3, // VFS has native methods to determine the mime type
	AUTHORS = 4, // VFS nodes can have different owners/authors, used by VCS
	META_TREE = 5, // VFS has non INode tree nodes (VCS branches, tags, commits,..)
	ROOT = 6,  // VFS can have an root path prefix, eg. the user's home directory,
	REMOTE_CONNECTION = 7 // VFS has a remote connection
}
/**
 * Supported file operations
 *
 * @export
 * @enum {number}
 */
export enum EOperations {
	LS = 0,
	RENAME = 1,
	COPY = 2,
	DELETE = 3,
	MOVE = 4,
	GET = 5,
	SET = 6
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
	owner?: any;
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

export interface IMount {
    name: string;
    type: string;
    path: string;
}


export interface IVFSConfig {
	configPath: string;
    mounts: IMount[];
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

import * as fs from 'fs-extra';
import { dirname } from 'path';

export class MountManager {
    private mounts: IMount[];

    constructor(mounts: IMount[]) {
        this.mounts = mounts;
    }

    findByName(name: string): IMount | undefined {
        return this.mounts.find(m => m.name === name);
    }

    resolve(vfsPath: string): { mount: IMount, path: string } {
        const [mountName, ...rest] = vfsPath.split(':');
        const path = rest.join(':');
        const mount = this.findByName(mountName);
        if (!mount) {
            throw new Error(`Mount not found: ${mountName}`);
        }
        return { mount, path };
    }
}


