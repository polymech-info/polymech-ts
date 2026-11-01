import { Logger } from 'tslog';
import type { RcloneLib } from './RcloneLib';

/**
 * Library for managing rclone configuration
 */
export class ConfigManagerLib {
  private logger: Logger<unknown>;
  private rclone: RcloneLib;

  constructor(rclone: RcloneLib) {
    this.logger = new Logger({ name: 'ConfigManagerLib' });
    this.rclone = rclone;
  }

  /**
   * Show current configuration
   */
  async showConfig(): Promise<Record<string, any>> {
    const result = await this.rclone.executeCommand('config', ['show']);
    
    if (!result.success) {
      throw new Error(`Failed to show config: ${result.stderr}`);
    }

    return this.parseConfigOutput(result.stdout);
  }

  /**
   * Get configuration file path
   */
  async getConfigPath(): Promise<string> {
    const result = await this.rclone.executeCommand('config', ['file']);
    
    if (!result.success) {
      throw new Error(`Failed to get config path: ${result.stderr}`);
    }

    // Extract path from output
    const match = result.stdout.match(/Configuration file is stored at:\s*(.+)/);
    return match ? match[1].trim() : result.stdout.trim();
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const remotes = await this.rclone.remotes.listRemotes();
      
      for (const remote of remotes) {
        try {
          const test = await this.rclone.remotes.testRemote(remote);
          if (!test.success) {
            errors.push(`Remote '${remote}': ${test.error}`);
          }
        } catch (error: any) {
          errors.push(`Remote '${remote}': ${error.message}`);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Backup configuration
   */
  async backupConfig(backupPath: string): Promise<void> {
    const configPath = await this.getConfigPath();
    
    // Use file operations to copy config
    await this.rclone.files.copy('local', configPath, 'local', backupPath);
    
    this.logger.info('Configuration backed up', { from: configPath, to: backupPath });
  }

  /**
   * Restore configuration from backup
   */
  async restoreConfig(backupPath: string): Promise<void> {
    const configPath = await this.getConfigPath();
    
    // Use file operations to restore config
    await this.rclone.files.copy('local', backupPath, 'local', configPath, { overwrite: true });
    
    this.logger.info('Configuration restored', { from: backupPath, to: configPath });
  }

  /**
   * Export configuration to JSON
   */
  async exportConfig(): Promise<Record<string, any>> {
    return await this.showConfig();
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(config: Record<string, any>): Promise<void> {
    for (const [remoteName, remoteConfig] of Object.entries(config)) {
      if (typeof remoteConfig === 'object' && remoteConfig !== null) {
        const { type, ...parameters } = remoteConfig as any;
        
        if (type) {
          await this.rclone.remotes.createRemote(remoteName, type, parameters);
        }
      }
    }
    
    this.logger.info('Configuration imported', { remoteCount: Object.keys(config).length });
  }

  private parseConfigOutput(output: string): Record<string, any> {
    const config: Record<string, any> = {};
    const lines = output.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // New section
        currentSection = trimmed.slice(1, -1);
        config[currentSection] = {};
      } else if (currentSection && trimmed.includes('=')) {
        // Configuration parameter
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        config[currentSection][key.trim()] = value;
      }
    }
    
    return config;
  }
}
