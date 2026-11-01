import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as convertCommand from './commands/convert.js';
import { ConvertCommandArgsSchema } from './types.js';
import { toYargs } from '@polymech/commons';
const commandModule = {
    command: convertCommand.command,
    describe: convertCommand.desc,
    builder: (yargs) => toYargs(yargs, ConvertCommandArgsSchema),
    handler: convertCommand.handler
};
yargs(hideBin(process.argv))
    .command(commandModule)
    .demandCommand(1, 'You need to specify a command')
    .help()
    .parse();
