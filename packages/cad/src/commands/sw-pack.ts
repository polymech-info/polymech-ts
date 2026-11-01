import * as CLI from 'yargs'
import { logger } from '../index.js'
import { SolidworkOptions } from '../types.js'
import { defaultOptions, sanitize } from '../sw_argv.js'
import { convert } from '../cad/index.js'

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {

    return cli.command('sw-pack', 'Pack and Go - Using the Zip option to preserve folder structure', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        const options = sanitize(argv) as SolidworkOptions

        options.debug && logger.info("options " + argv.dst, options)
        return convert(options)
    })
}
