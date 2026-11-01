import { logger } from '../index.js';
import { cli } from '../cli.js';
import { sanitize, defaults } from '../_cli.js';
import { toYargs } from '@polymech/commons';
import { watermark, WatermarkOptionsSchema } from '../lib/media/images/watermark.js';
export const command = 'watermark';
export const desc = 'Adds watermarks to images';
export const defaultOptions = (yargs) => {
    return toYargs(yargs, WatermarkOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'src':
                    return yargs.positional(key, { ...options, demandOption: true });
                case 'watermark':
                    return yargs.option(key, { ...options, demandOption: true });
                default:
                    return yargs.option(key, options);
            }
        })
    });
};
export const builder = defaultOptions;
export async function handler(argv) {
    defaults();
    const options = WatermarkOptionsSchema().parse(argv);
    logger.settings.minLevel = options.logLevel;
    // The watermark content is already parsed by the schema
    const sanitizedOptions = sanitize(options);
    return await watermark(sanitizedOptions);
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3dhdGVybWFyay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBQ3BDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDL0IsT0FBTyxFQUNILFFBQVEsRUFDUixRQUFRLEVBQ1gsTUFBTSxZQUFZLENBQUE7QUFDbkIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRTNDLE9BQU8sRUFDSCxTQUFTLEVBRVQsc0JBQXNCLEVBQ3pCLE1BQU0sa0NBQWtDLENBQUE7QUFFekMsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQztBQUNuQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsMkJBQTJCLENBQUM7QUFFaEQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxPQUFPLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFLEVBQUU7UUFDNUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzVCLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxLQUFLO29CQUNOLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBQyxHQUFHLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtnQkFDbEUsS0FBSyxXQUFXO29CQUNaLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBQyxHQUFHLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtnQkFDOUQ7b0JBQ0ksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUN6QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0tBQ0wsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBQ0QsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQTtBQUNyQyxNQUFNLENBQUMsS0FBSyxVQUFVLE9BQU8sQ0FBQyxJQUFtQjtJQUM3QyxRQUFRLEVBQUUsQ0FBQTtJQUNWLE1BQU0sT0FBTyxHQUFHLHNCQUFzQixFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBcUIsQ0FBQTtJQUN4RSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBZSxDQUFBO0lBRWxELHdEQUF3RDtJQUN4RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQXFCLENBQUE7SUFFOUQsT0FBTyxNQUFNLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQzVDLENBQUM7QUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBIn0=