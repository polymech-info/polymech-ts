import * as CLI from 'yargs'
import * as path from 'path'
import { logger } from '../index.js'
import { SlicerOptions } from '../types.js'
import { defaultOptions, sanitize } from '../slic3r_argv.js'
import { convert } from '../print/index.js'
import { load } from 'js-yaml'
import { deepClone as clone } from "@polymech/core/objects"
import { sync as read } from "@polymech/fs/read"
//import { dirname } from '../util.js'
const SLIC3R_DEFAULTS = () => path.resolve(path.join(import.meta.dirname, '../profiles/slic3r_defaults.yaml'))

const defaults = (defaults, options) => {

    let key,
        returnObject

    returnObject = clone(options) || {}

    for (key in defaults)
        if (defaults.hasOwnProperty(key) &&
            typeof returnObject[key] === 'undefined')
            returnObject[key] = defaults[key]

    return returnObject
}

export const register = (cli: CLI.Argv) => {

    const defaults_path = SLIC3R_DEFAULTS()
    
    cli.parserConfiguration({
        "short-option-groups": true,
        "camel-case-expansion": false
    })

    const defaultsRaw = read(defaults_path) as string
    let defaults_json: any = load(defaultsRaw)
    let options: any = (yargs: CLI.Argv) => {
        let opts = defaultOptions(yargs)
        Object.keys(defaults_json.properties).forEach((k) => {
            const val = defaults_json.properties[k]
            switch (defaults_json.properties[k].type) {
                case 'object':
                case 'boolean':
                case 'number':
                case 'string': {
                    opts = opts.option(k, val)
                    break;
                }
            }
        })

        return opts
    }

    return cli.command('slice', 'Run Slic3r', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }

        let options = sanitize(argv) as SlicerOptions

        options = defaults(defaults_json, options)

        options.debug && logger.info("options " + argv.dst, options)

        return convert(options)
    })
}