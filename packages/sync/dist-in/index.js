export * from './lib/sync.js';
export * from './argv.js';
export * from './types.js';
export { logger } from './logger.js';
import { substitute as _substitute, substituteAlt as _substituteAlt } from '@polymech/core/strings';
export const substitute = (alt, template, vars) => alt ? _substituteAlt(template, vars) : _substitute(template, vars);
