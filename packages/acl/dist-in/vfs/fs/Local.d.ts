import { type ReadStream } from 'fs';
import type { INode } from './VFS.js';
import type { FileResource } from './Resource.js';
export interface IDefaultParameters {
    readonly root: string;
    nopty?: boolean;
    local?: boolean;
    metapath?: boolean;
    defaultEnv?: any;
    umask?: string | number;
    checkSymlinks?: boolean;
    wsmetapath?: boolean;
    testing?: boolean;
}
export declare class LocalVFS {
    private fsOptions;
    private root;
    private base;
    private umask;
    private ig;
    constructor(fsOptions: IDefaultParameters, _resource?: FileResource);
    /**
     * Check if a relative path is ignored by .gitignore rules.
     */
    isIgnored(relativePath: string): boolean;
    /**
     * SECURITY: Resolve a relative path to an absolute path within the jail.
     * Layer 2 of defense-in-depth — uses sanitizeSubpath for input validation,
     * then enforces the root boundary via realpath + prefix check.
     */
    private resolvePath;
    stat(path: string, _options?: any): Promise<INode>;
    private createStatEntry;
    readfile(path: string, options?: any): Promise<{
        stream: ReadStream;
        meta: any;
    }>;
    writefile(path: string, content: string | Buffer, options?: any): Promise<void>;
    readdir(path: string, _options?: any): Promise<INode[]>;
    mkfile(path: string, options?: any): Promise<void>;
    mkdir(path: string, options?: any): Promise<void>;
    mkdirP(path: string, options?: any): Promise<void>;
    rmfile(path: string, _options?: any): Promise<void>;
    rmdir(path: string, _options?: any): Promise<void>;
    rename(from: string, to: string, _options?: any): Promise<void>;
    copy(from: string, to: string, _options?: any): Promise<void>;
    exists(path: string): Promise<boolean>;
    private calcEtag;
}
