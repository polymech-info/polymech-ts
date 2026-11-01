import type { MdRoot } from './ast/mdast.js';
import { type Config } from './config.js';
export declare function replaceMdastStrings({ mdast, config, strings }: {
    mdast: MdRoot;
    strings: string[];
    config: Config;
}): MdRoot;
export declare function replaceJsonOrYamlStrings({ source, type, strings, config }: {
    source: string;
    type?: 'json' | 'yaml';
    strings: string[];
    config: Config;
}): string;
