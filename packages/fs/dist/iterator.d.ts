import { IProcessingNode, IBaseOptions } from './interfaces.js';
import { ArrayIterator } from '@polymech/core/iterator';
export declare function async(from: string, options: IBaseOptions): Promise<ArrayIterator<IProcessingNode>>;
export declare function sync(from: string, options: IBaseOptions): ArrayIterator<IProcessingNode>;
