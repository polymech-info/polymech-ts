import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GripVertical, Loader2, X } from 'lucide-react';
import { RulerButton } from './components/RulerButton';
import { type PlaceFull } from '@polymech/shared';
import { fetchRegionBoundary } from './client-gridsearch';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/components/ThemeProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoPanel } from './InfoPanel';
import { GadmPicker } from './gadm-picker';
import { GridSearchSimulator } from './gridsearch/simulator/GridSearchSimulator';
import { Sparkles } from 'lucide-react';
import { useMapControls } from './hooks/useMapControls';
import { MapFooter } from './components/MapFooter';
import { MAP_STYLES, type MapStyleKey } from './components/map-styles';
import { SimulatorLayers } from './components/map-layers/SimulatorLayers';
import { RegionLayers } from './components/map-layers/RegionLayers';
import { MapLayerToggles } from './components/MapLayerToggles';
import { MapOverlayToolbars } from './components/MapOverlayToolbars';
import { LiveSearchLayers } from './components/map-layers/LiveSearchLayers';
import { MapPosterOverlay } from './components/MapPosterOverlay';
import { LocationLayers } from './components/map-layers/LocationLayers';
import { T, translate } from '../../i18n';

const safeSetStyle = (m: maplibregl.Map, style: any) => {
    const terrain = m.getTerrain();
    if (terrain) {
        m.setTerrain(null);
    }
    m.setStyle(style);
    if (terrain) {
        m.once('style.load', () => {
            setTimeout(() => {
                try { m.setTerrain(terrain); } catch (e) { }
            }, 50);
        });
    }
};



export type MapPreset = 'SearchView' | 'Minimal';

export interface MapFeatures {
    enableSidebarTools: boolean;
    enableRuler: boolean;
    enableEnrichment: boolean;
    enableLayerToggles: boolean;
    enableInfoPanel: boolean;
    enableLocationDetails: boolean;
    enableAutoRegions: boolean;
    enableSimulator: boolean;
    showSidebar?: boolean;
    canDebug?: boolean;
    canPlaybackSpeed?: boolean;
    showRegions?: boolean;
    showSettings?: boolean;
    showLocations?: boolean;
}

export const MAP_PRESETS: Record<MapPreset, MapFeatures> = {
    SearchView: {
        enableSidebarTools: true,
        enableRuler: true,
        enableEnrichment: true,
        enableLayerToggles: true,
        enableInfoPanel: true,
        enableLocationDetails: true,
        enableAutoRegions: true,
        enableSimulator: true,
        canDebug: true,
        canPlaybackSpeed: true,
        showRegions: true,
        showSettings: true,
        showLocations: true,
    },
    Minimal: {
        enableSidebarTools: true, // hasTools (minimal = true)
        enableRuler: true,
        enableEnrichment: true,
        enableLayerToggles: true,
        enableInfoPanel: false,
        enableLocationDetails: true,
        enableAutoRegions: true,
        enableSimulator: true,
        canDebug: false,
        canPlaybackSpeed: false,
        showRegions: true,
        showSettings: true,
        showLocations: true,
    }
};

interface PlacesMapViewProps {
    preset?: MapPreset;
    customFeatures?: Partial<MapFeatures>;
    places: PlaceFull[];
    onMapCenterUpdate: (loc: string, zoom?: number) => void;
    initialCenter?: { lat: number, lng: number };
    initialZoom?: number;
    initialPitch?: number;
    initialBearing?: number;
    onMapMove?: (state: { lat: number, lng: number, zoom: number, pitch?: number, bearing?: number }) => void;
    enrich: (ids: string[], enrichers: string[]) => Promise<void>;
    isEnriching: boolean;
    enrichmentProgress?: { current: number; total: number; message: string } | null;
    initialGadmRegions?: Array<{ gid: string; name: string; level: number }>;
    initialSimulatorSettings?: Record<string, any>;
    simulatorSettings?: any;
    onSimulatorSettingsChange?: (settings: any) => void;
    liveAreas?: any[];
    liveRadii?: any[];
    liveNodes?: any[];
    liveScanner?: any;
    onRegionsChange?: (regions: any[]) => void;
    isPosterMode?: boolean;
    onClosePosterMode?: () => void;
    posterTheme?: string;
    setPosterTheme?: (theme: string) => void;
    selectedPlaceId?: string | null;
    onSelectPlace?: (id: string | null, behavior?: 'select' | 'open' | 'toggle') => void;
    /** Optional callback fired once after the internal map instance is created. */
    onMapReady?: (map: maplibregl.Map) => void;
}

export const PlacesMapView: React.FC<PlacesMapViewProps> = ({ places, onMapCenterUpdate, initialCenter, initialZoom, initialPitch, initialBearing, onMapMove, enrich, isEnriching, enrichmentProgress, initialGadmRegions, initialSimulatorSettings, simulatorSettings, onSimulatorSettingsChange, liveAreas = [], liveRadii = [], liveNodes = [], liveScanner, preset = 'SearchView', customFeatures, onRegionsChange, isPosterMode, onClosePosterMode, posterTheme: controlledPosterTheme, setPosterTheme: setControlledPosterTheme, selectedPlaceId, onSelectPlace, onMapReady }) => {
    const features: MapFeatures = useMemo(() => {
        if (isPosterMode) {
            return { ...MAP_PRESETS['Minimal'], enableSidebarTools: false, ...customFeatures };
        }
        return {
            ...MAP_PRESETS[preset],
            ...customFeatures
        };
    }, [preset, customFeatures, isPosterMode]);

    const mapContainer = useRef<HTMLDivElement>(null);
    const mapWrapper = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const { theme } = useTheme();
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>('light');

    useEffect(() => {
        const updateTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            setMapStyleKey(isDark ? 'dark' : 'light');
        };
        updateTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.addEventListener("change", updateTheme);
            return () => mediaQuery.removeEventListener("change", updateTheme);
        }
    }, [theme]);

    // Selection and Sidebar State
    const [selectedLocation, setSelectedLocation] = useState<PlaceFull | null>(null);

    const handleSelectLocation = useCallback((loc: PlaceFull | null, behavior: 'select' | 'open' | 'toggle' = 'open') => {
        setSelectedLocation(loc);
        onSelectPlace?.(loc?.place_id || null, behavior);
    }, [onSelectPlace]);

    // Add logic to label locations A, B, C...
    const validLocations = useMemo(() => {
        return places
            .map((c, i) => {
                const lat = c.gps_coordinates?.latitude ?? c.raw_data?.geo?.latitude ?? (c as any).lat;
                const lon = c.gps_coordinates?.longitude ?? c.raw_data?.geo?.longitude ?? (c as any).lon;

                if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
                    return {
                        ...c,
                        lat: Number(lat),
                        lon: Number(lon),
                        label: String.fromCharCode(65 + (i % 26)) + (Math.floor(i / 26) > 0 ? Math.floor(i / 26) : '')
                    };
                }
                return null;
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);
    }, [places]);

    const locationIds = useMemo(() => {
        return validLocations.map(l => l.place_id).sort().join(',');
    }, [validLocations]);

    // Sync local selection with prop
    useEffect(() => {
        if (selectedPlaceId) {
            const loc = validLocations.find(l => l.place_id === selectedPlaceId);
            if (loc && loc.place_id !== selectedLocation?.place_id) {
                setSelectedLocation(loc);
            }
        } else {
            setSelectedLocation(null);
        }
    }, [selectedPlaceId, validLocations]);
    const [gadmPickerActive, setGadmPickerActive] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(features.showSidebar ?? false);
    const lastInitialGidsRef = useRef<string | null>(null);

    // Grid Search Simulator State
    const [simulatorActive, setSimulatorActive] = useState(false);
    const [pickerRegions, setPickerRegions] = useState<any[]>(() => {
        console.log('initialGadmRegions', initialGadmRegions);

        if (!features.enableAutoRegions || !initialGadmRegions || initialGadmRegions.length === 0) return [];
        return initialGadmRegions.map((r: any) => ({
            gid: r.gid,
            gadmName: r.name,
            level: r.level,
            raw: r.raw || { gid: r.gid, gadmName: r.name, level: r.level }
        }));
    });
    /** When false (`regions=0`), we keep guided-area metadata for Expand etc. but do not fetch boundaries. */
    const showRegionBoundaries = features.showRegions !== false;
    const [pickerPolygons, setPickerPolygons] = useState<any[]>([]);
    const [simulatorData, setSimulatorData] = useState<any>(null);
    const [simulatorPath, setSimulatorPath] = useState<any>(null);
    const [simulatorScanner, setSimulatorScanner] = useState<any>(null);

    // Layer Toggles
    const [showDensity, setShowDensity] = useState(false);
    const [showCenters, setShowCenters] = useState(false);

    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(384);
    const [isLeftResizing, setIsLeftResizing] = useState(false);

    const [localPosterTheme, setLocalPosterTheme] = useState('terracotta');
    const posterTheme = controlledPosterTheme ?? localPosterTheme;
    const setPosterTheme = setControlledPosterTheme ?? setLocalPosterTheme;

    const [infoPanelOpen, setInfoPanelOpen] = useState(false);

    const handleCloseLocationDetail = useCallback(() => handleSelectLocation(null), [handleSelectLocation]);
    const handleCloseInfoPanel = useCallback(() => setInfoPanelOpen(false), []);

    const { mapInternals, currentCenterLabel, isLocating, setupMapListeners, handleLocate, cleanupLocateMarker } = useMapControls(onMapCenterUpdate);

    // Auto-load GADM boundaries when guided areas exist and region layers are enabled (skip network when `regions=0`).
    useEffect(() => {
        if (!showRegionBoundaries) {
            setPickerPolygons([]);
            lastInitialGidsRef.current = null;
            return;
        }
        if (!features.enableAutoRegions || !initialGadmRegions || initialGadmRegions.length === 0) return;

        const gidsKey = initialGadmRegions.map(r => r.gid).sort().join(',');
        if (lastInitialGidsRef.current === gidsKey) return;
        lastInitialGidsRef.current = gidsKey;

        let cancelled = false;

        (async () => {
            const regions: any[] = [];
            const polygons: any[] = [];
            for (const region of initialGadmRegions) {
                if (cancelled) return;
                regions.push({
                    gid: region.gid,
                    gadmName: region.name,
                    level: region.level,
                    raw: region
                });
                try {
                    const geojson = await fetchRegionBoundary(region.gid, region.name, region.level, true);
                    if (geojson) polygons.push(geojson);
                } catch (err) {
                    console.error('Failed to fetch boundary for', region.gid, err);
                }
            }
            if (cancelled) return;
            setPickerRegions(regions);
            setPickerPolygons(polygons);
            hasFittedBoundsRef.current = false;
        })();

        return () => {
            cancelled = true;
        };
    }, [showRegionBoundaries, features.enableAutoRegions, initialGadmRegions]);

    const onRegionsChangeRef = useRef(onRegionsChange);
    useEffect(() => {
        onRegionsChangeRef.current = onRegionsChange;
    }, [onRegionsChange]);

    // Bubble picker regions up to parent
    useEffect(() => {
        onRegionsChangeRef.current?.(pickerRegions);
    }, [pickerRegions]);

    // Fit map to loaded region boundaries (waits for map readiness)
    const hasFittedBoundsRef = useRef(false);
    const lastFittedPolygonsRef = useRef<any[] | null>(null);

    useEffect(() => {
        if (pickerPolygons.length === 0) return;

        // Skip if we already successfully fitted for these exact polygons
        if (hasFittedBoundsRef.current && lastFittedPolygonsRef.current === pickerPolygons) return;

        const isInitialLoad = lastFittedPolygonsRef.current === null;

        // Only fit bounds on the first-time data detection.
        // We skip camera movement for subsequent live updates (discovered areas).
        if (isPosterMode || (initialCenter && isInitialLoad) || !isInitialLoad) {
            hasFittedBoundsRef.current = true;
            lastFittedPolygonsRef.current = pickerPolygons;
            return;
        }

        const fitToPolygons = () => {
            if (!map.current) return false;
            const bounds = new maplibregl.LngLatBounds();
            let hasPoints = false;
            pickerPolygons.forEach(fc => {
                fc?.features?.forEach((f: any) => {
                    const coords = f.geometry?.coordinates;
                    if (!coords) return;
                    if (f.geometry.type === 'MultiPolygon') {
                        coords.forEach((poly: any) => poly[0]?.forEach((c: any) => { bounds.extend(c); hasPoints = true; }));
                    } else if (f.geometry.type === 'Polygon') {
                        coords[0]?.forEach((c: any) => { bounds.extend(c); hasPoints = true; });
                    }
                });
            });
            if (hasPoints && !bounds.isEmpty()) {
                map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
                hasFittedBoundsRef.current = true;
                lastFittedPolygonsRef.current = pickerPolygons;
                return true;
            }
            return false;
        };

        // Reset state for new polygons and try fitting
        hasFittedBoundsRef.current = false;
        if (fitToPolygons()) return;

        const interval = setInterval(() => {
            if (fitToPolygons()) clearInterval(interval);
        }, 200);
        const timeout = setTimeout(() => clearInterval(interval), 5000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [pickerPolygons, initialCenter, isPosterMode]);

    // Enrichment Hook - NOW PASSED VIA PROPS
    // const { enrich, isEnriching, progress: enrichmentProgress } = useLocationEnrichment();


    // Memoize the polygons FeatureCollection to avoid creating a new object reference on every render.
    // Without this, RegionLayers re-pushes GeoJSON data to the map source on every single render.
    const polygonsFeatureCollection = useMemo(() => {
        if (pickerPolygons.length === 0) return undefined;
        return { type: 'FeatureCollection' as const, features: pickerPolygons.flatMap(fc => fc?.features || []) };
    }, [pickerPolygons]);

    const markersRef = useRef<maplibregl.Marker[]>([]); // To be removed or kept as empty for ref safety if used elsewhere

    const onMapMoveRef = useRef(onMapMove);
    useEffect(() => {
        onMapMoveRef.current = onMapMove;
    }, [onMapMove]);

    // Initialize Map
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        console.log('initialCenter', initialCenter);

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[mapStyleKey],
            center: [initialCenter?.lng ?? 10.45, initialCenter?.lat ?? 51.16], // Default center (Germany roughly) or prop
            zoom: initialZoom ?? 5,
            pitch: initialPitch ?? 0,
            bearing: initialBearing ?? 0,
            maxPitch: 85,
        });

        // Add controls
        map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }), 'top-right');
        // If container is null, it falls back to map canvas perfectly. 
        map.current.addControl(new maplibregl.FullscreenControl({ container: mapWrapper.current || undefined }), 'top-right');

        // Only add TerrainControl when terrain source is available (3D style).
        // The old code injected the terrain source into every style on style.load,
        // causing expensive uncacheable DEM tile fetches even on 2D styles.
        let terrainCtrlAdded = false;
        map.current.on('style.load', () => {
            const m = map.current;
            if (!m) return;
            if (m.getSource('terrainSource') && !terrainCtrlAdded) {
                terrainCtrlAdded = true;
                try {
                    m.addControl(new maplibregl.TerrainControl({
                        source: 'terrainSource',
                        exaggeration: 1
                    }), 'top-right');
                } catch (e) { /* already added */ }
            }
        });

        const cleanupListeners = setupMapListeners(map.current, onMapMoveRef.current);
        onMapReady?.(map.current);

        return () => {
            cleanupListeners();
            cleanupLocateMarker();
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);
    const lastFittedLocationIdsRef = useRef<string | null>(null);

    // Handle Data Updates - No longer creates manual markers. LocationLayers handles this via WebGL.
    useEffect(() => {
        if (!map.current) return;

        // Fit bounds only when the core locations set changes
        if (validLocations.length > 0 && lastFittedLocationIdsRef.current !== locationIds) {
            const isInitialLoad = lastFittedLocationIdsRef.current === null;

            // Fit bounds on first-time data load only (skip poster mode and subsequent live updates).
            // initialCenter only affects the map's starting position (in the init effect),
            // it should not prevent fitting to actual data once it arrives.
            if (!isPosterMode && isInitialLoad) {
                const bounds = new maplibregl.LngLatBounds();
                validLocations.forEach(loc => bounds.extend([loc.lon, loc.lat]));
                map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            }
            lastFittedLocationIdsRef.current = locationIds;
        }
    }, [locationIds, validLocations, isPosterMode]);


    // Sync Theme/Style
    useEffect(() => {
        if (!map.current) return;
        let targetStyleKey = mapStyleKey;
        if (isPosterMode && mapStyleKey === 'light') {
            targetStyleKey = 'vector_light' as MapStyleKey;
        }
        safeSetStyle(map.current, MAP_STYLES[targetStyleKey]);
        // Note: Re-adding sources/layers after style switch would be needed here for production resilience,
        // but for now we assume style switching might reset them. 
        // A robust solution would re-initialize layers on 'style.load'.
    }, [mapStyleKey, isPosterMode]);



    // Handle Layout Resize (debounced to avoid layout thrashing)
    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = setTimeout(() => {
            if (map.current) {
                map.current.resize();
            }
        }, 100);
        return () => { if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current); };
    }, [selectedLocation, sidebarWidth, leftSidebarWidth, gadmPickerActive, simulatorActive]);

    // Resizing Handlers — use refs so global listeners are only attached during active drag
    const isResizingRef = useRef(false);
    const isLeftResizingRef = useRef(false);

    const startResizing = useCallback(() => {
        isResizingRef.current = true;
        setIsResizing(true);
        const onMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth);
        };
        const onUp = () => {
            isResizingRef.current = false;
            setIsResizing(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    const startLeftResizing = useCallback(() => {
        isLeftResizingRef.current = true;
        setIsLeftResizing(true);
        const onMove = (e: MouseEvent) => {
            if (!isLeftResizingRef.current) return;
            setLeftSidebarWidth(Math.max(100, e.clientX));
        };
        const onUp = () => {
            isLeftResizingRef.current = false;
            setIsLeftResizing(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    // Keyboard Navigation for Detail View
    useEffect(() => {
        if (!features.enableLocationDetails || !selectedLocation) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Only intercept keys we care about to prevent interfering with other global shortcuts
            if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Escape'].includes(e.key)) return;

            let handled = false;
            let nextLoc: typeof validLocations[0] | null = null;
            const current = selectedLocation;

            if (e.key === 'Escape') {
                setSelectedLocation(null);
                handled = true;
            } else {
                handled = true;

                // Spatial Navigation logic
                const currentLoc = validLocations.find(l => l.place_id === current.place_id);
                if (currentLoc) {
                    const candidates = validLocations.filter(loc => loc.place_id !== current.place_id);
                    let bestDistance = Infinity;

                    candidates.forEach(loc => {
                        const dx = loc.lon - currentLoc.lon;
                        const dy = loc.lat - currentLoc.lat;

                        // Check if it's in the correct direction hemisphere
                        let isValidDirection = false;
                        if (e.key === 'ArrowRight' && dx > 0) isValidDirection = true;
                        if (e.key === 'ArrowLeft' && dx < 0) isValidDirection = true;
                        if (e.key === 'ArrowUp' && dy > 0) isValidDirection = true;
                        if (e.key === 'ArrowDown' && dy < 0) isValidDirection = true;

                        if (isValidDirection) {
                            // We add a slight penalty to perpendicular movement to encourage strict directional lines,
                            // but simple Euclidean distance generally works best for human expectation on maps.
                            const distance = Math.hypot(dx, dy);
                            if (distance < bestDistance) {
                                bestDistance = distance;
                                nextLoc = loc;
                            }
                        }
                    });

                    // Rollover if we've hit the extent
                    if (!nextLoc && candidates.length > 0) {
                        let wrapTarget = candidates[0];
                        candidates.forEach(loc => {
                            if (e.key === 'ArrowRight' && loc.lon < wrapTarget.lon) wrapTarget = loc;
                            if (e.key === 'ArrowLeft' && loc.lon > wrapTarget.lon) wrapTarget = loc;
                            if (e.key === 'ArrowUp' && loc.lat < wrapTarget.lat) wrapTarget = loc;
                            if (e.key === 'ArrowDown' && loc.lat > wrapTarget.lat) wrapTarget = loc;
                        });
                        nextLoc = wrapTarget;
                    }
                }
            }

            if (handled) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();

                if (e.key !== 'Escape' && nextLoc) {
                    handleSelectLocation(nextLoc, 'select');
                    if (map.current) {
                        map.current.flyTo({
                            center: [nextLoc.lon, nextLoc.lat],
                            zoom: map.current.getZoom(),
                            duration: 500
                        });
                    }
                }
            }
        };

        // Use capture phase to intercept before maplibregl gets it
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [selectedLocation, validLocations, sidebarWidth, features.enableLocationDetails]);

    return (
        <div className="flex-1 w-full h-full flex flex-col min-h-0">
            <style>{`
                .map-popup-override { z-index: 20 !important; }
                .map-popup-override .maplibregl-popup-content { padding: 0; border-radius: 0.5rem; }
                
                /* Force crosshair when GADM picker is active to prevent layer hover overrides */
                .gadm-picker-active .maplibregl-canvas {
                    cursor: crosshair !important;
                }
            `}</style>

            {/* Split View Container */}
            <div ref={mapWrapper} className="flex-1 w-full h-full min-h-[400px] flex flex-col md:flex-row [&:fullscreen]:h-screen overflow-hidden relative bg-white dark:bg-gray-900">

                {/* Left Tools Sidebar */}
                {(features.enableSidebarTools || sidebarOpen) && (
                    <>
                        <div
                            className={`flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 overflow-hidden shadow-xl ${(gadmPickerActive || simulatorActive || sidebarOpen) ? 'flex' : 'hidden'}`}
                            style={{ width: leftSidebarWidth }}
                        >
                            <Tabs
                                value={simulatorActive ? 'simulator' : 'gadm'}
                                onValueChange={(val) => {
                                    setGadmPickerActive(val === 'gadm');
                                    setSimulatorActive(val === 'simulator');
                                }}
                                className="flex flex-col h-full w-full"
                            >
                                <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="gadm" className="text-xs"><T>Area Selector</T></TabsTrigger>
                                        <TabsTrigger value="simulator" className="text-xs"><T>Grid Search</T></TabsTrigger>
                                    </TabsList>
                                    <button
                                        onClick={() => { setGadmPickerActive(false); setSimulatorActive(false); setSidebarOpen(false); }}
                                        className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                        title={translate('Close Tools')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <TabsContent value="gadm" forceMount className="data-[state=inactive]:hidden flex-1 overflow-y-auto m-0 p-4 border-none outline-none custom-scrollbar">
                                    <GadmPicker
                                        map={map.current}
                                        active={gadmPickerActive || sidebarOpen || false}
                                        onClose={() => setGadmPickerActive(false)}
                                        onSelectionChange={(r, p) => {
                                            setPickerRegions(r);
                                            setPickerPolygons(p);
                                            onRegionsChange?.(r);
                                        }}
                                        initialRegions={initialGadmRegions}
                                    />
                                </TabsContent>

                                <TabsContent value="simulator" forceMount className="data-[state=inactive]:hidden flex-1 overflow-y-auto m-0 p-4 border-none outline-none custom-scrollbar">
                                    {(pickerRegions && pickerRegions.length > 0) ? (
                                        <GridSearchSimulator
                                            pickerRegions={pickerRegions}
                                            pickerPolygons={pickerPolygons}
                                            setSimulatorData={setSimulatorData}
                                            setSimulatorPath={setSimulatorPath}
                                            setSimulatorScanner={setSimulatorScanner}
                                            onFilterCell={() => true}
                                            initialSettings={initialSimulatorSettings}
                                            simulatorSettings={simulatorSettings}
                                            onSimulatorSettingsChange={onSimulatorSettingsChange}
                                            canDebug={features.canDebug}
                                            canPlaybackSpeed={features.canPlaybackSpeed}
                                        />
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500 text-center border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                            <T>Please select a region using the Area Selector first to define the search bounds.</T>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                        {/* Drag Handle for Left Sidebar */}
                        <div
                            className={`w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-500 cursor-col-resize items-center justify-center z-30 transition-colors shrink-0 ${(gadmPickerActive || simulatorActive || sidebarOpen) ? 'flex' : 'hidden'}`}
                            onMouseDown={startLeftResizing}
                        >
                            <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>
                    </>
                )}

                {/* Map Panel & Center Layout */}
                {/* Needed for widget mode: relative flex container with min-h-0 to ensure layout stability */}
                <div className="relative flex flex-col flex-1 min-h-0 transition-all duration-75 bg-white dark:bg-gray-900 overflow-hidden">
                    {/* Header: Search Region & Tools Overlay */}
                    {!isPosterMode && (
                        <MapOverlayToolbars
                            features={features}
                            sidebarOpen={sidebarOpen}
                            gadmPickerActive={gadmPickerActive}
                            simulatorActive={simulatorActive}
                            setSidebarOpen={setSidebarOpen}
                            setGadmPickerActive={setGadmPickerActive}
                            setSimulatorActive={setSimulatorActive}
                            infoPanelOpen={infoPanelOpen}
                            setInfoPanelOpen={setInfoPanelOpen}
                        />
                    )}

                    {/* Map Viewport */}
                    <div className={`relative flex-1 min-h-0 w-full overflow-hidden ${gadmPickerActive ? 'gadm-picker-active' : ''}`}>
                        <div
                            ref={mapContainer}
                            className="w-full h-full relative"
                        />

                        {map.current && (
                            <>
                                {features.showSettings !== false && (
                                    <SimulatorLayers
                                        map={map.current}
                                        isDarkStyle={mapStyleKey === 'dark'}
                                        simulatorData={liveAreas.length > 0 ? null : simulatorData}
                                        simulatorPath={simulatorPath}
                                        simulatorScanner={liveScanner || simulatorScanner}
                                    />
                                )}
                                {features.showRegions !== false && (
                                    <RegionLayers
                                        map={map.current}
                                        isDarkStyle={mapStyleKey === 'dark'}
                                        pickerPolygons={pickerPolygons}
                                        polygonsFeatureCollection={polygonsFeatureCollection}
                                        showDensity={showDensity}
                                        showCenters={showCenters}
                                    />
                                )}
                                <LiveSearchLayers
                                    map={map.current}
                                    isDarkStyle={mapStyleKey === 'dark'}
                                    liveAreas={liveAreas}
                                    liveRadii={liveRadii}
                                    liveNodes={liveNodes}
                                />
                                {isPosterMode && (
                                    <MapPosterOverlay
                                        map={map.current}
                                        pickerRegions={pickerRegions}
                                        pickerPolygons={pickerPolygons}
                                        posterTheme={posterTheme}
                                        setPosterTheme={setPosterTheme}
                                        onClose={onClosePosterMode || (() => { })}
                                    />
                                )}
                                {features.showLocations !== false && (
                                    <LocationLayers
                                        map={map.current}
                                        competitors={validLocations}
                                        isDarkStyle={mapStyleKey === 'dark'}
                                        onSelect={(loc) => {
                                            handleSelectLocation(loc);
                                            setInfoPanelOpen(false);
                                        }}
                                        selectedId={selectedPlaceId}
                                    />
                                )}
                            </>
                        )}

                        {/* Hidden simulator for portal-based play controls in Minimal mode */}
                        {features.enableSimulator && !features.enableSidebarTools && !sidebarOpen && pickerRegions.length > 0 && (
                            <div className="sr-only">
                                <GridSearchSimulator
                                    pickerRegions={pickerRegions}
                                    pickerPolygons={pickerPolygons}
                                    setSimulatorData={setSimulatorData}
                                    setSimulatorPath={setSimulatorPath}
                                    setSimulatorScanner={setSimulatorScanner}
                                    onFilterCell={() => true}
                                    initialSettings={{ gridMode: 'centers', cellSize: 50 }}
                                    simulatorSettings={simulatorSettings}
                                    onSimulatorSettingsChange={onSimulatorSettingsChange}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer: Status Info & Toggles */}
                    {/* Needed for widget mode: mt-auto wrapper to force footer to the bottom of the flex stack */}
                    <div className="mt-auto">
                        <MapFooter
                            map={map.current}
                            currentCenterLabel={currentCenterLabel}
                            mapInternals={mapInternals}
                            isLocating={isLocating}
                            onLocate={() => handleLocate(map.current)}
                            onZoomToFit={() => {
                                if (!map.current) return;
                                const bounds = new maplibregl.LngLatBounds();
                                let hasPoints = false;

                                if (validLocations.length > 0) {
                                    validLocations.forEach(loc => bounds.extend([loc.lon, loc.lat]));
                                    hasPoints = true;
                                }

                                if (pickerPolygons.length > 0) {
                                    pickerPolygons.forEach(fc => {
                                        fc?.features?.forEach((f: any) => {
                                            const coords = f.geometry?.coordinates;
                                            if (!coords) return;
                                            if (f.geometry.type === 'MultiPolygon') {
                                                coords.forEach((poly: any) => poly[0]?.forEach((c: any) => { bounds.extend(c); hasPoints = true; }));
                                            } else if (f.geometry.type === 'Polygon') {
                                                coords[0]?.forEach((c: any) => { bounds.extend(c); hasPoints = true; });
                                            }
                                        });
                                    });
                                }

                                if (hasPoints && !bounds.isEmpty()) {
                                    map.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
                                }
                            }}
                            activeStyleKey={mapStyleKey}
                            onStyleChange={setMapStyleKey}
                        >
                            {features.enableLayerToggles && (
                                <MapLayerToggles
                                    showDensity={showDensity}
                                    onToggleDensity={setShowDensity}
                                    showCenters={showCenters}
                                    onToggleCenters={setShowCenters}
                                />
                            )}
                            {features.enableRuler && <RulerButton map={map.current} />}
                            {features.enableEnrichment && (
                                <button
                                    onClick={() => enrich(locationIds.split(','), ['meta'])}
                                    disabled={isEnriching || validLocations.length === 0}
                                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isEnriching ? 'text-indigo-600 animate-pulse' : 'text-gray-500'}`}
                                    title={translate("Enrich Visible Locations")}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {features.enableEnrichment && enrichmentProgress && (
                                <div className="absolute bottom-10 right-4 bg-white dark:bg-gray-800 p-2 rounded shadow text-xs border border-gray-200 dark:border-gray-700 flex items-center gap-2 z-50">
                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                                    <span>{enrichmentProgress.message} ({enrichmentProgress.current}/{enrichmentProgress.total})</span>
                                </div>
                            )}
                        </MapFooter>
                    </div>
                </div>

                {/* Info Panel (kept as sidebar-capable for now if it's separate from LocationDetail) */}
                {features.enableInfoPanel && infoPanelOpen && (
                    <>
                        {/* Drag Handle */}
                        <div
                            className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center z-30 transition-colors"
                            onMouseDown={startResizing}
                        >
                            <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>

                        {/* Property Pane */}
                        <div className="hidden lg:block h-full bg-white dark:bg-gray-800 z-20 overflow-hidden relative" style={{ width: sidebarWidth }}>
                            <InfoPanel
                                isOpen={infoPanelOpen}
                                onClose={handleCloseInfoPanel}
                                lat={mapInternals?.lat}
                                lng={mapInternals?.lng}
                                locationName={currentCenterLabel}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
