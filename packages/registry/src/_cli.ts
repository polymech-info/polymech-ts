import { IOptions } from './types.js'

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

    return argv
}