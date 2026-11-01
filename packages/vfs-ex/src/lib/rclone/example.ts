#!/usr/bin/env node

import { RcloneLib } from './RcloneLib';

/**
 * Example usage of the RcloneLib library layer
 */
async function main() {
  console.log('🚀 RcloneLib Example\n');

  // Initialize the library
  const rclone = new RcloneLib({
    rcUrl: 'http://localhost:5572',
    rcUsername: 'admin',
    rcPassword: 'password123',
    defaultRemote: 'gdrive:',
    logLevel: 'INFO',
  });

  try {
    // Check system health
    console.log('📊 Checking system health...');
    const health = await rclone.healthCheck();
    console.log(`Binary: ${health.rcloneBinary ? '✅' : '❌'}`);
    console.log(`RC Server: ${health.rcServer ? '✅' : '❌'}`);
    if (health.version) {
      console.log(`Version: ${health.version}`);
    }

    // List remotes
    console.log('\n🔗 Available remotes:');
    const remotes = await rclone.remotes.listRemotes();
    remotes.forEach(remote => console.log(`  - ${remote}`));

    // Create a mount
    console.log('\n📁 Creating mount...');
    const mount = await rclone.mounts.createMount({
      name: 'example-mount',
      type: 'rclone',
      path: '',
      remote: 'gdrive:',
      url: 'http://localhost:5572',
      username: 'admin',
      password: 'password123',
    });
    console.log(`Mount created: ${mount.name} (${mount.status})`);

    // List files using the mount
    console.log('\n📄 Listing files...');
    const files = await rclone.files.list('example-mount', '/');
    files.forEach(file => {
      const icon = file.isDir ? '📁' : '📄';
      console.log(`  ${icon} ${file.name} (${file.size} bytes)`);
    });

    // Start a copy operation
    console.log('\n🔄 Starting transfer...');
    const transferId = await rclone.files.copy(
      'example-mount',
      '/source-file.txt',
      'example-mount', 
      '/backup-file.txt'
    );
    console.log(`Transfer started: ${transferId}`);

    // Monitor the transfer
    console.log('Monitoring transfer progress...');
    let completed = false;
    while (!completed) {
      const transfer = rclone.getTransfer(transferId);
      if (transfer) {
        console.log(`Progress: ${transfer.progress.percentage.toFixed(1)}% (${transfer.status})`);
        completed = ['completed', 'failed', 'cancelled'].includes(transfer.status);
        
        if (!completed) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        completed = true;
      }
    }

    console.log('\n✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean up
    await rclone.cleanup();
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runExample };
