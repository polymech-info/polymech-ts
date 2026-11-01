#!/usr/bin/env node
import * as CLI from 'yargs'
import { logger } from './'
import { types, jsonSchemas, openAPI } from './zod_schema'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('logLevel', {
        default: 'info',
        describe: 'Log level : error, warn, info, debug, trace'
    }).option('dst', {
        describe: 'destination path',
        default: './zod_schemas.json'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)
export const registerTypes = (cli: CLI.Argv) => {
    return cli.command('types', 'generate types', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        logger.setSettings({ minLevel: argv.logLevel as any })
        logger.info('generating types')
        types()
    })
}
registerTypes(CLI)
export const registerSchemas = (cli: CLI.Argv) => {
    return cli.command('schemas', 'generate JSON schemas', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        logger.setSettings({ minLevel: argv.logLevel as any })
        logger.info('generating types')
        jsonSchemas((argv as any).dst)
    })
}
registerSchemas(CLI)


export const registerOpenAPI = (cli: CLI.Argv) => {
    return cli.command('openapi', 'generate OpenAPI spec', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        logger.setSettings({ minLevel: argv.logLevel as any })
        logger.info('generating OpenAPI spec')
        openAPI((argv as any).dst)
    })
}
registerOpenAPI(CLI)

const argv: any = CLI.argv
if (argv.help) {
    CLI.showHelp();
    process.exit();
} else if (argv.v || argv.version) {
    process.exit();
}
