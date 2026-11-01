import { type UnNode, type UnParent } from './unist.js';
export declare function unwalk(node: UnNode, visit: UnVisitor, filter?: (node: UnNode, parent: UnParent | undefined) => boolean): void;
export interface UnVisitor {
    (node: UnNode | UnParent, parent: UnParent | undefined, index: number | undefined): boolean | void;
}
