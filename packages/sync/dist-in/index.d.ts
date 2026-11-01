export * from './lib/sync.js';
export * from './argv.js';
export * from './types.js';
export { logger } from './logger.js';
import { IObjectLiteral } from '@polymech/core';
export declare const substitute: (alt: boolean, template: string, vars: IObjectLiteral) => any;
