import * as CLI from 'yargs'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../index.js'
import { cli } from '../cli.js'
import { defaults } from '../_cli.js'
import { WindowsRegistry } from '../lib/salamander/index.js'

export const defaultOptions = (yargs: CLI.Argv) => {
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
    })
}

export const command = 'register-commands'
export const desc = 'Register all pm-media commands in Salamander menu'
export const builder = defaultOptions

interface CommandInfo {
    name: string
    command: string
    args: string
    description: string
}

// Default command mappings - can be overridden by JSON file
const DEFAULT_COMMAND_MAPPINGS: Record<string, CommandInfo> = {
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
}

/**
 * Load command mappings from JSON file or use defaults
 */
function loadCommandMappings(configPath: string): Record<string, CommandInfo> {
    try {
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8')
            const config = JSON.parse(configContent)
            logger.info(`Loaded command mappings from: ${configPath}`)
            return config
        } else {
            logger.info(`Config file not found (${configPath}), using default mappings`)
            return DEFAULT_COMMAND_MAPPINGS
        }
    } catch (error) {
        logger.warn(`Failed to load config file (${configPath}):`, error)
        logger.info('Using default command mappings')
        return DEFAULT_COMMAND_MAPPINGS
    }
}

async function getAvailableCommands(commandMappings: Record<string, CommandInfo>): Promise<string[]> {
    const commandsDir = path.join(process.cwd(), 'src', 'commands')
    const files = fs.readdirSync(commandsDir)
    
    // Get commands from actual files
    const fileBasedCommands = files
        .filter(file => file.endsWith('.ts') && 
                      file !== 'salamander.ts' && 
                      file !== 'register-commands.ts')
        .map(file => file.replace('.ts', ''))
        .filter(cmd => commandMappings[cmd])
    
    // Get all commands from mappings (includes custom commands like resize-square)
    const allMappingCommands = Object.keys(commandMappings)
    
    // Combine and deduplicate
    const allCommands = [...new Set([...fileBasedCommands, ...allMappingCommands])]
    
    return allCommands
}

export async function handler(argv: CLI.Arguments) {
    defaults()
    logger.settings.minLevel = argv.logLevel as any
    
    const options = {
        group: argv.group as string,
        commands: argv.commands as string,
        dry: argv.dry as boolean,
        force: argv.force as boolean
    }
    
    try {
        // Load command mappings from file or use defaults
        const commandMappings = loadCommandMappings(options.commands)
        
        logger.info('Scanning available pm-media commands...')
        const availableCommands = await getAvailableCommands(commandMappings)
        logger.info(`Found ${availableCommands.length} commands: ${availableCommands.join(', ')}`)
        
        if (options.dry) {
            logger.info('\n=== DRY RUN - Commands that would be registered ===')
            for (const cmdName of availableCommands) {
                const cmdInfo = commandMappings[cmdName]
                logger.info(`\nCommand: ${cmdName}`)
                logger.info(`  Name: ${cmdInfo.name}`)
                logger.info(`  Args: ${cmdInfo.args}`)
                logger.info(`  Group: ${options.group}`)
            }
            return
        }
        
        // Check which commands already exist
        logger.info('Checking existing registry entries...')
        const existingEntries = await WindowsRegistry.listAllMenuEntries()
        const existingCommands = existingEntries
            .filter(entry => entry.type === 'command') // Only commands, not submenus
        
        logger.info(`Found ${existingCommands.length} existing command entries`)
        
        let registeredCount = 0
        let skippedCount = 0
        
        // Check if the target group exists, create it if it doesn't
        const groupExists = existingEntries.some(entry => 
            entry.type === 'submenu' && entry.name === options.group
        )
        
        let groupInsertionPoint: number
        
        if (!groupExists) {
            logger.info(`Creating group: ${options.group}`)
            
            // Get the starting index for the new submenu
            groupInsertionPoint = await WindowsRegistry.getNextMenuIndex()
            
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
            }
            
            await WindowsRegistry.writeMenuEntry(groupInsertionPoint, groupStartValues)
            logger.info(`✓ Created group start: ${options.group} at index ${groupInsertionPoint}`)
            
            // Increment for the first command slot
            groupInsertionPoint++
        } else {
            logger.info(`Group '${options.group}' already exists`)
            groupInsertionPoint = await WindowsRegistry.findGroupInsertionPoint(options.group)
        }
        
        for (const cmdName of availableCommands) {
            const cmdInfo = commandMappings[cmdName]
            
            // Check if command already exists - look for exact name AND command match
            const exists = existingCommands.some(entry => {
                const nameMatch = entry.name === cmdInfo.name
                const commandMatch = entry.command === cmdInfo.command
                const argsMatch = entry.arguments === cmdInfo.args
                
                // Consider it a duplicate if name and command match (even if args differ slightly)
                return nameMatch && commandMatch
            })
            
            if (exists && !options.force) {
                logger.info(`Skipping '${cmdInfo.name}' - already exists (use --force to override)`)
                skippedCount++
                continue
            }
            
            logger.info(`Registering: ${cmdInfo.name}`)
            
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
                }
                
                await WindowsRegistry.writeMenuEntry(groupInsertionPoint, values)
                
                registeredCount++
                logger.info(`✓ Registered: ${cmdInfo.name} at index ${groupInsertionPoint}`)
                
                // Increment insertion point for next command to insert them sequentially within the group
                groupInsertionPoint++
                
            } catch (error) {
                logger.error(`Failed to register '${cmdInfo.name}':`, error)
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
            }
            
            await WindowsRegistry.writeMenuEntry(groupInsertionPoint, groupEndValues)
            logger.info(`✓ Created group end at index ${groupInsertionPoint}`)
        }
        
        logger.info(`\n=== Registration Complete ===`)
        logger.info(`Registered: ${registeredCount} commands`)
        logger.info(`Skipped: ${skippedCount} commands`)
        logger.info(`Total available: ${availableCommands.length} commands`)
        
        if (registeredCount > 0) {
            logger.info('\nCommands have been registered in Salamander\'s User Menu.')
            logger.info('Restart Salamander to see the new menu entries.')
        }
        
    } catch (error) {
        logger.error('Failed to register commands:', error)
        process.exit(1)
    }
}

cli.command(command, desc, builder, handler)
