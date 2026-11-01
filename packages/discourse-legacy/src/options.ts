
import { resolveConfig } from '@polymech/core'

export * from './lib/index.js'

import { IOptions } from './types.js'


export const parse = (options: IOptions, argv: any): IOptions => {

    for (const k in argv) {
        if (!(k in options.variables) && k !== '_'
            && k !== '$0'
            && k !== 'variables'
            && k !== 'src'
            && k !== 'format'
            && k !== 'profile'
            && k !== 'output') {
            options.variables[k] = argv[k];
        }
    }

    options.variables['cwd'] = options.variables['cwd'] ? options.variables['cwd'] : options.cwd
    resolveConfig(options.variables)
    let variables = {}
    options.pathVariables = variables
    return options
}