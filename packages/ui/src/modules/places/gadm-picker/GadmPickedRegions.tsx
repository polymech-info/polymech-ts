import React from 'react';
import { X, Trash2, ChevronRight } from 'lucide-react';
import type { GadmNode } from './GadmTreePicker';

export interface GadmPickedRegionsProps {
    selectedNodes: GadmNode[];
    resolutions: Record<string, number>;
    onRemove: (node: GadmNode) => void;
    onChangeResolution: (node: GadmNode, level: number) => void;
    onClearAll: () => void;
}

/** Build breadcrumb segments from node hierarchy data */
function buildBreadcrumbs(node: GadmNode): string[] {
    const crumbs: string[] = [];
    if (!node.data) return [node.label || node.name];
    for (let i = 0; i <= 5; i++) {
        const name = node.data[`NAME_${i}`];
        if (!name) break;
        crumbs.push(name);
        if (node.data[`GID_${i}`] === node.gid) break;
    }
    if (crumbs.length === 0) crumbs.push(node.label || node.name);
    return crumbs;
}

export function GadmPickedRegions({ selectedNodes, resolutions, onRemove, onChangeResolution, onClearAll }: GadmPickedRegionsProps) {
    if (!selectedNodes || selectedNodes.length === 0) return null;

    return (
        <div className="flex flex-col gap-1.5 h-full">
            <div className="flex justify-between items-center px-2 py-1.5 shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Selected ({selectedNodes.length})
                </span>
                {onClearAll && (
                    <button onClick={onClearAll} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-1">
                {selectedNodes.map((node) => {
                    const crumbs = buildBreadcrumbs(node);
                    const currentRes = resolutions[node.gid] ?? node.level;

                    return (
                        <div
                            key={node.gid}
                            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-lg px-2.5 py-1.5 group"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />

                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-0.5 min-w-0 flex-1 text-xs text-amber-800 dark:text-amber-300 truncate">
                                {crumbs.map((c, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-amber-400/60 shrink-0" />}
                                        <span className={i === crumbs.length - 1 ? 'font-semibold truncate' : 'opacity-70 shrink-0'}>
                                            {c}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Compact resolution pills */}
                            <div className="flex gap-px shrink-0">
                                {[0, 1, 2, 3, 4, 5].map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => onChangeResolution(node, l)}
                                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                                            currentRes === l
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'text-amber-600/50 dark:text-amber-400/40 hover:bg-amber-200/60 dark:hover:bg-amber-800/40'
                                        }`}
                                        title={`Level ${l}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(node); }}
                                className="text-amber-400/60 hover:text-red-500 transition-colors shrink-0 ml-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
