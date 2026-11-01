import CLI from 'yargs'
import { logger } from '../index.js'
import { SolidworkOptions } from '../types.js'
import { defaultOptions, sanitize } from '../sw_argv.js'
import { convert } from '../cad/sw-convert.js'
export const options = (yargs: CLI.Argv) => defaultOptions(yargs)
export const handler = (argv) => {
    if (argv.help) { return }
    const options = sanitize(argv) as SolidworkOptions
    logger.setSettings({ minLevel: options.logLevel as any })
    logger.info("options " + argv.dst, options)
    return convert(options) as any
}