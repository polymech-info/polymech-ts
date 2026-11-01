import * as CLI from 'yargs'
import { logger } from '../index.js'
import { types } from '../lib/index.js'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    })
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);

export const register = (cli: CLI.Argv) => {
    return cli.command('types', 'generate types', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        logger.settings.minLevel = argv.logLevel as any || 2
        logger.info('generating types')
        types()
    })
}