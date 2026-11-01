import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from 'tslog';
import { RcloneClient } from '../client';
import type { RcloneVFSConfig } from '../zod_schema';

const execAsync = promisify(exec);

export interface RcloneOptions {
  config?: string;
  verbose?: boolean;
  quiet?: boolean;
  dryRun?: boolean;
  rcAddr?: string;
  rcUser?: string;
  rcPass?: string;
  progress?: boolean;
  stats?: string;
  logLevel?: 'DEBUG' | 'INFO' | 'NOTICE' | 'ERROR';
  logFile?: string;
  checkFirst?: boolean;
  transfers?: number;
  checkers?: number;
  bwlimit?: string;
  exclude?: string[];
  include?: string[];
  filter?: string[];
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class RcloneWrapper {
  private logger: Logger<unknown>;
  private client?: RcloneClient;
  private options: RcloneOptions;

  constructor(options: RcloneOptions = {}) {
    this.logger = new Logger({ name: 'RcloneWrapper' });
    this.options = options;
    
    // Initialize RC client if RC options are provided
    if (options.rcAddr) {
      const rcConfig: RcloneVFSConfig = {
        url: `http://${options.rcAddr}`,
        username: options.rcUser,
        password: options.rcPass,
        remote: '', // Will be set per operation
        timeout: 30000,
        retries: 3,
      };
      
      this.client = new RcloneClient(rcConfig);
    }
  }

  /**
   * Execute rclone command using binary
   */
  async executeCommand(command: string, args: string[], options: RcloneOptions = {}): Promise<CommandResult> {
    const mergedOptions = { ...this.options, ...options };
    const rcloneArgs = this.buildArgs(command, args, mergedOptions);
    
    this.logger.debug('Executing rclone command:', { command: 'rclone', args: rcloneArgs });

    if (mergedOptions.dryRun) {
      this.logger.info('DRY RUN - Would execute:', `rclone ${rcloneArgs.join(' ')}`);
      return {
        success: true,
        stdout: 'DRY RUN - Command would be executed',
        stderr: '',
        exitCode: 0,
      };
    }

    try {
      const { stdout, stderr } = await execAsync(`rclone ${rcloneArgs.join(' ')}`);
      
      if (!mergedOptions.quiet) {
        if (stdout) console.log(stdout);
        if (stderr && mergedOptions.verbose) console.error(stderr);
      }

      return {
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
      };
    } catch (error: any) {
      this.logger.error('Command failed:', error.message);
      
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }

  /**
   * Execute rclone command using RC API (if available)
   */
  async executeRC(operation: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.client) {
      throw new Error('RC client not initialized. Provide rcAddr option.');
    }

    this.logger.debug('Executing RC command:', { operation, params });

    if (this.options.dryRun) {
      this.logger.info('DRY RUN - Would execute RC:', { operation, params });
      return { dryRun: true, operation, params };
    }

    // Map common operations to client methods
    switch (operation) {
      case 'operations/list':
        return this.client.list(params.remote || '', params.opt);
      case 'operations/stat':
        return this.client.stat(params.remote || '', params.opt);
      case 'operations/copyfile':
        return this.client.copyFile(params.srcRemote, params.dstRemote);
      case 'operations/movefile':
        return this.client.moveFile(params.srcRemote, params.dstRemote);
      case 'operations/deletefile':
        return this.client.deleteFile(params.remote);
      case 'operations/mkdir':
        return this.client.mkdir(params.remote);
      case 'operations/rmdir':
        return this.client.rmdir(params.remote);
      case 'operations/purge':
        return this.client.purge(params.remote);
      case 'config/listremotes':
        return this.client.listRemotes();
      case 'core/version':
        return this.client.getVersion();
      default:
        throw new Error(`Unsupported RC operation: ${operation}`);
    }
  }

  /**
   * Build command arguments
   */
  private buildArgs(command: string, args: string[], options: RcloneOptions): string[] {
    const rcloneArgs: string[] = [command, ...args];

    // Add global flags
    if (options.config) {
      rcloneArgs.push('--config', options.config);
    }
    
    if (options.verbose) {
      rcloneArgs.push('-v');
    }
    
    if (options.quiet) {
      rcloneArgs.push('-q');
    }
    
    if (options.dryRun) {
      rcloneArgs.push('--dry-run');
    }
    
    if (options.progress) {
      rcloneArgs.push('--progress');
    }
    
    if (options.stats) {
      rcloneArgs.push('--stats', options.stats);
    }
    
    if (options.logLevel) {
      rcloneArgs.push('--log-level', options.logLevel);
    }
    
    if (options.logFile) {
      rcloneArgs.push('--log-file', options.logFile);
    }
    
    if (options.checkFirst) {
      rcloneArgs.push('--check-first');
    }
    
    if (options.transfers) {
      rcloneArgs.push('--transfers', options.transfers.toString());
    }
    
    if (options.checkers) {
      rcloneArgs.push('--checkers', options.checkers.toString());
    }
    
    if (options.bwlimit) {
      rcloneArgs.push('--bwlimit', options.bwlimit);
    }
    
    if (options.exclude) {
      for (const pattern of options.exclude) {
        rcloneArgs.push('--exclude', pattern);
      }
    }
    
    if (options.include) {
      for (const pattern of options.include) {
        rcloneArgs.push('--include', pattern);
      }
    }
    
    if (options.filter) {
      for (const pattern of options.filter) {
        rcloneArgs.push('--filter', pattern);
      }
    }

    return rcloneArgs;
  }

  /**
   * Check if rclone is available
   */
  async checkRclone(): Promise<boolean> {
    try {
      await execAsync('rclone version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get rclone version
   */
  async getVersion(): Promise<string> {
    if (this.client) {
      const version = await this.client.getVersion();
      return version.version || 'unknown';
    }
    
    try {
      const { stdout } = await execAsync('rclone version');
      const match = stdout.match(/rclone v([\d.]+)/);
      return match ? match[1] : 'unknown';
    } catch (error) {
      throw new Error('Failed to get rclone version. Is rclone installed?');
    }
  }

  /**
   * Test RC connection
   */
  async testRC(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      return await this.client.ping();
    } catch {
      return false;
    }
  }

  /**
   * Get available remotes
   */
  async listRemotes(): Promise<string[]> {
    if (this.client) {
      return this.client.listRemotes();
    }
    
    try {
      const { stdout } = await execAsync('rclone listremotes');
      return stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      throw new Error('Failed to list remotes');
    }
  }

  /**
   * Stream command output
   */
  streamCommand(command: string, args: string[], options: RcloneOptions = {}): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const mergedOptions = { ...this.options, ...options };
      const rcloneArgs = this.buildArgs(command, args, mergedOptions);
      
      this.logger.debug('Streaming rclone command:', { command: 'rclone', args: rcloneArgs });

      if (mergedOptions.dryRun) {
        this.logger.info('DRY RUN - Would stream:', `rclone ${rcloneArgs.join(' ')}`);
        resolve({
          success: true,
          stdout: 'DRY RUN - Command would be streamed',
          stderr: '',
          exitCode: 0,
        });
        return;
      }

      const child = spawn('rclone', rcloneArgs, { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (!mergedOptions.quiet) {
          process.stdout.write(chunk);
        }
      });

      child.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (mergedOptions.verbose && !mergedOptions.quiet) {
          process.stderr.write(chunk);
        }
      });

      child.on('close', (code) => {
        const result: CommandResult = {
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
        };

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

