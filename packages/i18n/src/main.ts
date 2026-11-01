#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import cli from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as translate from './commands/translate.js'

cli(hideBin(process.argv))
.command('translate', 'Convert CAD files via Solidworks Interop API', translate.options, translate.handler)
.help()
.parse()

/*
//import { register as registerInfo } from './commands/info.js'; registerInfo(cli)
import { register as registerTranslate } from './commands/translate.js'; registerTranslate(cli)
import { register as registerGlossary } from './commands/glossary.js'; registerGlossary(cli)

const argv: any = cli.argv

if (argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
*/
