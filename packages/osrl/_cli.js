"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = exports.sanitize = exports.defaultOptions = void 0;
const path = require("path");
const exists_1 = require("@plastichub/fs/exists");
const primitives_1 = require("@plastichub/core/primitives");
const osr_commons_1 = require("@plastichub/osr-commons");
const index_1 = require("./index");
const defaultOptions = (yargs) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    });
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
    });
};
exports.defaultOptions = defaultOptions;
const sanitize = (argv) => {
    let ret = {
        alt: argv.alt
    };
    ret.stdout = argv.stdout === 'true' || argv.stdout === true ? true : false;
    ret.dry = argv.dry === 'true' || argv.dry === true ? true : false;
    ret.env = argv.env;
    ret.trace = argv.trace;
    if (argv.plugins) {
        if (typeof argv.plugins === 'string') {
            ret.plugins = [argv.plugins];
        }
        else if ((0, primitives_1.isArray)(argv.plugins)) {
            ret.plugins = argv.plugins;
        }
        else {
            ret.plugins = [];
        }
    }
    else {
        argv.plugins = [];
    }
    try {
        if (!argv.source) {
            index_1.logger.error("You must specify a source path!");
            return false;
        }
        ret.source = argv.source;
    }
    catch (e) {
        index_1.logger.error("Error sanitize", e);
    }
    ret.output = argv.output ? argv.output : null;
    ret.profile = argv.profile ? argv.profile : null;
    ret.template = argv.template ? path.resolve((0, osr_commons_1.resolve)(argv.template, ret.alt)) : null;
    if (ret.template && !(0, osr_commons_1.isFile)(ret.template)) {
        index_1.logger.error(`Template file ${ret.template} not found or invalid`);
    }
    const bootstrap = ret.bootstrap ? path.resolve((0, osr_commons_1.resolve)(ret.bootstrap, false, argv)) : null;
    if (bootstrap) {
        if ((0, exists_1.sync)(bootstrap)) {
            ret.bootstrap = bootstrap;
        }
        else {
            index_1.logger.warn(`Error reading bootstrap ${bootstrap}`);
            ret.bootstrap = null;
        }
    }
    ret.format = argv.format && (argv.format === 'md' || argv.format === 'html') ? argv.format : 'md';
    ret.language = argv.language && (argv.language === 'liquid' || argv.language === 'liquid') ? argv.language : 'osr';
    if (argv.disabled && argv.disable.includes(',')) {
        const disabled = {};
        argv.disable.split(',').forEach((d) => {
            disabled[d] = true;
        });
        ret.disabled = disabled;
    }
    if (argv.cwd) {
        ret.cwd = path.resolve((0, osr_commons_1.resolve)(argv.cwd));
        if (!(0, exists_1.sync)((ret.cwd))) {
            index_1.logger.error(`Invalid working directory ${argv.cwd}`);
        }
    }
    else {
        ret.cwd = process.cwd();
    }
    ret = Object.assign(Object.assign({}, ret), { variables: {} });
    return ret;
};
exports.sanitize = sanitize;
// tweaks and handlers
const defaults = () => {
    // default command
    const DefaultCommand = 'compile';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    // currently no default handler, display only :
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
exports.defaults = defaults;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9fY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDZCQUE0QjtBQUM1QixrREFBc0Q7QUFDdEQsNERBQXFEO0FBQ3JELHlEQUF5RDtBQUV6RCxtQ0FBZ0M7QUFHekIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFDdEIsc0JBQXNCLEVBQUUsS0FBSztLQUNoQyxDQUFDLENBQUE7SUFDRixPQUFPLEtBQUs7UUFDUixjQUFjLENBQUMsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxRQUFRLEVBQUU7UUFDYixRQUFRLEVBQUUseUVBQXlFO1FBQ25GLE9BQU8sRUFBRSxJQUFJO1FBQ2IsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDO0tBQzNDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ2hCLFFBQVEsRUFBRTs0Q0FDc0I7S0FDbkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDbEIsUUFBUSxFQUFFLGtKQUFrSjtLQUMvSixDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUNsQixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQztLQUM3QixDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNuQixRQUFRLEVBQUUsNENBQTRDO0tBQ3pELENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO1FBQ25CLFFBQVEsRUFBRSxpRkFBaUY7UUFDM0YsT0FBTyxFQUFFLCtCQUErQjtLQUMzQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNmLFFBQVEsRUFBRSx5QkFBeUI7UUFDbkMsT0FBTyxFQUFFLG1DQUFtQztL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