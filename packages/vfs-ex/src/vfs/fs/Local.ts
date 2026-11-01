import { Stream } from 'stream';
import { randomBytes } from 'crypto';

import {
    join,
    resolve as pathResolve,
    normalize as pathNormalize,
    dirname,
    basename,
    sep as pathSep,
} from 'path';


import * as fs from 'fs-extra';
import type { INode } from './VFS';
import type { FileResource } from './Resource';

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

    constructor(fsOptions: IDefaultParameters, resource?: FileResource) {
        if (!fsOptions.root) {
            throw new Error('root is a required option');
        }
        console.log('LocalVFS constructor options:', fsOptions);

        this.fsOptions = fsOptions;
        this.root = pathNormalize(fsOptions.root);
        console.log('LocalVFS constructor normalized root:', this.root);

        if (pathSep === '/' && this.root[0] !== '/') {
            throw new Error('root path must start in /');
        }
        if (this.root[this.root.length - 1] !== pathSep) {
            this.root += pathSep;
        }

        if (pathSep === '\\') {
            this.root = this.root.replace(/\\/g, '/');
        }
        this.base = this.root.substr(0, this.root.length - 1);

        this.umask = (this.fsOptions.umask as number) || Number.parseInt('0750', 8);
    }

    private async resolvePath(path: string, options?: any): Promise<string> {
        console.log(`resolvePath input: ${path}`);
        options = options || {};
		const alreadyRooted = options.alreadyRooted;
        const checkSymlinks = options.checkSymlinks === undefined ? true : options.checkSymlinks;
		let isHome = false;

        if (path.substr(0, 2) === '~/') {
			isHome = true;
			path = process.env.HOME + path.substr(1);
        } else if (!alreadyRooted) {
            path = join(this.root, path);
		}

        if (checkSymlinks && this.fsOptions.checkSymlinks && !alreadyRooted) {
            path = await fs.realpath(path);
		}

        if (pathSep === '\\') {
            path = path.replace(/\\/g, '/');
        }

			if (!options.nocheck) {
            if (!(path === this.base || path.substr(0, this.root.length) === this.root) && !isHome) {
                const err: any = new Error(`EACCESS: '${path}' not in '${this.root}'`);
                err.code = 'EACCESS';
                throw err;
            }
        }
        console.log(`resolvePath output: ${path}`);
        return path;
    }

    async stat(path: string, options?: any): Promise<INode> {
        const dir = await this.resolvePath(dirname(path));
        const file = basename(path);
        path = join(dir, file);
        return this.createStatEntry(file, path);
    }

    private async createStatEntry(file: string, fullpath: string): Promise<INode> {
        console.log(`createStatEntry input: file=${file}, fullpath=${fullpath}`);
        const stat = await fs.lstat(fullpath);
        const relativePath = '/' + fullpath.replace(/\\/g, '/').replace(this.root, '');

        const entry: INode = {
				name: file,
				path: relativePath,
				mime: null,
            mtime: stat.mtime.valueOf(),
            size: stat.size,
            parent: dirname(relativePath),
            type: '',
        };
        console.log('createStatEntry output:', entry);

				if (stat.isDirectory()) {
            entry.mime = 'inode/directory';
        } /* else if (stat.isSymbolicLink()) {
            entry.mime = 'inode/symlink';
            const link = await fs.readlink(fullpath);
					entry['link'] = link;
            const newpath = await this.resolvePath(pathResolve(dirname(fullpath), link), { alreadyRooted: true });
            const linkStat = await this.createStatEntry(basename(newpath), newpath);
							entry['linkStat'] = linkStat;
        }*/

        return entry;
    }

    async readfile(path: string, options: any = {}): Promise<{ stream: fs.ReadStream; meta: any }> {
        const realpath = await this.resolvePath(path);
        const stat = await fs.stat(realpath);
			if (stat.isDirectory()) {
            const err: any = new Error('EISDIR: Requested resource is a directory');
            err.code = 'EISDIR';
            throw err;
        }

        const meta = {
            size: stat.size,
            etag: this.calcEtag(stat),
        };

        if (options.head) {
            return { stream: null, meta };
        }

        const stream = fs.createReadStream(realpath, options);
        return { stream, meta };
    }

    async writefile(path: string, content: string | Buffer, options: any = {}): Promise<void> {
        const realpath = await this.resolvePath(path);
        await fs.outputFile(realpath, content, options);
    }

    async readdir(path: string, options?: any): Promise<INode[]> {
        console.log(`readdir input: ${path}`);
        const realpath = await this.resolvePath(path);
        console.log(`readdir realpath: ${realpath}`);
        const stat = await fs.stat(realpath);
        if (!stat.isDirectory()) {
            const err: any = new Error('ENOTDIR: Requested resource is not a directory');
            err.code = 'ENOTDIR';
            throw err;
        }

        const files = await fs.readdir(realpath);
        const entries = await Promise.all(
            files.map((file) => this.createStatEntry(file, join(realpath, file)))
        );
        console.log('readdir output:', entries);
        return entries;
    }

    async mkfile(path: string, options: any = {}): Promise<void> {
        await this.writefile(path, '', options);
    }

    async mkdir(path: string, options: any = {}): Promise<void> {
        const realpath = await this.resolvePath(path);
        await fs.mkdir(realpath, options);
    }

    async mkdirP(path: string, options: any = {}): Promise<void> {
        const realpath = await this.resolvePath(path, { checkSymlinks: false });
        await fs.mkdirp(realpath, options);
    }

    async rmfile(path: string, options?: any): Promise<void> {
        const realpath = await this.resolvePath(path);
        await fs.remove(realpath);
    }

    async rmdir(path: string, options: any = {}): Promise<void> {
        const realpath = await this.resolvePath(path);
        await fs.remove(realpath);
    }

    async rename(from: string, to: string, options: any = {}): Promise<void> {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await fs.rename(frompath, topath);
    }

    async copy(from: string, to: string, options: any = {}): Promise<void> {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await fs.copy(frompath, topath, options);
    }

    exists(path: string): Promise<boolean> {
        return new Promise(async (resolve) => {
            try {
                const realpath = await this.resolvePath(path);
                resolve(await fs.pathExists(realpath));
            } catch (err) {
                resolve(false);
			}
		});
	}

    private calcEtag(stat: fs.Stats): string {
        return (
            (stat.isFile() ? '' : 'W/') +
            '"' +
            (stat.ino || 0).toString(36) +
            '-' +
            stat.size.toString(36) +
            '-' +
            stat.mtime.valueOf().toString(36) +
            '"'
        );
    }
}



