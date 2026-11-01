import * as CLI from 'yargs'
import * as path from 'path'
import { sync as exists } from '@plastichub/fs/exists'
import { isArray } from '@plastichub/core/primitives'
import { isFile, resolve } from '@plastichub/osr-commons'

import { logger } from './index'
import { IOptions } from './types'

export const defaultOptions = (yargs: CLI.Argv) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    })
    return yargs.
        showHelpOnFail(true).
        option('format', {
            describe: 'selects the output format, can be \'html\', \'md\', \'raw\', \'pretty\'',
            default: 'md',
            choices: ['md', 'html', 'raw', 'pretty']
        }).option('source', {
            describe: 'Path to the input file. If not specified, std.in will be used.\
            Glob patters are also supported',
        }).option('template', {
            describe: 'Path to a surrounding template file, for --source. In this case, the source file will be included by referencing ${SOURCE} in your template file'
        }).option('language', {
            describe: 'Set source language',
            default: 'osr',
            choices: ['osr', 'liquid']
        }).option('bootstrap', {
            describe: 'Path to another Javscript bootstrap module'
        }).option('variables', {
            describe: 'Path to another JSON file being filled into Javascript evaluation global scopes',
            default: '${OSR_ROOT}/conf/variables.js'
        }).option('trace', {
            describe: 'Path to the output file',
            default: '${SRC_DIR}/${SRC_NAME}-trace.json'
        }).option('output', {
            describe: 'Path to the output file',
            default: '${SRC_DIR}/${SRC_NAME}.md'
        }).option('disable', {
            describe: 'Comma separated list of disabled tags and filters'
        }).option('profile', {
            describe: "Path to profile(s) file which provides all settings, paths and variables.\n \
                      CLI arguments will override any profile settings.",
            default: '${OSR_ROOT}/osr-templates/osrl/.osrl.json'
        }).option('envVariables', {
            describe: 'Append Global scope for environment variables',
            default: 'true',
            boolean: true
        }).option('stdout', {
            describe: 'write on stdout',
            default: 'false',
            boolean: true
        }).option('dry', {
            describe: 'Don`t run the compiler',
            default: 'false',
            boolean: true
        }).option('introspect', {
            describe: 'Path to a report file, containing scopes and evaluations. Dumps also defaults. - Not implemented!'
        }).option('env', {
            describe: 'Target environment',
        }).option('alt', {
            default: false,
            describe: 'Use alternate tokenizer, & instead of $',
            type: 'boolean'
        }).option('plugins', {
            describe: "Path or array of paths for plugins to be loaded.\n \
                       The --disabled argument is being applied! \
                       Accepted file patterns : \n \
                       tags:  tag.mytag.js\n \
                       filters:  filter.mytag.js"
        }).option('targetLanguage', {
            describe: 'The target language (i18n)',
            default: 'en',
            type: 'string'
        }).option('sourceLanguage', {
            describe: 'The source language (i18n)',
            default: 'en',
            type: 'string'
        }).option('logLevel', {
            describe: 'Log level',
            default: 'warn',
            type: 'string'
        })
}

export const sanitize = (argv: any): IOptions | boolean => {
    let ret: any = {
        alt: argv.alt
    }
    ret.stdout = argv.stdout === 'true' || argv.stdout === true ? true : false
    ret.dry = argv.dry === 'true' || argv.dry === true ? true : false
    ret.env = argv.env
    ret.trace = argv.trace
    if (argv.plugins) {
        if (typeof argv.plugins === 'string') {
            ret.plugins = [argv.plugins]
        } else if (isArray(argv.plugins)) {
            ret.plugins = argv.plugins
        } else {
            ret.plugins = []
        }
    } else {
        argv.plugins = []
    }

    try {
        if (!argv.source) {
            logger.error("You must specify a source path!")
            return false;
        }
        ret.source = argv.source;
    } catch (e) {
        logger.error("Error sanitize", e)
    }

    ret.output = argv.output ? argv.output : null
    ret.profile = argv.profile ? argv.profile : null
    ret.template = argv.template ? path.resolve(resolve(argv.template, ret.alt)) : null
    if (ret.template && !isFile(ret.template)) {
        logger.error(`Template file ${ret.template} not found or invalid`)
    }
    const bootstrap = ret.bootstrap ? path.resolve(resolve(ret.bootstrap, false, argv)) : null
    if (bootstrap) {
        if (exists(bootstrap)) {
            ret.bootstrap = bootstrap
        } else {
            logger.warn(`Error reading bootstrap ${bootstrap}`)
            ret.bootstrap = null
        }
    }

    ret.format = argv.format && (argv.format === 'md' || argv.format === 'html') ? argv.format : 'md';
    ret.language = argv.language && (argv.language === 'liquid' || argv.language === 'liquid') ? argv.language : 'osr';

    if (argv.disabled && (argv.disable as string).includes(',')) {
        const disabled = {};
        (argv.disable as string).split(',').forEach((d) => {
            disabled[d] = true
        })
        ret.disabled = disabled
    }

    if (argv.cwd) {
        ret.cwd = path.resolve(resolve(argv.cwd))
        if (!exists((ret.cwd))) {
            logger.error(`Invalid working directory ${argv.cwd}`)
        }
    } else {
        ret.cwd = process.cwd();
    }

    ret = {
        ...ret,
        ...{ variables: {} }
    }

    return ret
}

// tweaks and handlers
export const defaults = () => {
    
    // default command
    const DefaultCommand = 'compile';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand)
    }

    // currently no default handler, display only :
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason)
    })
}

