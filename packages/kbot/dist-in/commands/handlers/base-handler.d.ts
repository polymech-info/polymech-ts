export interface IHandler {
    canHandle(content: Buffer | string, isPath: boolean): Promise<boolean>;
    handle(content: Buffer | string, isPath: boolean): Promise<string>;
}
export declare abstract class BaseHandler implements IHandler {
    abstract canHandle(content: Buffer | string, isPath: boolean): Promise<boolean>;
    abstract handle(content: Buffer | string, isPath: boolean): Promise<string>;
}
