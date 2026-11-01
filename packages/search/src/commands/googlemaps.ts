import * as CLI from 'yargs'
import { logger } from '../index.js'
import { defaults } from '../_cli.js'
import {  yargsOptions, zodSchema, googleMaps } from '../lib/googlemaps.js'
import { IOptionsGoogleMaps } from '../lib/index.js'

let options = (yargs: CLI.Argv) => yargsOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('googlemaps <verb>', 'Search GoogleMaps', options as any, async (argv: any): Promise<any> => {
        defaults()
        if (argv.help) { return }
        
        let opts = null
        try {
            opts = zodSchema().parse(argv) as IOptionsGoogleMaps            
        } catch (e) {
            logger.error('Invalid options', e.message, e.issues)
            return
        }
        return await googleMaps(opts)
    })
}
