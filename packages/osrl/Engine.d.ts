import { Liquid } from './liquidjs/liquid';
import { IObjectLiteral } from '@plastichub/core';
export { sync as dir } from '@plastichub/fs/dir';
import { Context } from './conf/bootstrap';
import { IOptions } from './types';
export declare const getEngine: () => Engine;
export declare const getContext: () => Context;
export declare class LiquidEx extends Liquid {
    owner: Engine;
}
export declare class Engine {
    constructor(options: IOptions);
    engine: LiquidEx;
    options: IOptions;
    variables: IObjectLiteral;
    expressionCache: IObjectLiteral;
    global: any;
    context: Context;
    stats: any;
    render(sourceFile: string, vars: IObjectLiteral): Promise<any>;
    parse(string: string, vars: any, iterations?: number): Promise<any>;
}
