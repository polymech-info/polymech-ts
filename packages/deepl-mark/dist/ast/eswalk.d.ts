import { EsNode, EsNodeMap, EsProgram } from './estree.js';
export declare const DEFAULT_ESWALKERS: EsWalkers;
export declare function eswalk(ast: EsProgram, visitors: EsVisitors, walkers?: EsWalkers): void;
export interface EsProcessor {
    (node: EsNode | null, parents: EsNode[]): void;
}
export interface EsVisitor<NodeType extends keyof EsNodeMap> {
    (node: EsNodeMap[NodeType], parents: EsNode[]): boolean | void;
}
export type EsVisitors = {
    [NodeType in keyof EsNodeMap]?: EsVisitor<NodeType>;
};
export interface EsWalker<NodeType extends keyof EsNodeMap> {
    (node: EsNodeMap[NodeType], parents: EsNode[], process: EsProcessor): void;
}
export type EsWalkers = {
    [NodeType in keyof Partial<EsNodeMap>]: EsWalker<NodeType>;
};
