import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { Logger } from 'tslog';
import {
  type RcloneVFSConfig,
  type RcloneRequest,
  type RcloneResponse,
  type RcloneListResponse,
  type RcloneFileItem,
  type OperationsListRequest,
  type OperationsStatRequest,
  type OperationsStatResponse,
  type OperationsCopyFileRequest,
  type OperationsMoveFileRequest,
  type OperationsDeleteFileRequest,
  type OperationsMkdirRequest,
  type OperationsRmdirRequest,
  type OperationsPurgeRequest,
  type CoreVersionResponse,
  type ConfigListRemotesResponse,
  type JobStatusRequest,
  type JobStatusResponse,
  type JobListResponse,
  type RcloneErrorResponse,
  RcloneListResponseSchema,
  OperationsStatResponseSchema,
  CoreVersionResponseSchema,
  ConfigListRemotesResponseSchema,
  JobStatusResponseSchema,
  JobListResponseSchema,
} from './zod_schema';

export class RcloneClient {
  private client: AxiosInstance;
  private logger: Logger<unknown>;
  private config: RcloneVFSConfig;

  constructor(config: RcloneVFSConfig) {
    this.config = config;
    this.logger = new Logger({ name: 'RcloneClient' });

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.url,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add authentication if provided
    if (config.username && config.password) {
      this.client.defaults.auth = {
        username: config.username,
        password: config.password,
      };
    }

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('Rclone API Request:', {
          method: config.method,
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        this.logger.error('Rclone API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('Rclone API Response:', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        this.logger.error('Rclone API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: any): RcloneErrorResponse {
    const rcloneError: RcloneErrorResponse = {
      error: error.message || 'Unknown error',
      status: error.response?.status,
    };

    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        rcloneError.error = error.response.data;
      } else if (error.response.data.error) {
        rcloneError.error = error.response.data.error;
        rcloneError.input = error.response.data.input;
        rcloneError.path = error.response.data.path;
      }
    }

    return rcloneError;
  }

  private async makeRequest<T>(
    endpoint: string,
    data: Record<string, any>,
    retries = this.config.retries
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(endpoint, data);
      
      // Check for rclone-specific errors in successful HTTP responses
      const responseData = response.data as any;
      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      return response.data;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        this.logger.warn(`Retrying request to ${endpoint}, attempts left: ${retries - 1}`);
        await this.delay(1000);
        return this.makeRequest<T>(endpoint, data, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Core API methods
  async getVersion(): Promise<CoreVersionResponse> {
    const response = await this.makeRequest<CoreVersionResponse>('/core/version', {});
    return CoreVersionResponseSchema.parse(response);
  }

  async ping(): Promise<boolean> {
    try {
      await this.makeRequest<RcloneResponse>('/rc/noop', {});
      return true;
    } catch {
      return false;
    }
  }

  // Config API methods
  async listRemotes(): Promise<string[]> {
    const response = await this.makeRequest<ConfigListRemotesResponse>('/config/listremotes', {});
    const parsed = ConfigListRemotesResponseSchema.parse(response);
    return parsed.remotes || [];
  }

  // Operations API methods
  async list(path: string, options?: {
    showHash?: boolean;
    showOrigIDs?: boolean;
    showEncrypted?: boolean;
    showMimeType?: boolean;
    recurse?: boolean;
    filesOnly?: boolean;
    dirsOnly?: boolean;
    hashTypes?: string[];
  }): Promise<RcloneFileItem[]> {
    const request: OperationsListRequest = {
      fs: this.config.remote,
      remote: path || '',
      opt: options,
    };

    const response = await this.makeRequest<RcloneListResponse>('/operations/list', request);
    const parsed = RcloneListResponseSchema.parse(response);
    return parsed.list || [];
  }

  async stat(path: string, options?: {
    showHash?: boolean;
    showOrigIDs?: boolean;
    showEncrypted?: boolean;
    showMimeType?: boolean;
    hashTypes?: string[];
  }): Promise<RcloneFileItem | null> {
    const request: OperationsStatRequest = {
      fs: this.config.remote,
      remote: path,
      opt: options,
    };

    try {
      const response = await this.makeRequest<OperationsStatResponse>('/operations/stat', request);
      const parsed = OperationsStatResponseSchema.parse(response);
      return parsed.item || null;
    } catch (error: any) {
      // If file not found, return null instead of throwing
      if (error.message?.includes('not found') || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async copyFile(srcPath: string, dstPath: string): Promise<void> {
    const request: OperationsCopyFileRequest = {
      srcFs: this.config.remote,
      srcRemote: srcPath,
      dstFs: this.config.remote,
      dstRemote: dstPath,
    };

    await this.makeRequest<RcloneResponse>('/operations/copyfile', request);
  }

  async moveFile(srcPath: string, dstPath: string): Promise<void> {
    const request: OperationsMoveFileRequest = {
      srcFs: this.config.remote,
      srcRemote: srcPath,
      dstFs: this.config.remote,
      dstRemote: dstPath,
    };

    await this.makeRequest<RcloneResponse>('/operations/movefile', request);
  }

  async deleteFile(path: string): Promise<void> {
    const request: OperationsDeleteFileRequest = {
      fs: this.config.remote,
      remote: path,
    };

    await this.makeRequest<RcloneResponse>('/operations/deletefile', request);
  }

  async mkdir(path: string): Promise<void> {
    const request: OperationsMkdirRequest = {
      fs: this.config.remote,
      remote: path,
    };

    await this.makeRequest<RcloneResponse>('/operations/mkdir', request);
  }

  async rmdir(path: string): Promise<void> {
    const request: OperationsRmdirRequest = {
      fs: this.config.remote,
      remote: path,
    };

    await this.makeRequest<RcloneResponse>('/operations/rmdir', request);
  }

  async purge(path: string): Promise<void> {
    const request: OperationsPurgeRequest = {
      fs: this.config.remote,
      remote: path,
    };

    await this.makeRequest<RcloneResponse>('/operations/purge', request);
  }

  async uploadFile(path: string, content: Buffer | string): Promise<void> {
    // For file uploads, we need to use multipart/form-data
    const formData = new FormData();
    
    // Convert content to Blob for FormData
    const blob = content instanceof Buffer 
      ? new Blob([content]) 
      : new Blob([content], { type: 'text/plain' });
    
    formData.append('file', blob);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const endpoint = `/operations/uploadfile`;
    const params = new URLSearchParams({
      fs: this.config.remote,
      remote: path,
    });

    await this.client.post(`${endpoint}?${params.toString()}`, formData, config);
  }

  // File content operations
  async readFile(path: string, options?: { start?: number; end?: number }): Promise<ArrayBuffer> {
    const params = new URLSearchParams({
      fs: this.config.remote,
      remote: path,
    });

    const config: AxiosRequestConfig = {
      responseType: 'arraybuffer',
    };

    // Add range header if specified
    if (options?.start !== undefined || options?.end !== undefined) {
      const start = options.start || 0;
      const end = options.end || '';
      config.headers = {
        'Range': `bytes=${start}-${end}`,
      };
    }

    const response = await this.client.get(`/[${this.config.remote}]/${path}`, config);
    return response.data;
  }

  // Job management methods
  async getJobStatus(jobId: number): Promise<JobStatusResponse> {
    const request: JobStatusRequest = { jobid: jobId };
    const response = await this.makeRequest<JobStatusResponse>('/job/status', request);
    return JobStatusResponseSchema.parse(response);
  }

  async listJobs(): Promise<number[]> {
    const response = await this.makeRequest<JobListResponse>('/job/list', {});
    const parsed = JobListResponseSchema.parse(response);
    return parsed.jobids || [];
  }

  async stopJob(jobId: number): Promise<void> {
    const request = { jobid: jobId };
    await this.makeRequest<RcloneResponse>('/job/stop', request);
  }

  // Async operation support
  async executeAsync<T>(operation: () => Promise<T>): Promise<{ jobId?: number; result?: T }> {
    try {
      const result = await operation();
      return { result };
    } catch (error: any) {
      // If the operation returns a job ID, it's running asynchronously
      if (error.response?.data?.jobid) {
        return { jobId: error.response.data.jobid };
      }
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    try {
      const version = await this.getVersion();
      const pingSuccess = await this.ping();
      
      return {
        healthy: pingSuccess,
        version: version.version,
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

