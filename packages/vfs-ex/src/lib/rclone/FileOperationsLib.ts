import { Logger } from 'tslog';
import { Readable } from 'stream';
import type { RcloneLib } from './RcloneLib';
import type { FileInfo, DirectoryInfo, OperationOptions } from './index';

/**
 * Library for file operations across different mounts and remotes
 */
export class FileOperationsLib {
  private logger: Logger<unknown>;
  private rclone: RcloneLib;

  constructor(rclone: RcloneLib) {
    this.logger = new Logger({ name: 'FileOperationsLib' });
    this.rclone = rclone;
  }

  /**
   * Read file content
   */
  async readFile(
    mountOrRemote: string, 
    path: string, 
    options: {
      encoding?: BufferEncoding;
      start?: number;
      end?: number;
    } = {}
  ): Promise<string | Buffer> {
    this.logger.debug('Reading file', { mountOrRemote, path, options });

    try {
      // Try to get VFS instance first (for mounts)
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      const { stream } = await vfs.readfile(path, options);
      
      if (!stream) {
        throw new Error('File is a directory');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      return options.encoding ? buffer.toString(options.encoding) : buffer;
    } catch (error) {
      // Fall back to direct remote access
      if (this.rclone.getClient()) {
        const arrayBuffer = await this.rclone.getClient()!.readFile(path, options);
        const buffer = Buffer.from(arrayBuffer);
        return options.encoding ? buffer.toString(options.encoding) : buffer;
      }
      
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(
    mountOrRemote: string,
    path: string,
    content: string | Buffer,
    options: OperationOptions = {}
  ): Promise<void> {
    this.logger.debug('Writing file', { mountOrRemote, path, contentLength: content.length });

    if (options.dryRun) {
      this.logger.info('DRY RUN - Would write file', { mountOrRemote, path });
      return;
    }

    try {
      // Try VFS instance first
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      await vfs.writefile(path, content);
    } catch (error) {
      // Fall back to direct remote access
      if (this.rclone.getClient()) {
        await this.rclone.getClient()!.uploadFile(path, content);
      } else {
        throw error;
      }
    }
  }

  /**
   * Copy file or directory
   */
  async copy(
    sourceMountOrRemote: string,
    sourcePath: string,
    destMountOrRemote: string,
    destPath: string,
    options: OperationOptions = {}
  ): Promise<string> {
    this.logger.info('Copying', { 
      source: `${sourceMountOrRemote}:${sourcePath}`,
      dest: `${destMountOrRemote}:${destPath}`,
      options 
    });

    // For cross-mount operations, use rclone command
    const sourceRemote = `${sourceMountOrRemote}:${sourcePath}`;
    const destRemote = `${destMountOrRemote}:${destPath}`;
    
    return this.rclone.startTransfer('copy', sourceRemote, destRemote, options);
  }

  /**
   * Move file or directory
   */
  async move(
    sourceMountOrRemote: string,
    sourcePath: string,
    destMountOrRemote: string,
    destPath: string,
    options: OperationOptions = {}
  ): Promise<string> {
    this.logger.info('Moving', { 
      source: `${sourceMountOrRemote}:${sourcePath}`,
      dest: `${destMountOrRemote}:${destPath}`,
      options 
    });

    const sourceRemote = `${sourceMountOrRemote}:${sourcePath}`;
    const destRemote = `${destMountOrRemote}:${destPath}`;
    
    return this.rclone.startTransfer('move', sourceRemote, destRemote, options);
  }

  /**
   * Delete file or directory
   */
  async delete(
    mountOrRemote: string,
    path: string,
    options: OperationOptions & { recursive?: boolean } = {}
  ): Promise<void> {
    this.logger.info('Deleting', { mountOrRemote, path, options });

    if (options.dryRun) {
      this.logger.info('DRY RUN - Would delete', { mountOrRemote, path });
      return;
    }

    try {
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      await vfs.rmfile(path);
    } catch (error) {
      // Fall back to rclone command
      const args = [`${mountOrRemote}:${path}`];
      const command = options.recursive ? 'purge' : 'delete';
      
      const result = await this.rclone.executeCommand(command, args, options);
      if (!result.success) {
        throw new Error(result.stderr || 'Delete operation failed');
      }
    }
  }

  /**
   * Create directory
   */
  async mkdir(
    mountOrRemote: string,
    path: string,
    options: OperationOptions & { parents?: boolean } = {}
  ): Promise<void> {
    this.logger.debug('Creating directory', { mountOrRemote, path, options });

    if (options.dryRun) {
      this.logger.info('DRY RUN - Would create directory', { mountOrRemote, path });
      return;
    }

    try {
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      if (options.parents) {
        await vfs.mkdirP(path);
      } else {
        await vfs.mkdir(path);
      }
    } catch (error) {
      // Fall back to rclone command
      const args = [`${mountOrRemote}:${path}`];
      const result = await this.rclone.executeCommand('mkdir', args, options);
      
      if (!result.success) {
        throw new Error(result.stderr || 'Directory creation failed');
      }
    }
  }

  /**
   * List directory contents
   */
  async list(
    mountOrRemote: string,
    path: string = '/',
    options: {
      recursive?: boolean;
      showHidden?: boolean;
      includeSize?: boolean;
      includeHash?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<FileInfo[]> {
    this.logger.debug('Listing directory', { mountOrRemote, path, options });

    try {
      // Try VFS first
      const files = await this.rclone.mounts.browse(mountOrRemote, path);
      
      if (options.recursive && options.maxDepth !== 0) {
        const allFiles = [...files];
        
        for (const file of files) {
          if (file.isDir) {
            try {
              const subFiles = await this.list(
                mountOrRemote, 
                file.path, 
                { 
                  ...options, 
                  maxDepth: options.maxDepth ? options.maxDepth - 1 : undefined 
                }
              );
              allFiles.push(...subFiles);
            } catch (error) {
              this.logger.warn('Failed to list subdirectory', { path: file.path, error });
            }
          }
        }
        
        return allFiles;
      }
      
      return files;
    } catch (error) {
      // Fall back to rclone command
      const args = [`${mountOrRemote}:${path}`];
      const command = options.recursive ? 'lsjson' : 'lsjson';
      
      if (options.recursive) {
        args.push('-R');
      }
      
      const result = await this.rclone.executeCommand(command, args);
      if (!result.success) {
        throw new Error(result.stderr || 'List operation failed');
      }
      
      // Parse JSON output
      try {
        const items = JSON.parse(result.stdout);
        return items.map((item: any) => ({
          name: item.Name,
          path: item.Path || `${path}/${item.Name}`,
          size: item.Size || 0,
          mtime: item.ModTime ? new Date(item.ModTime) : undefined,
          isDir: item.IsDir || false,
          mime: item.MimeType,
          hash: item.Hashes,
        }));
      } catch (parseError) {
        throw new Error('Failed to parse list output');
      }
    }
  }

  /**
   * Get file or directory information
   */
  async stat(mountOrRemote: string, path: string): Promise<FileInfo> {
    this.logger.debug('Getting file stats', { mountOrRemote, path });

    try {
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      const stats = await vfs.stat(path);
      
      return {
        name: stats.name,
        path: stats.path,
        size: stats.size,
        mtime: stats.mtime ? new Date(stats.mtime) : undefined,
        isDir: stats.type === 'dir',
        mime: stats.mime || undefined,
      };
    } catch (error) {
      // Fall back to rclone stat command
      const args = [`${mountOrRemote}:${path}`];
      const result = await this.rclone.executeCommand('lsjson', args);
      
      if (!result.success) {
        throw new Error(result.stderr || 'Stat operation failed');
      }
      
      try {
        const items = JSON.parse(result.stdout);
        if (items.length === 0) {
          throw new Error('File not found');
        }
        
        const item = items[0];
        return {
          name: item.Name,
          path: path,
          size: item.Size || 0,
          mtime: item.ModTime ? new Date(item.ModTime) : undefined,
          isDir: item.IsDir || false,
          mime: item.MimeType,
          hash: item.Hashes,
        };
      } catch (parseError) {
        throw new Error('Failed to parse stat output');
      }
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(mountOrRemote: string, path: string): Promise<boolean> {
    try {
      await this.stat(mountOrRemote, path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get directory tree structure
   */
  async tree(
    mountOrRemote: string,
    path: string = '/',
    options: {
      maxDepth?: number;
      includeFiles?: boolean;
      includeSize?: boolean;
    } = {}
  ): Promise<DirectoryInfo> {
    const rootInfo = await this.stat(mountOrRemote, path);
    
    if (!rootInfo.isDir) {
      throw new Error('Path is not a directory');
    }

    const buildTree = async (
      currentPath: string, 
      depth: number = 0
    ): Promise<DirectoryInfo> => {
      const dirInfo = await this.stat(mountOrRemote, currentPath);
      const result: DirectoryInfo = {
        ...dirInfo,
        children: [],
        totalSize: 0,
        fileCount: 0,
        dirCount: 0,
      };

      if (options.maxDepth && depth >= options.maxDepth) {
        return result;
      }

      try {
        const items = await this.list(mountOrRemote, currentPath);
        
        for (const item of items) {
          if (item.isDir) {
            result.dirCount!++;
            const subTree = await buildTree(item.path, depth + 1);
            result.children!.push(subTree);
            result.totalSize! += subTree.totalSize || 0;
            result.fileCount! += subTree.fileCount || 0;
            result.dirCount! += subTree.dirCount || 0;
          } else if (options.includeFiles !== false) {
            result.fileCount!++;
            result.totalSize! += item.size;
            result.children!.push(item);
          }
        }
      } catch (error) {
        this.logger.warn('Failed to build tree for directory', { path: currentPath, error });
      }

      return result;
    };

    return buildTree(path);
  }

  /**
   * Calculate directory size
   */
  async calculateSize(
    mountOrRemote: string,
    path: string,
    options: { recursive?: boolean } = {}
  ): Promise<{ size: number; fileCount: number; dirCount: number }> {
    this.logger.debug('Calculating size', { mountOrRemote, path, options });

    try {
      // Use rclone size command for accurate results
      const args = [`${mountOrRemote}:${path}`];
      const result = await this.rclone.executeCommand('size', [...args, '--json']);
      
      if (result.success) {
        const sizeInfo = JSON.parse(result.stdout);
        return {
          size: sizeInfo.bytes || 0,
          fileCount: sizeInfo.count || 0,
          dirCount: 0, // size command doesn't provide directory count
        };
      }
    } catch (error) {
      this.logger.warn('Size command failed, falling back to manual calculation', { error });
    }

    // Fall back to manual calculation
    const items = await this.list(mountOrRemote, path, { recursive: options.recursive });
    
    let totalSize = 0;
    let fileCount = 0;
    let dirCount = 0;

    for (const item of items) {
      if (item.isDir) {
        dirCount++;
      } else {
        fileCount++;
        totalSize += item.size;
      }
    }

    return { size: totalSize, fileCount, dirCount };
  }

  /**
   * Create a readable stream for a file
   */
  async createReadStream(
    mountOrRemote: string,
    path: string,
    options: { start?: number; end?: number } = {}
  ): Promise<Readable> {
    try {
      const vfs = await this.rclone.mounts.getVFS(mountOrRemote);
      const { stream } = await vfs.readfile(path, options);
      return stream;
    } catch (error) {
      // For remote access, we'd need to implement streaming via RC API
      throw new Error('Stream access not available for remote-only operations');
    }
  }

  /**
   * Upload file from stream or buffer
   */
  async upload(
    mountOrRemote: string,
    path: string,
    source: Readable | Buffer | string,
    options: OperationOptions & { 
      overwrite?: boolean;
      createDirectories?: boolean;
    } = {}
  ): Promise<void> {
    this.logger.info('Uploading file', { mountOrRemote, path, options });

    if (options.dryRun) {
      this.logger.info('DRY RUN - Would upload file', { mountOrRemote, path });
      return;
    }

    // Convert source to buffer if needed
    let content: Buffer;
    if (source instanceof Buffer) {
      content = source;
    } else if (typeof source === 'string') {
      content = Buffer.from(source);
    } else {
      // Handle stream
      const chunks: Buffer[] = [];
      for await (const chunk of source) {
        chunks.push(chunk);
      }
      content = Buffer.concat(chunks);
    }

    // Create parent directories if requested
    if (options.createDirectories) {
      const parentPath = path.substring(0, path.lastIndexOf('/'));
      if (parentPath && parentPath !== '/') {
        await this.mkdir(mountOrRemote, parentPath, { parents: true });
      }
    }

    // Check if file exists and handle overwrite
    if (!options.overwrite && await this.exists(mountOrRemote, path)) {
      throw new Error(`File already exists: ${path}`);
    }

    await this.writeFile(mountOrRemote, path, content, options);
  }
}
