// High-level rclone library exports
export { RcloneLib } from './RcloneLib';
export { MountManagerLib } from './MountManagerLib';
export { FileOperationsLib } from './FileOperationsLib';
export { RemoteManagerLib } from './RemoteManagerLib';
export { ConfigManagerLib } from './ConfigManagerLib';
export { SyncManagerLib } from './SyncManagerLib';

// Re-export types and schemas
export * from '../../vfs/rclone/zod_schema';
export type { IRcloneVFSParameters } from '../../vfs/rclone/RcloneVFS';

// Library-specific types
export interface RcloneLibConfig {
  rcUrl?: string;
  rcUsername?: string;
  rcPassword?: string;
  timeout?: number;
  retries?: number;
  defaultRemote?: string;
  configPath?: string;
  logLevel?: 'DEBUG' | 'INFO' | 'NOTICE' | 'ERROR';
}

export interface OperationOptions {
  dryRun?: boolean;
  verbose?: boolean;
  progress?: boolean;
  transfers?: number;
  checkers?: number;
  bwlimit?: string;
  exclude?: string[];
  include?: string[];
  filter?: string[];
}

export interface MountInfo {
  name: string;
  type: 'local' | 'rclone';
  path: string;
  remote?: string;
  url?: string;
  username?: string;
  password?: string;
  timeout?: number;
  retries?: number;
  status: 'active' | 'inactive' | 'error';
  lastAccessed?: Date;
  errorMessage?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mtime?: Date;
  isDir: boolean;
  mime?: string;
  hash?: Record<string, string>;
  remote?: string;
  mount?: string;
}

export interface DirectoryInfo extends FileInfo {
  children?: FileInfo[];
  totalSize?: number;
  fileCount?: number;
  dirCount?: number;
}

export interface TransferInfo {
  id: string;
  operation: 'copy' | 'move' | 'sync' | 'upload' | 'download';
  source: string;
  destination: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
    speed: number; // bytes per second
    eta: number; // seconds remaining
  };
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface RemoteInfo {
  name: string;
  type: string;
  config: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error';
  features: string[];
  quota?: {
    total: number;
    used: number;
    free: number;
  };
}

export interface SyncOptions extends OperationOptions {
  deleteExcluded?: boolean;
  deleteAfter?: boolean;
  deleteDuring?: boolean;
  ignoreSize?: boolean;
  ignoreTime?: boolean;
  sizeOnly?: boolean;
  checksum?: boolean;
  maxAge?: string;
  minAge?: string;
  maxSize?: string;
  minSize?: string;
}
