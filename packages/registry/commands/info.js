"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const __1 = require("../");
const _cli_1 = require("../_cli");
const path = __importStar(require("path"));
const osr_commons_1 = require("@plastichub/osr-commons");
const defaultOptions = (yargs) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('verb', {
        description: 'search api: scaleserp',
        default: 'scaleserp'
    }).option('location', {
        description: 'location to be searched from',
        default: 'Berlin, Germany'
    }).option('query', {
        description: 'the query',
        default: 'Precious Plastic Munich'
    }).option('dst', {
        description: 'dst output path, supports XLS|CSV|HTML',
        default: './tests/data/serpwow.json'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    });
};
let options = (yargs) => defaultOptions(yargs);
const register = (cli) => {
    return cli.command('info <verb>', 'Search', options, async (argv) => {
        (0, _cli_1.defaults)();
        if (argv.help) {
            return;
        }
        const args = argv;
        const config = (0, osr_commons_1.CONFIG_DEFAULT)(args.env_key);
        const opts = {
            verb: argv.verb,
            query: argv.query,
            dst: path.resolve(args.dst)
        };
        if (!opts.verb) {
            __1.logger.error('No verb specified');
            return;
        }
        __1.logger.debug(`Reading OSR Config with key "${argv.env_key}"`, opts);
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQTRCO0FBQzVCLGtDQUFrQztBQUdsQywyQ0FBNEI7QUFDNUIseURBQXdEO0FBRXhELE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDdkMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUN6QixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsZ0JBQWdCO0tBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsV0FBVyxFQUFFLHVCQUF1QjtRQUNwQyxPQUFPLEVBQUUsV0FBVztLQUN2QixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUNsQixXQUFXLEVBQUUsOEJBQThCO1FBQzNDLE9BQU8sRUFBRSxpQkFBaUI7S0FDN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixXQUFXLEVBQUUsV0FBVztRQUN4QixPQUFPLEVBQUUseUJBQXlCO0tBQ3JDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsV0FBVyxFQUFFLHdDQUF3QztRQUNyRCxPQUFPLEVBQUUsMkJBQTJCO0tBQ3ZDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLFFBQVEsRUFBRSxvQ0FBb0M7S0FDakQsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDO0FBRUYsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUdsRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQy9FLElBQUEsZUFBUSxHQUFFLENBQUE7UUFDVixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFBRSxPQUFNO1NBQUU7UUFDekIsTUFBTSxJQUFJLEdBQVEsSUFBSSxDQUFBO1FBRXRCLE1BQU0sTUFBTSxHQUFHLElBQUEsNEJBQWMsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFM0MsTUFBTSxJQUFJLEdBQUc7WUFDVCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUM5QixDQUFBO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDWixVQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbEMsT0FBTTtTQUNUO1FBQ0QsVUFBTSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3ZFLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBcEJZLFFBQUEsUUFBUSxZQW9CcEIifQ==