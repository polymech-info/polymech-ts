"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = exports.substitute = void 0;
const substitute = (template, map) => {
    const transform = (k) => k || '';
    return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, (match, key, format) => transform(map[key]).toString());
};
exports.substitute = substitute;
const _resolve = (config) => {
    for (const key in config) {
        if (config[key] && typeof config[key] == 'string') {
            const resolved = (0, exports.substitute)(config[key], config);
            config[key] = resolved;
        }
    }
    return config;
};
const resolveConfig = (config) => {
    config = _resolve(config);
    config = _resolve(config);
    return config;
};
exports.resolveConfig = resolveConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNPLE1BQU0sVUFBVSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQzFDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pDLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyx3Q0FBd0MsRUFDOUQsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDNUQsQ0FBQyxDQUFDO0FBSlcsUUFBQSxVQUFVLGNBSXJCO0FBRUYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRTtJQUMxQixLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUN4QixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxRQUFRLEVBQUU7WUFDakQsTUFBTSxRQUFRLEdBQUcsSUFBQSxrQkFBVSxFQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUE7QUFDTSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQ3RDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUE7QUFKWSxRQUFBLGFBQWEsaUJBSXpCIn0=