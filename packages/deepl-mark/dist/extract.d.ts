import type { UnNode } from './ast/unist.js';
import { type Config } from './config.js';
export declare function extractMdastStrings({ mdast, config }: {
    mdast: UnNode;
    config: Config;
}): string[];
export declare function extractJsonOrYamlStrings({ source, type, config }: {
    source: string;
    type?: 'json' | 'yaml';
    config: Config;
}): string[];
