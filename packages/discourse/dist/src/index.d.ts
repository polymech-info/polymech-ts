export * from './constants.js';
export * from './types.js';
export * from './lib/index.js';
export { Logger } from 'tslog';
import { IObjectLiteral } from "@polymech/core";
export declare const substitute: (alt: boolean, template: string, vars?: IObjectLiteral) => any;
