/// <reference types="node" />
import { IBaseOptions, IProcessingNode } from '@plastichub/fs/interfaces';
import { ArrayIterator } from '@plastichub/core/iterator';
import { IObjectLiteral } from '@plastichub/core';
export interface Context extends IObjectLiteral {
    markdownTable: (data: any, options?: any) => string;
    cacache: any;
    cheerio: any;
    TOML: any;
    frontmatter: any;
    logger: any;
    config: any;
    PATHS: any;
    fs: {
        findUp: any;
        iterator: (from: string, options: IBaseOptions) => ArrayIterator<IProcessingNode>;
        glob: (path: string, options: any) => string[];
        slash: (s: string) => string;
        EIteratorFlags: {
            MODE: 2;
            TIMES: 4;
            SYMLINKS: 8;
            FILE_SIZE: 16;
            DIRECTORY_SIZE: 32;
            CHECKSUM: 64;
            MIME: 128;
        };
        sizeToString: (size: number) => string;
        dir: (dir: any, glob: any) => string[];
        path: any;
        exists: (path: string) => boolean | string;
        resolve: (path: string, alt: boolean, vars: IObjectLiteral) => string[];
        write: (path: string, content: string) => void;
        read: (path: string, type: string) => string | Buffer;
    };
}
export declare const context: Context;
