import { z } from 'zod';

// Base rclone remote configuration
export const RcloneRemoteConfigSchema = z.object({
  name: z.string(),
  type: z.string(),
  parameters: z.record(z.string(), z.any()).optional(),
});

export type RcloneRemoteConfig = z.infer<typeof RcloneRemoteConfigSchema>;

// Rclone RC API request/response schemas
export const RcloneRequestSchema = z.object({
  command: z.string(),
  parameters: z.record(z.string(), z.any()).optional(),
  _async: z.boolean().optional(),
  _config: z.record(z.string(), z.any()).optional(),
  _filter: z.record(z.string(), z.any()).optional(),
  _group: z.string().optional(),
});

export type RcloneRequest = z.infer<typeof RcloneRequestSchema>;

export const RcloneResponseSchema = z.object({
  error: z.string().optional(),
  input: z.record(z.string(), z.any()).optional(),
  jobid: z.number().optional(),
  finished: z.boolean().optional(),
});

export type RcloneResponse = z.infer<typeof RcloneResponseSchema>;

// File/Directory listing schemas
export const RcloneFileItemSchema = z.object({
  Name: z.string(),
  Size: z.number(),
  MimeType: z.string(),
  ModTime: z.string(),
  IsDir: z.boolean(),
  Hashes: z.record(z.string(), z.string()).optional(),
  ID: z.string().optional(),
  OrigID: z.string().optional(),
  Tier: z.string().optional(),
});

export type RcloneFileItem = z.infer<typeof RcloneFileItemSchema>;

export const RcloneListResponseSchema = RcloneResponseSchema.extend({
  list: z.array(RcloneFileItemSchema).optional(),
});

export type RcloneListResponse = z.infer<typeof RcloneListResponseSchema>;

// Operations schemas
export const OperationsListRequestSchema = z.object({
  fs: z.string(),
  remote: z.string().default(''),
  opt: z.object({
    showHash: z.boolean().optional(),
    showOrigIDs: z.boolean().optional(),
    showEncrypted: z.boolean().optional(),
    showMimeType: z.boolean().optional(),
    recurse: z.boolean().optional(),
    filesOnly: z.boolean().optional(),
    dirsOnly: z.boolean().optional(),
    hashTypes: z.array(z.string()).optional(),
  }).optional(),
});

export type OperationsListRequest = z.infer<typeof OperationsListRequestSchema>;

export const OperationsStatRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
  opt: z.object({
    showHash: z.boolean().optional(),
    showOrigIDs: z.boolean().optional(),
    showEncrypted: z.boolean().optional(),
    showMimeType: z.boolean().optional(),
    hashTypes: z.array(z.string()).optional(),
  }).optional(),
});

export type OperationsStatRequest = z.infer<typeof OperationsStatRequestSchema>;

export const OperationsStatResponseSchema = RcloneResponseSchema.extend({
  item: RcloneFileItemSchema.optional(),
});

export type OperationsStatResponse = z.infer<typeof OperationsStatResponseSchema>;

export const OperationsCopyFileRequestSchema = z.object({
  srcFs: z.string(),
  srcRemote: z.string(),
  dstFs: z.string(),
  dstRemote: z.string(),
});

export type OperationsCopyFileRequest = z.infer<typeof OperationsCopyFileRequestSchema>;

export const OperationsMoveFileRequestSchema = z.object({
  srcFs: z.string(),
  srcRemote: z.string(),
  dstFs: z.string(),
  dstRemote: z.string(),
});

export type OperationsMoveFileRequest = z.infer<typeof OperationsMoveFileRequestSchema>;

export const OperationsDeleteFileRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
});

export type OperationsDeleteFileRequest = z.infer<typeof OperationsDeleteFileRequestSchema>;

export const OperationsMkdirRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
});

export type OperationsMkdirRequest = z.infer<typeof OperationsMkdirRequestSchema>;

export const OperationsRmdirRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
});

export type OperationsRmdirRequest = z.infer<typeof OperationsRmdirRequestSchema>;

export const OperationsPurgeRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
});

export type OperationsPurgeRequest = z.infer<typeof OperationsPurgeRequestSchema>;

// Upload file schema
export const OperationsUploadFileRequestSchema = z.object({
  fs: z.string(),
  remote: z.string(),
  file: z.any(), // File data
});

export type OperationsUploadFileRequest = z.infer<typeof OperationsUploadFileRequestSchema>;

// Core version response
export const CoreVersionResponseSchema = RcloneResponseSchema.extend({
  arch: z.string().optional(),
  decomposed: z.array(z.number()).optional(),
  goTags: z.string().optional(),
  goVersion: z.string().optional(),
  isBeta: z.boolean().optional(),
  isGit: z.boolean().optional(),
  linking: z.string().optional(),
  os: z.string().optional(),
  version: z.string().optional(),
});

export type CoreVersionResponse = z.infer<typeof CoreVersionResponseSchema>;

// Config schemas
export const ConfigListRemotesResponseSchema = RcloneResponseSchema.extend({
  remotes: z.array(z.string()).optional(),
});

export type ConfigListRemotesResponse = z.infer<typeof ConfigListRemotesResponseSchema>;

export const ConfigGetRequestSchema = z.object({
  name: z.string(),
});

export type ConfigGetRequest = z.infer<typeof ConfigGetRequestSchema>;

export const ConfigGetResponseSchema = RcloneResponseSchema.and(
  z.record(z.string(), z.any())
);

export type ConfigGetResponse = z.infer<typeof ConfigGetResponseSchema>;

// Job management schemas
export const JobStatusRequestSchema = z.object({
  jobid: z.number(),
});

export type JobStatusRequest = z.infer<typeof JobStatusRequestSchema>;

export const JobStatusResponseSchema = RcloneResponseSchema.extend({
  duration: z.number().optional(),
  endTime: z.string().optional(),
  error: z.string().optional(),
  finished: z.boolean().optional(),
  group: z.string().optional(),
  id: z.number().optional(),
  output: z.record(z.string(), z.any()).optional(),
  startTime: z.string().optional(),
  success: z.boolean().optional(),
});

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

export const JobListResponseSchema = RcloneResponseSchema.extend({
  jobids: z.array(z.number()).optional(),
});

export type JobListResponse = z.infer<typeof JobListResponseSchema>;

// Rclone VFS configuration
export const RcloneVFSConfigSchema = z.object({
  url: z.string().url(),
  username: z.string().optional(),
  password: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  remote: z.string(),
});

export type RcloneVFSConfig = z.infer<typeof RcloneVFSConfigSchema>;

// Error response schema
export const RcloneErrorResponseSchema = z.object({
  error: z.string(),
  input: z.record(z.string(), z.any()).optional(),
  path: z.string().optional(),
  status: z.number().optional(),
});

export type RcloneErrorResponse = z.infer<typeof RcloneErrorResponseSchema>;

// HTTP Range support
export const RangeRequestSchema = z.object({
  start: z.number().optional(),
  end: z.number().optional(),
});

export type RangeRequest = z.infer<typeof RangeRequestSchema>;
