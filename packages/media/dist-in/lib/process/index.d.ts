export declare enum STATUS {
    OK = 0,
    ERROR = 1,
    PENDING = 2
}
export declare class Process {
    binary: string;
    cwd: string;
    args: string;
    constructor(options?: any);
    optionsToString(options: any): string;
    optionsToArray(options: any): string[];
    exec(command: string, options?: any, args?: any[]): Promise<any>;
}
export declare class Helper {
    static run(cwd: any, command: string, gitArgs: string[]): Promise<any>;
    static runBin(cwd: any, bin: any, command: string, gitArgs: string[]): Promise<any>;
}
