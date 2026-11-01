#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import { cli } from './cli.js'

import { register as registerInfo } from './commands/info.js'; registerInfo(cli)
import { register as registerTest } from './commands/test.js'; registerTest(cli)
import { register as registerTypes } from './commands/types.js'; registerTypes(cli)
import { register as registerSASearch } from './commands/googlemaps.js'; registerSASearch(cli)


const argv: any = cli.argv;


if (argv.help) {
    cli.showHelp(true)
    process.exit()
} else if (argv.v || argv.version) {
    process.exit()
}
