# Rclone VFS Implementation

This module provides a Virtual File System (VFS) implementation that interfaces with [rclone](https://rclone.org/) remote storage systems via the rclone Remote Control (RC) API.

## Features

- **Complete VFS Interface**: Implements all standard VFS operations (read, write, list, delete, etc.)
- **HTTP Range Support**: Supports partial content requests for large files
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Logging**: Integrated logging with tslog
- **Retry Logic**: Configurable retry logic for network operations
- **Authentication**: Support for HTTP basic authentication

## Architecture

### Components

1. **`zod_schema.ts`**: Zod schemas for type-safe API communication
2. **`client.ts`**: HTTP client for rclone RC API communication
3. **`RcloneVFS.ts`**: Main VFS implementation class
4. **`index.ts`**: Module exports

### API Endpoints Used

The implementation uses the following rclone RC API endpoints:

- `operations/list` - List directory contents
- `operations/stat` - Get file/directory metadata
- `operations/copyfile` - Copy files
- `operations/movefile` - Move/rename files
- `operations/deletefile` - Delete files
- `operations/mkdir` - Create directories
- `operations/rmdir` - Remove directories
- `operations/purge` - Remove directories recursively
- `operations/uploadfile` - Upload files
- `core/version` - Get rclone version
- `config/listremotes` - List available remotes
- `job/*` - Job management for async operations

## Configuration

### Mount Configuration

Add rclone mounts to your `vfs.json` configuration file:

```json
[
  {
    "name": "rclone-gdrive",
    "type": "rclone",
    "path": "",
    "url": "http://localhost:5572",
    "username": "admin",
    "password": "password123", 
    "remote": "gdrive:",
    "timeout": 30000,
    "retries": 3
  }
]
```

### Configuration Options

- **`name`**: Unique mount identifier
- **`type`**: Must be `"rclone"`
- **`path`**: Not used for rclone mounts (leave empty)
- **`url`**: Rclone RC API URL (e.g., `http://localhost:5572`)
- **`username`**: Optional HTTP basic auth username
- **`password`**: Optional HTTP basic auth password
- **`remote`**: Rclone remote name (e.g., `"gdrive:"`, `"s3:bucket-name"`)
- **`timeout`**: Request timeout in milliseconds (default: 30000)
- **`retries`**: Number of retry attempts for failed requests (default: 3)

## Usage

### Starting Rclone RC Server

Before using the rclone VFS, you need to start an rclone RC server:

```bash
# Basic server
rclone rcd --rc-addr=localhost:5572

# With authentication
rclone rcd --rc-addr=localhost:5572 --rc-user=admin --rc-pass=password123

# With web UI
rclone rcd --rc-addr=localhost:5572 --rc-web-gui
```

### API Usage

Once configured, the rclone VFS works seamlessly with the existing VFS API:

```bash
# List files
GET /vfs/ls/rclone-gdrive

# List files with glob pattern
GET /vfs/ls/rclone-gdrive?glob=*.txt

# Get file metadata
GET /vfs/stat/rclone-gdrive/path/to/file.txt

# Read file content
GET /vfs/read/rclone-gdrive/path/to/file.txt

# Serve file with range support
GET /vfs/get/rclone-gdrive/path/to/file.txt

# Upload file
PUT /vfs/write/rclone-gdrive/path/to/file.txt
POST /vfs/upload/rclone-gdrive/path/to/file.txt

# Create directory
POST /vfs/mkdir/rclone-gdrive/new-directory

# Delete file or directory
DELETE /vfs/delete/rclone-gdrive/path/to/item
```

### Programmatic Usage

```typescript
import { RcloneVFS } from './src/vfs/rclone';

const vfs = new RcloneVFS({
  remote: 'gdrive:',
  url: 'http://localhost:5572',
  username: 'admin',
  password: 'password123',
  timeout: 30000,
  retries: 3,
});

// List directory
const files = await vfs.readdir('/Documents');

// Read file
const { stream, meta } = await vfs.readfile('/Documents/file.txt');

// Write file
await vfs.writefile('/Documents/new-file.txt', 'Hello World');

// Check health
const health = await vfs.healthCheck();
console.log('VFS healthy:', health.healthy);
```

## Error Handling

The implementation provides comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Clear error messages for auth failures
- **File Not Found**: Proper ENOENT errors
- **Permission Errors**: EACCESS errors when appropriate
- **Directory Errors**: ENOTDIR, EISDIR errors for type mismatches

## Limitations

1. **Glob Patterns**: Limited glob support compared to local filesystem (basic regex matching)
2. **Atomic Operations**: Some operations may not be atomic depending on the remote
3. **Performance**: Network latency affects performance compared to local operations
4. **Concurrent Access**: Limited by rclone's concurrent operation limits

## Supported Remote Types

The rclone VFS supports any storage backend that rclone supports, including:

- Google Drive
- Amazon S3
- Dropbox
- Microsoft OneDrive
- SFTP/FTP
- WebDAV
- And 40+ other storage providers

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure rclone RC server is running
2. **Authentication Failed**: Check username/password in mount config
3. **Remote Not Found**: Verify remote name exists in rclone config
4. **Timeout Errors**: Increase timeout value for slow connections
5. **Rate Limiting**: Some providers have rate limits; adjust retry settings

### Health Check

Use the health check endpoint to verify connectivity:

```typescript
const health = await vfs.healthCheck();
if (!health.healthy) {
  console.error('VFS health check failed:', health.error);
}
```

### Debugging

Enable debug logging to troubleshoot issues:

```typescript
// The client automatically logs requests/responses at debug level
// Configure your logger to show debug messages
```

## Performance Considerations

- **Caching**: Consider implementing caching for frequently accessed files
- **Batch Operations**: Group multiple operations when possible
- **Connection Pooling**: Reuse VFS instances to maintain connections
- **Timeout Tuning**: Adjust timeouts based on your network conditions

## Security

- Use HTTPS for rclone RC API in production
- Store credentials securely (environment variables, secrets manager)
- Consider using rclone's built-in encryption for sensitive data
- Implement proper access controls in your application layer

