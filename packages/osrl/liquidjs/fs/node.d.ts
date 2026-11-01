export declare function exists(filepath: string): Promise<boolean>;
export declare function readFile(filepath: string): any;
export declare function existsSync(filepath: string): boolean;
export declare function readFileSync(filepath: string): string;
export declare function resolve(root: string, file: string, ext: string): string;
export declare function fallback(file: string): string;
export declare function dirname(filepath: string): string;
export declare function contains(root: string, file: string): boolean;
export { sep } from 'path';
