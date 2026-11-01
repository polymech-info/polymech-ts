#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { defaults } from './_cli.js';
defaults();
import { cli } from './cli.js';
import './commands/info.js';
import './commands/sync.js';
import './commands/zip.js';
import { logger } from './index.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = cli.argv;
if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
    logger.info(pkg.version);
    process.exit();
}
