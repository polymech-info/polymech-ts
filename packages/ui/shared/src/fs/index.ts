export type VfsMountName = string;
export type VfsSubpath = string;

export interface VfsPathRef {
  mount: VfsMountName;
  path: VfsSubpath;
}

export type VfsCopyConflictMode = 'auto' | 'manual';
export type VfsCopyConflictStrategy = 'error' | 'overwrite' | 'skip' | 'rename' | 'if_newer';
export type VfsTransferOperation = 'copy' | 'move' | 'delete';

export interface VfsCopyRequest {
  operation?: VfsTransferOperation;
  source?: VfsPathRef;
  sources?: VfsPathRef[];
  destination?: VfsPathRef;
  conflictMode?: VfsCopyConflictMode;
  conflictStrategy?: VfsCopyConflictStrategy;
  includePatterns?: string[];
  excludePatterns?: string[];
  excludeDefault?: boolean;
}

export interface VfsCopyConflict {
  source: string;
  destination: string;
  suggestedPath?: string;
}

export interface VfsCopyResponse {
  success: boolean;
  filesCopied: number;
  filesSkipped: number;
  bytesCopied: number;
  destinationPath?: string;
}

export interface VfsCopyConflictResponse {
  error: string;
  conflict: VfsCopyConflict;
}

export interface VfsCopyProgressEvent {
  sourceMount: string;
  destinationMount: string;
  sourcePath: string;
  destinationPath: string;
  progress: number;
  filesDone: number;
  totalFiles: number;
  bytesCopied: number;
}
