#!/usr/bin/env node
import { defaults } from './_cli.js';
defaults();
import cli from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as translate from './commands/translate.js';
cli(hideBin(process.argv))
    .command('translate', 'Convert CAD files via Solidworks Interop API', translate.options, translate.handler)
    .help()
    .parse();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQUMsUUFBUSxFQUFFLENBQUE7QUFDaEQsT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFBO0FBQ3ZCLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSx5QkFBeUIsQ0FBQTtBQUVwRCxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QixPQUFPLENBQUMsV0FBVyxFQUFFLDhDQUE4QyxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQztLQUMxRyxJQUFJLEVBQUU7S0FDTixLQUFLLEVBQUUsQ0FBQTtBQUVSOzs7Ozs7Ozs7Ozs7O0VBYUUifQ==