import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import { toYargs } from '@polymech/commons';
import { cropForeground, CropForegroundOptionsSchema } from '../lib/media/images/crop-foreground.js';
export const defaultOptions = (yargs) => {
    return toYargs(yargs, CropForegroundOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, { ...options, demandOption: true });
                default:
                    return yargs.option(key, options);
            }
        })
    });
};
export const command = 'image-crop:foreground';
export const desc = 'Crop foreground from images using Bria AI';
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = CropForegroundOptionsSchema().parse(argv);
    logger.settings.minLevel = options.logLevel;
    const config = CONFIG_DEFAULT();
    // Get API key from argument, environment variable, or config
    options.apiKey = options.apiKey || process.env.BRIA_API_KEY || config?.bria?.key;
    if (!options.apiKey) {
        logger.error('Bria API key is required. Provide it via --apiKey argument, set BRIA_API_KEY environment variable, or configure it in config.bria.key');
        logger.info('Get your API key at: https://bria.ai/');
        process.exit(1);
    }
    // The schema already parsed all the options correctly
    const sanitizedOptions = sanitize(options);
    logger.info("Cropping foreground with Bria AI options:", {
        sync: sanitizedOptions.sync,
        contentModeration: sanitizedOptions.contentModeration,
        preserveAlpha: sanitizedOptions.preserveAlpha,
        files: sanitizedOptions.srcInfo?.FILES?.length || 0
    });
    await cropForeground(sanitizedOptions);
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JvcC1mb3JlZ3JvdW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2Nyb3AtZm9yZWdyb3VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDbEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBQy9CLE9BQU8sRUFDSCxRQUFRLEVBQ1IsUUFBUSxFQUNYLE1BQU0sWUFBWSxDQUFBO0FBQ25CLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUUzQyxPQUFPLEVBQ0gsY0FBYyxFQUVkLDJCQUEyQixFQUM5QixNQUFNLHdDQUF3QyxDQUFBO0FBRS9DLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQzlDLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxFQUFFO1FBQ2pELEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUM1QixRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNWLEtBQUssS0FBSztvQkFDTixPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEVBQUMsR0FBRyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7Z0JBQ2xFO29CQUNJLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDekMsQ0FBQztRQUNMLENBQUMsQ0FBQztLQUNMLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQztBQUMvQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsMkNBQTJDLENBQUM7QUFDaEUsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQztBQUV0QyxNQUFNLENBQUMsS0FBSyxVQUFVLE9BQU8sQ0FBQyxJQUFtQjtJQUM3QyxRQUFRLEVBQUUsQ0FBQTtJQUNWLE1BQU0sT0FBTyxHQUFHLDJCQUEyQixFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBMEIsQ0FBQTtJQUNsRixNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBZSxDQUFBO0lBQ2xELE1BQU0sTUFBTSxHQUFRLGNBQWMsRUFBRSxDQUFBO0lBRXBDLDZEQUE2RDtJQUM3RCxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUM7SUFFakYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDLHVJQUF1SSxDQUFDLENBQUM7UUFDdEosTUFBTSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVELHNEQUFzRDtJQUN0RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQTBCLENBQUE7SUFFbkUsTUFBTSxDQUFDLElBQUksQ0FBQywyQ0FBMkMsRUFBRTtRQUNyRCxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsSUFBSTtRQUMzQixpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxpQkFBaUI7UUFDckQsYUFBYSxFQUFFLGdCQUFnQixDQUFDLGFBQWE7UUFDN0MsS0FBSyxFQUFFLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7S0FDdEQsQ0FBQyxDQUFDO0lBRUgsTUFBTSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQSJ9