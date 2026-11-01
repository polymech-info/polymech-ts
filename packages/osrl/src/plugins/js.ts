import { Liquid, Template, Token, Value, TagToken, TopLevelToken } from '../liquidjs/liquid'
import { IOptions } from "../types"
import * as path from 'path'
import { statSync } from 'fs'
import { sync as exists } from '@plastichub/fs/exists'
import { sync as write } from '@plastichub/fs/write'
import { isString } from '@plastichub/core/primitives'
import { substitute } from "@plastichub/core/strings"
import { toVariables } from '../liquid/parser'
import { evaluate } from '../vm/eval'
import { forward_slash, read, files } from '../lib/fs'
import { createHash } from 'crypto'
import { context } from '../conf/bootstrap'
import { replaceAll } from '../lib/StringUtils'
import { logger } from '../index'

const exceptionFormatter = require('exception-formatter')
var fm = require('front-matter')
import { parse } from 'query-string'

const toModule = (expr) => {
    let _header = 'module.exports = function () {'
    return `${_header}\n ${expr.trim()};\n}`;
}
const resolve = (filePath: string, hints: string[], variables: any) => {
    let resolved
    filePath = substitute(filePath, variables)
    hints.find((f) => {
        let testPath = path.join(f, filePath)
        if (exists(testPath)) {
            const stat = statSync(testPath)
            if (stat.isFile()) {
                resolved = testPath
            }
        }
    })
    return resolved;
}

const toScript = (path) => {
    try {
        const script = require(path);
        if (script && script.default) {
            return script.default;
        }

        if (script && typeof script === 'function') {
            return script;
        }

    } catch (e) {
        logger.error(e);
    }
}

export const runJS = (path: string, options: IOptions, engine: any, parsed: Template[]) => {
    let scope = {
        ...engine.variables
    }

    const script = resolve(path, options.profile.includes as [], engine.variables);
    const pageVariables = toVariables(parsed);
    pageVariables.forEach((t) => scope[t.key] = t.value);

    let ret;
    if (script) {
        const fn: Function = toScript(script);
        if (fn) {
            ret = fn.apply(engine, [scope]);
        } else {
            console.warn('invalid script ' + script);
        }
    }
    return ret;
}

const createScope = (engine, parsed, ctx, options, templateFile = "") => {
    let scope = {
        ...engine.variables
    }
    const pageVariables = toVariables(parsed);
    pageVariables.forEach((t) => scope[t.key] = t.value);

    // mixin liquid variables
    (ctx.scopes || []).forEach(_scope => {
        scope = {
            ..._scope,
            ...scope
        }
    });

    const ret = {
        ...context,
        ...scope,
        scope: scope,
        substitute: (string, variables = {}) => substitute(string, { ...scope, ...variables }),
        lookup: (fileName: string) => {
            const hints = [
                ...options.profile.includes as [],
                path.parse(templateFile).dir
            ];
            return resolve(fileName, [...new Set(hints)], engine.variables);
        },
        engine: engine,
        forward_slash: forward_slash,
        read: (file) => read(substitute(file, scope)) || {},
        write: (file, data) => write(substitute(file, scope), data),
        readJSON: (file) => read(substitute(file, scope), 'json') || {},
        writeJSON: (file, data) => write(substitute(file, scope), data),
        readFile: (file) => read(substitute(file, scope)) || {},
        store: engine.global,
        addGlobal: (what) => {
            engine.global = {
                ...engine.global,
                ...what
            }
        },
        register: (key, value) => {
            ctx.bottom()[key] = value;
        }
    }
    ret.logger = logger;
    return ret
}

const loadPlugins = (engine, options: IOptions) => {
    let ret = {};
    if (options.plugins) {
        options.plugins.forEach((d) => {
            const jsFiles = files(d, '*.js');
            jsFiles.map((f) => {
                try {
                    const plugin = require(f);
                    ret = {
                        ...ret,
                        ...plugin
                    }
                } catch (e) {
                    logger.error(`Couldnt load plugin from ${f} : \n ${e.message}`, e)
                }
            });
        });
    }
    return ret;
}

export const runJSExpressionEx = (
    expr: string,
    options: IOptions,
    engine: Liquid,
    parsed: Template[] = [],
    _ctx,
    args: any = {},
    templateFile: string = ""
) => {
    let expression = "" + expr
    let ret
    try {
        let ctx = createScope(engine, parsed, _ctx, options, templateFile);
        let _fm = { fm: {} };
        if (fm.test(options.string)) {
            _fm = {
                fm: fm(options.string).attributes
            }
        }

        engine['context'] = ctx;
        let plugins = loadPlugins(engine, options);
        let scopeArgs = { ...engine['context'], ...plugins, ..._fm.fm };
        for (let k in args) {
            if (isString(args[k])) {
                args[k] = substitute(args[k], scopeArgs);
            }
        }
        ret = evaluate(toModule(expr), templateFile + '.js', { ...scopeArgs, ...args }, true)(args);
        return ret;
    } catch (e) {
        logger.error(`Error running expression ${expression} :: ${templateFile}.js @ ${options.source || options.string} : ${e.message}`)
        return exceptionFormatter(e, {
            format: 'html'
        })
    }

    return ret;
}


export const register = (engine) => {
    engine.registerTag('js', {
        parse: function (token, remainTokens) {
            this.tokens = []
            const stream = this.liquid.parser.parseStream(remainTokens);

            this['currentFile'] = token.file
            const argsStr = replaceAll(" ", "&", token.args || "");
            this.args = parse(argsStr, { parseNumbers: true, parseBooleans: true }) || {};
            stream
                .on('token', (token: Token) => {
                    if (token['name'] === 'endjs') {
                        stream.stop();
                    }
                    else {
                        this.tokens.push(token)
                    }
                })
                .on('end', () => {
                    throw new Error(`tag ${token.raw} not closed`)
                })
            stream.start()
        },
        render: async function (ctx) {
            const file = this['currentFile']
            const text = this.tokens.map((token) => token.getText()).join('').replace('<script>', '').replace('</script>', '')
            const { liquid } = this
            const _hash: string = createHash('md5').update(text).digest('base64')
            if (_hash in liquid.owner.expressionCache) {
                // return liquid.owner.expressionCache[_hash];
            }
            const content = runJSExpressionEx(text, liquid.owner.engine.options, liquid.owner, [], ctx, this.args, file)
            liquid.owner.expressionCache[_hash] = content
            return content
        }
    })
}
export const runJSExpression = (expr: string, options: IOptions, engine: any, parsed: Template[] = []) => {
    let expression = "" + expr;
    expr = 'return ' + expr.trim();
    let ret;
    try {
        try {
            let ctx = createScope(engine, parsed, null, options, "");
            ret = evaluate(toModule(expr), 'js expression', ctx, true);
            return ret();
        } catch (e) {
            logger.error(`Error running expression ${expression} :: ${e.message}`)
            return 'Invalid Expression: ' + `"${expression}"`
        }

    } catch (e) {
        logger.error(`Error running expression ${expr}`, e);
    }
    return ret
}
