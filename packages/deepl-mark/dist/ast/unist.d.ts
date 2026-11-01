import type { Position as UnPosition } from 'unist';
export declare function unNodeIsParent(node: UnNode): node is UnParent;
/**
 * ============================================================
 */
export interface UnNode {
    type: string;
    position?: UnPosition;
    data?: unknown;
}
export interface UnParent extends UnNode {
    children: (UnNode | UnParent)[];
}
