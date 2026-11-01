import * as CLI from 'yargs'
import { yargsOptionsEach, zodSchemaEach, each } from '../lib/googlemaps.js'
import { ZodObject } from 'zod'
import { logger } from '../index.js'
export const registerCommand = (
    cli: CLI.Argv,
    name,
    description,
    options,
    zodSchema: () => ZodObject<any>,
    main: (opts: any, argv:any) => Promise<any>) => {
    return cli.command(name, description, options, async (argv: CLI.Arguments): Promise<any> => {
        if (argv.help) { return }
        let opts = null
        try {
            opts = zodSchema().parse(argv)
        } catch (e) {
            logger.error(`Error parsing options: ${name}`, e.message, e.issues)
            return
        }
        return await main(opts, argv)
    })
}

export const registerCommands = (cli: CLI.Argv) => {
    registerCommand(cli as any, 'googlemaps-each', 'each', yargsOptionsEach, zodSchemaEach, each)
}
