import { substitute } from './strings.js';
const _resolve = (config) => {
    for (const key in config) {
        if (config[key] && typeof config[key] == 'string') {
            const resolved = substitute(config[key], config);
            config[key] = resolved;
        }
    }
    return config;
};
export const resolveConfig = (config) => {
    config = _resolve(config);
    config = _resolve(config);
    return config;
};
export { substitute } from './strings.js';
export * from './constants.js';
//# sourceMappingURL=index.js.map