/**
 * Node types
 *
 * @export
 * @enum {string}
 */
export declare enum ENodeType {
    FILE,
    DIR,
    SYMLINK,
    OTHER,
    BLOCK
}
/**
 * General features of a VFS
 *
 * @export
 * @enum {number}
 */
export declare enum ECapabilties {
    VERSIONED = 0,// VCS
    CHANGE_MESSAGE = 1,// changes require additional comments
    META = 2,// more meta data per node
    MIME = 3,// VFS has native methods to determine the mime type
    AUTHORS = 4,// VFS nodes can have different owners/authors, used by VCS
    META_TREE = 5,// VFS has non INode tree nodes (VCS branches, tags, commits,..)
    ROOT = 6,// VFS can have an root path prefix, eg. the user's home directory,
    REMOTE_CONNECTION = 7
}
/**
 * Supported file operations
 *
 * @export
 * @enum {number}
 */
export declare enum EOperations {
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
    mime?: string;
    parent: string;
    mount?: string;
    children?: INode[];
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
export declare enum NODE_FIELDS {
    SHOW_ISDIR = 1602,
    SHOW_OWNER = 1604,
    SHOW_MIME = 1608,
    SHOW_SIZE = 1616,
    SHOW_PERMISSIONS = 1632,
    SHOW_TIME = 1633,
    SHOW_FOLDER_SIZE = 1634,
    SHOW_FOLDER_HIDDEN = 1635,
    SHOW_TYPE = 1636,
    SHOW_MEDIA_INFO = 1637
}
export interface VfsBind {
    id: string;
    source: {
        mount: string;
        subpath?: string;
    };
    target: {
        mount: string;
        path: string;
    };
    readonly?: boolean;
    acl?: 'source' | 'inherit';
}
export declare class BindManager {
    private binds;
    constructor(binds: VfsBind[]);
    getAll(): VfsBind[];
    findByHostMount(mountName: string): VfsBind[];
}
export declare class MountManager {
    private mounts;
    constructor(mounts: IMount[]);
    findByName(name: string): IMount | undefined;
    resolve(vfsPath: string): {
        mount: IMount;
        path: string;
    };
}
