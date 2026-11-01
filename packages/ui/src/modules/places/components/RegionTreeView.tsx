import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Search, Map as MapIcon } from 'lucide-react';

interface RegionNode {
    id: string; // GID or unique ID
    label: string;
    children: RegionNode[];
    data: any;
}

interface RegionTreeViewProps {
    subdivisions: any[];
    rootName: string;
    rootId: string;
    onSearch?: (term: string) => void;
}

export const RegionTreeView: React.FC<RegionTreeViewProps> = ({ subdivisions, rootName, rootId, onSearch }) => {

    const treeData = useMemo(() => {
        // 1. Convert all items to nodes
        const nodes: Record<string, RegionNode> = {};
        const roots: RegionNode[] = [];

        // Pre-process: Identify all valid GID items
        const gidItems = subdivisions.filter(s => Object.keys(s).some(k => k.startsWith('GID_')));

        // Items without GID (e.g. Scanned Locations)
        const scannedItems = subdivisions.filter(s => s.type === 'Scanned Location');

        // Create nodes map for GID items
        gidItems.forEach(item => {
            const gidKey = Object.keys(item).find(k => k.startsWith('GID_'));
            if (!gidKey) return;

            const gid = item[gidKey];
            const level = parseInt(gidKey.split('_')[1]);
            const nameKey = `NAME_${level}`;
            const label = item[nameKey] || 'Unknown';

            nodes[gid] = {
                id: gid,
                label,
                children: [],
                data: item
            };
        });

        // Build Hierarchy
        Object.values(nodes).forEach(node => {
            // Determine parent GID
            // GID structure: DEU.14.3.1_1 -> Parent DEU.14.3_1 (roughly)
            // Or count dots?
            // Split by '.', remove last segment, join.
            // CAUTION: The suffix `_1` is versioning? Or part of the ID?
            // Usually `DEU.1.2_1`.
            // Let's assume parent is defined by removing the last dot-segment BEFORE the underscore?
            // Or simpler: Look for a potential parent in the `nodes` map.
            // If `DEU.14.3.1_1` exists, check if `DEU.14.3_1` exists in map.

            // Heuristic: Remove last number group.
            // DEU.14.3.1_1 -> parts: [DEU, 14, 3, 1_1].
            // If I remove `.1_1` and add `_1`?
            // Actually, `pygadm` ensures `GID` consistency.
            // A node is a root if no parent found in the *current list*.

            // We need a robust parent finding strats.
            // Let's iterate all other nodes and see if one is a prefix?
            // No, strictly hierarchical.

            let parentFound = false;

            // Try to construct potential parent ID strategies
            // Strategy 1: Remove last dot component. `DEU.14.3.1_1` -> `DEU.14.3_1`
            // Removing `.1_1` is tricky because last part contains `_1`.
            // Let's try splitting by `.`
            const parts = node.id.split('.');
            if (parts.length > 1) {
                // e.g. ["DEU", "14", "3", "1_1"]
                // Parent candidate: ["DEU", "14", "3_1"].join('.') -> "DEU.14.3_1"
                // Logic: 
                // 1. Remove last part ("1_1").
                // 2. Take second to last ("3").
                // 3. Append "_1" to it? -> "3_1".
                // 4. Join.

                // Wait, does GADM always use `_1`? Yes for current version.
                // Does parent always have `_1`? Yes.

                // Let's act on string directly.
                // Find last dot.
                const lastDot = node.id.lastIndexOf('.');
                if (lastDot > 0) {
                    const potentialParentBase = node.id.substring(0, lastDot); // "DEU.14.3"
                    // Now append "_1"?
                    // Wait, `DEU.14.3` is not `DEU.14.3_1`.
                    // The parent GID in the set is `DEU.14.3_1`.
                    const candidate = potentialParentBase + '_1';

                    if (nodes[candidate]) {
                        nodes[candidate].children.push(node);
                        parentFound = true;
                    }
                }
            }

            if (!parentFound) {
                roots.push(node);
            }
        });

        // Add scanned items to roots (since they are direct children of the VIEWING region)
        // Or should we create a "Scanned" folder?
        if (scannedItems.length > 0) {
            const scannedRoot: RegionNode = {
                id: 'scanned-root',
                label: 'Scanned Towns',
                children: scannedItems.map((s, idx) => ({
                    id: `scan-${idx}-${s.NAME_SCAN}`,
                    label: s.NAME_SCAN,
                    children: [],
                    data: s
                })),
                data: {}
            };
            roots.push(scannedRoot);
        }

        // Sort roots by label
        roots.sort((a, b) => a.label.localeCompare(b.label));
        return roots;
    }, [subdivisions]);

    const renderTree = (nodes: RegionNode[]) => nodes.map((node) => (
        <TreeItem
            key={node.id}
            itemId={node.id}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                    <span>{node.label}</span>
                    {onSearch && (node.data.GID_2 || node.id.startsWith('scan-')) && (
                        <Search
                            className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSearch(node.label);
                            }}
                        />
                    )}
                </Box>
            }
        >
            {node.children.length > 0 ? renderTree(node.children) : null}
        </TreeItem>
    ));

    return (
        <Box sx={{ minHeight: 200, flexGrow: 1, overflowY: 'auto' }}>
            <SimpleTreeView>
                {/* Root Region */}
                <TreeItem itemId={rootId} label={rootName}>
                    {renderTree(treeData)}
                </TreeItem>
            </SimpleTreeView>
        </Box>
    );
};
