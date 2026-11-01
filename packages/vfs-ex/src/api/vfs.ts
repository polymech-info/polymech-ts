import { Hono } from 'hono';
import { MountManager } from '../vfs/fs/VFS';
import { LocalVFS } from '../vfs/fs/Local';
import { RcloneVFS } from '../vfs/rclone/RcloneVFS';
import * as path from 'path';
import * as fs from 'fs-extra';
import type { IMount } from '../vfs/fs/VFS';
import { glob } from 'glob';
import type { INode } from '../vfs/fs/VFS';
import mime from 'mime';

const vfsRouter = new Hono();

const configPath = path.resolve('./vfs.json');
const mounts: IMount[] = fs.readJsonSync(configPath);
const mountManager = new MountManager(mounts);

// Extended mount interface to support different VFS types
interface IExtendedMount extends IMount {
    // For rclone mounts
    url?: string;
    username?: string;
    password?: string;
    timeout?: number;
    retries?: number;
    remote?: string;
}

// VFS factory function
function createVFS(mount: IExtendedMount): LocalVFS | RcloneVFS {
    switch (mount.type) {
        case 'local':
        case 'fs': // Support both 'local' and 'fs' for filesystem mounts
            return new LocalVFS({ root: path.resolve(mount.path) });
        
        case 'rclone':
            if (!mount.url || !mount.remote) {
                throw new Error(`Rclone mount '${mount.name}' requires url and remote parameters`);
            }
            return new RcloneVFS({
                remote: mount.remote,
                url: mount.url,
                username: mount.username,
                password: mount.password,
                timeout: mount.timeout,
                retries: mount.retries,
            });
        
        default:
            throw new Error(`Unsupported mount type: ${mount.type}`);
    }
}

/**
 * @openapi
 * /vfs/ls/{mount}/{path}:
 *   get:
 *     summary: List files and directories
 *     tags: [VFS]
 *     description: List files and directories at a given path
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: glob
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of files and directories
 *       404:
 *         description: Mount or directory not found
 */
// Handle root mount listing
vfsRouter.get('/ls/:mount', async (c) => {
    const mountName = c.req.param('mount');
    const subpath = '';
    const globPattern = c.req.query('glob');
    
    console.log(`VFS ls endpoint (root): mount=${mountName}, subpath="${subpath}", glob="${globPattern}"`);

    const mount = mountManager.findByName(mountName);

    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        if (globPattern) {
            // For local mounts, use glob; for rclone, fall back to readdir and filter
            if (mount.type === 'local') {
                const files = await glob(globPattern, { cwd: path.join(mount.path, subpath) });
                const nodes: INode[] = await Promise.all(files.map(async (file) => {
                    const stats = await fs.stat(path.join(mount.path, subpath, file));
                    return {
                        name: file,
                        path: path.join(subpath, file).replace(/\\/g, '/'),
                        mime: stats.isDirectory() ? 'inode/directory' : null,
                        mtime: stats.mtime.valueOf(),
                        size: stats.size,
                        parent: subpath,
                        type: stats.isDirectory() ? 'dir' : 'file',
                    };
                }));
                return c.json(nodes);
            } else {
                // For rclone and other VFS types, use readdir and basic pattern matching
                let files = await vfs.readdir(subpath);
                // Simple glob pattern matching (basic support)
                if (globPattern !== '*') {
                    const regex = new RegExp(globPattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                    files = files.filter(file => regex.test(file.name));
                }
                return c.json(files.map(file => ({ ...file, path: file.path.replace(/\\/g, '/') })));
            }
        } else {
            let files = await vfs.readdir(subpath);
            return c.json(files.map(file => ({ ...file, path: file.path.replace(/\\/g, '/') })));
        }
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOTDIR' || err.code === 'ENOENT') {
            return c.json({ error: 'Directory not found' }, 404);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Handle subpath listing
vfsRouter.get('/ls/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // If the wildcard didn't capture anything, try extracting from the full path
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/ls/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    } else {
        // Decode the captured wildcard path
        subpath = decodeURIComponent(subpath);
    }
    
    // Normalize path - remove leading slashes
    if (subpath.startsWith('/')) {
        subpath = subpath.substring(1);
    }
    
    const globPattern = c.req.query('glob');
    
    console.log(`VFS ls endpoint (subpath): mount=${mountName}, subpath="${subpath}", glob="${globPattern}", fullPath="${c.req.path}"`);

    const mount = mountManager.findByName(mountName);

    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        if (globPattern) {
            // For local mounts, use glob; for rclone, fall back to readdir and filter
            if (mount.type === 'local') {
                const files = await glob(globPattern, { cwd: path.join(mount.path, subpath) });
                const nodes: INode[] = await Promise.all(files.map(async (file) => {
                    const stats = await fs.stat(path.join(mount.path, subpath, file));
                    return {
                        name: file,
                        path: path.join(subpath, file).replace(/\\/g, '/'),
                        mime: stats.isDirectory() ? 'inode/directory' : null,
                        mtime: stats.mtime.valueOf(),
                        size: stats.size,
                        parent: subpath,
                        type: stats.isDirectory() ? 'dir' : 'file',
                    };
                }));
                return c.json(nodes);
            } else {
                // For rclone and other VFS types, use readdir and basic pattern matching
                let files = await vfs.readdir(subpath);
                // Simple glob pattern matching (basic support)
                if (globPattern !== '*') {
                    const regex = new RegExp(globPattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                    files = files.filter(file => regex.test(file.name));
                }
                return c.json(files.map(file => ({ ...file, path: file.path.replace(/\\/g, '/') })));
            }
        } else {
            let files = await vfs.readdir(subpath);
            return c.json(files.map(file => ({ ...file, path: file.path.replace(/\\/g, '/') })));
        }
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOTDIR' || err.code === 'ENOENT') {
            return c.json({ error: 'Directory not found' }, 404);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/write/{mount}/{path}:
 *   put:
 *     summary: Write file content
 *     tags: [VFS]
 *     description: Write or update file content (for editor saves)
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: File written successfully
 *       404:
 *         description: Mount not found
 */
vfsRouter.put('/write/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/write/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    } else {
        // Decode the captured wildcard path
        subpath = decodeURIComponent(subpath);
    }
    
    // Normalize path - remove leading slashes
    if (subpath.startsWith('/')) {
        subpath = subpath.substring(1);
    }
    
    console.log(`VFS write endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        const content = await c.req.text();
        await vfs.writefile(subpath, content);
        return c.json({ success: true, path: subpath });
    } catch (error) {
        const err = error as Error & { code?: string };
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/upload/{mount}/{path}:
 *   post:
 *     summary: Upload file
 *     tags: [VFS]
 *     description: Upload a file to the specified path
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       404:
 *         description: Mount not found
 */
vfsRouter.post('/upload/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/upload/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    }
    
    console.log(`VFS upload endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        const body = await c.req.parseBody();
        const file = body.file as File;
        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }
        
        const content = await file.arrayBuffer();
        await vfs.writefile(subpath, Buffer.from(content));
        return c.json({ success: true, path: subpath, size: content.byteLength });
    } catch (error) {
        const err = error as Error & { code?: string };
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/delete/{mount}/{path}:
 *   delete:
 *     summary: Delete file or directory
 *     tags: [VFS]
 *     description: Delete a file or directory at the specified path
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File or directory deleted successfully
 *       404:
 *         description: Mount, file, or directory not found
 */
vfsRouter.delete('/delete/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/delete/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    }
    
    console.log(`VFS delete endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        await vfs.rmfile(subpath);
        return c.json({ success: true, path: subpath });
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOENT') {
            return c.json({ error: 'File or directory not found' }, 404);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/mkdir/{mount}/{path}:
 *   post:
 *     summary: Create directory
 *     tags: [VFS]
 *     description: Create a directory at the specified path
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Directory created successfully
 *       404:
 *         description: Mount not found
 */
vfsRouter.post('/mkdir/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/mkdir/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    }
    
    console.log(`VFS mkdir endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        await vfs.mkdirP(subpath);
        return c.json({ success: true, path: subpath });
    } catch (error) {
        const err = error as Error & { code?: string };
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/read/{mount}/{path}:
 *   get:
 *     summary: Read file content
 *     tags: [VFS]
 *     description: Read the content of a file
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Mount or file not found
 */
vfsRouter.get('/read/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/read/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    }
    
    console.log(`VFS read endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        const { stream } = await vfs.readfile(subpath);
        if (!stream) {
            return c.json({ error: 'File is a directory' }, 400);
        }
        
        // Convert stream to string
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const content = Buffer.concat(chunks).toString('utf-8');
        
        return c.text(content);
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOENT') {
            return c.json({ error: 'File not found' }, 404);
        } else if (err.code === 'EISDIR') {
            return c.json({ error: 'Path is a directory' }, 400);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * @openapi
 * /vfs/get/{mount}/{path}:
 *   get:
 *     summary: Get file with HTTP range support
 *     tags: [VFS]
 *     description: Serve a file with proper MIME type, caching headers, and HTTP range support for large files
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: Range
 *         required: false
 *         schema:
 *           type: string
 *         description: HTTP Range header for partial content requests
 *     responses:
 *       200:
 *         description: Full file content
 *       206:
 *         description: Partial content (range request)
 *       404:
 *         description: Mount or file not found
 *       416:
 *         description: Range not satisfiable
 */
vfsRouter.get('/get/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    let subpath = c.req.param('*') || '';
    
    // Extract path from full URL if wildcard didn't capture it
    if (!subpath) {
        const fullPath = c.req.path;
        const mountPrefix = `/vfs/get/${mountName}`;
        if (fullPath.length > mountPrefix.length) {
            subpath = decodeURIComponent(fullPath.substring(mountPrefix.length));
        }
    } else {
        // Decode the captured wildcard path
        subpath = decodeURIComponent(subpath);
    }
    
    // Normalize path - remove leading slashes
    if (subpath.startsWith('/')) {
        subpath = subpath.substring(1);
    }
    
    console.log(`VFS get endpoint: mount=${mountName}, subpath="${subpath}"`);

    const mount = mountManager.findByName(mountName);
    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        // Get file stats first
        const stats = await vfs.stat(subpath);
        if (stats.mime === 'inode/directory') {
            return c.json({ error: 'Path is a directory' }, 400);
        }

        const fileSize = stats.size;
        const rangeHeader = c.req.header('Range');
        
        // MIME type detection using official mime database with custom overrides
        let contentType = mime.getType(subpath) || 'application/octet-stream';
        
        // Custom overrides for web development files
        const ext = path.extname(subpath).toLowerCase();
        const webDevOverrides: Record<string, string> = {
            '.ts': 'application/typescript',
            '.tsx': 'text/tsx',
            '.jsx': 'text/jsx',
        };
        
        if (webDevOverrides[ext]) {
            contentType = webDevOverrides[ext];
        }

        // Handle range requests
        if (rangeHeader) {
            const ranges = parseRange(fileSize, rangeHeader);
            if (!ranges || ranges.length === 0) {
                return c.text('Range Not Satisfiable', 416, {
                    'Content-Range': `bytes */${fileSize}`
                });
            }

            // For simplicity, only handle single range requests
            const range = ranges[0];
            const { stream } = await vfs.readfile(subpath, {
                start: range.start,
                end: range.end
            });

            const contentLength = range.end - range.start + 1;
            
            // For range requests, always buffer to ensure proper Content-Length
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            
            return c.body(buffer, 206, {
                'Content-Type': contentType,
                'Content-Length': contentLength.toString(),
                'Content-Range': `bytes ${range.start}-${range.end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
                'ETag': `"${stats.mtime}-${stats.size}"`
            });
        }

        // Serve full file with true streaming
        const { stream } = await vfs.readfile(subpath);
        if (!stream) {
            return c.json({ error: 'File is a directory' }, 400);
        }

        // For files larger than 10MB, use streaming; otherwise buffer for proper Content-Length
        if (fileSize > 10 * 1024 * 1024) {
            // Convert Node.js stream to ReadableStream for large files
            const readableStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => {
                        controller.enqueue(new Uint8Array(chunk));
                    });
                    stream.on('end', () => {
                        controller.close();
                    });
                    stream.on('error', (error) => {
                        controller.error(error);
                    });
                }
            });

            return c.body(readableStream, 200, {
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
                'ETag': `"${stats.mtime}-${stats.size}"`
            });
        } else {
            // For smaller files, buffer to get proper Content-Length header
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            return c.body(buffer, 200, {
                'Content-Type': contentType,
                'Content-Length': fileSize.toString(),
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
                'ETag': `"${stats.mtime}-${stats.size}"`
            });
        }
        
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOENT') {
            return c.json({ error: 'File not found' }, 404);
        } else if (err.code === 'EISDIR') {
            return c.json({ error: 'Path is a directory' }, 400);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Simple range parser (basic implementation)
function parseRange(size: number, rangeHeader: string): Array<{start: number, end: number}> | null {
    if (!rangeHeader.startsWith('bytes=')) {
        return null;
    }
    
    const ranges: Array<{start: number, end: number}> = [];
    const rangeSpecs = rangeHeader.substring(6).split(',');
    
    for (const rangeSpec of rangeSpecs) {
        const [startStr, endStr] = rangeSpec.trim().split('-');
        
        let start: number;
        let end: number;
        
        if (startStr === '') {
            // Suffix range: -500 (last 500 bytes)
            start = Math.max(0, size - parseInt(endStr));
            end = size - 1;
        } else if (endStr === '') {
            // Prefix range: 500- (from byte 500 to end)
            start = parseInt(startStr);
            end = size - 1;
        } else {
            // Full range: 500-999
            start = parseInt(startStr);
            end = parseInt(endStr);
        }
        
        // Validate range
        if (start >= size || end >= size || start > end) {
            return null;
        }
        
        ranges.push({ start, end });
    }
    
    return ranges;
}

/**
 * @openapi
 * /vfs/stat/{mount}/{path}:
 *   get:
 *     summary: Get file or directory metadata
 *     tags: [VFS]
 *     description: Get metadata for a file or directory at a given path
 *     parameters:
 *       - in: path
 *         name: mount
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File or directory metadata
 *       404:
 *         description: Mount, file, or directory not found
 */
vfsRouter.get('/stat/:mount/*', async (c) => {
    const mountName = c.req.param('mount');
    const subpath = c.req.param('*') || '';

    const mount = mountManager.findByName(mountName);

    if (!mount) {
        return c.json({ error: `Mount '${mountName}' not found` }, 404);
    }

    const vfs = createVFS(mount as IExtendedMount);

    try {
        const stats = await vfs.stat(subpath);
        return c.json(stats);
    } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'ENOENT') {
            return c.json({ error: 'File or directory not found' }, 404);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default vfsRouter;
