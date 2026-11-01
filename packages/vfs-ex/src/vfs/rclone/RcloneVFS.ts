import { Readable } from 'stream';
import { Logger } from 'tslog';
import { join, dirname, basename, normalize as pathNormalize } from 'path';
import type { INode } from '../fs/VFS';
import type { FileResource } from '../fs/Resource';
import { RcloneClient } from './client';
import { type RcloneVFSConfig, type RcloneFileItem, RcloneVFSConfigSchema } from './zod_schema';

export interface IRcloneVFSParameters {
  readonly remote: string;
  readonly url: string;
  readonly username?: string;
  readonly password?: string;
  readonly timeout?: number;
  readonly retries?: number;
}

export class RcloneVFS {
  private client: RcloneClient;
  private logger: Logger<unknown>;
  private config: RcloneVFSConfig;
  private remote: string;

  constructor(fsOptions: IRcloneVFSParameters, resource?: FileResource) {
    if (!fsOptions.remote) {
      throw new Error('remote is a required option');
    }
    if (!fsOptions.url) {
      throw new Error('url is a required option');
    }

    this.logger = new Logger({ name: 'RcloneVFS' });
    this.logger.debug('RcloneVFS constructor options:', fsOptions);

    // Validate and parse configuration
    this.config = RcloneVFSConfigSchema.parse({
      remote: fsOptions.remote,
      url: fsOptions.url,
      username: fsOptions.username,
      password: fsOptions.password,
      timeout: fsOptions.timeout || 30000,
      retries: fsOptions.retries || 3,
    });

    this.remote = this.config.remote;
    this.client = new RcloneClient(this.config);

    this.logger.info(`RcloneVFS initialized for remote: ${this.remote}`);
  }

  private normalizePath(path: string): string {
    // Remove leading slash and normalize path separators
    const normalized = pathNormalize(path).replace(/^\/+/, '').replace(/\\/g, '/');
    this.logger.debug(`normalizePath: ${path} -> ${normalized}`);
    return normalized;
  }

  private rcloneItemToINode(item: RcloneFileItem, parentPath: string = ''): INode {
    const isDirectory = item.IsDir || item.MimeType === 'inode/directory';
    const itemPath = parentPath ? `${parentPath}/${item.Name}` : item.Name;
    
    // Parse modification time
    let mtime: number | undefined;
    try {
      mtime = item.ModTime ? new Date(item.ModTime).valueOf() : undefined;
    } catch (error) {
      this.logger.warn(`Failed to parse ModTime for ${item.Name}: ${item.ModTime}`);
      mtime = Date.now();
    }

    const node: INode = {
      name: item.Name,
      path: `/${itemPath}`.replace(/\/+/g, '/'),
      size: item.Size || 0,
      mtime,
      mime: isDirectory ? 'inode/directory' : (item.MimeType || null),
      parent: parentPath ? `/${parentPath}`.replace(/\/+/g, '/') : '/',
      type: isDirectory ? 'dir' : 'file',
      mount: this.remote,
    };

    this.logger.debug('rcloneItemToINode output:', node);
    return node;
  }

  async stat(path: string, options?: any): Promise<INode> {
    this.logger.debug(`stat input: ${path}`);
    const normalizedPath = this.normalizePath(path);
    
    try {
      const item = await this.client.stat(normalizedPath, {
        showMimeType: true,
        showHash: false,
      });

      if (!item) {
        const error: any = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }

      const parentPath = dirname(normalizedPath);
      return this.rcloneItemToINode(item, parentPath === '.' ? '' : parentPath);
    } catch (error: any) {
      this.logger.error(`stat error for ${path}:`, error);
      
      if (error.message?.includes('not found') || error.status === 404) {
        const err: any = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        err.code = 'ENOENT';
        throw err;
      }
      
      throw error;
    }
  }

  async readfile(path: string, options: any = {}): Promise<{ stream: Readable; meta: any }> {
    this.logger.debug(`readfile input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      // First check if it's a file
      const item = await this.client.stat(normalizedPath);
      if (!item) {
        const error: any = new Error(`ENOENT: no such file or directory, open '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }

      if (item.IsDir) {
        const error: any = new Error('EISDIR: Requested resource is a directory');
        error.code = 'EISDIR';
        throw error;
      }

      const meta = {
        size: item.Size,
        etag: `"${item.ModTime}-${item.Size}"`,
      };

      if (options.head) {
        return { stream: null as any, meta };
      }

      // Read file content
      const rangeOptions = options.start !== undefined || options.end !== undefined 
        ? { start: options.start, end: options.end }
        : undefined;

      const arrayBuffer = await this.client.readFile(normalizedPath, rangeOptions);
      const buffer = Buffer.from(arrayBuffer);
      
      // Create readable stream from buffer
      const stream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        }
      });

      return { stream, meta };
    } catch (error: any) {
      this.logger.error(`readfile error for ${path}:`, error);
      
      if (error.code === 'EISDIR' || error.code === 'ENOENT') {
        throw error;
      }
      
      // Transform other errors
      const err: any = new Error(`Error reading file: ${error.message}`);
      err.code = 'EIO';
      throw err;
    }
  }

  async writefile(path: string, content: string | Buffer, options: any = {}): Promise<void> {
    this.logger.debug(`writefile input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      await this.client.uploadFile(normalizedPath, content);
      this.logger.info(`File written successfully: ${path}`);
    } catch (error: any) {
      this.logger.error(`writefile error for ${path}:`, error);
      throw new Error(`Error writing file: ${error.message}`);
    }
  }

  async readdir(path: string, options?: any): Promise<INode[]> {
    this.logger.debug(`readdir input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      // First verify it's a directory
      if (normalizedPath) {
        const item = await this.client.stat(normalizedPath);
        if (item && !item.IsDir) {
          const error: any = new Error('ENOTDIR: Requested resource is not a directory');
          error.code = 'ENOTDIR';
          throw error;
        }
      }

      const items = await this.client.list(normalizedPath, {
        showMimeType: true,
        showHash: false,
      });

      const nodes = items.map(item => this.rcloneItemToINode(item, normalizedPath));
      this.logger.debug(`readdir output: ${nodes.length} items`);
      return nodes;
    } catch (error: any) {
      this.logger.error(`readdir error for ${path}:`, error);
      
      if (error.code === 'ENOTDIR') {
        throw error;
      }
      
      if (error.message?.includes('not found') || error.status === 404) {
        const err: any = new Error('ENOENT: Directory not found');
        err.code = 'ENOENT';
        throw err;
      }
      
      throw error;
    }
  }

  async mkfile(path: string, options: any = {}): Promise<void> {
    await this.writefile(path, '', options);
  }

  async mkdir(path: string, options: any = {}): Promise<void> {
    this.logger.debug(`mkdir input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      await this.client.mkdir(normalizedPath);
      this.logger.info(`Directory created: ${path}`);
    } catch (error: any) {
      this.logger.error(`mkdir error for ${path}:`, error);
      throw new Error(`Error creating directory: ${error.message}`);
    }
  }

  async mkdirP(path: string, options: any = {}): Promise<void> {
    this.logger.debug(`mkdirP input: ${path}`);
    const normalizedPath = this.normalizePath(path);
    
    // For rclone, we need to create parent directories recursively
    const pathSegments = normalizedPath.split('/').filter(segment => segment.length > 0);
    let currentPath = '';
    
    for (const segment of pathSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      
      try {
        // Check if directory already exists
        const existing = await this.client.stat(currentPath);
        if (existing && !existing.IsDir) {
          throw new Error(`ENOTDIR: Path exists but is not a directory: ${currentPath}`);
        }
      } catch (error: any) {
        if (error.message?.includes('not found') || error.status === 404) {
          // Directory doesn't exist, create it
          try {
            await this.client.mkdir(currentPath);
            this.logger.debug(`Created directory: ${currentPath}`);
          } catch (mkdirError: any) {
            this.logger.error(`mkdirP error creating ${currentPath}:`, mkdirError);
            throw new Error(`Error creating directory ${currentPath}: ${mkdirError.message}`);
          }
        } else {
          throw error;
        }
      }
    }
    
    this.logger.info(`Directory path created: ${path}`);
  }

  async rmfile(path: string, options?: any): Promise<void> {
    this.logger.debug(`rmfile input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      // Check if it's a file or directory
      const item = await this.client.stat(normalizedPath);
      if (!item) {
        const error: any = new Error(`ENOENT: no such file or directory, unlink '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }

      if (item.IsDir) {
        // Use purge for directories (removes directory and all contents)
        await this.client.purge(normalizedPath);
      } else {
        await this.client.deleteFile(normalizedPath);
      }
      
      this.logger.info(`Removed: ${path}`);
    } catch (error: any) {
      this.logger.error(`rmfile error for ${path}:`, error);
      
      if (error.code === 'ENOENT') {
        throw error;
      }
      
      throw new Error(`Error removing file/directory: ${error.message}`);
    }
  }

  async rmdir(path: string, options: any = {}): Promise<void> {
    this.logger.debug(`rmdir input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      // Check if directory exists and is empty
      const items = await this.client.list(normalizedPath);
      if (items.length > 0) {
        const error: any = new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`);
        error.code = 'ENOTEMPTY';
        throw error;
      }

      await this.client.rmdir(normalizedPath);
      this.logger.info(`Directory removed: ${path}`);
    } catch (error: any) {
      this.logger.error(`rmdir error for ${path}:`, error);
      
      if (error.code === 'ENOTEMPTY') {
        throw error;
      }
      
      if (error.message?.includes('not found') || error.status === 404) {
        const err: any = new Error(`ENOENT: no such file or directory, rmdir '${path}'`);
        err.code = 'ENOENT';
        throw err;
      }
      
      throw new Error(`Error removing directory: ${error.message}`);
    }
  }

  async rename(from: string, to: string, options: any = {}): Promise<void> {
    this.logger.debug(`rename input: ${from} -> ${to}`);
    const fromPath = this.normalizePath(from);
    const toPath = this.normalizePath(to);

    try {
      await this.client.moveFile(fromPath, toPath);
      this.logger.info(`Renamed: ${from} -> ${to}`);
    } catch (error: any) {
      this.logger.error(`rename error for ${from} -> ${to}:`, error);
      throw new Error(`Error renaming file: ${error.message}`);
    }
  }

  async copy(from: string, to: string, options: any = {}): Promise<void> {
    this.logger.debug(`copy input: ${from} -> ${to}`);
    const fromPath = this.normalizePath(from);
    const toPath = this.normalizePath(to);

    try {
      await this.client.copyFile(fromPath, toPath);
      this.logger.info(`Copied: ${from} -> ${to}`);
    } catch (error: any) {
      this.logger.error(`copy error for ${from} -> ${to}:`, error);
      throw new Error(`Error copying file: ${error.message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    this.logger.debug(`exists input: ${path}`);
    const normalizedPath = this.normalizePath(path);

    try {
      const item = await this.client.stat(normalizedPath);
      return item !== null;
    } catch (error: any) {
      this.logger.debug(`exists check failed for ${path}:`, error.message);
      return false;
    }
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    return this.client.healthCheck();
  }

  // Get remote name
  getRemote(): string {
    return this.remote;
  }

  // Get available remotes
  async getAvailableRemotes(): Promise<string[]> {
    return this.client.listRemotes();
  }
}
