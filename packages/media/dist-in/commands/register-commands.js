import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { defaults } from '../_cli.js';
import { WindowsRegistry } from '../lib/salamander/index.js';
export const defaultOptions = (yargs) => {
    return yargs.option('group', {
        describe: 'Group name to register commands under',
        type: 'string',
        default: 'Media'
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
const DEFAULT_COMMAND_MAPPINGS = {
    'resize': {
        name: 'Resize Images',
        command: 'pm-media',
        args: 'resize --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_resized.&{SRC_EXT}\"',
        description: 'Resize images'
    },
    'watermark': {
        name: 'Add Watermark',
        command: 'pm-media',
        args: 'watermark --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --watermark=\"&{POLYMECH-ROOT}/nordin-ex/branding/logos/polymech-saw-ex.svg\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_watermarked.&{SRC_EXT}\"',
        description: 'Add watermark to images'
    },
    'background-remove': {
        name: 'Remove Background',
        command: 'pm-media',
        args: 'background:remove --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_bg_removed.&{SRC_EXT}\"',
        description: 'Remove background from images'
    },
    'background-remove-bria': {
        name: 'Remove Background (Bria AI)',
        command: 'pm-media',
        args: 'background:remove:bria --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_bria_bg_removed.&{SRC_EXT}\"',
        description: 'Remove background using Bria AI'
    },
    'convert': {
        name: 'Convert Format',
        command: 'pm-media',
        args: 'convert --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_converted.jpg\"',
        description: 'Convert image format'
    },
    'pdf2jpg': {
        name: 'PDF to JPG',
        command: 'pm-media',
        args: 'pdf2jpg --alt=true --logLevel=info --input=\"$(FullName)\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_page.jpg\"',
        description: 'Convert PDF pages to JPG images'
    },
    'svg2jpg': {
        name: 'SVG to JPG',
        command: 'pm-media',
        args: 'svg2jpg --alt=true --logLevel=info --src=\"$(FullName)/**/*.svg\" --dst=\"&{SRC_DIR}/&{SRC_NAME}.jpg\"',
        description: 'Convert SVG to JPG'
    },
    'crop-foreground': {
        name: 'Crop Foreground',
        command: 'pm-media',
        args: 'crop-foreground --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_cropped.&{SRC_EXT}\"',
        description: 'Crop to foreground content'
    },
    'resize-square': {
        name: 'Resize to Square',
        command: 'pm-media',
        args: 'resize --alt=true --logLevel=info --src=\"$(FullName)/**/*.+(&{IMAGES})\" --dst=\"&{SRC_DIR}/&{SRC_NAME}_sq.&{SRC_EXT}\" --width=1980 --square --fillColor=white',
        description: 'Resize images to square format (1980x1980) with white background'
    }
};
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
        logger.info('Scanning available pm-media commands...');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXItY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvcmVnaXN0ZXItY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUE7QUFDeEIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFDNUIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBQy9CLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDckMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBRTVELE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQzlDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDekIsUUFBUSxFQUFFLHVDQUF1QztRQUNqRCxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxPQUFPO0tBQ25CLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFFBQVEsRUFBRSx5Q0FBeUM7UUFDbkQsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsaUJBQWlCO0tBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsNERBQTREO1FBQ3RFLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsK0NBQStDO1FBQ3pELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFFBQVEsRUFBRSxzQ0FBc0M7UUFDaEQsSUFBSSxF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