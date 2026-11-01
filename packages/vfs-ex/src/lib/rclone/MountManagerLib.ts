import { Logger } from 'tslog';
import type { RcloneLib } from './RcloneLib';
import type { MountInfo, FileInfo } from './index';
import { RcloneVFS } from '../../vfs/rclone/RcloneVFS';
import { LocalVFS } from '../../vfs/fs/Local';

/**
 * Library for managing rclone mounts and VFS instances
 */
export class MountManagerLib {
  private logger: Logger<unknown>;
  private rclone: RcloneLib;
  private activeMounts = new Map<string, MountInfo>();
  private vfsInstances = new Map<string, RcloneVFS | LocalVFS>();

  constructor(rclone: RcloneLib) {
    this.logger = new Logger({ name: 'MountManagerLib' });
    this.rclone = rclone;
  }

  /**
   * Create a new mount configuration
   */
  async createMount(config: {
    name: string;
    type: 'local' | 'rclone';
    path: string;
    remote?: string;
    url?: string;
    username?: string;
    password?: string;
    timeout?: number;
    retries?: number;
  }): Promise<MountInfo> {
    this.logger.info('Creating mount', { config });

    const mountInfo: MountInfo = {
      ...config,
      status: 'inactive',
      lastAccessed: new Date(),
    };

    try {
      // Validate the mount configuration
      await this.validateMount(mountInfo);
      
      mountInfo.status = 'active';
      this.activeMounts.set(config.name, mountInfo);
      
      this.logger.info('Mount created successfully', { name: config.name });
      return mountInfo;
    } catch (error: any) {
      mountInfo.status = 'error';
      mountInfo.errorMessage = error.message;
      this.activeMounts.set(config.name, mountInfo);
      
      this.logger.error('Failed to create mount', { name: config.name, error: error.message });
      throw error;
    }
  }

  /**
   * Get mount information
   */
  getMount(name: string): MountInfo | undefined {
    return this.activeMounts.get(name);
  }

  /**
   * List all mounts
   */
  listMounts(): MountInfo[] {
    return Array.from(this.activeMounts.values());
  }

  /**
   * Update mount configuration
   */
  async updateMount(name: string, updates: Partial<MountInfo>): Promise<MountInfo> {
    const mount = this.activeMounts.get(name);
    if (!mount) {
      throw new Error(`Mount '${name}' not found`);
    }

    const updatedMount = { ...mount, ...updates };
    
    try {
      await this.validateMount(updatedMount);
      updatedMount.status = 'active';
      this.activeMounts.set(name, updatedMount);
      
      // Invalidate VFS instance to force recreation with new config
      this.vfsInstances.delete(name);
      
      return updatedMount;
    } catch (error: any) {
      updatedMount.status = 'error';
      updatedMount.errorMessage = error.message;
      this.activeMounts.set(name, updatedMount);
      throw error;
    }
  }

  /**
   * Remove a mount
   */
  async removeMount(name: string): Promise<boolean> {
    const mount = this.activeMounts.get(name);
    if (!mount) {
      return false;
    }

    // Clean up VFS instance
    this.vfsInstances.delete(name);
    this.activeMounts.delete(name);
    
    this.logger.info('Mount removed', { name });
    return true;
  }

  /**
   * Get or create VFS instance for a mount
   */
  async getVFS(mountName: string): Promise<RcloneVFS | LocalVFS> {
    // Check if we have a cached instance
    let vfs = this.vfsInstances.get(mountName);
    if (vfs) {
      return vfs;
    }

    const mount = this.activeMounts.get(mountName);
    if (!mount) {
      throw new Error(`Mount '${mountName}' not found`);
    }

    if (mount.status !== 'active') {
      throw new Error(`Mount '${mountName}' is not active: ${mount.errorMessage || mount.status}`);
    }

    // Create VFS instance based on mount type
    if (mount.type === 'local') {
      vfs = new LocalVFS({ root: mount.path });
    } else if (mount.type === 'rclone') {
      if (!mount.remote || !mount.url) {
        throw new Error(`Rclone mount '${mountName}' requires remote and url`);
      }
      
      vfs = this.rclone.createVFS(mount.remote, {
        url: mount.url,
        username: mount.username,
        password: mount.password,
        timeout: mount.timeout,
        retries: mount.retries,
      });
    } else {
      throw new Error(`Unsupported mount type: ${mount.type}`);
    }

    // Cache the instance
    this.vfsInstances.set(mountName, vfs);
    
    // Update last accessed time
    mount.lastAccessed = new Date();
    
    return vfs;
  }

  /**
   * Test mount connectivity
   */
  async testMount(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const vfs = await this.getVFS(name);
      
      // Try to read root directory
      await vfs.readdir('/');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get mount statistics
   */
  async getMountStats(name: string): Promise<{
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    lastModified?: Date;
  }> {
    const vfs = await this.getVFS(name);
    
    // Get root directory stats
    const files = await vfs.readdir('/');
    
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    let lastModified: Date | undefined;

    for (const file of files) {
      if (file.type === 'dir') {
        totalDirectories++;
      } else {
        totalFiles++;
        totalSize += file.size;
      }
      
      if (file.mtime) {
        const fileDate = new Date(file.mtime);
        if (!lastModified || fileDate > lastModified) {
          lastModified = fileDate;
        }
      }
    }

    return {
      totalFiles,
      totalDirectories,
      totalSize,
      lastModified,
    };
  }

  /**
   * Browse mount contents
   */
  async browse(mountName: string, path: string = '/'): Promise<FileInfo[]> {
    const vfs = await this.getVFS(mountName);
    const files = await vfs.readdir(path);
    
    return files.map(file => ({
      name: file.name,
      path: file.path,
      size: file.size,
      mtime: file.mtime ? new Date(file.mtime) : undefined,
      isDir: file.type === 'dir',
      mime: file.mime || undefined,
      mount: mountName,
    }));
  }

  /**
   * Search for files in a mount
   */
  async search(
    mountName: string, 
    pattern: string, 
    options: {
      recursive?: boolean;
      caseSensitive?: boolean;
      includeDirectories?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<FileInfo[]> {
    const vfs = await this.getVFS(mountName);
    const results: FileInfo[] = [];
    
    const searchRecursive = async (currentPath: string, depth: number = 0): Promise<void> => {
      if (options.maxResults && results.length >= options.maxResults) {
        return;
      }
      
      try {
        const files = await vfs.readdir(currentPath);
        
        for (const file of files) {
          // Check if file matches pattern
          const fileName = options.caseSensitive ? file.name : file.name.toLowerCase();
          const searchPattern = options.caseSensitive ? pattern : pattern.toLowerCase();
          
          if (fileName.includes(searchPattern)) {
            if (file.type === 'dir' && !options.includeDirectories) {
              // Skip directories if not requested
            } else {
              results.push({
                name: file.name,
                path: file.path,
                size: file.size,
                mtime: file.mtime ? new Date(file.mtime) : undefined,
                isDir: file.type === 'dir',
                mime: file.mime || undefined,
                mount: mountName,
              });
            }
          }
          
          // Recurse into directories if requested
          if (options.recursive && file.type === 'dir' && depth < 10) {
            await searchRecursive(file.path, depth + 1);
          }
        }
      } catch (error) {
        this.logger.warn('Search error in directory', { path: currentPath, error });
      }
    };
    
    await searchRecursive('/');
    return results.slice(0, options.maxResults || results.length);
  }

  /**
   * Get mount health status
   */
  async getHealthStatus(): Promise<Record<string, { status: string; error?: string }>> {
    const status: Record<string, { status: string; error?: string }> = {};
    
    for (const [name, mount] of this.activeMounts) {
      try {
        const testResult = await this.testMount(name);
        status[name] = {
          status: testResult.success ? 'healthy' : 'unhealthy',
          error: testResult.error,
        };
      } catch (error: any) {
        status[name] = {
          status: 'error',
          error: error.message,
        };
      }
    }
    
    return status;
  }

  /**
   * Clean up inactive VFS instances
   */
  cleanupInactiveVFS(maxAge: number = 300000): void { // 5 minutes default
    const now = new Date();
    
    for (const [name, mount] of this.activeMounts) {
      if (mount.lastAccessed && (now.getTime() - mount.lastAccessed.getTime()) > maxAge) {
        this.vfsInstances.delete(name);
        this.logger.debug('Cleaned up inactive VFS instance', { name });
      }
    }
  }

  // Private methods

  private async validateMount(mount: MountInfo): Promise<void> {
    if (mount.type === 'rclone') {
      if (!mount.remote) {
        throw new Error('Rclone mount requires remote parameter');
      }
      
      if (!mount.url) {
        throw new Error('Rclone mount requires url parameter');
      }
      
      // Test RC connection if possible
      const client = this.rclone.getClient();
      if (client && mount.url === this.rclone.getConfig().rcUrl) {
        const healthy = await client.ping();
        if (!healthy) {
          throw new Error('Cannot connect to rclone RC server');
        }
      }
    }
    
    // Additional validation can be added here
  }
}
