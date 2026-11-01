import * as CLI from 'yargs'
import * as path from 'path'
import { Promise as BPromise } from 'bluebird'
import { sync as read } from '@plastichub/fs/read'
import { sync as exists } from '@plastichub/fs/exists'
import { sync as write } from '@plastichub/fs/write'
import { DATE_VARS } from '@plastichub/osr-commons'
import { Engine } from '../Engine'
import { parse } from '../options'
import { logger, substitute } from '../index'
import { defaultOptions, sanitize } from '../_cli'
import { IOptions } from '../types'
import { compilerOptions } from '../zod_schema'

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

async function _compile(options: IOptions) {
    let engineOptions = {
        root: [
            ...options.profile.includes
        ],
        ...options
    }
    if (options.dry) {
        return
    }

    let engine = new Engine(engineOptions)
    options.source = path.resolve(options.source)
    logger.info(`\n\nCompile ${options.source}`)
    let output = await engine.render(options.source, options.variables)
    if(!output){
        logger.error(`Error compiling ${options.source} : invalid output`)
        return false
    }

    output = output.trim()
    if (!options.output && options.stdout) {
        process.stdout.write(output)
    } else {
        write(options.output, output)
    }
    const outputPath = path.resolve(options.output)
    options.output && logger.info(`\n\nWriting output to ${outputPath}`)
}

const clone = (obj) => {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
export const targets = (f: string, options: IOptions) => {
    const srcParts = path.parse(f)
    const variables = clone(options.pathVariables)
    const targets = []
    variables.SRC_NAME = srcParts.name
    variables.SRC_DIR = srcParts.dir
    variables.SRC_EXT = srcParts.ext
    if (variables.ROOT) {
        variables.SRC_REL = path.relative(variables.ROOT, srcParts.dir);
    }

    if (options.targetInfo.IS_GLOB) {
        options.targetInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            let targetPath = substitute(options.alt, options.pathVariables.DST_PATH, variables)
            targetPath = path.resolve(targetPath.replace(options.pathVariables.DST_FILE_EXT, '') + e)
            targets.push(targetPath)
        })
    } else {
        let targetPath = substitute(options.alt, options.pathVariables.DST_PATH, variables)
        targets.push(targetPath);
    }
    return targets;
}
async function compile(options: IOptions) {
    if (options.srcInfo) {
        return await BPromise.resolve(options.srcInfo.FILES).map((f) => {
            const outputs = targets(f, options);
            return _compile(
                {
                    ...options,
                    source: f,
                    output: outputs[0]
                });
        }, { concurrency: 1 });
    } else {
        return _compile(options);
    }
}
export const register = (cli: CLI.Argv) => {
    return cli.command('compile', 'Compiles input files', options, async (argv: CLI.Arguments) => {
        if (argv.help) {
            return;
        }
        let options = sanitize(argv as any) as IOptions
        if (!options) {
            return
        }
        
        options = compilerOptions().parse(options) as any
        options = parse(options, argv)        
        let variables = Object.assign({}, ...Object.keys(argv).filter((k) => k.startsWith('var-')).map((k) => {
            return {
                [k.replace('var-', '')]: argv[k]
            }
        }))
        options.variables = {
            ...options.variables,
            ...variables,
            ...DATE_VARS(),
            ...{
                model: argv.model
            }
        }
        logger.settings.minLevel =  options.logLevel as any
        if (options.source && !options.srcInfo) {
            if (!exists(options.source)) {
                logger.error(`Invalid source file, doesn't exists: ${options.source} `);
                return;
            }
        }
        if (options.dry) {
            logger.info(`Abort : Dry enabled`)
            return
        }
        logger.debug(`Compile with options`, options)
        await compile(options)
    })
}
