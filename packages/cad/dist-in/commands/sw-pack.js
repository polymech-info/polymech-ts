import { logger } from '../index.js';
import { defaultOptions, sanitize } from '../sw_argv.js';
import { convert } from '../cad/index.js';
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('sw-pack', 'Pack and Go - Using the Zip option to preserve folder structure', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const options = sanitize(argv);
        options.debug && logger.info("options " + argv.dst, options);
        return convert(options);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ctcGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9zdy1wYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFcEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFDeEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRXpDLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUE7QUFFeEQsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFFdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpRUFBaUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQW1CLEVBQUUsRUFBRTtRQUNwSSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUFDLE9BQU07UUFBQyxDQUFDO1FBQ3pCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQXFCLENBQUE7UUFFbEQsT0FBTyxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzNCLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBIn0=