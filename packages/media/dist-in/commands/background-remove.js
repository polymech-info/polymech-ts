import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import { toYargs } from '@polymech/commons';
import { backgroundRemove, BackgroundRemoveOptionsSchema } from '../lib/media/images/background-remove.js';
export const defaultOptions = (yargs) => {
    return toYargs(yargs, BackgroundRemoveOptionsSchema(), {
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
export const command = 'background:remove';
export const desc = 'Remove background from images using AI';
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = BackgroundRemoveOptionsSchema().parse(argv);
    logger.settings.minLevel = options.logLevel;
    const config = CONFIG_DEFAULT();
    // Get API key from argument or environment variable
    options.apiKey = options.apiKey || process.env.REPLICATE_API_TOKEN || config?.replicate?.key;
    if (!options.apiKey) {
        logger.error('Replicate API key is required. Provide it via --apiKey argument or set REPLICATE_API_TOKEN environment variable');
        logger.info('Get your API key at: https://replicate.com/account/api-tokens');
        process.exit(1);
    }
    // The schema already parsed all the options correctly
    const sanitizedOptions = sanitize(options);
    logger.info("Removing background with options:", {
        model: sanitizedOptions.model,
        alpha_matting: sanitizedOptions.alpha_matting,
        files: sanitizedOptions.srcInfo?.FILES?.length || 0
    });
    await backgroundRemove(sanitizedOptions);
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC1yZW1vdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvYmFja2dyb3VuZC1yZW1vdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUMvQixPQUFPLEVBQ0gsUUFBUSxFQUNSLFFBQVEsRUFDWCxNQUFNLFlBQVksQ0FBQTtBQUNuQixPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0MsT0FBTyxFQUNILGdCQUFnQixFQUVoQiw2QkFBNkIsRUFDaEMsTUFBTSwwQ0FBMEMsQ0FBQTtBQUVqRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsNkJBQTZCLEVBQUUsRUFBRTtRQUNuRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDNUIsUUFBUSxHQUFHLEVBQUUsQ0FBQztnQkFDVixLQUFLLEtBQUs7b0JBQ04sT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxFQUFDLEdBQUcsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFBO2dCQUNsRTtvQkFDSSxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3pDLENBQUM7UUFDTCxDQUFDLENBQUM7S0FDTCxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsbUJBQW1CLENBQUM7QUFDM0MsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLHdDQUF3QyxDQUFDO0FBQzdELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUM7QUFFdEMsTUFBTSxDQUFDLEtBQUssVUFBVSxPQUFPLENBQUMsSUFBbUI7SUFDN0MsUUFBUSxFQUFFLENBQUE7SUFDVixNQUFNLE9BQU8sR0FBRyw2QkFBNkIsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQTRCLENBQUE7SUFDdEYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQWUsQ0FBQTtJQUNsRCxNQUFNLE1BQU0sR0FBUSxjQUFjLEVBQUUsQ0FBQTtJQUVwQyxvREFBb0Q7SUFDcEQsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUM7SUFFN0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDLGlIQUFpSCxDQUFDLENBQUM7UUFDaEksTUFBTSxDQUFDLElBQUksQ0FBQywrREFBK0QsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVELHNEQUFzRDtJQUN0RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQTRCLENBQUE7SUFFckUsTUFBTSxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsRUFBRTtRQUM3QyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsS0FBSztRQUM3QixhQUFhLEVBQUUsZ0JBQWdCLENBQUMsYUFBYTtRQUM3QyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztLQUN0RCxDQUFDLENBQUM7SUFFSCxNQUFNLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUVELEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUEifQ==