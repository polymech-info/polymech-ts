import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import { Loader2, X, Crosshair, Plus, ChevronRight, Copy, Download, Upload, Trash2 } from 'lucide-react';
import * as turf from '@turf/turf';
import { searchGadmRegions, fetchRegionBoundary, resolveGadmHierarchy, type GadmRow } from '../client-gridsearch';
import { GadmSearchControls } from './components/GadmSearchControls';
import { T } from '../../../i18n';


export interface GadmRegion {
    gid: string;
    gadmName: string;
    level: number;
    stats?: any;
    raw?: any;
    parents?: { name: string; gid: string; level: number }[];
}



const MAX_DISPLAY_LEVEL: Record<number, number> = {
    0: 1,
    1: 3,
    2: 4,
    3: 5,
    4: 5,
    5: 5
};

function getOriginalLevel(gid: string): number {
    if (!gid) return 0;
    const base = gid.split('_')[0];
    return base.split('.').length - 1;
}

export interface GadmPickerProps {
    map: maplibregl.Map | null;
    active: boolean;
    onClose?: () => void;
    onSelectionChange?: (regions: GadmRegion[], geojsons: any[]) => void;
    className?: string;
    /** Pre-load these regions (same shape as export: { gid, name, level }) */
    initialRegions?: Array<{ gid: string; name: string; level: number }>;
}

const LEVEL_OPTIONS = [
    { value: 0, label: 'Country (Level 0)' },
    { value: 1, label: 'State (Level 1)' },
    { value: 2, label: 'Province (Level 2)' },
    { value: 3, label: 'District (Level 3)' },
    { value: 4, label: 'City (Level 4)' },
    { value: 5, label: 'Town (Level 5)' },
];

export function GadmPicker({ map, active, onClose, onSelectionChange, className = "", initialRegions }: GadmPickerProps) {
    const [levelOption, setLevelOption] = useState<number>(3);
    const [resolutionOption, setResolutionOption] = useState<number>(3);
    const enrich = true;

    // UI state
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsWrapRef = useRef<HTMLDivElement>(null);
    const headerSuggestionsWrapRef = useRef<HTMLDivElement>(null);
    const [headerPortalTarget, setHeaderPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setHeaderPortalTarget(document.getElementById('gadm-controls-portal'));
    }, []);

    const [selectedRegions, setSelectedRegions] = useState<GadmRegion[]>([]);
    const [geojsons, setGeojsons] = useState<Record<string, any>>({});

    // Extracted Inspector State
    const [inspectedHierarchy, setInspectedHierarchy] = useState<any[] | null>(null);
    const [inspectedPoint, setInspectedPoint] = useState<{ lat: number, lng: number } | null>(null);
    const [inspectedGeojson, setInspectedGeojson] = useState<any>(null);
    const [loadingInspector, setLoadingInspector] = useState(false);
    const [loadingHighlightGid, setLoadingHighlightGid] = useState<string | null>(null);

    const [pendingSelectionCount, setPendingSelectionCount] = useState(0);
    const isFetchingSelectionRef = useRef(false);

    const [loadingBoundaryIds, setLoadingBoundaryIds] = useState<Set<string>>(new Set());
    const loadingBoundaryIdsRef = useRef<Set<string>>(new Set());
    const processingGids = useRef<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importedInitialRef = useRef<string | null>(null);

    // Ctrl+click inspection queue logic
    const inspectionIdRef = useRef(0);
    const queuedInspectionsRef = useRef<Set<number>>(new Set());

    // Fix stale closures in map click / drag listeners
    const stateRef = useRef({ levelOption, resolutionOption, enrich });
    useEffect(() => {
        stateRef.current = { levelOption, resolutionOption, enrich };
    }, [levelOption, resolutionOption, enrich]);



    // Provide selected data mapping up
    useEffect(() => {
        if (onSelectionChange) {
            const polygons = selectedRegions.map(r => geojsons[r.gid]).filter(Boolean);
            onSelectionChange(selectedRegions, polygons);
        }

    }, [selectedRegions, geojsons]);

    const updateMapFeatures = useCallback(() => {
        if (!map || !map.getSource('gadm-picker-features')) return;

        const PALETTE = [
            { fill: '#fef08a', line: '#ca8a04', outerLine: '#b91c1c' }, // Yellow / Red
            { fill: '#bfdbfe', line: '#2563eb', outerLine: '#1e3a8a' }, // Blue
            { fill: '#fecaca', line: '#dc2626', outerLine: '#7f1d1d' }, // Red
            { fill: '#a7f3d0', line: '#059669', outerLine: '#064e3b' }, // Emerald
            { fill: '#e9d5ff', line: '#9333ea', outerLine: '#581c87' }, // Purple
            { fill: '#fed7aa', line: '#ea580c', outerLine: '#7c2d12' }, // Orange
            { fill: '#a5f3fc', line: '#0891b2', outerLine: '#164e63' }, // Cyan
            { fill: '#fbcfe8', line: '#db2777', outerLine: '#831843' }, // Pink
        ];

        const allFeatures: any[] = [];
        selectedRegions.forEach((region, i) => {
            const gj = geojsons[region.gid];
            const colors = PALETTE[i % PALETTE.length];

            if (gj?.features) {
                gj.features.forEach((f: any) => {
                    const isOuter = f.properties.isOuter === true;
                    allFeatures.push({
                        ...f,
                        properties: { ...f.properties, _fillColor: colors.fill, _lineColor: isOuter ? colors.outerLine : colors.line }
                    });
                });
            }
        });

        const fc = { type: 'FeatureCollection', features: allFeatures };
        (map.getSource('gadm-picker-features') as maplibregl.GeoJSONSource).setData(fc as any);
    }, [map, geojsons, selectedRegions]);

    // Setup map source/layers
    useEffect(() => {
        if (!map) return;

        const setupMapLayers = () => {
            if (!map.getStyle()) return;
            if (!map.getSource('gadm-picker-features')) {
                // Draw GADM picker polygons below place clusters (clusters are added first; opening the sidebar after would otherwise stack GADM on top).
                const beforeId = map.getLayer('clusters')
                    ? 'clusters'
                    : map.getLayer('unclustered-point-circle')
                        ? 'unclustered-point-circle'
                        : undefined;
                map.addSource('gadm-picker-features', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                map.addLayer({ id: 'gadm-picker-fill', type: 'fill', source: 'gadm-picker-features', paint: { 'fill-color': ['get', '_fillColor'], 'fill-opacity': 0.15 } }, beforeId);
                map.addLayer({ id: 'gadm-picker-line', type: 'line', source: 'gadm-picker-features', paint: { 'line-color': ['get', '_lineColor'], 'line-width': ['case', ['==', ['get', 'isOuter'], true], 3, 1] } }, beforeId);
                updateMapFeatures();
                if (!map.getSource('gadm-picker-highlight')) {
                    map.addSource('gadm-picker-highlight', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                    map.addLayer({ id: 'gadm-picker-highlight-fill', type: 'fill', source: 'gadm-picker-highlight', paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.25 } }, beforeId);
                    map.addLayer({ id: 'gadm-picker-highlight-line', type: 'line', source: 'gadm-picker-highlight', paint: { 'line-color': '#0ea5e9', 'line-width': 2 } }, beforeId);
                }
            }
        };

        if (map.isStyleLoaded()) setupMapLayers();
        map.on('styledata', setupMapLayers);

        return () => {
            map.off('styledata', setupMapLayers);
            if (map.getStyle()) {
                if (map.getLayer('gadm-picker-fill')) map.removeLayer('gadm-picker-fill');
                if (map.getLayer('gadm-picker-line')) map.removeLayer('gadm-picker-line');
                if (map.getSource('gadm-picker-features')) map.removeSource('gadm-picker-features');
                if (map.getLayer('gadm-picker-highlight-fill')) map.removeLayer('gadm-picker-highlight-fill');
                if (map.getLayer('gadm-picker-highlight-line')) map.removeLayer('gadm-picker-highlight-line');
                if (map.getSource('gadm-picker-highlight')) map.removeSource('gadm-picker-highlight');
            }
        };
    }, [map, updateMapFeatures]);

    // Map Interactions
    useEffect(() => {
        if (!map || !active) return;

        const handleMapClick = (e: maplibregl.MapMouseEvent) => {
            // Left click handles normal inspection (or multi-select if Ctrl is held)
            if (e.originalEvent.button === 0) {
                performInspection(e.lngLat.lat, e.lngLat.lng, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
            }
        };

        const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
            // Middle click (button 1) acts as a shortcut for "Add to selection"
            if (e.originalEvent.button === 1) {
                performInspection(e.lngLat.lat, e.lngLat.lng, true);
                
                // Prevent MapLibre from starting a drag-rotate with middle mouse
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
            }
        };

        map.on('click', handleMapClick);
        map.on('mousedown', handleMouseDown);
        
        const canvas = map.getCanvas();
        const oldCursor = canvas.style.cursor;
        canvas.style.cursor = 'crosshair';

        const handleMouseEnter = () => { canvas.style.cursor = 'crosshair'; };
        map.on('mouseenter', handleMouseEnter);

        return () => {
            map.off('click', handleMapClick);
            map.off('mousedown', handleMouseDown);
            map.off('mouseenter', handleMouseEnter);
            canvas.style.cursor = oldCursor;
        };
    }, [map, active]);

    // Handle Inspector Clear on deactivate
    useEffect(() => {
        if (!map || !active) {
            setInspectedGeojson(null);
            setInspectedHierarchy(null);
            setInspectedPoint(null);
            return;
        }
    }, [map, active]);

    const performInspection = async (lat: number, lng: number, ctrlKey: boolean = false) => {
        const id = ++inspectionIdRef.current;
        if (ctrlKey) {
            queuedInspectionsRef.current.add(id);
            isFetchingSelectionRef.current = true;
            setPendingSelectionCount(p => p + 1);
        } else {
            queuedInspectionsRef.current.clear();
        }

        try {
            if (id === inspectionIdRef.current) {
                setInspectedPoint({ lat, lng });
                setLoadingInspector(true);
                setInspectedHierarchy(null);
            }

            let rows: any[] | null = null;
            try {
                rows = await resolveGadmHierarchy(lat, lng);
            } catch (e) {
                console.error(e);
            }

            if (ctrlKey) {
                if (!queuedInspectionsRef.current.has(id)) return; // Aborted by a newer normal click
                queuedInspectionsRef.current.delete(id);
            } else {
                if (id !== inspectionIdRef.current) return; // Aborted by a newer click
            }

            if (id === inspectionIdRef.current) {
                setLoadingInspector(false);
                if (rows) setInspectedHierarchy(rows);
            }

            if (rows) {
                const { levelOption } = stateRef.current;
                const targetRow = rows.find((r: any) => r.level === levelOption) || rows[rows.length - 1];
                if (targetRow && targetRow.gid) {
                    if (id === inspectionIdRef.current) {
                        setLoadingHighlightGid(targetRow.gid);
                    }
                    try {
                        const { levelOption: currentLevelOpt, resolutionOption } = stateRef.current;
                        const previewLevel = (resolutionOption > targetRow.level) ? resolutionOption : targetRow.level;

                        const maxDisplay = MAX_DISPLAY_LEVEL[targetRow.level] ?? 5;
                        const displayPreviewLevel = Math.min(previewLevel, maxDisplay);

                        const geojson = await fetchRegionBoundary(targetRow.gid, targetRow.gadmName, displayPreviewLevel, false);
                        if (id === inspectionIdRef.current) {
                            setInspectedGeojson(geojson);
                        }

                        if (ctrlKey) {
                            handleSelectRegion({ ...targetRow.gadmRow, level: targetRow.level }, undefined, true);
                        }
                    } catch (e) {
                        console.error('Failed to fetch boundary for highlight', e);
                        if (id === inspectionIdRef.current) setInspectedGeojson(null);
                    } finally {
                        if (id === inspectionIdRef.current) setLoadingHighlightGid(null);
                    }
                } else {
                    if (id === inspectionIdRef.current) setInspectedGeojson(null);
                }
            } else {
                if (id === inspectionIdRef.current) setInspectedGeojson(null);
            }
        } finally {
            if (ctrlKey) {
                isFetchingSelectionRef.current = false;
                setPendingSelectionCount(p => Math.max(0, p - 1));
            }
        }
    };

    const handlePreviewRegion = async (gid: string, name: string, level: number) => {
        if (!map) return;
        setLoadingHighlightGid(gid);
        try {
            const { resolutionOption } = stateRef.current;
            const previewLevel = (resolutionOption > level) ? resolutionOption : level;
            const maxDisplay = MAX_DISPLAY_LEVEL[level] ?? 5;
            const displayPreviewLevel = Math.min(previewLevel, maxDisplay);

            const geojson = await fetchRegionBoundary(gid, name, displayPreviewLevel, false);
            setInspectedGeojson(geojson);

            if (geojson && geojson.features && geojson.features.length > 0) {
                const bbox = turf.bbox(geojson as any);
                map.fitBounds(bbox as any, { padding: 50, duration: 800 });
            }
        } catch (e) {
            console.error('Failed to fetch preview boundary', e);
        } finally {
            setLoadingHighlightGid(null);
        }
    };

    // Keep map highlight mapped to inspectedGeojson
    useEffect(() => {
        if (!map || !active) return;
        const source = map.getSource('gadm-picker-highlight') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(inspectedGeojson || { type: 'FeatureCollection', features: [] });
        }
    }, [map, active, inspectedGeojson]);

    // Map click handler when active
    useEffect(() => {
        if (!map || !active) return;

        const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
            // Skip if ruler tool is active
            if (map.getCanvas().dataset.rulerActive) return;
            const ctrlKey = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
            if (ctrlKey && isFetchingSelectionRef.current) return;
            const lat = e.lngLat.lat;
            const lng = e.lngLat.lng;
            await performInspection(lat, lng, ctrlKey);
        };

        map.getCanvas().style.cursor = 'crosshair';
        map.on('click', handleMapClick);

        return () => {
            map.getCanvas().style.cursor = '';
            map.off('click', handleMapClick);
        };
    }, [map, active]);

    // Close suggestions
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const tgt = e.target as Node;
            const inMain = suggestionsWrapRef.current?.contains(tgt);
            const inHeader = headerSuggestionsWrapRef.current?.contains(tgt);
            if (!inMain && !inHeader) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Search query debouncer
    useEffect(() => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }
        const tid = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const results = await searchGadmRegions(query, levelOption);
                setSuggestions(results);
            } catch (err) {
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 400);
        return () => clearTimeout(tid);
    }, [query, levelOption]);

    const setLoadingGid = (gid: string, isLoading: boolean) => {
        if (isLoading) loadingBoundaryIdsRef.current.add(gid);
        else loadingBoundaryIdsRef.current.delete(gid);
        // Force a re-render to reflect loading state changes
        setLoadingBoundaryIds(new Set(loadingBoundaryIdsRef.current));
    };

    async function handleSelectRegion(region: any, forceLevel?: number, isMulti: boolean = false) {
        const { levelOption, resolutionOption, enrich } = stateRef.current;
        const gadmLevel = region.raw?.level ?? (region.level !== undefined ? region.level : levelOption);

        // Robust GID resolution: prioritization
        // 1. region.gid (if explicitly passed)
        // 2. region.GID_{gadmLevel} (specific level match)
        // 3. Fallback to GID_0 ONLY if gadmLevel is 0, otherwise it's a failure (don't snap to country)
        const gid = region.gid || region[`GID_${gadmLevel}`] || (gadmLevel === 0 ? region.GID_0 : undefined);
        const name = region.gadmName || region.name || region[`NAME_${gadmLevel}`] || region.NAME_0;

        if (!gid) {
            console.warn('GadmPicker: Could not resolve gid for region', region, 'at level', gadmLevel);
            return;
        }

        if (!isMulti) {
            if (isFetchingSelectionRef.current) return;
            isFetchingSelectionRef.current = true;
        }

        const realGadmLevel = getOriginalLevel(gid);

        // Ensure we handle duplicate queries safely
        if (processingGids.current.has(gid)) {
            if (!isMulti) isFetchingSelectionRef.current = false;
            return;
        }
        processingGids.current.add(gid);

        const targetLevel = (forceLevel !== undefined) ? forceLevel : (resolutionOption > realGadmLevel ? resolutionOption : realGadmLevel);

        // Build parent chain for breadcrumb
        const parents: { name: string; gid: string; level: number }[] = [];
        // Try inspectedHierarchy first (available during inspector ctrl+click)
        if (inspectedHierarchy) {
            for (const row of inspectedHierarchy) {
                if (row.level < realGadmLevel && row.gadmName && row.gid) {
                    parents.push({ name: row.gadmName, gid: row.gid, level: row.level });
                }
            }
        }
        // Fallback: try raw GADM NAME_0/GID_0 fields (available from search results)
        if (parents.length === 0) {
            for (let l = 0; l < realGadmLevel; l++) {
                const n = region[`NAME_${l}`];
                const g = region[`GID_${l}`];
                if (n && g) parents.push({ name: n, gid: g, level: l });
            }
        }

        let isDuplicate = false;
        setSelectedRegions(prev => {
            if (prev.some(r => r.gid === gid)) { isDuplicate = true; return prev; }
            return [...prev, { gid, gadmName: name, level: targetLevel, raw: region, parents: parents.length > 0 ? parents : undefined }];
        });

        if (isDuplicate) {
            setQuery(''); setShowSuggestions(false);
            return;
        }

        setQuery(''); setShowSuggestions(false);
        setLoadingGid(gid, true);

        try {
            const displayLevel = Math.min(targetLevel, MAX_DISPLAY_LEVEL[realGadmLevel] ?? 5);

            let geojson = await fetchRegionBoundary(
                gid, name || '', displayLevel, enrich
            );

            if (!geojson.features || geojson.features.length === 0) {
                console.warn(`No subdivisions found for ${gid} at level ${targetLevel} (displayed ${displayLevel}). Snapping back to level ${realGadmLevel}`);

                setSelectedRegions(prev => prev.map(r => r.gid === gid ? { ...r, level: realGadmLevel } : r));
                geojson = await fetchRegionBoundary(gid, name || '', realGadmLevel, enrich);
            }

            let activeStats: Record<string, any> | undefined;
            if (enrich && geojson.features && geojson.features.length > 0) {
                const props = geojson.features[0].properties;
                if (props.ghsPopulation !== undefined || props.ghsBuiltWeight !== undefined) {
                    activeStats = {
                        ghsBuiltWeight: props.ghsBuiltWeight,
                        ghsPopulation: props.ghsPopulation
                    };
                }
            }

            setSelectedRegions(prev => prev.map(r => r.gid === gid ? { ...r, stats: activeStats } : r));
            setGeojsons(prev => ({ ...prev, [gid]: geojson }));

            if (!isMulti && map && geojson && geojson.features && geojson.features.length > 0) {
                try {
                    const bbox = turf.bbox(geojson as any);
                    map.fitBounds(bbox as any, { padding: 50, duration: 800 });
                } catch (e) {
                    console.error("Failed to auto-fit bounds", e);
                }
            }
        } catch (e) {
            console.error("Failed to fetch boundary for", gid, e);
        } finally {
            setLoadingGid(gid, false);
            if (!isMulti) isFetchingSelectionRef.current = false;
        }
    };

    const handleRemoveRegion = (gid: string) => {
        processingGids.current.delete(gid);
        setSelectedRegions(prev => prev.filter(r => r.gid !== gid));
        setGeojsons(prev => {
            const next = { ...prev };
            delete next[gid];
            return next;
        });
    };

    const handleFlyToRegion = async (gid: string) => {
        if (!map) return;
        const gj = geojsons[gid];
        if (!gj || !gj.features || gj.features.length === 0) return;

        try {
            const turf = await import('@turf/turf');
            const bbox = turf.bbox(gj as any);
            map.fitBounds(bbox as any, { padding: 50, duration: 800 });
        } catch (e) {
            console.error("Failed to fit bounds", e);
        }
    };

    const handleReResolveRegion = (region: any, targetLevel: number) => {
        if (loadingBoundaryIds.has(region.gid)) return;
        if (targetLevel === region.level) return;
        handleRemoveRegion(region.gid);
        const originalRaw = region.raw || { gid: region.gid, gadmName: region.gadmName, level: region.level };
        handleSelectRegion(originalRaw, targetLevel, true);
    };

    const handleCopyToClipboard = async () => {
        const data = selectedRegions.map(r => ({ gid: r.gid, name: r.gadmName, level: r.level, raw: r.raw }));
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    };

    const handleExportJson = () => {
        if (!selectedRegions.length) return;
        const data = selectedRegions.map(r => ({ gid: r.gid, name: r.gadmName, level: r.level, raw: r.raw }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gadm-selection-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const parsed = JSON.parse(evt.target?.result as string);
                if (Array.isArray(parsed)) {
                    // Full reset
                    queuedInspectionsRef.current.clear();
                    processingGids.current.clear();
                    loadingBoundaryIdsRef.current.clear();
                    setLoadingBoundaryIds(new Set());
                    setSelectedRegions([]);
                    setGeojsons({});

                    // Queue them all concurrently via isMulti=true
                    for (const item of parsed) {
                        const raw = item.raw ? { ...item.raw, level: item.level } : { gid: item.gid, gadmName: item.name, level: item.level };
                        handleSelectRegion(raw, item.level, true);
                    }
                }
            } catch (err) {
                console.error("Failed to parse JSON", err);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    const handleClearAll = () => {
        isFetchingSelectionRef.current = false;
        queuedInspectionsRef.current.clear();
        processingGids.current.clear();
        loadingBoundaryIdsRef.current.clear();
        setLoadingBoundaryIds(new Set());
        setSelectedRegions([]);
        setGeojsons({});
        setInspectedGeojson(null);
        setInspectedHierarchy(null);
    };

    // Import initialRegions prop (same logic as handleImportJson)
    useEffect(() => {
        if (!initialRegions || initialRegions.length === 0) {
            if (active && importedInitialRef.current !== null) {
                 // If it became empty, we SHOULD clear
                 handleClearAll();
                 importedInitialRef.current = null;
            }
            return;
        }

        const key = initialRegions.map(r => r.gid).sort().join(',');
        if (importedInitialRef.current === key) return;

        // Check if current selectedRegions already contains exactly these gids
        const currentGids = selectedRegions.map(r => r.gid).sort().join(',');
        if (currentGids === key) {
            importedInitialRef.current = key;
            return;
        }

        importedInitialRef.current = key;

        // Full reset, same as import handler
        queuedInspectionsRef.current.clear();
        processingGids.current.clear();
        loadingBoundaryIdsRef.current.clear();
        setLoadingBoundaryIds(new Set());
        setSelectedRegions([]);
        setGeojsons({});

        for (const item of initialRegions) {
            const raw = (item as any).raw
                ? { ...((item as any).raw), gid: item.gid, level: item.level }
                : { gid: item.gid, gadmName: item.name, level: item.level };
            handleSelectRegion(raw, item.level, true);
        }
    }, [initialRegions]);

    useEffect(() => {
        updateMapFeatures();
    }, [updateMapFeatures]);

    const sidebarContent = active ? (
        <div className={`w-full h-full flex flex-col space-y-4 ${className}`}>

            <p className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <T>Click anywhere on the map to inspect administrative areas, or use the search below.</T>
            </p>

            {/* Config & Search */}
            <GadmSearchControls
                levelOption={levelOption} setLevelOption={setLevelOption}
                resolutionOption={resolutionOption} setResolutionOption={setResolutionOption}
                query={query} setQuery={setQuery}
                suggestions={suggestions} loadingSuggestions={loadingSuggestions}
                showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
                onSelectSuggestion={(s, ctrlKey) => handleSelectRegion(s, undefined, ctrlKey)}
                suggestionsWrapRef={suggestionsWrapRef}
                layout="vertical"
            />

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
                {/* Visual Inspector Panel */}
                {(inspectedPoint || loadingInspector) && (
                    <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2 text-sky-800 dark:text-sky-300">
                            <Crosshair className="w-4 h-4" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider"><T>Inspected Location</T></h4>
                            {loadingInspector && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                        </div>

                        {!loadingInspector && inspectedHierarchy && (
                            <div className="flex flex-col gap-1.5 mt-2">
                                {inspectedHierarchy.map((row) => (
                                    <div key={row.level} className="flex flex-col">
                                        <div className="flex items-center min-h-[28px] overflow-hidden group">
                                            {/* Indentation */}
                                            {Array.from({ length: row.level }).map((_, i) => (
                                                <div key={i} className="w-3 mx-1 flex-shrink-0 flex items-center justify-center opacity-30">
                                                    <ChevronRight className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                                </div>
                                            ))}

                                            {/* Name / Action */}
                                            {row.gid ? (
                                                <div className="flex items-center flex-1 min-w-0 bg-white dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded px-2 py-1 transition-colors group/row">
                                                    <div
                                                        className="flex items-baseline flex-1 min-w-0 mr-2 cursor-pointer group-hover/row:text-sky-600 transition-colors"
                                                        onClick={() => handlePreviewRegion(row.gid, row.gadmName, row.level)}
                                                    >
                                                        {loadingHighlightGid === row.gid && <Loader2 className="w-3 h-3 animate-spin text-sky-500 mr-1.5 self-center shrink-0" />}
                                                        <span className="text-sm font-medium text-sky-900 dark:text-sky-100 group-hover/row:text-sky-600 group-hover/row:underline dark:group-hover/row:text-sky-300 truncate flex-shrink">
                                                            {row.gadmName}
                                                        </span>
                                                        <span className="ml-1.5 text-[10px] text-sky-500 dark:text-sky-400 font-normal opacity-70 flex-shrink-0">L{row.level}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleSelectRegion(row.gadmRow, row.level, e.ctrlKey || e.metaKey)}
                                                        className="ml-auto text-[10px] font-bold tracking-wide uppercase bg-sky-100 hover:bg-sky-200 dark:bg-sky-800 dark:hover:bg-sky-700 text-sky-700 dark:text-sky-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1 flex-shrink-0"
                                                        title="Add this region"
                                                    >
                                                        <Plus className="w-3 h-3" /> <T>Add</T>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center flex-1 min-w-0 px-2 py-1">
                                                    <span className="text-sm font-medium text-sky-900/40 dark:text-sky-100/30 italic truncate">
                                                        <T>No Level</T> {row.level} <T>data</T>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Selected Regions header and actions */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <T>Picked Regions</T> {selectedRegions.length > 0 && `(${selectedRegions.length})`}
                    </h4>
                    <div className="flex gap-2">
                        <button onClick={handleCopyToClipboard} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title="Copy configuration to clipboard">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handleExportJson} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title="Download configuration JSON">
                            <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title="Import configuration JSON">
                            <Upload className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleImportJson} />
                        <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <button onClick={handleClearAll} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400" title="Clear all regions">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {selectedRegions.length > 0 ? (
                    <div className="space-y-2 pb-2">
                        <div className="flex flex-col gap-2">
                            {selectedRegions.map((region) => {
                                const loading = loadingBoundaryIds.has(region.gid);
                                const realGadm = getOriginalLevel(region.gid);
                                const maxDisplay = MAX_DISPLAY_LEVEL[realGadm] ?? 5;
                                const isCapped = region.level > maxDisplay;
                                return (
                                    <div
                                        key={region.gid}
                                        className="flex flex-col bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button')) return;
                                            handleFlyToRegion(region.gid);
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5 justify-between">
                                            <div className="flex items-center gap-1.5 font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                                                {loading && <Loader2 className="w-3 h-3 animate-spin text-yellow-600" />}
                                                {!loading && <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>}
                                                <span className="truncate">{region.gadmName}</span>
                                                <span className="text-xs opacity-70">({region.gid})</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveRegion(region.gid); }}
                                                className="text-yellow-600 hover:text-red-500 flex-shrink-0 focus:outline-none ml-2 bg-yellow-100/50 dark:bg-yellow-800/30 p-1 rounded transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {!loading && (() => {
                                            const crumbs = region.parents;
                                            if (!crumbs || crumbs.length === 0) return null;
                                            return (
                                                <div className="flex items-center flex-wrap gap-0.5 mt-1 pl-3.5 text-[10px] text-yellow-700/70 dark:text-yellow-400/60">
                                                    {crumbs.map((c, i) => (
                                                        <React.Fragment key={c.gid}>
                                                            {i > 0 && <ChevronRight className="w-2.5 h-2.5 opacity-50" />}
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const geo = await fetchRegionBoundary(c.gid, c.name, c.level, false);
                                                                        if (geo?.features?.length) {
                                                                            const centroid = turf.centroid(geo.features[0]);
                                                                            const [lng, lat] = centroid.geometry.coordinates;
                                                                            await performInspection(lat, lng);
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Breadcrumb inspect failed', err);
                                                                    }
                                                                }}
                                                                className="hover:text-yellow-900 dark:hover:text-yellow-200 hover:underline underline-offset-2 transition-colors cursor-pointer"
                                                                title={`Inspect ${c.name}`}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                        {region.stats && !loading && (
                                            <div className="mt-1.5 text-xs text-yellow-700 dark:text-yellow-500 flex gap-4 opacity-90 border-t border-yellow-200/50 dark:border-yellow-800/50 pt-1.5 pl-3.5">
                                                <span><strong className="font-semibold"><T>Built:</T></strong> {region.stats.ghsBuiltWeight ? Math.round(region.stats.ghsBuiltWeight).toLocaleString() : 'N/A'}</span>
                                                <span><strong className="font-semibold"><T>Pop:</T></strong> {region.stats.ghsPopulation ? Math.round(region.stats.ghsPopulation).toLocaleString() : 'N/A'}</span>
                                            </div>
                                        )}
                                        {isCapped && !loading && (
                                            <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pl-3.5 opacity-80" title={`Target is L${region.level} but map shows max L${maxDisplay} for performance. Simulator uses full L${region.level} data.`}>
                                                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                <span><T>Map capped at</T> <strong>L{maxDisplay}</strong> — <T>simulator uses full</T> <strong>L{region.level}</strong></span>
                                            </div>
                                        )}
                                        <div className="mt-2 flex items-center justify-between border-t border-yellow-200/50 dark:border-yellow-800/50 pt-2 px-1">
                                            <span className="text-[10px] uppercase font-bold text-yellow-600/70 dark:text-yellow-500/70 tracking-wider"><T>Change Level</T></span>
                                            <div className="flex items-center bg-yellow-100/50 dark:bg-yellow-900/30 p-0.5 rounded border border-yellow-200 dark:border-yellow-700/50">
                                                {[0, 1, 2, 3, 4, 5].map((lvl) => {
                                                    const isSelected = lvl === region.level;
                                                    return (
                                                        <button
                                                            key={lvl}
                                                            onClick={(e) => { e.stopPropagation(); handleReResolveRegion(region, lvl); }}
                                                            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${isSelected
                                                                ? 'bg-yellow-400 text-yellow-900 shadow-sm'
                                                                : 'text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50'
                                                                }`}
                                                            title={`Change to Level ${lvl}`}
                                                        >
                                                            L{lvl}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Optimistic pending selection placeholders */}
                            {Array.from({ length: pendingSelectionCount }).map((_, i) => (
                                <div key={`pending-${i}`} className="flex flex-col bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-2 opacity-70">
                                    <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                                        <Loader2 className="w-3 h-3 animate-spin text-yellow-600" />
                                        <span>Resolving location...</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    pendingSelectionCount > 0 ? (
                        <div className="space-y-2 pb-2">
                            <div className="flex flex-col gap-2">
                                {Array.from({ length: pendingSelectionCount }).map((_, i) => (
                                    <div key={`pending-empty-${i}`} className="flex flex-col bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-2 opacity-70">
                                        <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                                            <Loader2 className="w-3 h-3 animate-spin text-yellow-600" />
                                            <span><T>Resolving location...</T></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        !inspectedPoint && (
                            <div className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-dashed border-gray-200 dark:border-gray-700">
                                <T>No regions picked yet.</T>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            {sidebarContent}

            {/* Portal Config & Search to Header */}
            {headerPortalTarget && createPortal(
                <GadmSearchControls
                    levelOption={levelOption} setLevelOption={setLevelOption}
                    resolutionOption={resolutionOption} setResolutionOption={setResolutionOption}
                    query={query} setQuery={setQuery}
                    suggestions={suggestions} loadingSuggestions={loadingSuggestions}
                    showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
                    onSelectSuggestion={(s, ctrlKey) => handleSelectRegion(s, undefined, ctrlKey)}
                    suggestionsWrapRef={headerSuggestionsWrapRef}
                    layout="horizontal"
                />,
                headerPortalTarget
            )}
        </>
    );
}
