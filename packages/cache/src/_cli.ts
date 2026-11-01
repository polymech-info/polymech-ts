import * as path from 'path'
import { IOptions } from './options.js'
import { sync as exists } from '@polymech/fs/exists'
import { logger } from './index.js'

// tweaks and handlers
export const defaults = () => {
    // default command
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    // currently no default handler, display only :
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};

export const sanitize = (argv: any): IOptions | boolean => {

    let ret: any = {
        all: argv.all,
        src: argv.src,
        types: argv.types,
        dst: argv.dst,
        depth:argv.dept   
    }
    
    if (argv.cwd) {
        ret.cwd = path.resolve(argv.cwd);
        if (!exists((ret.cwd))) {
            logger.error(`Invalid working directory ${argv.cwd}`);
        }
    } else {
        ret.cwd = process.cwd();
    }

    ret = {
        ...ret,
        ...{ variables: {} }
    }

    return ret;
};