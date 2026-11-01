import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Locate } from 'lucide-react';
import { searchGadmRegions, fetchRegionChildren, fetchRegionHierarchy, fetchIpLocation } from '../client-gridsearch';
import { GadmTreePicker, GadmNode, GadmTreePickerApi } from './GadmTreePicker';
import { GadmPickedRegions } from './GadmPickedRegions';
import { useGadmPicker } from './GadmPickerContext';
import { T, translate } from '../../../i18n';

export interface GadmRegionCollectorProps {
    resolutions?: Record<string, number>;
    onChangeResolution?: (gid: string, level: number) => void;
}
export function GadmRegionCollector({
    resolutions = {},
    onChangeResolution = () => { }
}: GadmRegionCollectorProps) {
    const {
        roots, setRoots,
        expandMap, setExpandMap,
        regionQuery, setRegionQuery,
        hasAutoLocated, setHasAutoLocated,
        treeApiRef,
        selectedNodes, setSelectedNodes
    } = useGadmPicker();

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const suggestionsWrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLocating, setIsLocating] = useState(false);

    const handleAddSuggestion = (s: any, keepQuery?: string) => {
        // Find the deepest GID available in the search result
        let deepestGid = '';
        let deepestName = '';
        let deepestLevel = -1;
        for (let i = 5; i >= 0; i--) {
            if (s[`GID_${i}`]) {
                deepestGid = s[`GID_${i}`];
                deepestName = s[`NAME_${i}`] || s.name || deepestGid;
                deepestLevel = i;
                break;
            }
        }
        if (!deepestGid) return;

        // Parse the GID to reconstruct the full hierarchy
        // GID format: "DEU.14.3_1" → country="DEU", segments=["14","3"], version="_1"
        const versionMatch = deepestGid.match(/_\d+$/);
        const version = versionMatch ? versionMatch[0] : '_1';
        const withoutVersion = deepestGid.replace(/_\d+$/, '');
        const parts = withoutVersion.split('.');
        const countryCode = parts[0]; // e.g. "DEU"

        // Build path GIDs for each level: DEU, DEU.14_1, DEU.14.3_1
        const pathGids: string[] = [countryCode];
        for (let i = 1; i < parts.length; i++) {
            pathGids.push(parts.slice(0, i + 1).join('.') + version);
        }

        // Create root node for the country (L0)
        const rootName = s['NAME_0'] || countryCode;
        const rootNode: GadmNode = {
            name: rootName,
            gid: countryCode,
            level: 0,
            hasChildren: true,
            data: { GID_0: countryCode, NAME_0: rootName }
        };

        setRoots(prev => {
            if (prev.find(p => p.gid === rootNode.gid)) return prev;
            return [...prev, rootNode];
        });

        // Trigger expand path with all GIDs up to the target
        setTimeout(() => {
            treeApiRef.current?.expandPath(pathGids);
        }, 100);

        if (keepQuery !== undefined) {
            setRegionQuery(keepQuery);
        } else {
            setRegionQuery('');
        }
        setShowSuggestions(false);
    };

    const performLocate = async () => {
        setIsLocating(true);
        try {
            const data = await fetchIpLocation();
            if (data && !data.error && data.latitude && data.longitude) {
                const hierarchy = await fetchRegionHierarchy(data.latitude, data.longitude);
                if (hierarchy && hierarchy.length > 0) {

                    const l0 = hierarchy[0];

                    const rootNode: GadmNode = {
                        name: l0.gadmName || l0.name || l0.gid,
                        gid: l0.gid,
                        level: l0.level,
                        hasChildren: l0.level < 5,
                        data: l0
                    };
                    console.log('root node', rootNode)

                    setRoots(prev => {
                        if (prev.find(p => p.gid === rootNode.gid)) return prev;
                        return [...prev, rootNode];
                    });

                    setTimeout(() => {
                        // treeApiRef.current?.expandPath(pathGids);
                    }, 100);

                    const lastNode = hierarchy[hierarchy.length - 1];
                    setRegionQuery(lastNode.gadmName || lastNode.name || lastNode.gid);
                }
            }
        } catch (e) {
            console.error('Failed to locate', e);
        } finally {
            setIsLocating(false);
        }
    };

    useEffect(() => {
        if (!hasAutoLocated) {
            setHasAutoLocated(true);
            performLocate();
        }
    }, [hasAutoLocated]);

    // Ensure tree path expands to existing selections (e.g. when returning from back-navigation)
    useEffect(() => {
        if (selectedNodes.length === 0 || roots.length === 0) return;

        let expandedAnything = false;
        for (const node of selectedNodes) {
            const data = node.data;
            if (!data) continue;

            const pathGids: string[] = [];
            for (let i = 0; i <= node.level; i++) {
                if (data[`GID_${i}`]) {
                    pathGids.push(data[`GID_${i}`]);
                }
            }
            if (pathGids.length > 0) {
                expandedAnything = true;
                setTimeout(() => {
                    treeApiRef.current?.expandPath(pathGids);
                }, 100);
            }
        }
    }, [roots.length]); // Relies on roots being loaded


    useEffect(() => {
        if (!regionQuery || regionQuery.length < 2) { setSuggestions([]); return; }
        const id = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const results = await searchGadmRegions(regionQuery);
                setSuggestions(Array.isArray(results) ? results : (results as any).results || []);
                if (document.activeElement === inputRef.current) {
                    setShowSuggestions(true);
                }
            } catch { setSuggestions([]); }
            setLoadingSuggestions(false);
        }, 400);
        return () => clearTimeout(id);
    }, [regionQuery]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (suggestionsWrapRef.current && !suggestionsWrapRef.current.contains(e.target as Node))
                setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleRemovePicked = (node: GadmNode) => {
        const nextNodes = selectedNodes.filter(n => n.gid !== node.gid);
        setSelectedNodes(nextNodes);
        treeApiRef.current?.setSelectedIds(nextNodes.map(n => n.gid));
    };

    const handleClearAll = () => {
        setSelectedNodes([]);
        treeApiRef.current?.setSelectedIds([]);
    };

    return (
        <div className="flex flex-col gap-4 flex-1 min-h-0 w-full">
            <div className="relative mt-2" ref={suggestionsWrapRef}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-6 w-6 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={translate("Search countries, regions, cities to add...")}
                    className="w-full block pl-12 pr-12 py-4 text-lg border-2 border-transparent bg-gray-100 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 focus:ring-0 rounded-xl transition-colors dark:text-white"
                    value={regionQuery}
                    onChange={e => { setRegionQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {loadingSuggestions ? (
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    ) : (
                        <button
                            type="button"
                            onClick={performLocate}
                            disabled={isLocating}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
                            title={translate("Use my current location")}
                        >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
                        </button>
                    )}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-auto py-2">
                        {suggestions.map((s, i) => {
                            const nameKey = Object.keys(s).find(k => k.startsWith('NAME_'));
                            const gidKey = Object.keys(s).find(k => k.startsWith('GID_'));
                            const name = nameKey ? s[nameKey] : '';
                            const gid = gidKey ? s[gidKey] : '';
                            const displayName = s.hierarchy || s.name || name || gid;
                            return (
                                <li
                                    key={i}
                                    className="px-6 py-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                    onClick={() => handleAddSuggestion(s)}
                                >
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{displayName}</div>
                                        <div className="text-sm text-gray-500">{gid}</div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <div className="flex-1 min-h-0 border rounded-xl overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex flex-col">
                {roots.length === 0 && selectedNodes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MapPin className="w-12 h-12 mb-2 opacity-50" />
                        <p><T>Search and select regions above to build your list</T></p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {roots.length > 0 && (
                            <div className="flex-1 min-h-0 border-b border-gray-200 dark:border-gray-700">
                                <GadmTreePicker
                                    apiRef={treeApiRef}
                                    data={roots}
                                    expandMapExternal={expandMap}
                                    setExpandMapExternal={setExpandMap}
                                    initialSelectedIds={selectedNodes.map(n => n.gid)}
                                    fetchChildren={async (node) => {
                                        const children = await fetchRegionChildren(node.gid, node.level + 1);
                                        const seen = new Set();
                                        return children.map((c: any) => {
                                            const actualName = c.name || c.gadmName || c[`NAME_${node.level + 1}`] || c.gid || 'Unknown';
                                            return {
                                                name: actualName,
                                                gid: c.gid || c[`GID_${node.level + 1}`] || c.id || Math.random().toString(),
                                                level: node.level + 1,
                                                hasChildren: node.level + 1 < 5,
                                                label: c.LABEL || undefined,
                                                data: c
                                            };
                                        }).filter((c: any) => {
                                            if (seen.has(c.gid)) return false;
                                            seen.add(c.gid);
                                            const display = c.label || c.name;
                                            if (display.toLowerCase() === 'unknown') return false;
                                            return true;
                                        });
                                    }}
                                    onActivate={(node) => {
                                        // Optional: trigger onSelect when activated, or just keep it distinct
                                    }}
                                    onSelectionChange={(treeNodes, treeSelectedIds) => {
                                        setSelectedNodes(prev => {
                                            const missingIds = Array.from(treeSelectedIds).filter(id => !treeNodes.find(n => n.gid === id));
                                            const missingNodes = prev.filter(n => missingIds.includes(n.gid));

                                            const nextNodes = [...missingNodes, ...treeNodes];
                                            // Simple equality check to prevent infinite re-renders
                                            if (nextNodes.length === prev.length && nextNodes.every(n => prev.some(p => p.gid === n.gid))) {
                                                return prev;
                                            }

                                            return nextNodes;
                                        });
                                    }}
                                />
                            </div>
                        )}

                        {selectedNodes.length > 0 && (
                            <div className="shrink-0 max-h-[50%] overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-800/10">
                                <GadmPickedRegions
                                    selectedNodes={selectedNodes}
                                    resolutions={resolutions}
                                    onRemove={handleRemovePicked}
                                    onChangeResolution={(node, lvl) => onChangeResolution(node.gid, lvl)}
                                    onClearAll={handleClearAll}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
