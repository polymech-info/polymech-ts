import * as path from 'path';
import { logger } from '../index.js';
import { defaultOptions, sanitize } from '../slic3r_argv.js';
import { convert } from '../print/index.js';
import { load } from 'js-yaml';
import { deepClone as clone } from "@polymech/core/objects";
import { sync as read } from "@polymech/fs/read";
//import { dirname } from '../util.js'
const SLIC3R_DEFAULTS = () => path.resolve(path.join(import.meta.dirname, '../profiles/slic3r_defaults.yaml'));
const defaults = (defaults, options) => {
    let key, returnObject;
    returnObject = clone(options) || {};
    for (key in defaults)
        if (defaults.hasOwnProperty(key) &&
            typeof returnObject[key] === 'undefined')
            returnObject[key] = defaults[key];
    return returnObject;
};
export const register = (cli) => {
    const defaults_path = SLIC3R_DEFAULTS();
    cli.parserConfiguration({
        "short-option-groups": true,
        "camel-case-expansion": false
    });
    const defaultsRaw = read(defaults_path);
    let defaults_json = load(defaultsRaw);
    let options = (yargs) => {
        let opts = defaultOptions(yargs);
        Object.keys(defaults_json.properties).forEach((k) => {
            const val = defaults_json.properties[k];
            switch (defaults_json.properties[k].type) {
                case 'object':
                case 'boolean':
                case 'number':
                case 'string': {
                    opts = opts.option(k, val);
                    break;
                }
            }
        });
        return opts;
    };
    return cli.command('slice', 'Run Slic3r', options, async (argv) => {
        if (argv.help) {
            return;
        }
        let options = sanitize(argv);
        options = defaults(defaults_json, options);
        options.debug && logger.info("options " + argv.dst, options);
        return convert(options);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvc2xpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFDNUIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUVwQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzVELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQzlCLE9BQU8sRUFBRSxTQUFTLElBQUksS0FBSyxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDM0QsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxzQ0FBc0M7QUFDdEMsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUMsQ0FBQTtBQUU5RyxNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUVuQyxJQUFJLEdBQUcsRUFDSCxZQUFZLENBQUE7SUFFaEIsWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUE7SUFFbkMsS0FBSyxHQUFHLElBQUksUUFBUTtRQUNoQixJQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDO1lBQzVCLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFdBQVc7WUFDeEMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUV6QyxPQUFPLFlBQVksQ0FBQTtBQUN2QixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUV0QyxNQUFNLGFBQWEsR0FBRyxlQUFlLEVBQUUsQ0FBQTtJQUV2QyxHQUFHLENBQUMsbUJBQW1CLENBQUM7UUFDcEIscUJBQXFCLEVBQUUsSUFBSTtRQUMzQixzQkFBc0IsRUFBRSxLQUFLO0tBQ2hDLENBQUMsQ0FBQTtJQUVGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQVcsQ0FBQTtJQUNqRCxJQUFJLGFBQWEsR0FBUSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDMUMsSUFBSSxPQUFPLEdBQVEsQ0FBQyxLQUFlLEVBQUUsRUFBRTtRQUNuQyxJQUFJLElBQUksR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN2QyxRQUFRLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZDLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssU0FBUyxDQUFDO2dCQUNmLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDWixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUE7b0JBQzFCLE1BQU07Z0JBQ1YsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQTtRQUVGLE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQyxDQUFBO0lBRUQsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDN0UsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFBQyxPQUFNO1FBQUMsQ0FBQztRQUV6QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFrQixDQUFBO1FBRTdDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBRTFDLE9BQU8sQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUU1RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUMzQixDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQSJ9