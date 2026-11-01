import * as path from 'path';
import { sync as exists } from '@polymech/fs/exists';
import { logger } from './index.js';
// tweaks and handlers
export const defaults = () => {
    // default command
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    // currently no default handler, display only :
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
export const sanitize = (argv) => {
    let ret = {
        all: argv.all,
        src: argv.src,
        types: argv.types,
        dst: argv.dst,
        depth: argv.dept
    };
    if (argv.cwd) {
        ret.cwd = path.resolve(argv.cwd);
        if (!exists((ret.cwd))) {
            logger.error(`Invalid working directory ${argv.cwd}`);
        }
    }
    else {
        ret.cwd = process.cwd();
    }
    ret = {
        ...ret,
        ...{ variables: {} }
    };
    return ret;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9fY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBRTVCLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUVuQyxzQkFBc0I7QUFDdEIsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtJQUN6QixrQkFBa0I7SUFDbEIsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0lBQzlCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELCtDQUErQztJQUMvQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7UUFDaEQsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQVMsRUFBc0IsRUFBRTtJQUV0RCxJQUFJLEdBQUcsR0FBUTtRQUNYLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztRQUNiLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztRQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztRQUNqQixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDYixLQUFLLEVBQUMsSUFBSSxDQUFDLElBQUk7S0FDbEIsQ0FBQTtJQUVELElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyQixNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO0lBQ0wsQ0FBQztTQUFNLENBQUM7UUFDSixHQUFHLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsR0FBRyxHQUFHO1FBQ0YsR0FBRyxHQUFHO1FBQ04sR0FBRyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7S0FDdkIsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFDIn0=