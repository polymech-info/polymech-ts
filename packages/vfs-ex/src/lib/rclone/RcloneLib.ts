import { Logger } from 'tslog';
import { RcloneClient } from '../../vfs/rclone/client';
import { RcloneVFS } from '../../vfs/rclone/RcloneVFS';
import { RcloneWrapper } from '../../vfs/rclone/cli/RcloneWrapper';
import { MountManagerLib } from './MountManagerLib';
import { FileOperationsLib } from './FileOperationsLib';
import { RemoteManagerLib } from './RemoteManagerLib';
import { ConfigManagerLib } from './ConfigManagerLib';
import { SyncManagerLib } from './SyncManagerLib';
import type { 
  RcloneLibConfig, 
  MountInfo, 
  TransferInfo, 
  OperationOptions 
} from './index';
import type { RcloneVFSConfig } from '../../vfs/rclone/zod_schema';

/**
 * High-level rclone library providing unified access to all rclone functionality
 */
export class RcloneLib {
  private logger: Logger<unknown>;
  private config: RcloneLibConfig;
  private client?: RcloneClient;
  private wrapper: RcloneWrapper;
  
  // Sub-managers
  public readonly mounts: MountManagerLib;
  public readonly files: FileOperationsLib;
  public readonly remotes: RemoteManagerLib;
  public readonly configuration: ConfigManagerLib;
  public readonly sync: SyncManagerLib;
  
  private activeTransfers = new Map<string, TransferInfo>();
  private transferIdCounter = 0;

  constructor(config: RcloneLibConfig = {}) {
    this.logger = new Logger({ name: 'RcloneLib' });
    this.config = {
      timeout: 30000,
      retries: 3,
      logLevel: 'INFO',
      ...config,
    };

    // Initialize wrapper for CLI operations
    this.wrapper = new RcloneWrapper({
      config: this.config.configPath,
      rcAddr: this.config.rcUrl?.replace(/^https?:\/\//, ''),
      rcUser: this.config.rcUsername,
      rcPass: this.config.rcPassword,
      logLevel: this.config.logLevel,
    });

    // Initialize RC client if URL provided
    if (this.config.rcUrl) {
      const clientConfig: RcloneVFSConfig = {
        url: this.config.rcUrl,
        username: this.config.rcUsername,
        password: this.config.rcPassword,
        remote: this.config.defaultRemote || '',
        timeout: this.config.timeout!,
        retries: this.config.retries!,
      };
      
      this.client = new RcloneClient(clientConfig);
    }

    // Initialize sub-managers
    this.mounts = new MountManagerLib(this);
    this.files = new FileOperationsLib(this);
    this.remotes = new RemoteManagerLib(this);
    this.configuration = new ConfigManagerLib(this);
    this.sync = new SyncManagerLib(this);

    this.logger.info('RcloneLib initialized', { config: this.config });
  }

  /**
   * Get the underlying RcloneClient (for RC API operations)
   */
  getClient(): RcloneClient | undefined {
    return this.client;
  }

  /**
   * Get the underlying RcloneWrapper (for CLI operations)
   */
  getWrapper(): RcloneWrapper {
    return this.wrapper;
  }

  /**
   * Get library configuration
   */
  getConfig(): RcloneLibConfig {
    return { ...this.config };
  }

  /**
   * Check if rclone is available and working
   */
  async healthCheck(): Promise<{
    rcloneBinary: boolean;
    rcServer: boolean;
    version?: string;
    error?: string;
  }> {
    const result = {
      rcloneBinary: false,
      rcServer: false,
      version: undefined as string | undefined,
      error: undefined as string | undefined,
    };

    try {
      // Check rclone binary
      result.rcloneBinary = await this.wrapper.checkRclone();
      if (result.rcloneBinary) {
        result.version = await this.wrapper.getVersion();
      }
    } catch (error: any) {
      result.error = `Binary check failed: ${error.message}`;
    }

    try {
      // Check RC server if configured
      if (this.client) {
        result.rcServer = await this.wrapper.testRC();
      }
    } catch (error: any) {
      if (!result.error) {
        result.error = `RC server check failed: ${error.message}`;
      }
    }

    return result;
  }

  /**
   * Create a VFS instance for a specific remote
   */
  createVFS(remote: string, options?: Partial<RcloneVFSConfig>): RcloneVFS {
    if (!this.config.rcUrl) {
      throw new Error('RC URL is required to create VFS instances');
    }

    const vfsConfig = {
      url: this.config.rcUrl,
      username: this.config.rcUsername,
      password: this.config.rcPassword,
      remote,
      timeout: this.config.timeout!,
      retries: this.config.retries!,
      ...options,
    };

    return new RcloneVFS(vfsConfig);
  }

  /**
   * Execute a command using the best available method (RC API or CLI)
   */
  async executeCommand(
    command: string, 
    args: string[], 
    options: OperationOptions = {}
  ): Promise<any> {
    this.logger.debug('Executing command', { command, args, options });

    // Try RC API first if available
    if (this.client && this.isRCCommand(command)) {
      try {
        return await this.executeRCCommand(command, args, options);
      } catch (error) {
        this.logger.warn('RC command failed, falling back to CLI', { error });
      }
    }

    // Fall back to CLI
    return await this.wrapper.executeCommand(command, args, options);
  }

  /**
   * Start a long-running operation with progress tracking
   */
  async startTransfer(
    operation: TransferInfo['operation'],
    source: string,
    destination: string,
    options: OperationOptions = {}
  ): Promise<string> {
    const transferId = `transfer_${++this.transferIdCounter}`;
    
    const transferInfo: TransferInfo = {
      id: transferId,
      operation,
      source,
      destination,
      status: 'pending',
      progress: {
        bytesTransferred: 0,
        totalBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
      },
      startTime: new Date(),
    };

    this.activeTransfers.set(transferId, transferInfo);

    // Start the operation asynchronously
    this.performTransfer(transferId, options).catch((error) => {
      const transfer = this.activeTransfers.get(transferId);
      if (transfer) {
        transfer.status = 'failed';
        transfer.error = error.message;
        transfer.endTime = new Date();
      }
    });

    return transferId;
  }

  /**
   * Get transfer status
   */
  getTransfer(transferId: string): TransferInfo | undefined {
    return this.activeTransfers.get(transferId);
  }

  /**
   * Get all active transfers
   */
  getActiveTransfers(): TransferInfo[] {
    return Array.from(this.activeTransfers.values());
  }

  /**
   * Cancel a transfer
   */
  async cancelTransfer(transferId: string): Promise<boolean> {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      return false;
    }

    transfer.status = 'cancelled';
    transfer.endTime = new Date();
    
    // TODO: Implement actual cancellation logic
    // This would involve stopping the underlying rclone process
    
    return true;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<{
    version: string;
    os: string;
    arch: string;
    goVersion: string;
    memstats?: any;
  }> {
    if (this.client) {
      const version = await this.client.getVersion();
      return {
        version: version.version || 'unknown',
        os: version.os || 'unknown',
        arch: version.arch || 'unknown',
        goVersion: version.goVersion || 'unknown',
      };
    }

    const version = await this.wrapper.getVersion();
    return {
      version,
      os: process.platform,
      arch: process.arch,
      goVersion: 'unknown',
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up RcloneLib resources');
    
    // Cancel all active transfers
    for (const transferId of this.activeTransfers.keys()) {
      await this.cancelTransfer(transferId);
    }
    
    this.activeTransfers.clear();
  }

  // Private methods

  private isRCCommand(command: string): boolean {
    const rcCommands = [
      'ls', 'lsd', 'lsf', 'lsjson', 'stat', 'copy', 'move', 'delete',
      'mkdir', 'rmdir', 'about', 'config', 'version'
    ];
    return rcCommands.includes(command);
  }

  private async executeRCCommand(
    command: string, 
    args: string[], 
    options: OperationOptions
  ): Promise<any> {
    if (!this.client) {
      throw new Error('RC client not available');
    }

    // Map CLI commands to RC operations
    const remote = args[0] || '';
    
    switch (command) {
      case 'ls':
        return this.client.list(remote, { showMimeType: true });
      case 'stat':
        return this.client.stat(remote, { showMimeType: true });
      case 'copy':
        return this.client.copyFile(args[0], args[1]);
      case 'move':
        return this.client.moveFile(args[0], args[1]);
      case 'delete':
        return this.client.deleteFile(remote);
      case 'mkdir':
        return this.client.mkdir(remote);
      case 'rmdir':
        return this.client.rmdir(remote);
      case 'version':
        return this.client.getVersion();
      default:
        throw new Error(`Unsupported RC command: ${command}`);
    }
  }

  private async performTransfer(
    transferId: string, 
    options: OperationOptions
  ): Promise<void> {
    const transfer = this.activeTransfers.get(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    try {
      transfer.status = 'running';

      // Map operation to command
      let command: string;
      switch (transfer.operation) {
        case 'copy':
          command = 'copy';
          break;
        case 'move':
          command = 'move';
          break;
        case 'sync':
          command = 'sync';
          break;
        default:
          throw new Error(`Unsupported operation: ${transfer.operation}`);
      }

      // Execute the operation
      const args = [transfer.source, transfer.destination];
      const result = await this.wrapper.streamCommand(command, args, {
        ...options,
        progress: true,
        stats: '1s',
      });

      if (result.success) {
        transfer.status = 'completed';
        transfer.progress.percentage = 100;
      } else {
        throw new Error(result.stderr || 'Transfer failed');
      }
    } catch (error: any) {
      transfer.status = 'failed';
      transfer.error = error.message;
    } finally {
      transfer.endTime = new Date();
    }
  }
}
