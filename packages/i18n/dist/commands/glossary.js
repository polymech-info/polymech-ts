import * as path from 'path';
import { pairs } from '../lib/glossary.js';
import { defaults } from '../_cli.js';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { resolve } from "@polymech/commons/variables";
const defaultOptions = (yargs) => {
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    }).option('src', {
        describe: 'Path to the input file(s). Glob patters are supported',
    }).option('dst', {
        describe: 'Target file',
    }).option('dst', {
        describe: 'Path to the output file(s). Glob patters are supported',
        default: '${SRC_DIR}/${SRC_NAME}_${DST_LANG}${SRC_EXT}'
    }).option('srcLang', {
        describe: 'Source language. Please run `osr-i18n info to see all supported languages`',
        default: ''
    }).option('cache', {
        describe: 'Cache directory',
        default: '${ROOT}/.osr/cache/i18n'
    }).option('dstLang', {
        describe: 'Target Language. Please run `osr-i18n info to see all supported languages`',
        default: 'DE'
    }).option('name', {
        describe: 'Name of the glossary',
        default: 'osr-i18n-store'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('glossary <verb>', 'Manages glossaries on DeepL', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        const args = argv;
        const config = CONFIG_DEFAULT(args.env_key);
        const verb = argv.verb;
        if (verb === 'create') {
            /*
            let options = sanitize(argv as any) as IOptions
            if (!options) {
                logger.error(`Invalid options, abort`);
                return
            }

            let opts = parse(options, args)
            opts.config = config
            if (!opts.srcInfo) {
                logger.error(`Invalid source : ${argv.src}`, opts)
                return
            }

            if (opts.srcInfo.IS_GLOB) {
                const glob_base = globBase(opts.src)
                opts.pathVariables.ROOT = path.resolve(glob_base.base)
            } else {
                options.pathVariables.ROOT = path.resolve(opts.cwd)
            }

            opts.pathVariables['DST_LANG'] = opts.dstLang.toLocaleLowerCase()
            opts.pathVariables['SRC_LANG'] = opts.srcLang.toLocaleLowerCase()
            opts.pathVariables['CWD'] = path.resolve(opts.cwd)
            if (!opts.srcInfo || (opts.srcInfo && !opts.srcInfo.FILES)) {
                logger.error(`Have no source files for ${opts.src}`)
                return
            }
            if (opts.srcInfo && opts.srcInfo.FILES) {
                await pMap(opts.srcInfo.FILES, async (files) => {
                    await pMap(files, (source: string) => {
                        //return create(options.srcLang, options.dstLang, options, source)
                    }, { concurrency: 1 })
                })
            }
            */
        }
        if (verb === 'pairs' && argv.dst) {
            await pairs(config.deepl, path.resolve(resolve(argv.dst)));
        }
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvc3NhcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvZ2xvc3NhcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFFNUIsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQzFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDckMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQTtBQUVyRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQ3ZDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0JBQWdCO1FBQzFCLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLFFBQVEsRUFBRSxxQ0FBcUM7S0FDbEQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsdURBQXVEO0tBQ3BFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsUUFBUSxFQUFFLGFBQWE7S0FDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsd0RBQXdEO1FBQ2xFLE9BQU8sRUFBRSw4Q0FBOEM7S0FDMUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsUUFBUSxFQUFFLDRFQUE0RTtRQUN0RixPQUFPLEVBQUUsRUFBRTtLQUNkLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsUUFBUSxFQUFFLGlCQUFpQjtRQUMzQixPQUFPLEVBQUUseUJBQXlCO0tBQ3JDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLFFBQVEsRUFBRSw0RUFBNEU7UUFDdEYsT0FBTyxFQUFFLElBQUk7S0FDaEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDZCxRQUFRLEVBQUUsc0JBQXNCO1FBQ2hDLE9BQU8sRUFBRSxnQkFBZ0I7S0FDNUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSx5Q0FBeUM7UUFDbkQsSUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBRUQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUd4RCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsNkJBQTZCLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDeEcsUUFBUSxFQUFFLENBQUE7UUFFVixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUFDLE9BQU07UUFBQyxDQUFDO1FBQ3pCLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQTtRQUN0QixNQUFNLE1BQU0sR0FBUSxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFDdEIsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDcEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBbUNFO1FBQ04sQ0FBQztRQUNELElBQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBYSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3hFLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQSJ9