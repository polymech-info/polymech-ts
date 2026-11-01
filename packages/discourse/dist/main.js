#!/usr/bin/env node
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { defaults } from './_cli';
defaults();
import * as cli from 'yargs';
import { register as registerInfo } from './commands/info.js';
registerInfo(cli);
import { register as registerQuery } from './commands/query.js';
registerQuery(cli);
import { register as registerOAImport } from './commands/import-oa-users.js';
registerOAImport(cli);
import { register as registerOAImportHowtos } from './commands/import-oa-howtos.js';
registerOAImportHowtos(cli);
import { register as registerSync } from './commands/sync-file.js';
registerSync(cli);
import { register as registerSyncComponent } from './commands/sync-component.js';
registerSyncComponent(cli);
const argv = cli.argv;
if (argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    process.exit();
}
//# sourceMappingURL=main.js.map