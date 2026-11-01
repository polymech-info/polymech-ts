import * as CLI from 'yargs'
import { logger } from '../index.js'
import {
    resize,
    ResizeOptionsSchema
} from '../lib/media/images/resize.js'
import { cli } from '../cli.js'
import {
    sanitize,
    defaults
} from '../_cli.js'
import { toYargs } from '@polymech/commons'

import {
    IOptions,
    IResizeOptions
} from '../types.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return toYargs(yargs, ResizeOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, {...options, demandOption: true})
                default:
                    return yargs.option(key, options)
            }
        })
    }).option('gui', {
        boolean: true,
        default: false,
        describe: 'Launch interactive graphical user interface'
    })
}

export const command = 'resize';
export const desc = 'Resizes files';
export const builder = defaultOptions;

export async function handler(argv: CLI.Arguments) {
    defaults()
    const options = sanitize(argv) as IOptions & IResizeOptions
    logger.settings.minLevel = options.logLevel as any
    
    // Check if GUI mode is requested
    if (options.gui) {
        const { renderSchemaUI } = await import('../lib/ui/electron.js')
        const { ResizeOptionsSchema } = await import('../lib/media/images/resize.js')
        
        // Generate schema for UI
        const schema = ResizeOptionsSchema()
        
        // Convert Zod schema to JSON Schema (enhanced)
        const jsonSchema = {
            type: 'object',
            title: 'Resize Image Options',
            properties: {
                src: {
                    type: 'string',
                    title: 'Source Files',
                    description: 'Source file(s) or directory to resize (supports glob patterns)',
                    examples: ['image.jpg', '*.png', './photos/', 'images/**/*.jpg']
                },
                dst: {
                    type: 'string',
                    title: 'Destination',
                    description: 'Output directory or file pattern for resized images'
                },
                width: {
                    type: 'integer',
                    title: 'Width (pixels)',
                    description: 'Target width in pixels',
                    minimum: 1,
                    maximum: 10000
                },
                height: {
                    type: 'integer',
                    title: 'Height (pixels)', 
                    description: 'Target height in pixels',
                    minimum: 1,
                    maximum: 10000
                },
                percent: {
                    type: 'number',
                    title: 'Resize Percentage',
                    description: 'Resize by percentage (e.g., 50 for 50%)',
                    minimum: 1,
                    maximum: 1000
                },
                square: {
                    type: 'boolean',
                    title: 'Square Output',
                    description: 'Fit image within specified width to create 1:1 aspect ratio',
                    default: false
                },
                fillColor: {
                    type: 'string',
                    title: 'Background Fill Color',
                    description: 'Color to use for background when creating square images',
                    default: 'white',
                    examples: ['white', 'black', 'transparent', '#FF0000']
                },
                fit: {
                    type: 'string',
                    title: 'Resize Fit Mode',
                    description: 'How the image should be resized to fit the dimensions',
                    enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
                    default: 'cover'
                },
                withoutEnlargement: {
                    type: 'boolean',
                    title: 'Prevent Enlargement',
                    description: 'Do not enlarge images that are smaller than target size',
                    default: false
                },
                quality: {
                    type: 'integer',
                    title: 'Quality',
                    description: 'Output quality for JPEG images (1-100)',
                    minimum: 1,
                    maximum: 100,
                    default: 90
                }
            },
            required: ['src'],
            anyOf: [
                {
                    required: ['width']
                },
                {
                    required: ['height'] 
                },
                {
                    required: ['percent']
                }
            ]
        }
        
        const uiSchema = {
            'ui:order': ['src', 'dst', 'width', 'height', 'percent', 'fit', 'square', 'fillColor', 'withoutEnlargement', 'quality'],
            src: {
                'ui:placeholder': 'e.g., *.jpg or ./photos/',
                'ui:help': 'Supports files, directories, and glob patterns',
                'ui:widget': 'textarea',
                'ui:options': {
                    rows: 2
                }
            },
            dst: {
                'ui:placeholder': 'e.g., ./resized/ or output.jpg',
                'ui:help': 'Output directory or file pattern'
            },
            width: {
                'ui:help': 'Leave empty to maintain aspect ratio'
            },
            height: {
                'ui:help': 'Leave empty to maintain aspect ratio'
            },
            percent: {
                'ui:help': 'Alternative to width/height - resize by percentage'
            },
            fit: {
                'ui:help': 'How to fit image when both width and height are specified'
            },
            fillColor: {
                'ui:help': 'Used when square mode creates padding',
                'ui:placeholder': 'white, black, transparent, #FF0000'
            },
            square: {
                'ui:help': 'Creates square images by padding with fillColor'
            },
            withoutEnlargement: {
                'ui:help': 'Prevents making small images larger'
            },
            quality: {
                'ui:help': 'Only applies to JPEG output files'
            }
        }
        
        try {
            // Extract CLI options that were provided
            const cliOptions: any = {};
            if (options.src) cliOptions.src = options.src;
            if (options.dst) cliOptions.dst = options.dst;
            if (options.width) cliOptions.width = options.width;
            if (options.height) cliOptions.height = options.height;
            if (options.percent) cliOptions.percent = options.percent;
            if (options.square !== undefined) cliOptions.square = options.square;
            if (options.fillColor) cliOptions.fillColor = options.fillColor;
            if (options.fit) cliOptions.fit = options.fit;
            if (options.withoutEnlargement !== undefined) cliOptions.withoutEnlargement = options.withoutEnlargement;

            const result = await renderSchemaUI({
                schema: jsonSchema,
                uiSchema,
                title: 'Resize Images',
                formData: {
                    fillColor: 'white',
                    square: false,
                    fit: 'cover',
                    withoutEnlargement: false,
                    quality: 90
                },
                cliOptions
            })
            
            if (result && result.data) {
                // Merge UI result with CLI options
                const uiOptions = { ...options, ...result.data }
                await resize(uiOptions)
            } else {
                logger.info('Operation cancelled by user')
            }
        } catch (error) {
            logger.error('GUI Error:', error)
            logger.info('Falling back to CLI mode...')
            await resize(options)
        }
    } else {
        await resize(options)
    }
}

cli.command(command, desc, builder, handler)
