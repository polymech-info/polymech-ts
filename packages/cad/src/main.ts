#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()
import cli from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as sw from './commands/sw.js'

cli(hideBin(process.argv))
.command('sw', 'Convert CAD files via Solidworks Interop API', sw.options, sw.handler)
.help()
.parse()

//import { register as registerSW } from './commands/sw.js'; registerSW(yargs)
//import { register as registerSlic3r } from './commands/slice.js'; registerSlic3r(cli as any)
//import { register as registerPack } from './commands/pack.js'; registerPack(cli as any)
//import { register as registerInfo } from './commands/info.js'; registerInfo(cli as any)
