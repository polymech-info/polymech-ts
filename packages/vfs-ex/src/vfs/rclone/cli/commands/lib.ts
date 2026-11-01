import type { Argv } from 'yargs';
import { RcloneLib } from '../../../../lib/rclone/RcloneLib';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'LibCommands' });

export function setupLibCommands(yargs: Argv): void {
  
  // lib command group
  yargs.command(
    'lib <command>',
    'High-level library operations',
    (yargs) => {
      return yargs
        .command(
          'health',
          'Check health of rclone installation and remotes',
          (yargs) => {
            return yargs.options({
              'detailed': {
                type: 'boolean',
                description: 'Show detailed health information',
                alias: 'd',
              },
            });
          },
          async (argv) => {
            const rclone = new RcloneLib({
              rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
              rcUsername: argv.rcUser,
              rcPassword: argv.rcPass,
              logLevel: argv.verbose ? 'DEBUG' : 'INFO',
            });

            try {
              console.log('🏥 Checking rclone health...\n');
              
              const health = await rclone.healthCheck();
              
              console.log(`Binary Available: ${health.rcloneBinary ? '✅' : '❌'}`);
              if (health.version) {
                console.log(`Version: ${health.version}`);
              }
              
              console.log(`RC Server: ${health.rcServer ? '✅' : '❌'}`);
              
              if (health.error) {
                console.log(`Error: ${health.error}`);
              }

              if (argv.detailed && health.rcloneBinary) {
                console.log('\n📊 System Information:');
                const sysInfo = await rclone.getSystemInfo();
                console.log(`OS: ${sysInfo.os}`);
                console.log(`Architecture: ${sysInfo.arch}`);
                console.log(`Go Version: ${sysInfo.goVersion}`);

                console.log('\n🔗 Remote Health:');
                const remoteHealth = await rclone.remotes.getHealthStatus();
                for (const [remote, status] of Object.entries(remoteHealth)) {
                  const icon = status.status === 'healthy' ? '✅' : '❌';
                  console.log(`${icon} ${remote}: ${status.status}`);
                  if (status.responseTime) {
                    console.log(`   Response time: ${status.responseTime}ms`);
                  }
                  if (status.error) {
                    console.log(`   Error: ${status.error}`);
                  }
                }
              }

              await rclone.cleanup();
            } catch (error) {
              logger.error('Health check failed:', error);
              process.exit(1);
            }
          }
        )
        .command(
          'mounts',
          'Manage VFS mounts',
          (yargs) => {
            return yargs
              .command(
                'list',
                'List all configured mounts',
                {},
                async (argv) => {
                  const rclone = new RcloneLib({
                    rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
                    rcUsername: argv.rcUser,
                    rcPassword: argv.rcPass,
                  });

                  try {
                    const mounts = rclone.mounts.listMounts();
                    
                    if (mounts.length === 0) {
                      console.log('No mounts configured');
                      return;
                    }

                    console.log('📁 Configured Mounts:\n');
                    for (const mount of mounts) {
                      const statusIcon = mount.status === 'active' ? '✅' : 
                                       mount.status === 'error' ? '❌' : '⏸️';
                      
                      console.log(`${statusIcon} ${mount.name} (${mount.type})`);
                      console.log(`   Path: ${mount.path}`);
                      if (mount.remote) {
                        console.log(`   Remote: ${mount.remote}`);
                      }
                      if (mount.lastAccessed) {
                        console.log(`   Last accessed: ${mount.lastAccessed.toLocaleString()}`);
                      }
                      if (mount.errorMessage) {
                        console.log(`   Error: ${mount.errorMessage}`);
                      }
                      console.log();
                    }

                    await rclone.cleanup();
                  } catch (error) {
                    logger.error('Failed to list mounts:', error);
                    process.exit(1);
                  }
                }
              )
              .command(
                'test <name>',
                'Test mount connectivity',
                (yargs) => {
                  return yargs.positional('name', {
                    describe: 'Mount name to test',
                    type: 'string',
                    demandOption: true,
                  });
                },
                async (argv) => {
                  const rclone = new RcloneLib({
                    rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
                    rcUsername: argv.rcUser,
                    rcPassword: argv.rcPass,
                  });

                  try {
                    console.log(`🧪 Testing mount: ${argv.name}`);
                    
                    const result = await rclone.mounts.testMount(argv.name);
                    
                    if (result.success) {
                      console.log('✅ Mount is accessible');
                    } else {
                      console.log('❌ Mount test failed');
                      if (result.error) {
                        console.log(`Error: ${result.error}`);
                      }
                      process.exit(1);
                    }

                    await rclone.cleanup();
                  } catch (error) {
                    logger.error('Mount test failed:', error);
                    process.exit(1);
                  }
                }
              )
              .demandCommand(1, 'Please specify a mounts subcommand');
          }
        )
        .command(
          'transfers',
          'Manage active transfers',
          (yargs) => {
            return yargs
              .command(
                'list',
                'List active transfers',
                {},
                async (argv) => {
                  const rclone = new RcloneLib({
                    rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
                    rcUsername: argv.rcUser,
                    rcPassword: argv.rcPass,
                  });

                  try {
                    const transfers = rclone.getActiveTransfers();
                    
                    if (transfers.length === 0) {
                      console.log('No active transfers');
                      return;
                    }

                    console.log('🔄 Active Transfers:\n');
                    for (const transfer of transfers) {
                      const statusIcon = transfer.status === 'completed' ? '✅' : 
                                       transfer.status === 'failed' ? '❌' : 
                                       transfer.status === 'running' ? '🔄' : '⏸️';
                      
                      console.log(`${statusIcon} ${transfer.id} (${transfer.operation})`);
                      console.log(`   Source: ${transfer.source}`);
                      console.log(`   Destination: ${transfer.destination}`);
                      console.log(`   Status: ${transfer.status}`);
                      console.log(`   Progress: ${transfer.progress.percentage.toFixed(1)}%`);
                      
                      if (transfer.progress.speed > 0) {
                        const speedMB = (transfer.progress.speed / (1024 * 1024)).toFixed(2);
                        console.log(`   Speed: ${speedMB} MB/s`);
                      }
                      
                      if (transfer.progress.eta > 0) {
                        const eta = Math.round(transfer.progress.eta / 60);
                        console.log(`   ETA: ${eta} minutes`);
                      }
                      
                      if (transfer.error) {
                        console.log(`   Error: ${transfer.error}`);
                      }
                      console.log();
                    }

                    await rclone.cleanup();
                  } catch (error) {
                    logger.error('Failed to list transfers:', error);
                    process.exit(1);
                  }
                }
              )
              .command(
                'cancel <id>',
                'Cancel a transfer',
                (yargs) => {
                  return yargs.positional('id', {
                    describe: 'Transfer ID to cancel',
                    type: 'string',
                    demandOption: true,
                  });
                },
                async (argv) => {
                  const rclone = new RcloneLib({
                    rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
                    rcUsername: argv.rcUser,
                    rcPassword: argv.rcPass,
                  });

                  try {
                    console.log(`⏹️ Cancelling transfer: ${argv.id}`);
                    
                    const success = await rclone.cancelTransfer(argv.id);
                    
                    if (success) {
                      console.log('✅ Transfer cancelled');
                    } else {
                      console.log('❌ Transfer not found or already completed');
                      process.exit(1);
                    }

                    await rclone.cleanup();
                  } catch (error) {
                    logger.error('Failed to cancel transfer:', error);
                    process.exit(1);
                  }
                }
              )
              .demandCommand(1, 'Please specify a transfers subcommand');
          }
        )
        .command(
          'remotes',
          'Manage remotes using library',
          (yargs) => {
            return yargs
              .command(
                'info [remote]',
                'Get detailed remote information',
                (yargs) => {
                  return yargs
                    .positional('remote', {
                      describe: 'Remote name (optional, shows all if not specified)',
                      type: 'string',
                    })
                    .options({
                      'refresh': {
                        type: 'boolean',
                        description: 'Force refresh of cached information',
                        alias: 'r',
                      },
                    });
                },
                async (argv) => {
                  const rclone = new RcloneLib({
                    rcUrl: argv.rcAddr ? `http://${argv.rcAddr}` : undefined,
                    rcUsername: argv.rcUser,
                    rcPassword: argv.rcPass,
                  });

                  try {
                    if (argv.remote) {
                      // Show info for specific remote
                      const info = await rclone.remotes.getRemoteInfo(argv.remote, argv.refresh);
                      
                      console.log(`🔗 Remote: ${info.name}`);
                      console.log(`Type: ${info.type}`);
                      console.log(`Status: ${info.status}`);
                      
                      if (info.features.length > 0) {
                        console.log(`Features: ${info.features.join(', ')}`);
                      }
                      
                      if (info.quota) {
                        const usedGB = (info.quota.used / (1024 * 1024 * 1024)).toFixed(2);
                        const totalGB = (info.quota.total / (1024 * 1024 * 1024)).toFixed(2);
                        const freeGB = (info.quota.free / (1024 * 1024 * 1024)).toFixed(2);
                        
                        console.log(`Quota: ${usedGB}GB used / ${totalGB}GB total (${freeGB}GB free)`);
                      }
                    } else {
                      // Show info for all remotes
                      const remotes = await rclone.remotes.getAllRemoteInfo(argv.refresh);
                      
                      if (remotes.length === 0) {
                        console.log('No remotes configured');
                        return;
                      }

                      console.log('🔗 Remote Information:\n');
                      for (const remote of remotes) {
                        const statusIcon = remote.status === 'connected' ? '✅' : 
                                         remote.status === 'error' ? '❌' : '⚠️';
                        
                        console.log(`${statusIcon} ${remote.name} (${remote.type})`);
                        console.log(`   Status: ${remote.status}`);
                        
                        if (remote.quota) {
                          const usedGB = (remote.quota.used / (1024 * 1024 * 1024)).toFixed(2);
                          const totalGB = (remote.quota.total / (1024 * 1024 * 1024)).toFixed(2);
                          const usedPercent = ((remote.quota.used / remote.quota.total) * 100).toFixed(1);
                          console.log(`   Usage: ${usedGB}GB / ${totalGB}GB (${usedPercent}%)`);
                        }
                        console.log();
                      }
                    }

                    await rclone.cleanup();
                  } catch (error) {
                    logger.error('Failed to get remote info:', error);
                    process.exit(1);
                  }
                }
              )
              .demandCommand(1, 'Please specify a remotes subcommand');
          }
        )
        .demandCommand(1, 'Please specify a lib subcommand');
    },
    () => {
      // This handler won't be called since we have subcommands
    }
  );
}
