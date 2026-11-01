import * as CLI from 'yargs'
import { logger } from '..'
import { defaultOptions, sanitize } from '../argv'

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('info', 'basic env info', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return; }
        // options.debug && logger.info("options " + argv.dst, options);        
    })
}
