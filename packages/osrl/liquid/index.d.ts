import { Liquid } from '../liquidjs/liquid';
import { IOptions } from '../types';
export { sync as dir } from '@plastichub/fs/dir';
export declare const engine: (options: any) => Liquid;
export declare const engineDefault: (options: any) => Liquid;
/**
 *
 * @param string
 * @param vars
 * @param options
 * @see https://liquidjs.com/tags/overview.html
 * @returns
 */
export declare function parseText(string: string, vars: any, iterations?: number, options?: IOptions): Promise<any>;
