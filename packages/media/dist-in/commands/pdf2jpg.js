import { logger } from '../index.js';
import { existsSync } from 'node:fs';
import * as z from 'zod';
import { runConversion, Pdf2JpgOptionsSchema } from '../lib/pdf/convert.js';
import { toYargs } from '@polymech/commons';
import { cli } from '../cli.js';
export const command = 'pdf2jpg';
export const desc = 'Convert PDF to images';
export const builder = (yargs) => {
    return toYargs(yargs, Pdf2JpgOptionsSchema(), {
        onKey: ((yargs, key, options) => {
            switch (key) {
                case 'input':
                    return yargs.option(key, { ...options, alias: 'i', demandOption: true });
                case 'output':
                    return yargs.option(key, { ...options, alias: 'o' });
                default:
                    return yargs.option(key, options);
            }
        })
    });
};
export async function handler(argv) {
    try {
        const config = Pdf2JpgOptionsSchema().parse(argv);
        // Validate startPage and endPage relationship
        if (config.startPage !== undefined && config.endPage !== undefined) {
            if (config.startPage > config.endPage) {
                throw new Error('startPage must be less than or equal to endPage');
            }
        }
        if (!existsSync(config.input)) {
            throw new Error(`Input file ${config.input} does not exist`);
        }
        logger.info("Calling conversion library function...");
        const outputFiles = await runConversion(config, logger);
        logger.info(`Conversion completed successfully`);
        logger.info(`Generated ${outputFiles.length} images`);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            logger.error('Invalid arguments:', error.flatten());
        }
        else {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error during conversion command:', message, error);
        }
        process.exit(1);
    }
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmMmpwZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wZGYyanBnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNyQyxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQztBQUN6QixPQUFPLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQzNGLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRWhDLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDakMsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLHVCQUF1QixDQUFDO0FBRTVDLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUM1QixRQUFRLEdBQUcsRUFBRSxDQUFDO2dCQUNWLEtBQUssT0FBTztvQkFDUixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUMsR0FBRyxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtnQkFDMUUsS0FBSyxRQUFRO29CQUNULE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBQyxHQUFHLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQTtnQkFDdEQ7b0JBQ0ksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUN6QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0tBQ0wsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxPQUFPLENBQUMsSUFBbUI7SUFDN0MsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQWtCLG9CQUFvQixFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWpFLDhDQUE4QztRQUM5QyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDakUsSUFBSSxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLGNBQWMsTUFBTSxDQUFDLEtBQUssaUJBQWlCLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sV0FBVyxHQUFHLE1BQU0sYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4RCxNQUFNLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDakQsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLFdBQVcsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLE9BQU8sR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztBQUNMLENBQUM7QUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBIn0=