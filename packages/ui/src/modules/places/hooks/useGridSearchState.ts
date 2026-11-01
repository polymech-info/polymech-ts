import { useCallback, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useSearchParams } from 'react-router-dom';
import { fetchGridSearchesLocal, fetchGridSearchLocal, fetchGridSearchPolygons, GridEnumerateResult } from '../client-gridsearch';

export function useGridSearchState() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

    // URL-aware state helpers
    const updateParams = useCallback((updates: Record<string, string | null>) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === '') next.delete(key);
                else next.set(key, value);
            });
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const updateParam = useCallback((key: string, value: string | null) => {
        updateParams({ [key]: value });
    }, [updateParams]);

    const showPolygons = searchParams.get('polygons') === '1';
    const [loading, setLoading] = useState(false);
    const [loadingPolygons, setLoadingPolygons] = useState(false);

    const [searches, setSearches] = useState<any[]>([]);
    const selectedSearch = searchParams.get('search');
    const [searchData, setSearchData] = useState<GridEnumerateResult | null>(null);

    // Simulator Datasets
    const [simulatorData, setSimulatorData] = useState<any>({ type: 'FeatureCollection', features: [] });
    const [simulatorPath, setSimulatorPath] = useState<any>({ type: 'FeatureCollection', features: [] });
    const [simulatorScanner, setSimulatorScanner] = useState<any>({ type: 'FeatureCollection', features: [] });
    
    // Derived Map Datasets
    const [bboxesData, setBboxesData] = useState<any>({ type: 'FeatureCollection', features: [] });
    const [polygonsData, setPolygonsData] = useState<any>({ type: 'FeatureCollection', features: [] });
    const [targetBounds, setTargetBounds] = useState<maplibregl.LngLatBoundsLike | undefined>(undefined);

    const setSelectedSearch = useCallback((val: string | null) => {
        updateParams({ search: val, polygons: null });
    }, [updateParams]);

    const getPersistentToggle = useCallback((key: string, urlValue: string | null, defaultValue: boolean): boolean => {
        if (typeof window === 'undefined') return defaultValue;
        if (urlValue !== null) {
            localStorage.setItem(`gridsearch_${key}`, urlValue);
            return urlValue === '1';
        }
        const stored = localStorage.getItem(`gridsearch_${key}`);
        if (stored !== null) return stored === '1';
        return defaultValue;
    }, []);

    const getPersistentString = useCallback((key: string, urlValue: string | null): string | null => {
        if (typeof window === 'undefined') return null;
        if (urlValue !== null) {
            localStorage.setItem(`gridsearch_${key}`, urlValue);
            return urlValue;
        }
        return localStorage.getItem(`gridsearch_${key}`);
    }, []);

    const includeStats = getPersistentToggle('stats', searchParams.get('stats'), true);
    const showDensity = getPersistentToggle('density', searchParams.get('density'), false);
    const showCenters = getPersistentToggle('centers', searchParams.get('centers'), true);
    const gadmPickerActive = getPersistentToggle('picker', searchParams.get('picker'), false);
    const urlStyle = getPersistentString('style', searchParams.get('style'));
    const posterMode = getPersistentToggle('poster', searchParams.get('poster'), false);
    const posterTheme = getPersistentString('theme', searchParams.get('theme')) || 'terracotta';

    const setPersistentParam = useCallback((key: string, val: string | null) => {
        if (typeof window !== 'undefined') {
            if (val === null) localStorage.removeItem(`gridsearch_${key}`);
            else localStorage.setItem(`gridsearch_${key}`, val);
        }
        updateParam(key, val);
    }, [updateParam]);

    const setIncludeStats = useCallback((val: boolean) => setPersistentParam('stats', val ? '1' : '0'), [setPersistentParam]);
    const setShowDensity = useCallback((val: boolean) => setPersistentParam('density', val ? '1' : '0'), [setPersistentParam]);
    const setShowCenters = useCallback((val: boolean) => setPersistentParam('centers', val ? '1' : '0'), [setPersistentParam]);
    const setGadmPickerActive = useCallback((val: boolean) => setPersistentParam('picker', val ? '1' : '0'), [setPersistentParam]);
    const setUrlStyle = useCallback((style: string) => setPersistentParam('style', style), [setPersistentParam]);
    const setPosterMode = useCallback((val: boolean) => setPersistentParam('poster', val ? '1' : '0'), [setPersistentParam]);
    const setPosterTheme = useCallback((theme: string) => setPersistentParam('theme', theme), [setPersistentParam]);

    const [pickerRegions, setPickerRegions] = useState<any[]>([]);
    const [pickerPolygons, setPickerPolygons] = useState<any[]>([]);

    useEffect(() => {
        fetchGridSearchesLocal()
            .then((list) => {
                const parsed = list.map((id: string) => {
                    let regionName = id;
                    let level = 'unknown';
                    let query = '';

                    const cleanId = id.replace(/^grid-state-/, '');
                    const levels = ['states', 'provinces', 'districts', 'cities', 'towns', 'villages'];
                    
                    if (cleanId.startsWith('search-') || cleanId.startsWith('email-')) {
                        const parts = cleanId.split('-');
                        const levelIdx = parts.findIndex(p => levels.includes(p));
                        if (levelIdx !== -1) {
                            level = parts[levelIdx];
                            regionName = parts.slice(1, levelIdx).join('-');
                            query = parts.slice(levelIdx + 1).join('-');
                        } else {
                            regionName = parts.slice(1).join('-');
                        }
                        
                        regionName = regionName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                        if (query) {
                            query = query.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                        }
                    }

                    return { id, regionName, level, query };
                });
                setSearches(parsed);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedSearch) return;
        setLoading(true);
        fetchGridSearchLocal(selectedSearch).then(data => {
            setSearchData(data);
            setLoading(false);

            const features = data.areas.map(area => {
                if (!area.bbox) return null;
                const [minX, minY, maxX, maxY] = area.bbox;
                return {
                    type: 'Feature',
                    properties: {
                        name: area.name, gid: area.gid, level: area.level,
                        population: area.stats?.totalPopulation ?? 0,
                        placeCount: area.stats?.placeCount ?? 0,
                        avgElevation: area.stats?.avgElevation ?? 0,
                        areaSqKm: area.areaSqKm ?? 0,
                    },
                    geometry: { type: 'Polygon', coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] }
                };
            }).filter(Boolean);

            setBboxesData({ type: 'FeatureCollection', features });
            setPolygonsData({ type: 'FeatureCollection', features: [] });

            if (data.region.bbox) {
                const [minX, minY, maxX, maxY] = data.region.bbox;
                setTargetBounds([[minX, minY], [maxX, maxY]]);
            } else if (features.length > 0) {
                const bounds = new maplibregl.LngLatBounds();
                features.forEach(f => {
                    // @ts-ignore
                    bounds.extend(f?.geometry.coordinates[0][0]);
                    // @ts-ignore
                    bounds.extend(f?.geometry.coordinates[0][2]);
                });
                setTargetBounds(bounds as any);
            }
        }).catch(err => { console.error(err); setLoading(false); });
    }, [selectedSearch]);

    const handleFetchPolygons = useCallback(async () => {
        if (!searchData?.areas) return;
        setLoadingPolygons(true);
        try {
            const fc: any = await fetchGridSearchPolygons({ regionGid: searchData.region?.gid, level: searchData.areas[0]?.level });
            setPolygonsData(fc);
            setBboxesData({ type: 'FeatureCollection', features: [] });
            updateParam('polygons', '1');
        } catch (e) { console.error(e); }
        setLoadingPolygons(false);
    }, [searchData, updateParam]);

    useEffect(() => {
        if (showPolygons && searchData && !loadingPolygons && polygonsData.features.length === 0 && bboxesData.features.length > 0) {
            handleFetchPolygons();
        }
    }, [showPolygons, searchData, loadingPolygons, handleFetchPolygons, polygonsData.features.length, bboxesData.features.length]);

    const handleSearchGenerated = useCallback((searchName: string, genRegion: string, genLevel: string) => {
        setSearches(prev => {
            if (prev.find(s => s.id === searchName)) return prev;
            return [...prev, { id: searchName, regionName: genRegion, level: genLevel, query: '', generatedAt: new Date().toISOString() }];
        });
        setSelectedSearch(searchName);
    }, [setSelectedSearch]);

    return {
        mapInstance, setMapInstance,
        bboxesData, polygonsData, targetBounds,
        urlStyle, setUrlStyle,
        posterMode, setPosterMode,
        posterTheme, setPosterTheme,
        showDensity, setShowDensity,
        showCenters, setShowCenters,
        gadmPickerActive, setGadmPickerActive,
        includeStats, setIncludeStats,
        searches, selectedSearch, setSelectedSearch,
        searchData, loading, 
        loadingPolygons, handleFetchPolygons,
        pickerRegions, setPickerRegions,
        pickerPolygons, setPickerPolygons,
        simulatorData, setSimulatorData,
        simulatorPath, setSimulatorPath,
        simulatorScanner, setSimulatorScanner,
        handleSearchGenerated
    };
}
