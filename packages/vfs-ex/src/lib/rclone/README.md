# RcloneLib - High-Level Library Layer

This is the high-level library layer that sits above the VFS API and provides a comprehensive, easy-to-use interface for all rclone functionality.

## Architecture

The library layer consists of several specialized managers:

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│                    RcloneLib (Main API)                     │
├─────────────────────────────────────────────────────────────┤
│  MountManager │ FileOperations │ RemoteManager │ SyncManager │
│  ConfigManager│               │               │             │
├─────────────────────────────────────────────────────────────┤
│              VFS Layer (RcloneVFS, LocalVFS)                │
├─────────────────────────────────────────────────────────────┤
│                 HTTP API / CLI Wrapper                      │
├─────────────────────────────────────────────────────────────┤
│                    rclone Binary / RC API                   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. RcloneLib (Main Library)
The main entry point that orchestrates all operations and manages sub-components.

**Features:**
- Unified configuration management
- Health monitoring
- Transfer management with progress tracking
- Automatic fallback between RC API and CLI
- Resource cleanup and lifecycle management

### 2. MountManagerLib
Manages VFS mounts and provides high-level mount operations.

**Features:**
- Create, update, and remove mounts
- Mount health monitoring
- VFS instance caching and lifecycle management
- Browse mount contents with search capabilities
- Mount statistics and usage tracking

### 3. FileOperationsLib
Provides high-level file and directory operations across different mounts and remotes.

**Features:**
- Unified file operations (read, write, copy, move, delete)
- Cross-mount operations
- Directory tree operations
- File search and filtering
- Streaming support for large files
- Size calculation and statistics

### 4. RemoteManagerLib
Manages rclone remote configurations and provides remote-specific operations.

**Features:**
- Remote discovery and information gathering
- Health checking and connectivity testing
- Configuration management (CRUD operations)
- Feature detection and capability querying
- Quota and usage information

### 5. ConfigManagerLib
Handles rclone configuration management.

**Features:**
- Configuration validation and backup
- Import/export functionality
- Configuration file management
- Settings validation and testing

### 6. SyncManagerLib
Manages synchronization operations between remotes and mounts.

**Features:**
- Unidirectional and bidirectional sync
- Dry-run capabilities with detailed reports
- Sync profiles and scheduled operations
- Progress monitoring and statistics
- Conflict resolution and comparison tools

## Usage Examples

### Basic Setup

```typescript
import { RcloneLib } from './src/lib/rclone';

const rclone = new RcloneLib({
  rcUrl: 'http://localhost:5572',
  rcUsername: 'admin',
  rcPassword: 'password123',
  defaultRemote: 'gdrive:',
  logLevel: 'INFO',
});
```

### Health Checking

```typescript
const health = await rclone.healthCheck();
console.log('Binary available:', health.rcloneBinary);
console.log('RC server available:', health.rcServer);
console.log('Version:', health.version);
```

### Mount Management

```typescript
// Create a mount
const mount = await rclone.mounts.createMount({
  name: 'my-gdrive',
  type: 'rclone',
  path: '',
  remote: 'gdrive:',
  url: 'http://localhost:5572',
});

// Test mount connectivity
const testResult = await rclone.mounts.testMount('my-gdrive');
console.log('Mount accessible:', testResult.success);

// Browse mount contents
const files = await rclone.mounts.browse('my-gdrive', '/Documents');
```

### File Operations

```typescript
// Read file content
const content = await rclone.files.readFile('my-gdrive', '/document.txt', { 
  encoding: 'utf8' 
});

// Write file
await rclone.files.writeFile('my-gdrive', '/new-file.txt', 'Hello World!');

// Copy files between mounts
const transferId = await rclone.files.copy(
  'my-gdrive', '/source.txt',
  'my-s3', '/backup.txt'
);

// Monitor transfer progress
const transfer = rclone.getTransfer(transferId);
console.log(`Progress: ${transfer.progress.percentage}%`);
```

### Remote Management

```typescript
// List all remotes
const remotes = await rclone.remotes.listRemotes();

// Get detailed remote information
const remoteInfo = await rclone.remotes.getRemoteInfo('gdrive');
console.log('Remote type:', remoteInfo.type);
console.log('Status:', remoteInfo.status);
console.log('Quota:', remoteInfo.quota);

// Test remote connectivity
const test = await rclone.remotes.testRemote('gdrive');
console.log('Connected:', test.success);
console.log('Response time:', test.responseTime, 'ms');
```

### Sync Operations

```typescript
// Sync directories
const syncId = await rclone.sync.sync(
  'my-gdrive', '/Documents',
  'my-s3', '/backup/Documents'
);

// Bidirectional sync
await rclone.sync.bisync(
  'my-gdrive', '/Shared',
  'my-dropbox', '/Shared',
  { checkAccess: true }
);

// Dry run to see what would be synchronized
const dryRun = await rclone.sync.dryRun(
  'my-gdrive', '/Documents',
  'my-s3', '/backup/Documents'
);
console.log('Files to transfer:', dryRun.fileCount);
console.log('Total size:', dryRun.totalSize, 'bytes');
```

### Configuration Management

```typescript
// Validate current configuration
const validation = await rclone.configuration.validateConfig();
console.log('Configuration valid:', validation.valid);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

// Backup configuration
await rclone.configuration.backupConfig('/backup/rclone.conf');

// Export configuration to JSON
const config = await rclone.configuration.exportConfig();
console.log('Remotes:', Object.keys(config));
```

## Error Handling

The library provides comprehensive error handling with typed errors:

```typescript
try {
  await rclone.files.readFile('nonexistent-mount', '/file.txt');
} catch (error) {
  if (error.message.includes('Mount') && error.message.includes('not found')) {
    console.log('Mount does not exist');
  } else if (error.message.includes('ENOENT')) {
    console.log('File not found');
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Advanced Features

### Transfer Monitoring

```typescript
// Start a long-running operation
const transferId = await rclone.files.copy('source', '/large-file.zip', 'dest', '/backup.zip');

// Monitor with callback
await rclone.sync.monitorSync(transferId, (stats) => {
  console.log(`Progress: ${stats.percentage}%`);
  console.log(`Speed: ${stats.speed} bytes/s`);
  console.log(`ETA: ${stats.eta} seconds`);
});
```

### Mount Statistics

```typescript
const stats = await rclone.mounts.getMountStats('my-gdrive');
console.log('Total files:', stats.totalFiles);
console.log('Total size:', stats.totalSize, 'bytes');
console.log('Last modified:', stats.lastModified);
```

### Search Functionality

```typescript
const results = await rclone.mounts.search('my-gdrive', '*.pdf', {
  recursive: true,
  caseSensitive: false,
  maxResults: 100,
});
console.log('Found PDFs:', results.length);
```

## Performance Considerations

- **VFS Instance Caching**: Mount VFS instances are cached and reused
- **Connection Pooling**: HTTP connections are pooled for efficiency
- **Lazy Loading**: Remote information is loaded on-demand and cached
- **Parallel Operations**: Multiple operations can run concurrently
- **Resource Cleanup**: Automatic cleanup of inactive resources

## Best Practices

1. **Always call cleanup()**: Ensure proper resource cleanup
2. **Use health checks**: Verify connectivity before operations
3. **Handle errors gracefully**: Implement proper error handling
4. **Monitor transfers**: Use progress callbacks for long operations
5. **Cache wisely**: Use refresh flags appropriately for cached data
6. **Test configurations**: Validate remotes and mounts before use

## CLI Integration

The library integrates with the CLI for high-level operations:

```bash
# Health check using library
rclone-cli lib health --detailed

# Mount management
rclone-cli lib mounts list
rclone-cli lib mounts test my-gdrive

# Transfer monitoring
rclone-cli lib transfers list
rclone-cli lib transfers cancel transfer_123

# Remote information
rclone-cli lib remotes info
rclone-cli lib remotes info gdrive --refresh
```

## Testing

```typescript
// Example test
import { RcloneLib } from './src/lib/rclone';

describe('RcloneLib', () => {
  let rclone: RcloneLib;
  
  beforeEach(() => {
    rclone = new RcloneLib({
      rcUrl: 'http://localhost:5572',
      logLevel: 'DEBUG',
    });
  });
  
  afterEach(async () => {
    await rclone.cleanup();
  });
  
  it('should check health', async () => {
    const health = await rclone.healthCheck();
    expect(health.rcloneBinary).toBe(true);
  });
});
```

This library layer provides a comprehensive, type-safe, and easy-to-use interface for all rclone operations while maintaining high performance and reliability.
