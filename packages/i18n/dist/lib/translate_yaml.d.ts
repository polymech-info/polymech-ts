import { IOptions } from '../types.js';
import * as TOML from 'smol-toml';
export declare const translateYAML: (src: string, dst: string, options: IOptions) => Promise<string | TOML.TomlTable>;
