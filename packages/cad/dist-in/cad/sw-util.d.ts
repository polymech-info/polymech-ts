export declare const dirname: () => string;
export declare const swProcMessage: (log: string) => {
    logLevel: string;
    message: string;
} | null;
export declare const fileAsBuffer: (path: string) => Buffer<ArrayBufferLike>;
export declare const getSWBin: (argv: string) => string;
export declare function closeAppByName(appName: string): void;
export declare function removeEmptyValues(obj: any): any;
export declare const equalFiles: (pathA: any, pathB: any) => boolean;
