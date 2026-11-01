import { sync as exists } from '@polymech/fs/exists';
import { IKBotTask } from './ai-tools/index.js';
export declare const default_filters: {
    isFile: (src: string) => boolean;
    exists: typeof exists;
    size: (filePath: string) => boolean;
};
export declare const isWebUrl: (str: string) => boolean;
export declare const glob: (projectPath: string, include?: string[], rawExcludeOptions?: string[], options?: IKBotTask) => {
    files: string[];
    webUrls: Set<string>;
};
