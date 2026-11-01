import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { defaults } from '../_cli.js';
import { WindowsRegistry } from '../lib/salamander/index.js';
import { registerCommands } from './each.js';
export const defaultOptions = (yargs) => {
    return yargs.option('group', {
        describe: 'Group name to register commands under',
        type: 'string',
        default: 'Commons'
    }).option('commands', {
        describe: 'Path to JSON file with command mappings',
        type: 'string',
        default: './salamand.json'
    }).option('dry', {
        default: false,
        describe: 'Show what would be registered without actually registering',
        type: 'boolean'
    }).option('force', {
        default: false,
        describe: 'Force register even if command already exists',
        type: 'boolean'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    });
};
export const command = 'register-commands';
export const desc = 'Register all pm-media commands in Salamander menu';
export const builder = defaultOptions;
// Default command mappings - can be overridden by JSON file
const DEFAULT_COMMAND_MAPPINGS = {};
/**
 * Load command mappings from JSON file or use defaults
 */
function loadCommandMappings(configPath) {
    try {
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);
            logger.info(`Loaded command mappings from: ${configPath}`);
            return config;
        }
        else {
            logger.info(`Config file not found (${configPath}), using default mappings`);
            return DEFAULT_COMMAND_MAPPINGS;
        }
    }
    catch (error) {
        logger.warn(`Failed to load config file (${configPath}):`, error);
        logger.info('Using default command mappings');
        return DEFAULT_COMMAND_MAPPINGS;
    }
}
async function getAvailableCommands(commandMappings) {
    const commandsDir = path.join(process.cwd(), 'src', 'commands');
    const files = fs.readdirSync(commandsDir);
    // Get commands from actual files
    const fileBasedCommands = files
        .filter(file => file.endsWith('.ts') &&
        file !== 'salamander.ts' &&
        file !== 'register-commands.ts')
        .map(file => file.replace('.ts', ''))
        .filter(cmd => commandMappings[cmd]);
    // Get all commands from mappings (includes custom commands like resize-square)
    const allMappingCommands = Object.keys(commandMappings);
    // Combine and deduplicate
    const allCommands = [...new Set([...fileBasedCommands, ...allMappingCommands])];
    return allCommands;
}
export async function handler(argv) {
    defaults();
    logger.settings.minLevel = argv.logLevel;
    const options = {
        group: argv.group,
        commands: argv.commands,
        dry: argv.dry,
        force: argv.force
    };
    try {
        // Load command mappings from file or use defaults
        const commandMappings = loadCommandMappings(options.commands);
        logger.info('Scanning available built-in commands...');
        const availableCommands = await getAvailableCommands(commandMappings);
        logger.info(`Found ${availableCommands.length} commands: ${availableCommands.join(', ')}`);
        if (options.dry) {
            logger.info('\n=== DRY RUN - Commands that would be registered ===');
            for (const cmdName of availableCommands) {
                const cmdInfo = commandMappings[cmdName];
                logger.info(`\nCommand: ${cmdName}`);
                logger.info(`  Name: ${cmdInfo.name}`);
                logger.info(`  Args: ${cmdInfo.args}`);
                logger.info(`  Group: ${options.group}`);
            }
            return;
        }
        // Check which commands already exist
        logger.info('Checking existing registry entries...');
        const existingEntries = await WindowsRegistry.listAllMenuEntries();
        const existingCommands = existingEntries
            .filter(entry => entry.type === 'command'); // Only commands, not submenus
        logger.info(`Found ${existingCommands.length} existing command entries`);
        let registeredCount = 0;
        let skippedCount = 0;
        // Check if the target group exists, create it if it doesn't
        const groupExists = existingEntries.some(entry => entry.type === 'submenu' && entry.name === options.group);
        let groupInsertionPoint;
        if (!groupExists) {
            logger.info(`Creating group: ${options.group}`);
            // Get the starting index for the new submenu
            groupInsertionPoint = await WindowsRegistry.getNextMenuIndex();
            // Create the group submenu start
            const groupStartValues = {
                'Item Name': options.group,
                'Command': '',
                'Arguments': '',
                'Initial Directory': '',
                'Execute Through Shell': 'dword:00000000',
                'Close Shell Window': 'dword:00000000',
                'Open Shell Window': 'dword:00000000',
                'Icon': '',
                'Type': 'dword:00000001',
                'Show In Toolbar': 'dword:00000001'
            };
            await WindowsRegistry.writeMenuEntry(groupInsertionPoint, groupStartValues);
            logger.info(`✓ Created group start: ${options.group} at index ${groupInsertionPoint}`);
            // Increment for the first command slot
            groupInsertionPoint++;
        }
        else {
            logger.info(`Group '${options.group}' already exists`);
            groupInsertionPoint = await WindowsRegistry.findGroupInsertionPoint(options.group);
        }
        for (const cmdName of availableCommands) {
            const cmdInfo = commandMappings[cmdName];
            // Check if command already exists - look for exact name AND command match
            const exists = existingCommands.some(entry => {
                const nameMatch = entry.name === cmdInfo.name;
                const commandMatch = entry.command === cmdInfo.command;
                const argsMatch = entry.arguments === cmdInfo.args;
                // Consider it a duplicate if name and command match (even if args differ slightly)
                return nameMatch && commandMatch;
            });
            if (exists && !options.force) {
                logger.info(`Skipping '${cmdInfo.name}' - already exists (use --force to override)`);
                skippedCount++;
                continue;
            }
            logger.info(`Registering: ${cmdInfo.name}`);
            try {
                // Build registry values for the command
                const values = {
                    'Item Name': cmdInfo.name,
                    'Command': cmdInfo.command,
                    'Arguments': cmdInfo.args,
                    'Initial Directory': '$(FullPath)',
                    'Execute Through Shell': 'dword:00000001',
                    'Close Shell Window': 'dword:00000001',
                    'Open Shell Window': 'dword:00000001',
                    'Icon': '',
                    'Type': 'dword:00000000',
                    'Show In Toolbar': 'dword:00000001'
                };
                await WindowsRegistry.writeMenuEntry(groupInsertionPoint, values);
                registeredCount++;
                logger.info(`✓ Registered: ${cmdInfo.name} at index ${groupInsertionPoint}`);
                // Increment insertion point for next command to insert them sequentially within the group
                groupInsertionPoint++;
            }
            catch (error) {
                logger.error(`Failed to register '${cmdInfo.name}':`, error);
            }
        }
        // If we created a new group and registered commands, add the submenu end
        if (!groupExists && registeredCount > 0) {
            const groupEndValues = {
                'Item Name': '(Submenu End)',
                'Command': '',
                'Arguments': '',
                'Initial Directory': '',
                'Execute Through Shell': 'dword:00000000',
                'Close Shell Window': 'dword:00000000',
                'Open Shell Window': 'dword:00000000',
                'Icon': '',
                'Type': 'dword:00000002',
                'Show In Toolbar': 'dword:00000000'
            };
            await WindowsRegistry.writeMenuEntry(groupInsertionPoint, groupEndValues);
            logger.info(`✓ Created group end at index ${groupInsertionPoint}`);
        }
        logger.info(`\n=== Registration Complete ===`);
        logger.info(`Registered: ${registeredCount} commands`);
        logger.info(`Skipped: ${skippedCount} commands`);
        logger.info(`Total available: ${availableCommands.length} commands`);
        if (registeredCount > 0) {
            logger.info('\nCommands have been registered in Salamander\'s User Menu.');
            logger.info('Restart Salamander to see the new menu entries.');
        }
    }
    catch (error) {
        logger.error('Failed to register commands:', error);
        process.exit(1);
    }
}
cli.command(command, desc, builder, handler);
registerCommands(cli);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXItY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUE7QUFDeEIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFDNUIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBQy9CLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDckMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQzVELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUM1QyxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLFFBQVEsRUFBRSx1Q0FBdUM7UUFDakQsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsU0FBUztLQUNyQixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUNsQixRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLGlCQUFpQjtLQUM3QixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLDREQUE0RDtRQUN0RSxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNmLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLCtDQUErQztRQUN6RCxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLFVB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