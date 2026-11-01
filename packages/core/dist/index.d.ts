export type Hash<T> = Record<string, T>;
export interface List<T> {
    [index: number]: T;
    length: number;
}
/**
 * Interface of the simple literal object with any string keys.
 */
export type IObjectLiteral = Record<string, any>;
export type JSONPathExpression = string;
export declare const resolveConfig: (config: any) => any;
export { substitute } from './strings.js';
export * from './constants.js';
