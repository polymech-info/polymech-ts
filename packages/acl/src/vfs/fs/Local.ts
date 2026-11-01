import {
    join,
    resolve as pathResolve,
    normalize as pathNormalize,
    dirname,
    basename,
    sep as pathSep,
} from 'path';

import { createReadStream, readFileSync, existsSync, type ReadStream, type Stats } from 'fs';
import { sanitizeSubpath } from '../path-sanitizer.js';
import { realpath, lstat, stat, readdir, mkdir, rm, rename, cp, writeFile, access } from 'fs/promises';
import ignoreModule from 'ignore';
import type { INode } from './VFS.js';
import type { FileResource } from './Resource.js';

import Mime from 'mime';

// Handle CJS/ESM interop — ignore exports { default: fn, isPathValid: fn }
const createIgnore: () => any = (typeof ignoreModule === 'function' ? ignoreModule : (ignoreModule as any).default);

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

export class LocalVFS {
    private fsOptions: IDefaultParameters;
    private root: string;
    private base: string;
    private umask: number;
    private ig: any = null;

    constructor(fsOptions: IDefaultParameters, _resource?: FileResource) {
        if (!fsOptions.root) {
            throw new Error('root is a required option');
        }

        this.fsOptions = fsOptions;
        this.root = pathNormalize(fsOptions.root);

        if (pathSep === '/' && !this.root.startsWith('/')) {
            throw new Error('root path must start in /');
        }
        if (!this.root.endsWith(pathSep)) {
            this.root += pathSep;
        }

        if (pathSep === '\\') {
            this.root = this.root.replace(/\\/g, '/');
        }
        this.base = this.root.substr(0, this.root.length - 1);

        this.umask = (this.fsOptions.umask as number) || Number.parseInt('0750', 8);

        // Load .gitignore if present in mount root
        const gitignorePath = join(this.root, '.gitignore');
        if (existsSync(gitignorePath)) {
            const patterns = readFileSync(gitignorePath, 'utf-8');
            this.ig = createIgnore().add(patterns);
        }
    }

    /**
     * Check if a relative path is ignored by .gitignore rules.
     */
    isIgnored(relativePath: string): boolean {
        if (!this.ig) return false;
        // Normalize: strip leading slash, use forward slashes
        const clean = relativePath.replace(/\\/g, '/').replace(/^\//, '');
        if (!clean) return false;
        return this.ig.ignores(clean);
    }

    /**
     * SECURITY: Resolve a relative path to an absolute path within the jail.
     * Layer 2 of defense-in-depth — uses sanitizeSubpath for input validation,
     * then enforces the root boundary via realpath + prefix check.
     */
    private async resolvePath(path: string, options?: { checkSymlinks?: boolean }): Promise<string> {
        // Sanitize input through the shared module (strips traversal, null bytes, etc.)
        // The sanitizer returns '' for root-directory references like '' or '.'
        const sanitized = sanitizeSubpath(path);

        // Join with root
        let resolved = join(this.root, sanitized);

        // Resolve symlinks to prevent symlink escape (default: on)
        const checkSymlinks = options?.checkSymlinks !== false;
        if (checkSymlinks) {
            try {
                resolved = await realpath(resolved);
            } catch {
                // File may not exist yet (e.g. for write) — normalize instead
                resolved = pathResolve(resolved);
            }
        } else {
            resolved = pathResolve(resolved);
        }

        // Normalize slashes (Windows compat)
        resolved = resolved.replace(/\\/g, '/');

        // Enforce root jail — resolved path MUST be root or start with root/
        const norm = (s: string) => {
            let n = s.replace(/\\/g, '/').replace(/\/+$/, '');
            if (pathSep === '\\') n = n.toLowerCase();
            return n;
        };
        const resolvedNorm = norm(resolved);
        const rootNorm = norm(this.root);
        if (resolvedNorm !== rootNorm && !resolvedNorm.startsWith(rootNorm + '/')) {
            const err: any = new Error(`EACCESS: '${resolved}' escapes root '${this.root}'`);
            err.code = 'EACCESS';
            throw err;
        }

        return resolved;
    }

    async stat(path: string, _options?: any): Promise<INode> {
        const dir = await this.resolvePath(dirname(path));
        const file = basename(path);
        path = join(dir, file);
        return this.createStatEntry(file, path);
    }

    private async createStatEntry(file: string, fullpath: string): Promise<INode> {
        const s = await lstat(fullpath);
        const relativePath = '/' + fullpath.replace(/\\/g, '/').replace(this.root, '');

        const entry: INode = {
            name: file,
            path: relativePath,
            mime: Mime.getType(file) || '',
            mtime: s.mtime.valueOf(),
            size: s.size,
            parent: dirname(relativePath),
            type: '',
        };

        if (s.isDirectory()) {
            entry.mime = 'inode/directory';
        }

        return entry;
    }

    async readfile(path: string, options: any = {}): Promise<{ stream: ReadStream; meta: any }> {
        const realp = await this.resolvePath(path);
        const s = await stat(realp);
        if (s.isDirectory()) {
            const err: any = new Error('EISDIR: Requested resource is a directory');
            err.code = 'EISDIR';
            throw err;
        }

        const meta = {
            size: s.size,
            etag: this.calcEtag(s),
        };

        if (options.head) {
            return { stream: null as any, meta };
        }

        const stream = createReadStream(realp, options);
        return { stream, meta };
    }

    async writefile(path: string, content: string | Buffer, options: any = {}): Promise<void> {
        const realp = await this.resolvePath(path);
        // Ensure parent directory exists (equivalent to fs-extra outputFile)
        await mkdir(dirname(realp), { recursive: true });
        await writeFile(realp, content, options);
    }

    async readdir(path: string, _options?: any): Promise<INode[]> {
        const realp = await this.resolvePath(path);
        const s = await stat(realp);
        if (!s.isDirectory()) {
            const err: any = new Error('ENOTDIR: Requested resource is not a directory');
            err.code = 'ENOTDIR';
            throw err;
        }

        const files = await readdir(realp);

        // Filter out .gitignore'd entries
        const filtered = this.ig
            ? files.filter(file => {
                // Build relative path from mount root for ignore matching
                // Normalize both sides: strip trailing slashes and use forward slashes
                const realpNorm = realp.replace(/\\/g, '/').replace(/\/+$/, '');
                const rootNorm = this.root.replace(/\/+$/, '');
                let relDir = realpNorm.startsWith(rootNorm)
                    ? realpNorm.substring(rootNorm.length).replace(/^\//, '')
                    : '';
                const relPath = relDir ? `${relDir}/${file}` : file;
                return !this.ig!.ignores(relPath);
            })
            : files;

        const entries = await Promise.all(
            filtered.map((file) => this.createStatEntry(file, join(realp, file)))
        );
        return entries;
    }

    async mkfile(path: string, options: any = {}): Promise<void> {
        await this.writefile(path, '', options);
    }

    async mkdir(path: string, options: any = {}): Promise<void> {
        const realp = await this.resolvePath(path);
        await mkdir(realp, options);
    }

    async mkdirP(path: string, options: any = {}): Promise<void> {
        const realp = await this.resolvePath(path, { checkSymlinks: false });
        await mkdir(realp, { ...options, recursive: true });
    }

    async rmfile(path: string, _options?: any): Promise<void> {
        const realp = await this.resolvePath(path);
        await rm(realp, { recursive: true, force: true });
    }

    async rmdir(path: string, _options: any = {}): Promise<void> {
        const realp = await this.resolvePath(path);
        await rm(realp, { recursive: true, force: true });
    }

    async rename(from: string, to: string, _options: any = {}): Promise<void> {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await rename(frompath, topath);
    }

    async copy(from: string, to: string, _options: any = {}): Promise<void> {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await cp(frompath, topath, { recursive: true });
    }

    async exists(path: string): Promise<boolean> {
        try {
            const realp = await this.resolvePath(path);
            await access(realp);
            return true;
        } catch (_err) {
            return false;
        }
    }

    private calcEtag(s: Stats): string {
        return (
            (s.isFile() ? '' : 'W/') +
            '"' +
            (s.ino || 0).toString(36) +
            '-' +
            s.size.toString(36) +
            '-' +
            s.mtime.valueOf().toString(36) +
            '"'
        );
    }
}
