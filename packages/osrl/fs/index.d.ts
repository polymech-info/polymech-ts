export { sync as dir } from '@plastichub/fs/dir';
export declare const exists: (filepath: string) => Promise<boolean>;
export declare function readFile(filepath: string): any;
export declare function existsSync(filepath: string): boolean;
export declare function readFileSync(filepath: string): string;
export declare function resolve(root: string, file: string, ext: string): string;
export declare const defaultFS: (resolve: any) => {
    exists: (f: any) => Promise<boolean>;
    existsSync: typeof existsSync;
    readFile: (f: any) => any;
    readFileSync: typeof readFileSync;
    resolve: any;
};
