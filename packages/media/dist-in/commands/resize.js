import { logger } from '../index.js';
import { resize, ResizeOptionsSchema } from '../lib/media/images/resize.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import { toYargs } from '@polymech/commons';
export const defaultOptions = (yargs) => {
    return toYargs(yargs, ResizeOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, { ...options, demandOption: true });
                default:
                    return yargs.option(key, options);
            }
        })
    }).option('gui', {
        boolean: true,
        default: false,
        describe: 'Launch interactive graphical user interface'
    });
};
export const command = 'resize';
export const desc = 'Resizes files';
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = sanitize(argv);
    logger.settings.minLevel = options.logLevel;
    // Check if GUI mode is requested
    if (options.gui) {
        const { renderSchemaUI } = await import('../lib/ui/electron.js');
        const { ResizeOptionsSchema } = await import('../lib/media/images/resize.js');
        // Generate schema for UI
        const schema = ResizeOptionsSchema();
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
        };
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
        };
        try {
            // Extract CLI options that were provided
            const cliOptions = {};
            if (options.src)
                cliOptions.src = options.src;
            if (options.dst)
                cliOptions.dst = options.dst;
            if (options.width)
                cliOptions.width = options.width;
            if (options.height)
                cliOptions.height = options.height;
            if (options.percent)
                cliOptions.percent = options.percent;
            if (options.square !== undefined)
                cliOptions.square = options.square;
            if (options.fillColor)
                cliOptions.fillColor = options.fillColor;
            if (options.fit)
                cliOptions.fit = options.fit;
            if (options.withoutEnlargement !== undefined)
                cliOptions.withoutEnlargement = options.withoutEnlargement;
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
            });
            if (result && result.data) {
                // Merge UI result with CLI options
                const uiOptions = { ...options, ...result.data };
                await resize(uiOptions);
            }
            else {
                logger.info('Operation cancelled by user');
            }
        }
        catch (error) {
            logger.error('GUI Error:', error);
            logger.info('Falling back to CLI mode...');
            await resize(options);
        }
    }
    else {
        await resize(options);
    }
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3Jlc2l6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ3BDLE9BQU8sRUFDSCxNQUFNLEVBQ04sbUJBQW1CLEVBQ3RCLE1BQU0sK0JBQStCLENBQUE7QUFDdEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUMvQixPQUFPLEVBQ0gsUUFBUSxFQUNSLFFBQVEsRUFDWCxNQUFNLFlBQVksQ0FBQTtBQUNuQixPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFPM0MsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLG1CQUFtQixFQUFFLEVBQUU7UUFDekMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzVCLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxLQUFLO29CQUNOLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBQyxHQUFHLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtnQkFDbEU7b0JBQ0ksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUN6QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0tBQ0wsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixPQUFPLEVBQUUsSUFBSTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLDZDQUE2QztLQUMxRCxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDO0FBQ2hD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