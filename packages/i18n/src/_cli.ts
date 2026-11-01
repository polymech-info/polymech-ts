import * as path from 'path'
import { sync as exists } from '@polymech/fs/exists'
import { IOptions } from './types.js'
import { logger } from './index.js'

export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }

    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason);
    })
}

export const sanitize = (argv: any): IOptions | boolean => {
    let ret: any = {
        all: argv.all,
        src: argv.src,
        dst: argv.dst,
        dry: argv.dry,
        alt: argv.alt,
        srcLang: argv.srcLang,
        dstLang: argv.dstLang || 'EN',
        formality: argv.formality,
        debug: argv.debug,
        text: argv.text,
        query: argv.query,
        glossary: argv.glossary,
        createGlossary: argv.createGlossary,
        cache: argv.cache,
        api_key: argv.api_key,
        keys: argv.keys,
        storeRoot: argv.storeRoot,
        store: argv.store,
        logLevel: argv.logLevel,
        engine: argv.engine,
        logger: argv.logger
    }

    if (!argv.src && !argv.text) {
        logger.error("No source path or text specified!")
        throw new Error("No source path or text specified!")
    }

    if (!argv.dstLang) {
        logger.error("No target language specified!")
        throw new Error("No target language specified!")
    }

    if (argv.cwd) {
        ret.cwd = path.resolve(argv.cwd)
        if (!exists((ret.cwd))) {
            ret.debug && logger.error(`Invalid working directory ${argv.cwd}`)
            ret.cwd = process.cwd()
        }
    } else {
        ret.cwd = process.cwd()
    }

    ret = {
        ...ret,
        ...{ variables: {} }
    }

    return ret
}