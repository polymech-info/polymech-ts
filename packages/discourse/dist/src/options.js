import { resolveConfig } from '@polymech/core';
export * from './lib/index.js';
export const parse = (options, argv) => {
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
    options.variables['cwd'] = options.variables['cwd'] ? options.variables['cwd'] : options.cwd;
    resolveConfig(options.variables);
    let variables = {};
    options.pathVariables = variables;
    return options;
};
//# sourceMappingURL=options.js.map