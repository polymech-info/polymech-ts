export * from './constants';
export * from './types';
export * from './lib';
export * from './lib/oa/types';
export { Logger } from 'tslog';
export declare const logger: any;
import { IObjectLiteral } from "@polymech/core";
export declare const substitute: (alt: boolean, template: string, vars?: IObjectLiteral) => any;
