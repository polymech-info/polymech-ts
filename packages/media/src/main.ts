#!/usr/bin/env node
import { defaults } from './_cli.js'; defaults()

import { cli } from './cli.js'

import './commands/resize.js'
import './commands/pdf2jpg.js'
import './commands/watermark.js'
import './commands/background-remove.js'
import './commands/background-remove-bria.js'
import './commands/crop-foreground.js'
import './commands/salamander.js'
import './commands/schemas.js'
import './commands/register-commands.js'
import './commands/register-explorer.js'

const argv: any = cli.argv;

if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
