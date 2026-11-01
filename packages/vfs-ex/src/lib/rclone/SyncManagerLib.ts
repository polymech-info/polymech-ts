import { Logger } from 'tslog';
import type { RcloneLib } from './RcloneLib';
import type { SyncOptions } from './index';

/**
 * Library for managing sync operations
 */
export class SyncManagerLib {
  private logger: Logger<unknown>;
  private rclone: RcloneLib;

  constructor(rclone: RcloneLib) {
    this.logger = new Logger({ name: 'SyncManagerLib' });
    this.rclone = rclone;
  }

  /**
   * Sync directories
   */
  async sync(
    sourceMountOrRemote: string,
    sourcePath: string,
    destMountOrRemote: string,
    destPath: string,
    options: SyncOptions = {}
  ): Promise<string> {
    this.logger.info('Starting sync operation', {
      source: `${sourceMountOrRemote}:${sourcePath}`,
      dest: `${destMountOrRemote}:${destPath}`,
      options,
    });

    const sourceRemote = `${sourceMountOrRemote}:${sourcePath}`;
    const destRemote = `${destMountOrRemote}:${destPath}`;
    
    return this.rclone.startTransfer('sync', sourceRemote, destRemote, options);
  }

  /**
   * Bidirectional sync (bisync)
   */
  async bisync(
    mountOrRemote1: string,
    path1: string,
    mountOrRemote2: string,
    path2: string,
    options: SyncOptions & {
      resync?: boolean;
      checkAccess?: boolean;
      checkFilename?: string;
      maxDelete?: number;
      force?: boolean;
    } = {}
  ): Promise<string> {
    this.logger.info('Starting bidirectional sync', {
      path1: `${mountOrRemote1}:${path1}`,
      path2: `${mountOrRemote2}:${path2}`,
      options,
    });

    const args = [`${mountOrRemote1}:${path1}`, `${mountOrRemote2}:${path2}`];
    
    if (options.resync) args.push('--resync');
    if (options.checkAccess) args.push('--check-access');
    if (options.checkFilename) args.push('--check-filename', options.checkFilename);
    if (options.maxDelete) args.push('--max-delete', options.maxDelete.toString());
    if (options.force) args.push('--force');

    const result = await this.rclone.executeCommand('bisync', args, options);
    
    if (!result.success) {
      throw new Error(`Bisync failed: ${result.stderr}`);
    }

    return 'bisync-completed';
  }

  /**
   * Check what would be synchronized without actually doing it
   */
  async dryRun(
    sourceMountOrRemote: string,
    sourcePath: string,
    destMountOrRemote: string,
    destPath: string,
    options: SyncOptions = {}
  ): Promise<{
    toTransfer: Array<{ path: string; size: number; action: 'copy' | 'delete' | 'update' }>;
    totalSize: number;
    fileCount: number;
  }> {
    this.logger.info('Running sync dry-run', {
      source: `${sourceMountOrRemote}:${sourcePath}`,
      dest: `${destMountOrRemote}:${destPath}`,
    });

    const sourceRemote = `${sourceMountOrRemote}:${sourcePath}`;
    const destRemote = `${destMountOrRemote}:${destPath}`;
    
    const result = await this.rclone.executeCommand('sync', [sourceRemote, destRemote], {
      ...options,
      dryRun: true,
      verbose: true,
    });

    if (!result.success) {
      throw new Error(`Dry run failed: ${result.stderr}`);
    }

    return this.parseDryRunOutput(result.stdout);
  }

  /**
   * Compare two directories
   */
  async compare(
    mountOrRemote1: string,
    path1: string,
    mountOrRemote2: string,
    path2: string,
    options: {
      checksum?: boolean;
      sizeOnly?: boolean;
      modTimeWindow?: string;
    } = {}
  ): Promise<{
    identical: Array<{ path: string; size: number }>;
    different: Array<{ path: string; reason: string }>;
    onlyInSource: Array<{ path: string; size: number }>;
    onlyInDest: Array<{ path: string; size: number }>;
  }> {
    this.logger.info('Comparing directories', {
      path1: `${mountOrRemote1}:${path1}`,
      path2: `${mountOrRemote2}:${path2}`,
      options,
    });

    const args = [`${mountOrRemote1}:${path1}`, `${mountOrRemote2}:${path2}`];
    
    if (options.checksum) args.push('--checksum');
    if (options.sizeOnly) args.push('--size-only');
    if (options.modTimeWindow) args.push('--modify-window', options.modTimeWindow);

    const result = await this.rclone.executeCommand('check', args, { verbose: true });
    
    // Note: rclone check command returns non-zero exit code when differences are found
    // So we parse the output regardless of success status
    return this.parseCheckOutput(result.stdout + result.stderr);
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(transferId: string): Promise<{
    bytesTransferred: number;
    totalBytes: number;
    filesTransferred: number;
    totalFiles: number;
    speed: number;
    eta: number;
    errors: string[];
  } | null> {
    const transfer = this.rclone.getTransfer(transferId);
    if (!transfer) {
      return null;
    }

    return {
      bytesTransferred: transfer.progress.bytesTransferred,
      totalBytes: transfer.progress.totalBytes,
      filesTransferred: 0, // Would need to parse from rclone output
      totalFiles: 0, // Would need to parse from rclone output
      speed: transfer.progress.speed,
      eta: transfer.progress.eta,
      errors: transfer.error ? [transfer.error] : [],
    };
  }

  /**
   * Create sync profile for repeated operations
   */
  createSyncProfile(name: string, config: {
    source: { mount: string; path: string };
    destination: { mount: string; path: string };
    options: SyncOptions;
    schedule?: {
      enabled: boolean;
      cron?: string;
      interval?: number; // minutes
    };
  }): void {
    // This would typically be stored in a database or config file
    // For now, we'll just log the profile creation
    this.logger.info('Sync profile created', { name, config });
  }

  /**
   * Run sync profile
   */
  async runSyncProfile(name: string): Promise<string> {
    // In a real implementation, this would load the profile from storage
    // and execute the sync operation
    this.logger.info('Running sync profile', { name });
    
    throw new Error('Sync profiles not yet implemented - would load from storage and execute');
  }

  /**
   * Monitor sync progress
   */
  async monitorSync(
    transferId: string,
    callback: (stats: any) => void,
    intervalMs: number = 1000
  ): Promise<void> {
    const monitor = setInterval(async () => {
      const stats = await this.getSyncStats(transferId);
      if (stats) {
        callback(stats);
        
        const transfer = this.rclone.getTransfer(transferId);
        if (transfer && ['completed', 'failed', 'cancelled'].includes(transfer.status)) {
          clearInterval(monitor);
        }
      } else {
        clearInterval(monitor);
      }
    }, intervalMs);
  }

  // Private helper methods

  private parseDryRunOutput(output: string): {
    toTransfer: Array<{ path: string; size: number; action: 'copy' | 'delete' | 'update' }>;
    totalSize: number;
    fileCount: number;
  } {
    const toTransfer: Array<{ path: string; size: number; action: 'copy' | 'delete' | 'update' }> = [];
    let totalSize = 0;
    let fileCount = 0;

    const lines = output.split('\n');
    
    for (const line of lines) {
      // Parse rclone dry-run output format
      // This is a simplified parser - real implementation would be more robust
      if (line.includes('NOTICE:') && (line.includes('copy') || line.includes('delete'))) {
        const match = line.match(/NOTICE:\s+(.+?):\s+(.+)/);
        if (match) {
          const action = match[1].toLowerCase().includes('delete') ? 'delete' : 'copy';
          const path = match[2];
          
          toTransfer.push({
            path,
            size: 0, // Would need to parse size from detailed output
            action: action as 'copy' | 'delete',
          });
          
          fileCount++;
        }
      }
      
      // Parse total size from summary
      if (line.includes('Transferred:')) {
        const sizeMatch = line.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/);
        if (sizeMatch) {
          totalSize = this.parseSize(sizeMatch[1], sizeMatch[2]);
        }
      }
    }

    return { toTransfer, totalSize, fileCount };
  }

  private parseCheckOutput(output: string): {
    identical: Array<{ path: string; size: number }>;
    different: Array<{ path: string; reason: string }>;
    onlyInSource: Array<{ path: string; size: number }>;
    onlyInDest: Array<{ path: string; size: number }>;
  } {
    const result = {
      identical: [] as Array<{ path: string; size: number }>,
      different: [] as Array<{ path: string; reason: string }>,
      onlyInSource: [] as Array<{ path: string; size: number }>,
      onlyInDest: [] as Array<{ path: string; size: number }>,
    };

    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('ERROR') && line.includes('not found')) {
        const pathMatch = line.match(/ERROR.*?([^:]+):\s*(.+)/);
        if (pathMatch) {
          const path = pathMatch[2];
          if (line.includes('source')) {
            result.onlyInDest.push({ path, size: 0 });
          } else {
            result.onlyInSource.push({ path, size: 0 });
          }
        }
      } else if (line.includes('ERROR') && (line.includes('differ') || line.includes('mismatch'))) {
        const pathMatch = line.match(/ERROR.*?([^:]+):\s*(.+)/);
        if (pathMatch) {
          result.different.push({
            path: pathMatch[2],
            reason: 'Content or metadata differs',
          });
        }
      }
    }

    return result;
  }

  private parseSize(value: string, unit: string): number {
    const num = parseFloat(value);
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };
    
    return num * (multipliers[unit] || 1);
  }
}
