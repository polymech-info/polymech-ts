export * from './constants.js';
export * from './types.js';
export * from './lib/index.js';
export * from './lib/oa/types.js';
export { Logger } from 'tslog';
export declare const logger: any;
import { IObjectLiteral } from "@polymech/core";
export declare const substitute: (alt: boolean, template: string, vars?: IObjectLiteral) => any;
