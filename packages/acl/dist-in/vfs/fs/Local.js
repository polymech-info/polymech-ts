import { join, resolve as pathResolve, normalize as pathNormalize, dirname, basename, sep as pathSep, } from 'path';
import { createReadStream, readFileSync, existsSync } from 'fs';
import { sanitizeSubpath } from '../path-sanitizer.js';
import { realpath, lstat, stat, readdir, mkdir, rm, rename, cp, writeFile, access } from 'fs/promises';
import ignoreModule from 'ignore';
import Mime from 'mime';
// Handle CJS/ESM interop — ignore exports { default: fn, isPathValid: fn }
const createIgnore = (typeof ignoreModule === 'function' ? ignoreModule : ignoreModule.default);
export class LocalVFS {
    constructor(fsOptions, _resource) {
        this.ig = null;
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
        this.umask = this.fsOptions.umask || Number.parseInt('0750', 8);
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
    isIgnored(relativePath) {
        if (!this.ig)
            return false;
        // Normalize: strip leading slash, use forward slashes
        const clean = relativePath.replace(/\\/g, '/').replace(/^\//, '');
        if (!clean)
            return false;
        return this.ig.ignores(clean);
    }
    /**
     * SECURITY: Resolve a relative path to an absolute path within the jail.
     * Layer 2 of defense-in-depth — uses sanitizeSubpath for input validation,
     * then enforces the root boundary via realpath + prefix check.
     */
    async resolvePath(path, options) {
        // Sanitize input through the shared module (strips traversal, null bytes, etc.)
        // The sanitizer returns '' for root-directory references like '' or '.'
        const sanitized = sanitizeSubpath(path);
        // Join with root
        let resolved = join(this.root, sanitized);
        // Resolve symlinks to prevent symlink escape (default: on)
        const checkSymlinks = (options === null || options === void 0 ? void 0 : options.checkSymlinks) !== false;
        if (checkSymlinks) {
            try {
                resolved = await realpath(resolved);
            }
            catch {
                // File may not exist yet (e.g. for write) — normalize instead
                resolved = pathResolve(resolved);
            }
        }
        else {
            resolved = pathResolve(resolved);
        }
        // Normalize slashes (Windows compat)
        resolved = resolved.replace(/\\/g, '/');
        // Enforce root jail — resolved path MUST be root or start with root/
        const norm = (s) => {
            let n = s.replace(/\\/g, '/').replace(/\/+$/, '');
            if (pathSep === '\\')
                n = n.toLowerCase();
            return n;
        };
        const resolvedNorm = norm(resolved);
        const rootNorm = norm(this.root);
        if (resolvedNorm !== rootNorm && !resolvedNorm.startsWith(rootNorm + '/')) {
            const err = new Error(`EACCESS: '${resolved}' escapes root '${this.root}'`);
            err.code = 'EACCESS';
            throw err;
        }
        return resolved;
    }
    async stat(path, _options) {
        const dir = await this.resolvePath(dirname(path));
        const file = basename(path);
        path = join(dir, file);
        return this.createStatEntry(file, path);
    }
    async createStatEntry(file, fullpath) {
        const s = await lstat(fullpath);
        const relativePath = '/' + fullpath.replace(/\\/g, '/').replace(this.root, '');
        const entry = {
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
    async readfile(path, options = {}) {
        const realp = await this.resolvePath(path);
        const s = await stat(realp);
        if (s.isDirectory()) {
            const err = new Error('EISDIR: Requested resource is a directory');
            err.code = 'EISDIR';
            throw err;
        }
        const meta = {
            size: s.size,
            etag: this.calcEtag(s),
        };
        if (options.head) {
            return { stream: null, meta };
        }
        const stream = createReadStream(realp, options);
        return { stream, meta };
    }
    async writefile(path, content, options = {}) {
        const realp = await this.resolvePath(path);
        // Ensure parent directory exists (equivalent to fs-extra outputFile)
        await mkdir(dirname(realp), { recursive: true });
        await writeFile(realp, content, options);
    }
    async readdir(path, _options) {
        const realp = await this.resolvePath(path);
        const s = await stat(realp);
        if (!s.isDirectory()) {
            const err = new Error('ENOTDIR: Requested resource is not a directory');
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
                return !this.ig.ignores(relPath);
            })
            : files;
        const entries = await Promise.all(filtered.map((file) => this.createStatEntry(file, join(realp, file))));
        return entries;
    }
    async mkfile(path, options = {}) {
        await this.writefile(path, '', options);
    }
    async mkdir(path, options = {}) {
        const realp = await this.resolvePath(path);
        await mkdir(realp, options);
    }
    async mkdirP(path, options = {}) {
        const realp = await this.resolvePath(path, { checkSymlinks: false });
        await mkdir(realp, { ...options, recursive: true });
    }
    async rmfile(path, _options) {
        const realp = await this.resolvePath(path);
        await rm(realp, { recursive: true, force: true });
    }
    async rmdir(path, _options = {}) {
        const realp = await this.resolvePath(path);
        await rm(realp, { recursive: true, force: true });
    }
    async rename(from, to, _options = {}) {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await rename(frompath, topath);
    }
    async copy(from, to, _options = {}) {
        const frompath = await this.resolvePath(from);
        const topath = await this.resolvePath(to);
        await cp(frompath, topath, { recursive: true });
    }
    async exists(path) {
        try {
            const realp = await this.resolvePath(path);
            await access(realp);
            return true;
        }
        catch (_err) {
            return false;
        }
    }
    calcEtag(s) {
        return ((s.isFile() ? '' : 'W/') +
            '"' +
            (s.ino || 0).toString(36) +
            '-' +
            s.size.toString(36) +
            '-' +
            s.mtime.valueOf().toString(36) +
            '"');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9jYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdmZzL2ZzL0xvY2FsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxJQUFJLEVBQ0osT0FBTyxJQUFJLFdBQVcsRUFDdEIsU0FBUyxJQUFJLGFBQWEsRUFDMUIsT0FBTyxFQUNQLFFBQVEsRUFDUixHQUFHLElBQUksT0FBTyxHQUNqQixNQUFNLE1BQU0sQ0FBQztBQUVkLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUErQixNQUFNLElBQUksQ0FBQztBQUM3RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN2RyxPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFJbEMsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBRXhCLDJFQUEyRTtBQUMzRSxNQUFNLFlBQVksR0FBYyxDQUFDLE9BQU8sWUFBWSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBRSxZQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBY3BILE1BQU0sT0FBTyxRQUFRO0lBT2pCLFlBQVksU0FBNkIsRUFBRSxTQUF3QjtRQUYzRCxPQUFFLEdBQVEsSUFBSSxDQUFDO1FBR25CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxTQUFT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