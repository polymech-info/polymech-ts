import type * as CLI from 'yargs';
export type IDefaultCLIArgs = CLI.Arguments & {
    source: any;
    target: string;
    module?: string;
    profile?: any;
    filter?: string;
    root?: string;
    verbose?: boolean;
    cwd?: string;
    alt?: boolean;
    renamer?: string | Function;
    content?: Function;
};
