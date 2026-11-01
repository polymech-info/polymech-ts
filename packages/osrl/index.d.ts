export * from './liquid';
export * from './Engine';
export * from './options';
export * from './types';
import { IObjectLiteral } from "@plastichub/core";
export declare const logger: import("@plastichub/core/debug").Logger;
export { getContext } from './Engine';
export declare const substitute: (alt: boolean, template: string, vars: IObjectLiteral) => any;
