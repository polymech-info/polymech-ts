export declare enum STATUS {
    OK = 0,
    ERROR = 1,
    PENDING = 2
}
export declare class Process {
    binary: string;
    cwd: string;
    args: string;
    buffer: string[];
    constructor(options?: any);
    exec(command: string, args?: string[]): Promise<any>;
}
export declare class Helper {
    static run(cwd: any, cmd: string, args: string[], buffer?: string[], debug_stream?: boolean): Promise<any>;
}
