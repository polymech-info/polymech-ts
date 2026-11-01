import * as path from 'path';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import SalamanderMenuGenerator, { SalamanderMenuGeneratorRegistry } from '../lib/salamander/index.js';
export const defaultOptions = (yargs) => {
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
    });
};
export const command = 'salamander';
export const desc = 'Generate Salamander file manager menu entries from JSON configuration';
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = sanitize(argv);
    logger.settings.minLevel = options.logLevel;
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
        let config;
        // Check if we're using individual command line options or JSON config
        if (argv.name && argv.command) {
            // Create config from command line options
            logger.info('Creating menu entry from command line options');
            config = {
                baseKey: 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu',
                startIndex: 1,
                items: [{
                        name: argv.name,
                        command: argv.command,
                        arguments: argv.args || '',
                        initialDirectory: argv.workingDir,
                        executeThoughShell: argv.executeThoughShell,
                        closeShellWindow: argv.closeShellWindow,
                        openShellWindow: argv.openShellWindow,
                        icon: argv.icon,
                        showInToolbar: argv.showInToolbar
                    }]
            };
        }
        else if (argv.config) {
            // Load configuration from JSON
            const configPath = argv.config;
            logger.info(`Loading configuration from: ${configPath}`);
            config = SalamanderMenuGenerator.loadFromJson(configPath);
        }
        else {
            logger.error('Either --config file or --name and --command options are required');
            process.exit(1);
        }
        // Determine starting index
        let startIndex = argv.startIndex;
        if (!startIndex) {
            if (argv.registry && process.platform === 'win32') {
                // Use registry to determine insertion point
                if (argv.group) {
                    startIndex = await SalamanderMenuGeneratorRegistry.autoDetectInsertionPoint(argv.group);
                    logger.info(`Found insertion point for group "${argv.group}": index ${startIndex}`);
                }
                else {
                    startIndex = await SalamanderMenuGeneratorRegistry.autoDetectInsertionPoint();
                    logger.info(`Detected next available index: ${startIndex}`);
                }
            }
            else if (argv.existing) {
                const existingPath = argv.existing;
                if (argv.group) {
                    startIndex = SalamanderMenuGenerator.findInsertionPoint(existingPath, argv.group);
                    logger.info(`Found insertion point for group "${argv.group}": index ${startIndex}`);
                }
                else {
                    const maxIndex = SalamanderMenuGenerator.parseExistingRegistry(existingPath);
                    startIndex = maxIndex + 1;
                    logger.info(`Detected next available index: ${startIndex}`);
                }
            }
            else {
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
            }
            else {
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
                    const itemName = entry.values['"Item Name"'];
                    const type = entry.values['"Type"'];
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
        let outputPath = argv.output;
        if (!outputPath) {
            if (argv.config) {
                const configPath = argv.config;
                const configDir = path.dirname(configPath);
                const configName = path.basename(configPath, '.json');
                outputPath = path.join(configDir, `${configName}-salamander-menu.reg`);
            }
            else {
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
                const itemName = entry.values['"Item Name"'];
                const type = entry.values['"Type"'];
                const typeStr = type === 'dword:00000001' ? '(submenu)' :
                    type === 'dword:00000002' ? '(submenu end)' : '(command)';
                logger.info(`  ${itemName} ${typeStr}`);
            }
        }
        logger.info(`\nTo apply the menu entries:`);
        logger.info(`1. Double-click the generated .reg file: ${outputPath}`);
        logger.info(`2. Confirm the registry import in Windows`);
        logger.info(`3. Restart Salamander to see the new menu items`);
    }
    catch (error) {
        logger.error(`Failed to generate Salamander menu:`, error.message);
        if (options.debug) {
            logger.error(error.stack);
        }
        process.exit(1);
    }
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FsYW1hbmRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9zYWxhbWFuZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUMvQixPQUFPLEVBQ0gsUUFBUSxFQUNSLFFBQVEsRUFDWCxNQUFNLFlBQVksQ0FBQTtBQUVuQixPQUFPLHVCQUF1QixFQUFFLEVBQXdCLCtCQUErQixFQUFtQixNQUFNLDRCQUE0QixDQUFBO0FBRTVJLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQzlDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7UUFDMUIsUUFBUSxFQUFFLDhCQUE4QjtRQUN4QyxJQUFJLEVBQUUsUUFBUTtLQUNqQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNoQixRQUFRLEVBQUUsMkJBQTJCO1FBQ3JDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFFBQVEsRUFBRSw2REFBNkQ7UUFDdkUsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixRQUFRLEVBQUUsaURBQWlEO1FBQzNELElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFO1FBQ3BCLFFBQVEsRUFBRSxnREFBZ0Q7UUFDMUQsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSxnQ0FBZ0M7UUFDMUMsSUFBSSxFQUFFLFNB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