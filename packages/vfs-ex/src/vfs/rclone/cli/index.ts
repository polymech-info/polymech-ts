#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { RcloneWrapper } from './RcloneWrapper';
import { setupCommands } from './commands';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'RcloneCLI' });

// Create yargs instance
const cli = yargs(hideBin(process.argv))
  .scriptName('rclone-cli')
  .usage('Usage: $0 <command> [options]')
  .example('$0 copy source: dest:', 'Copy files from source to destination')
  .example('$0 ls remote:', 'List contents of remote')
  .example('$0 config', 'Show configuration')
  .help('h')
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .demandCommand(1, 'You must provide a valid command')
  .recommendCommands()
  .strict();

// Global options
cli.options({
  'config': {
    type: 'string',
    description: 'Config file path',
    global: true,
  },
  'verbose': {
    type: 'boolean',
    description: 'Enable verbose logging',
    alias: 'V',
    global: true,
  },
  'quiet': {
    type: 'boolean',
    description: 'Suppress output',
    alias: 'q',
    global: true,
  },
  'rc-addr': {
    type: 'string',
    description: 'RC server address',
    default: 'localhost:5572',
    global: true,
  },
  'rc-user': {
    type: 'string',
    description: 'RC server username',
    global: true,
  },
  'rc-pass': {
    type: 'string',
    description: 'RC server password',
    global: true,
  },
  'dry-run': {
    type: 'boolean',
    description: 'Do a trial run with no permanent changes',
    alias: 'n',
    global: true,
  },
});

// Setup all commands
setupCommands(cli);

// Error handler
cli.fail((msg, err, yargs) => {
  if (err) {
    logger.error('Command failed:', err.message);
    if (process.env.DEBUG) {
      logger.error(err.stack);
    }
  } else {
    logger.error('Error:', msg);
    yargs.showHelp();
  }
  process.exit(1);
});

// Parse and execute
cli.parse();

