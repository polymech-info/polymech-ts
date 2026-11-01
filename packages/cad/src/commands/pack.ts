import * as CLI from 'yargs'
import { logger } from '../index.js'
import { SolidworkOptions } from '../types.js'
import { sanitizeSingle } from '../sw_argv.js'
import { pack } from '../cad/index.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: './',
        describe: 'The source directory or source file. Glob patters are supported!',
        demandOption: true
    }).option('dst', {
        describe: 'Destination folder or file'
    }).option('view', {
        default: 'Isometric',
        describe: 'Sets the target view'
    }).option('Report', {
        describe: 'Optional conversion report. Can be JSON, HTML, CSV or Markdown'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('skip', {
        default: true,
        describe: 'Skip existing files',
        type: 'boolean',
    }).option('dry', {
        default: false,
        describe: 'Run without conversion but create reports',
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Alternate tokenizer'
    }).option('verbose', {
        default: true,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('sw', {
        describe: 'Set explicit the path to the Solidworks binaries & scripts.\
        "It assumes SolidWorks.Interop.sldworks.dll and export.cmd at this location!'
    }).option('script', {
        describe: 'Set explicit the path to the Solidworks script'
    })
}
let options = (yargs: CLI.Argv) => defaultOptions(yargs)
export const register = (cli: CLI.Argv) => {
    return cli.command('pack', '', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        const options = sanitizeSingle(argv) as SolidworkOptions
        logger.setSettings({ minLevel: options.logLevel as any})
        logger.debug("options " + argv.dst, options)
        return pack(options) as any
    })
}
