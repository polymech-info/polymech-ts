import { Logger } from 'tslog';
import type { RcloneLib } from './RcloneLib';
import type { RemoteInfo } from './index';

/**
 * Library for managing rclone remotes
 */
export class RemoteManagerLib {
  private logger: Logger<unknown>;
  private rclone: RcloneLib;
  private remoteCache = new Map<string, RemoteInfo>();
  private lastCacheUpdate: Date | null = null;

  constructor(rclone: RcloneLib) {
    this.logger = new Logger({ name: 'RemoteManagerLib' });
    this.rclone = rclone;
  }

  /**
   * List all configured remotes
   */
  async listRemotes(refresh: boolean = false): Promise<string[]> {
    this.logger.debug('Listing remotes', { refresh });

    try {
      // Try RC API first
      const client = this.rclone.getClient();
      if (client) {
        return await client.listRemotes();
      }
      
      // Fall back to CLI
      return await this.rclone.getWrapper().listRemotes();
    } catch (error: any) {
      this.logger.error('Failed to list remotes', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed information about remotes
   */
  async getRemoteInfo(remoteName: string, refresh: boolean = false): Promise<RemoteInfo> {
    // Check cache first
    if (!refresh && this.remoteCache.has(remoteName)) {
      const cached = this.remoteCache.get(remoteName)!;
      // Cache is valid for 5 minutes
      if (this.lastCacheUpdate && (Date.now() - this.lastCacheUpdate.getTime()) < 300000) {
        return cached;
      }
    }

    this.logger.debug('Getting remote info', { remoteName, refresh });

    try {
      const remoteInfo: RemoteInfo = {
        name: remoteName,
        type: 'unknown',
        config: {},
        status: 'disconnected',
        features: [],
      };

      // Get remote configuration
      const client = this.rclone.getClient();
      if (client) {
        try {
          // Test connection by trying to list root
          await client.list('', { showMimeType: true });
          remoteInfo.status = 'connected';
        } catch (error) {
          remoteInfo.status = 'error';
        }

        // Try to get quota information
        try {
          const result = await this.rclone.executeCommand('about', [`${remoteName}:`], { quiet: true });
          if (result.success && result.stdout) {
            // Parse quota info from output
            const lines = result.stdout.split('\n');
            const quotaInfo = this.parseQuotaInfo(lines);
            if (quotaInfo) {
              remoteInfo.quota = quotaInfo;
            }
          }
        } catch (error) {
          this.logger.debug('Could not get quota info', { remoteName, error });
        }
      }

      // Get remote type and features from config
      try {
        const result = await this.rclone.executeCommand('config', ['show', remoteName]);
        if (result.success) {
          const config = this.parseConfigOutput(result.stdout);
          remoteInfo.config = config;
          remoteInfo.type = config.type || 'unknown';
        }
      } catch (error) {
        this.logger.debug('Could not get remote config', { remoteName, error });
      }

      // Cache the result
      this.remoteCache.set(remoteName, remoteInfo);
      this.lastCacheUpdate = new Date();

      return remoteInfo;
    } catch (error: any) {
      this.logger.error('Failed to get remote info', { remoteName, error: error.message });
      throw error;
    }
  }

  /**
   * Get information about all remotes
   */
  async getAllRemoteInfo(refresh: boolean = false): Promise<RemoteInfo[]> {
    const remoteNames = await this.listRemotes(refresh);
    const remoteInfoPromises = remoteNames.map(name => 
      this.getRemoteInfo(name, refresh).catch(error => {
        this.logger.warn('Failed to get info for remote', { name, error: error.message });
        return {
          name,
          type: 'unknown',
          config: {},
          status: 'error' as const,
          features: [],
        };
      })
    );

    return Promise.all(remoteInfoPromises);
  }

  /**
   * Test remote connectivity
   */
  async testRemote(remoteName: string): Promise<{ 
    success: boolean; 
    responseTime?: number; 
    error?: string;
    features?: string[];
  }> {
    this.logger.debug('Testing remote connectivity', { remoteName });

    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const result = await this.rclone.executeCommand('lsd', [`${remoteName}:`], { 
        quiet: true,
        timeout: 10000 
      });
      
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        // Get remote features
        const features = await this.getRemoteFeatures(remoteName);
        
        return {
          success: true,
          responseTime,
          features,
        };
      } else {
        return {
          success: false,
          responseTime,
          error: result.stderr || 'Connection test failed',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Get remote features and capabilities
   */
  async getRemoteFeatures(remoteName: string): Promise<string[]> {
    try {
      const result = await this.rclone.executeCommand('backend', ['features', `${remoteName}:`]);
      
      if (result.success) {
        // Parse features from JSON output
        try {
          const features = JSON.parse(result.stdout);
          return Object.keys(features).filter(key => features[key] === true);
        } catch (parseError) {
          this.logger.debug('Could not parse features JSON', { remoteName, parseError });
          return [];
        }
      }
      
      return [];
    } catch (error) {
      this.logger.debug('Could not get remote features', { remoteName, error });
      return [];
    }
  }

  /**
   * Get remote quota information
   */
  async getRemoteQuota(remoteName: string): Promise<{
    total: number;
    used: number;
    free: number;
  } | null> {
    try {
      const result = await this.rclone.executeCommand('about', [`${remoteName}:`, '--json']);
      
      if (result.success) {
        const aboutInfo = JSON.parse(result.stdout);
        return {
          total: aboutInfo.total || 0,
          used: aboutInfo.used || 0,
          free: aboutInfo.free || 0,
        };
      }
      
      return null;
    } catch (error) {
      this.logger.debug('Could not get quota information', { remoteName, error });
      return null;
    }
  }

  /**
   * Create a new remote configuration
   */
  async createRemote(
    name: string,
    type: string,
    config: Record<string, any>,
    options: { obscurePasswords?: boolean } = {}
  ): Promise<void> {
    this.logger.info('Creating remote', { name, type });

    // Build config command arguments
    const args = ['config', 'create', name, type];
    
    // Add configuration parameters
    for (const [key, value] of Object.entries(config)) {
      if (options.obscurePasswords && key.toLowerCase().includes('password')) {
        // Obscure password values
        const obscureResult = await this.rclone.executeCommand('obscure', [value]);
        if (obscureResult.success) {
          args.push(key, obscureResult.stdout.trim());
        } else {
          args.push(key, value);
        }
      } else {
        args.push(key, value);
      }
    }

    const result = await this.rclone.executeCommand('config', args);
    
    if (!result.success) {
      throw new Error(`Failed to create remote: ${result.stderr}`);
    }

    // Clear cache to force refresh
    this.remoteCache.delete(name);
    this.lastCacheUpdate = null;
  }

  /**
   * Update remote configuration
   */
  async updateRemote(
    name: string,
    updates: Record<string, any>,
    options: { obscurePasswords?: boolean } = {}
  ): Promise<void> {
    this.logger.info('Updating remote', { name, updates });

    for (const [key, value] of Object.entries(updates)) {
      let finalValue = value;
      
      if (options.obscurePasswords && key.toLowerCase().includes('password')) {
        const obscureResult = await this.rclone.executeCommand('obscure', [value]);
        if (obscureResult.success) {
          finalValue = obscureResult.stdout.trim();
        }
      }

      const result = await this.rclone.executeCommand('config', ['update', name, key, finalValue]);
      
      if (!result.success) {
        throw new Error(`Failed to update remote ${name}: ${result.stderr}`);
      }
    }

    // Clear cache
    this.remoteCache.delete(name);
    this.lastCacheUpdate = null;
  }

  /**
   * Delete a remote configuration
   */
  async deleteRemote(name: string): Promise<void> {
    this.logger.info('Deleting remote', { name });

    const result = await this.rclone.executeCommand('config', ['delete', name]);
    
    if (!result.success) {
      throw new Error(`Failed to delete remote: ${result.stderr}`);
    }

    // Clear from cache
    this.remoteCache.delete(name);
  }

  /**
   * Rename a remote
   */
  async renameRemote(oldName: string, newName: string): Promise<void> {
    this.logger.info('Renaming remote', { oldName, newName });

    // Get current config
    const remoteInfo = await this.getRemoteInfo(oldName);
    
    // Create new remote with same config
    await this.createRemote(newName, remoteInfo.type, remoteInfo.config);
    
    // Delete old remote
    await this.deleteRemote(oldName);
  }

  /**
   * Clear remote cache
   */
  clearCache(): void {
    this.remoteCache.clear();
    this.lastCacheUpdate = null;
    this.logger.debug('Remote cache cleared');
  }

  /**
   * Get health status of all remotes
   */
  async getHealthStatus(): Promise<Record<string, { 
    status: 'healthy' | 'unhealthy' | 'error'; 
    responseTime?: number;
    error?: string;
  }>> {
    const remoteNames = await this.listRemotes();
    const healthChecks = await Promise.allSettled(
      remoteNames.map(async name => {
        const test = await this.testRemote(name);
        return {
          name,
          status: test.success ? 'healthy' as const : 'unhealthy' as const,
          responseTime: test.responseTime,
          error: test.error,
        };
      })
    );

    const result: Record<string, any> = {};
    
    healthChecks.forEach((check, index) => {
      const remoteName = remoteNames[index];
      if (check.status === 'fulfilled') {
        result[remoteName] = {
          status: check.value.status,
          responseTime: check.value.responseTime,
          error: check.value.error,
        };
      } else {
        result[remoteName] = {
          status: 'error',
          error: check.reason?.message || 'Health check failed',
        };
      }
    });

    return result;
  }

  // Private helper methods

  private parseQuotaInfo(lines: string[]): { total: number; used: number; free: number } | null {
    try {
      let total = 0, used = 0, free = 0;
      
      for (const line of lines) {
        if (line.includes('Total:')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/);
          if (match) {
            total = this.parseSize(match[1], match[2]);
          }
        } else if (line.includes('Used:')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/);
          if (match) {
            used = this.parseSize(match[1], match[2]);
          }
        } else if (line.includes('Free:')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/);
          if (match) {
            free = this.parseSize(match[1], match[2]);
          }
        }
      }
      
      return total > 0 ? { total, used, free } : null;
    } catch (error) {
      return null;
    }
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

  private parseConfigOutput(output: string): Record<string, any> {
    const config: Record<string, any> = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        config[match[1]] = match[2];
      }
    }
    
    return config;
  }
}
