import * as CLI from 'yargs'
import * as path from 'path'
import { logger } from '../index.js'
import { cli } from '../cli.js'
import {
    sanitize,
    defaults
} from '../_cli.js'

import SalamanderMenuGenerator, { SalamanderMenuConfig, SalamanderMenuGeneratorRegistry, WindowsRegistry } from '../lib/salamander/index.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('config', {
        describe: 'JSON configuration file path',
        type: 'string'
    }).option('output', {
        describe: 'Output registry file path',
        type: 'string'
    }).option('existing', {
        describe: 'Path to existing registry file to parse for insertion point',
        type: 'string'
    }).option('group', {
        describe: 'Group name to insert items into (e.g., "Media")',
        type: 'string'
    }).option('startIndex', {
        describe: 'Starting menu index (overrides auto-detection)',
        type: 'number'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('verbose', {
        default: false,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    }).option('registry', {
        describe: 'Apply directly to Windows registry (Windows only)',
        type: 'boolean',
        default: false
    }).option('list', {
        describe: 'List current menu entries from registry',
        type: 'boolean',
        default: false
    }).option('remove', {
        describe: 'Remove menu entries from registry',
        type: 'boolean',
        default: false
    }).option('name', {
        describe: 'Menu item name',
        type: 'string'
    }).option('command', {
        describe: 'Command to execute',
        type: 'string'
    }).option('args', {
        describe: 'Command arguments',
        type: 'string'
    }).option('workingDir', {
        describe: 'Working directory for command execution',
        type: 'string',
        default: '$(FullPath)'
    }).option('icon', {
        describe: 'Icon path for menu item',
        type: 'string',
        default: ''
    }).option('executeThoughShell', {
        describe: 'Execute command through shell',
        type: 'boolean',
        default: true
    }).option('closeShellWindow', {
        describe: 'Close shell window after execution',
        type: 'boolean',
        default: false
    }).option('openShellWindow', {
        describe: 'Open shell window during execution',
        type: 'boolean',
        default: true
    }).option('showInToolbar', {
        describe: 'Show item in toolbar',
        type: 'boolean',
        default: true
    })
}

export const command = 'salamander';
export const desc = 'Generate Salamander file manager menu entries from JSON configuration';
export const builder = defaultOptions;

export async function handler(argv: CLI.Arguments) {
    defaults()
    const options = sanitize(argv)
    logger.settings.minLevel = options.logLevel as any

    try {
        // Handle listing current menu entries
        if (argv.list) {
            if (process.platform !== 'win32') {
                logger.error('Registry listing is only supported on Windows');
                process.exit(1);
            }
            
            logger.info('Current Salamander menu entries:');
            const entries = await SalamanderMenuGeneratorRegistry.listCurrentMenuEntries();
            
            for (const entry of entries) {
                const typeStr = entry.type === 'submenu' ? '(submenu)' : 
                              entry.type === 'submenu-end' ? '(submenu end)' : '(command)';
                const cmdStr = entry.command ? ` → ${entry.command}` : '';
                logger.info(`  [${entry.index}] ${entry.name} ${typeStr}${cmdStr}`);
            }
            return;
        }

        let config: SalamanderMenuConfig;

        // Check if we're using individual command line options or JSON config
        if (argv.name && argv.command) {
            // Create config from command line options
            logger.info('Creating menu entry from command line options');
            
            config = {
                baseKey: 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu',
                startIndex: 1,
                items: [{
                    name: argv.name as string,
                    command: argv.command as string,
                    arguments: argv.args as string || '',
                    initialDirectory: argv.workingDir as string,
                    executeThoughShell: argv.executeThoughShell as boolean,
                    closeShellWindow: argv.closeShellWindow as boolean,
                    openShellWindow: argv.openShellWindow as boolean,
                    icon: argv.icon as string,
                    showInToolbar: argv.showInToolbar as boolean
                }]
            };
        } else if (argv.config) {
            // Load configuration from JSON
            const configPath = argv.config as string;
            logger.info(`Loading configuration from: ${configPath}`);
            config = SalamanderMenuGenerator.loadFromJson(configPath);
        } else {
            logger.error('Either --config file or --name and --command options are required');
            process.exit(1);
        }
        
        // Determine starting index
        let startIndex = argv.startIndex as number;
        
        if (!startIndex) {
            if (argv.registry && process.platform === 'win32') {
                // Use registry to determine insertion point
                if (argv.group) {
                    startIndex = await SalamanderMenuGeneratorRegistry.autoDetectInsertionPoint(argv.group as string);
                    logger.info(`Found insertion point for group "${argv.group}": index ${startIndex}`);
                } else {
                    startIndex = await SalamanderMenuGeneratorRegistry.autoDetectInsertionPoint();
                    logger.info(`Detected next available index: ${startIndex}`);
                }
            } else if (argv.existing) {
                const existingPath = argv.existing as string;
                
                if (argv.group) {
                    startIndex = SalamanderMenuGenerator.findInsertionPoint(existingPath, argv.group as string);
                    logger.info(`Found insertion point for group "${argv.group}": index ${startIndex}`);
                } else {
                    const maxIndex = SalamanderMenuGenerator.parseExistingRegistry(existingPath);
                    startIndex = maxIndex + 1;
                    logger.info(`Detected next available index: ${startIndex}`);
                }
            } else {
                startIndex = config.startIndex || 1;
                logger.info(`Using configured start index: ${startIndex}`);
            }
        }
        
        // Update config with determined start index
        config.startIndex = startIndex;
        
        // Handle direct registry operations
        if (argv.registry) {
            if (process.platform !== 'win32') {
                logger.error('Direct registry operations are only supported on Windows');
                process.exit(1);
            }

            const generator = new SalamanderMenuGeneratorRegistry(config);
            
            if (argv.remove) {
                logger.info('Removing menu entries from registry...');
                await generator.removeFromRegistry();
                logger.info('Menu entries removed successfully');
            } else {
                logger.info('Applying menu entries to registry...');
                await generator.applyToRegistry();
                logger.info('Menu entries applied successfully');
                logger.info('Restart Salamander to see the new menu items');
            }
            
            // Show summary
            const entries = generator.generateRegistryEntries();
            logger.info(`Processed ${entries.length} menu entries`);
            
            if (options.verbose) {
                logger.info('Processed entries:');
                for (const entry of entries) {
                    const itemName = entry.values['"Item Name"'] as string;
                    const type = entry.values['"Type"'] as string;
                    const typeStr = type === 'dword:00000001' ? '(submenu)' : 
                                  type === 'dword:00000002' ? '(submenu end)' : '(command)';
                    logger.info(`  ${itemName} ${typeStr}`);
                }
            }
            
            return;
        }
        
        // Generate .reg file
        const generator = new SalamanderMenuGenerator(config);
        
        // Generate output path if not specified
        let outputPath = argv.output as string;
        if (!outputPath) {
            if (argv.config) {
                const configPath = argv.config as string;
                const configDir = path.dirname(configPath);
                const configName = path.basename(configPath, '.json');
                outputPath = path.join(configDir, `${configName}-salamander-menu.reg`);
            } else {
                outputPath = `salamander-menu-${argv.name?.toString().toLowerCase().replace(/\s+/g, '-') || 'item'}.reg`;
            }
        }
        
        logger.info(`Generating registry file: ${outputPath}`);
        
        // Generate and save registry file
        generator.saveRegistryFile(outputPath);
        
        // Generate summary
        const entries = generator.generateRegistryEntries();
        logger.info(`Successfully generated ${entries.length} menu entries`);
        
        if (options.verbose) {
            logger.info('Generated entries:');
            for (const entry of entries) {
                const itemName = entry.values['"Item Name"'] as string;
                const type = entry.values['"Type"'] as string;
                const typeStr = type === 'dword:00000001' ? '(submenu)' : 
                              type === 'dword:00000002' ? '(submenu end)' : '(command)';
                logger.info(`  ${itemName} ${typeStr}`);
            }
        }
        
        logger.info(`\nTo apply the menu entries:`);
        logger.info(`1. Double-click the generated .reg file: ${outputPath}`);
        logger.info(`2. Confirm the registry import in Windows`);
        logger.info(`3. Restart Salamander to see the new menu items`);
        
    } catch (error) {
        logger.error(`Failed to generate Salamander menu:`, error.message);
        if (options.debug) {
            logger.error(error.stack);
        }
        process.exit(1);
    }
}

cli.command(command, desc, builder, handler)
