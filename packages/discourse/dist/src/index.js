export * from './constants.js';
export * from './types.js';
export * from './lib/index.js';
export { Logger } from 'tslog';
import { substitute as _substitute, substituteAlt as _substituteAlt } from "@polymech/core/strings";
export const substitute = (alt, template, vars = {}) => alt ? _substituteAlt(template, vars) : _substitute(template, vars);
//# sourceMappingURL=index.js.map