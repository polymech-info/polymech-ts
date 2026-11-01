#!/usr/bin/env node
import { defaults } from './_cli.js';
defaults();
import cli from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as sw from './commands/sw.js';
cli(hideBin(process.argv))
    .command('sw', 'Convert CAD files via Solidworks Interop API', sw.options, sw.handler)
    .help()
    .parse();
//import { register as registerSW } from './commands/sw.js'; registerSW(yargs)
//import { register as registerSlic3r } from './commands/slice.js'; registerSlic3r(cli as any)
//import { register as registerPack } from './commands/pack.js'; registerPack(cli as any)
//import { register as registerInfo } from './commands/info.js'; registerInfo(cli as any)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQUMsUUFBUSxFQUFFLENBQUE7QUFDaEQsT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFBO0FBQ3ZCLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFdkMsT0FBTyxLQUFLLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUV0QyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QixPQUFPLENBQUMsSUFBSSxFQUFFLDhDQUE4QyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQztLQUNyRixJQUFJLEVBQUU7S0FDTixLQUFLLEVBQUUsQ0FBQTtBQUVSLDhFQUE4RTtBQUM5RSw4RkFBOEY7QUFDOUYseUZBQXlGO0FBQ3pGLHlGQUF5RiJ9