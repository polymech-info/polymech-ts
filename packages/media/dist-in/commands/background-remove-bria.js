import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import { toYargs } from '@polymech/commons';
import { briaBackgroundRemove, BriaBackgroundRemoveOptionsSchema } from '../lib/media/images/background-remove-bria.js';
export const defaultOptions = (yargs) => {
    return toYargs(yargs, BriaBackgroundRemoveOptionsSchema(), {
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
export const command = 'background:remove:bria';
export const desc = 'Remove background from images using Bria AI';
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = BriaBackgroundRemoveOptionsSchema().parse(argv);
    logger.settings.minLevel = options.logLevel;
    const config = CONFIG_DEFAULT();
    // Get API key from argument, environment variable, or config
    options.apiKey = options.apiKey || process.env.BRIA_API_TOKEN || config?.bria?.key;
    if (!options.apiKey) {
        logger.error('Bria API key is required. Provide it via --apiKey argument, set BRIA_API_TOKEN environment variable, or configure in config.bria.key');
        logger.info('Get your API key at: https://docs.bria.ai/');
        process.exit(1);
    }
    // The schema already parsed all the options correctly
    const sanitizedOptions = sanitize(options);
    logger.info("Removing background with Bria AI options:", {
        sync: sanitizedOptions.sync,
        contentModeration: sanitizedOptions.contentModeration,
        preserveAlpha: sanitizedOptions.preserveAlpha,
        files: sanitizedOptions.srcInfo?.FILES?.length || 0
    });
    await briaBackgroundRemove(sanitizedOptions);
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC1yZW1vdmUtYnJpYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9iYWNrZ3JvdW5kLXJlbW92ZS1icmlhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ3BDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDL0IsT0FBTyxFQUNILFFBQVEsRUFDUixRQUFRLEVBQ1gsTUFBTSxZQUFZLENBQUE7QUFDbkIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRTNDLE9BQU8sRUFDSCxvQkFBb0IsRUFFcEIsaUNBQWlDLEVBQ3BDLE1BQU0sK0NBQStDLENBQUE7QUFFdEQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLGlDQUFpQyxFQUFFLEVBQUU7UUFDdkQsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzVCLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxLQUFLO29CQUNOLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBQyxHQUFHLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtnQkFDbEU7b0JBQ0ksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUN6QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0tBQ0wsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLHdCQUF3QixDQUFDO0FBQ2hELE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyw2Q0FBNkMsQ0FBQztBQUNsRSxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBRXRDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsT0FBTyxDQUFDLElBQW1CO0lBQzdDLFFBQVEsRUFBRSxDQUFBO0lBQ1YsTUFBTSxPQUFPLEdBQUcsaUNBQWlDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFnQyxDQUFBO0lBQzlGLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFlLENBQUE7SUFDbEQsTUFBTSxNQUFNLEdBQVEsY0FBYyxFQUFFLENBQUE7SUFFcEMsNkRBQTZEO0lBQzdELE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQztJQUVuRixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xCLE1BQU0sQ0FBQyxLQUFLLENBQUMsc0lBQXNJLENBQUMsQ0FBQztRQUNySixNQUFNLENBQUMsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBZ0MsQ0FBQTtJQUV6RSxNQUFNLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxFQUFFO1FBQ3JELElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJO1FBQzNCLGlCQUFpQixFQUFFLGdCQUFnQixDQUFDLGlCQUFpQjtRQUNyRCxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsYUFBYTtRQUM3QyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztLQUN0RCxDQUFDLENBQUM7SUFFSCxNQUFNLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVELEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUEifQ==