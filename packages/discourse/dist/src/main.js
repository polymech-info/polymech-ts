#!/usr/bin/env node
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { defaults } from './_cli.js';
defaults();
import { cli } from './cli.js';
const argv = cli.argv;
if (argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    process.exit();
}
//# sourceMappingURL=main.js.map