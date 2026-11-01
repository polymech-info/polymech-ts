import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Map as MapIcon, PieChart, FileText, Terminal, PlusCircle, Loader2, Share2, Image as ImageIcon, Palette, PanelLeftClose, PanelLeftOpen, Merge, Pause, Play, Square, SlidersHorizontal } from 'lucide-react';

import { CompetitorsGridView, type CompetitorsGridViewHandle } from '../PlacesGridView';
import { PlacesMapView, type MapFeatures } from '../PlacesMapView';
import { PlacesThumbView } from '../PlacesThumbView';
import { PlacesMetaView } from '../PlacesMetaView';
import { PlacesReportView } from './PlacesReportView';
import { useRestoredSearch } from './RestoredSearchContext';
import { expandPlacesGridSearch, postPlacesGridSearchControl } from '../client-gridsearch';
import { useGridSearchStream, computeGridSearchOverallPercent } from './GridSearchStreamContext';
import { POSTER_THEMES } from '../utils/poster-themes';

import { type PlaceFull } from '@polymech/shared';
import { type LogEntry } from '@/contexts/LogContext';
import ChatLogBrowser from '@/components/ChatLogBrowser';
import { GripVertical, Download, Code, FileSpreadsheet, Compass } from 'lucide-react';
import { LocationDetailView } from '../LocationDetail';
import { exportToCSV, exportToJSON } from './exportUtils';
import { T, translate } from '@/i18n';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'grid' | 'thumb' | 'map' | 'meta' | 'report' | 'log' | 'poster';

interface GridSearchResultsProps {
    jobId: string;
    competitors: PlaceFull[];
    excludedTypes: string[];
    updateExcludedTypes?: (types: string[]) => Promise<void>;
    liveAreas?: any[];
    liveRadii?: any[];
    liveNodes?: any[];
    liveScanner?: any;
    stats?: any;
    streaming?: boolean;
    statusMessage?: string;
    sseLogs?: LogEntry[];
    onExpandSubmitted?: () => void;
    onMergeSubmitted?: () => void;
    isOwner?: boolean;
    isPublic?: boolean;
    onTogglePublic?: () => void;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

const MOCK_SETTINGS = {
    known_types: [],
    excluded_types: [],
    email_mode: 'fast' as const,
    auto_enrich: false
};

import { MergeDialog } from './MergeDialog';
import { ImportContactsDialog } from '../../contacts/ImportContactsDialog';
import { exportGridSearchToContacts, fetchCompetitorById, getPlacesAiGridFilters } from '../client-gridsearch';
import { GridFiltersPanel } from './GridFiltersPanel';
import { useAiGridColumns } from './useAiGridColumns';
import { UserPlus } from 'lucide-react';

/** URL/localStorage toggle for map layer visibility; same storage prefix as `useGridSearchState`. */
function readGridsearchPersistentToggle(key: string, urlValue: string | null, defaultValue: boolean): boolean {
    if (typeof window === 'undefined') return defaultValue;
    if (urlValue !== null) {
        localStorage.setItem(`gridsearch_${key}`, urlValue);
        return urlValue === '1';
    }
    const stored = localStorage.getItem(`gridsearch_${key}`);
    if (stored !== null) return stored === '1';
    return defaultValue;
}

export const GridSearchResults = React.memo(({ jobId, competitors, excludedTypes, updateExcludedTypes, liveAreas, liveRadii, liveNodes, liveScanner, stats, streaming, statusMessage, sseLogs, onExpandSubmitted, onMergeSubmitted, isOwner = false, isPublic, onTogglePublic, isSidebarOpen, onToggleSidebar }: GridSearchResultsProps) => {
    const { controlPaused, stats: streamStats, statusMessage: streamStatus } = useGridSearchStream();
    const overallPct = streaming ? computeGridSearchOverallPercent(streamStats) : null;
    const phaseLabel =
        streamStats.phase === 'enriching'
            ? translate('Enrichment')
            : streamStats.phase === 'searching' || streamStats.phase === 'grid'
                ? translate('Grid search')
                : streamStats.phase === 'complete'
                    ? translate('Done')
                    : translate('Starting…');
    const [runControlBusy, setRunControlBusy] = useState(false);
    const controlInFlight = useRef(false);

    const sendRunControl = useCallback(async (action: 'pause' | 'resume' | 'cancel') => {
        if (!streaming || controlInFlight.current) return;
        controlInFlight.current = true;
        setRunControlBusy(true);
        try {
            await postPlacesGridSearchControl(jobId, action);
        } catch (e) {
            console.error('Grid search control failed:', e);
        } finally {
            controlInFlight.current = false;
            setRunControlBusy(false);
        }
    }, [jobId, streaming]);

    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const [showImportToContactsDialog, setShowImportToContactsDialog] = useState(false);

    /** Merged onto stream competitors (e.g. llm_grid_filters after AI filter run). */
    const [placeUiPatch, setPlaceUiPatch] = useState<Record<string, Record<string, unknown>>>({});

    const patchedCompetitors = React.useMemo(() => {
        return competitors.map((c) => {
            const id = String((c as any).place_id || (c as any).placeId || (c as any).id);
            const p = placeUiPatch[id];
            return p ? ({ ...c, ...p } as PlaceFull) : c;
        });
    }, [competitors, placeUiPatch]);

    const filteredCompetitors = React.useMemo(() => {
        if (!excludedTypes || excludedTypes.length === 0) return patchedCompetitors;
        const excludedSet = new Set(excludedTypes.map(t => t.toLowerCase()));
        return patchedCompetitors.filter(c => {
            const types = (c as any).types || [];
            return !types.some((t: string) => excludedSet.has(t.toLowerCase()));
        });
    }, [patchedCompetitors, excludedTypes]);

    const [searchParams, setSearchParams] = useSearchParams();

    const showMapRegions = React.useMemo(
        () => readGridsearchPersistentToggle('regions', searchParams.get('regions'), true),
        [searchParams]
    );

    const mapCustomFeatures = React.useMemo((): Partial<MapFeatures> => {
        const base: Partial<MapFeatures> = { showRegions: showMapRegions };
        if (!isOwner) {
            base.enableSidebarTools = false;
            base.enableSimulator = false;
            base.enableInfoPanel = false;
        }
        return base;
    }, [isOwner, showMapRegions]);

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const urlView = searchParams.get('view') as ViewMode;
        const allowed: ViewMode[] = ['grid', 'thumb', 'map', 'meta', 'report', 'poster', ...(import.meta.env.DEV ? (['log'] as const) : [])];
        if (urlView && allowed.includes(urlView)) {
            if (urlView === 'log' && !isOwner) return 'grid';
            return urlView;
        }
        return 'grid';
    });

    const [posterTheme, setPosterTheme] = useState(() => searchParams.get('theme') || 'terracotta');

    /** When true, list view shows all rows and applies saved excludes as MUI column filters (editable in the filter panel). When false, rows are pre-filtered (previous behavior). */
    const [applySavedExcludesInGrid, setApplySavedExcludesInGrid] = useState(false);
    const gridExportRef = useRef<CompetitorsGridViewHandle | null>(null);

    const [gridFiltersOpen, setGridFiltersOpen] = useState(false);
    const [aiFilterDefs, setAiFilterDefs] = useState<import('../client-gridsearch').PlacesAiGridFilterDef[]>([]);
    const aiGridColumns = useAiGridColumns(aiFilterDefs);

    useEffect(() => {
        if (!gridFiltersOpen || !isOwner) return;
        getPlacesAiGridFilters().then(setAiFilterDefs).catch(() => { /* ignore */ });
    }, [gridFiltersOpen, isOwner, jobId]);

    const applySavedExcludesUrlClear = useCallback(() => {
        setSearchParams((prev) => {
            const p = new URLSearchParams(prev);
            Array.from(p.keys()).forEach((k) => {
                if (k.startsWith('filter_')) p.delete(k);
            });
            p.delete('nofilter');
            return p;
        }, { replace: true });
    }, [setSearchParams]);

    const handleApplySavedExcludesInGridToggle = useCallback(
        (next: boolean) => {
            setApplySavedExcludesInGrid(next);
            applySavedExcludesUrlClear();
        },
        [applySavedExcludesUrlClear],
    );

    const getRowsMatchingCurrentFilters = useCallback(() => {
        if (applySavedExcludesInGrid && viewMode === 'grid' && gridExportRef.current) {
            const ids = new Set(gridExportRef.current.getFilteredPlaceIds());
            return patchedCompetitors.filter((c) => ids.has(String((c as any).place_id || (c as any).placeId || (c as any).id)));
        }
        return filteredCompetitors;
    }, [applySavedExcludesInGrid, viewMode, patchedCompetitors, filteredCompetitors]);

    const { state: restoredState } = useRestoredSearch();
    const restoredGadmAreas = restoredState?.run?.request?.guided?.areas?.map((a: any) => ({
        gid: a.gid, name: a.name, level: a.level,
    })) || undefined;

    const defaultDiscoverQuery = restoredState?.run?.request?.search?.types?.[0] || restoredState?.run?.request?.types?.[0];
    const [discoverQuery, setDiscoverQuery] = useState("");
    const discoverQueryInitialized = React.useRef(false);

    React.useEffect(() => {
        if (restoredState && !discoverQueryInitialized.current) {
            setDiscoverQuery(defaultDiscoverQuery || 'business,shop,factory,service,industry,company');
            discoverQueryInitialized.current = true;
        }
    }, [restoredState, defaultDiscoverQuery]);

    // Track regions picked in the map's GADM picker
    const [pickedRegions, setPickedRegions] = useState<any[]>([]);
    const [mapSimSettings, setMapSimSettings] = useState<any>(null);
    const [expanding, setExpanding] = useState(false);
    const [expandError, setExpandError] = useState<string | null>(null);

    // Determine which picked regions are actually new (not already in this search)
    const existingGids = React.useMemo(() => {
        return new Set((restoredGadmAreas || []).map((a: any) => a.gid));
    }, [restoredGadmAreas]);

    const freshRegions = React.useMemo(() => {
        return pickedRegions.filter(r => !existingGids.has(r.gid));
    }, [pickedRegions, existingGids]);

    const handleExpand = useCallback(async () => {
        if (freshRegions.length === 0) return;

        setExpanding(true);
        setExpandError(null);
        try {
            const res = await expandPlacesGridSearch(jobId, freshRegions.map(r => ({
                gid: r.gid,
                name: r.name,
                level: r.level,
                raw: r.raw || { level: r.level, gadmName: r.name, gid: r.gid },
            })), mapSimSettings || undefined);
            onExpandSubmitted?.();

            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('jobId', res.jobId);
                next.set('view', 'map');
                return next;
            });
        } catch (e: any) {
            setExpandError(e.message || 'Failed to expand search');
            console.error('Expand failed:', e);
        } finally {
            setExpanding(false);
        }
    }, [jobId, freshRegions, onExpandSubmitted]);

    const handleViewportExpand = useCallback(async () => {
        const url = new URL(window.location.href);
        const lat = parseFloat(url.searchParams.get('mapLat') || '0');
        const lng = parseFloat(url.searchParams.get('mapLng') || '0');
        const zoom = parseFloat(url.searchParams.get('mapZoom') || '15');

        if (!discoverQuery.trim()) return;

        setExpanding(true);
        setExpandError(null);
        try {
            const res = await expandPlacesGridSearch(jobId, [], mapSimSettings || undefined, {
                viewportSearch: true,
                viewportCenter: { lat, lng },
                viewportZoom: zoom,
                types: [discoverQuery.trim()]
            });
            onExpandSubmitted?.();

            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('jobId', res.jobId);
                next.set('view', 'map');
                return next;
            });
        } catch (e: any) {
            setExpandError(e.message || 'Failed to start discover');
            console.error('Discover failed:', e);
        } finally {
            setExpanding(false);
        }
    }, [jobId, mapSimSettings, onExpandSubmitted, discoverQuery]);

    // Selection and Sidebar Panel state
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(400);

    const isResizingRef = useRef(false);
    const startResizing = useCallback(() => {
        isResizingRef.current = true;
        const onMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            // Calculate width from the right edge of the screen
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth);
        };
        const onUp = () => {
            isResizingRef.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    const activeCompetitor = React.useMemo(() => {
        if (!selectedPlaceId) return null;
        return patchedCompetitors.find(c => String(c.place_id || (c as any).placeId || (c as any).id) === selectedPlaceId);
    }, [selectedPlaceId, patchedCompetitors]);

    const getAllPlaceIds = useCallback(() => {
        return patchedCompetitors
            .map((c) => String((c as any).place_id || (c as any).placeId || (c as any).id))
            .filter(Boolean);
    }, [patchedCompetitors]);

    const handlePlaceLlmUpdated = useCallback(async (placeId: string) => {
        try {
            const d = await fetchCompetitorById(placeId);
            setPlaceUiPatch((prev) => ({
                ...prev,
                [placeId]: { llm_grid_filters: (d as any).llm_grid_filters } as Record<string, unknown>,
            }));
        } catch (e) {
            console.error(e);
        }
    }, []);

    const handleSelectPlace = useCallback((id: string | null, behavior: 'select' | 'open' | 'toggle' = 'select') => {
        const isSame = id === selectedPlaceId;
        setSelectedPlaceId(id);

        if (behavior === 'open') {
            setShowDetails(true);
        } else if (behavior === 'toggle') {
            if (isSame && showDetails) {
                setShowDetails(false);
            } else {
                setShowDetails(true);
            }
        }
    }, [selectedPlaceId, showDetails]);

    const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const theme = e.target.value;
        setPosterTheme(theme);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('theme', theme);
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    const handleViewChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', mode);
            return newParams;
        }, { replace: true });
    }, [setSearchParams]);

    /** Shared / anon viewers cannot use log view; normalize URL and state. */
    React.useEffect(() => {
        if (isOwner) return;
        if (searchParams.get('view') === 'log') {
            setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                p.set('view', 'grid');
                return p;
            }, { replace: true });
        }
        if (viewMode === 'log') {
            handleViewChange('grid');
        }
    }, [isOwner, searchParams, setSearchParams, viewMode, handleViewChange]);

    // Mock functions for now till we have real enrichment tracking in grid search results
    const dummyEnrich = async () => { };
    const handleMapCenterUpdate = () => { };

    // Debounced map move handler — prevents setSearchParams from triggering
    // a full React re-render on every single moveend event
    const mapMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleMapMove = useCallback((state: { lat: number; lng: number; zoom: number; pitch?: number; bearing?: number }) => {
        if (mapMoveTimerRef.current) {
            if ((window as any).__MAP_PERF_DEBUG__) console.log('[MapPerf] onMapMove debounce reset (prevented URL update)');
            clearTimeout(mapMoveTimerRef.current);
        }

        mapMoveTimerRef.current = setTimeout(() => {
            if ((window as any).__MAP_PERF_DEBUG__) console.log('[MapPerf] onMapMove → window.history.replaceState committed (300ms debounce)');

            // USE MANUAL HISTORY API: Updates the URL bar silently WITHOUT triggering React re-renders/useSearchParams
            const url = new URL(window.location.href);
            url.searchParams.set('mapLat', state.lat.toFixed(6));
            url.searchParams.set('mapLng', state.lng.toFixed(6));
            url.searchParams.set('mapZoom', state.zoom.toFixed(2));
            if (state.pitch !== undefined) url.searchParams.set('mapPitch', state.pitch.toFixed(0));
            if (state.bearing !== undefined) url.searchParams.set('mapBearing', state.bearing.toFixed(0));

            // Maintain view state if it's not locked to 'poster'
            if (url.searchParams.get('view') !== 'poster') {
                url.searchParams.set('view', 'map');
            }

            // Silently update the browser history
            window.history.replaceState(null, '', url.pathname + url.search);
        }, 300);
    }, []);

    const settings = { ...MOCK_SETTINGS, excluded_types: excludedTypes };

    return (
        <div className="flex flex-col h-full overflow-hidden w-full relative">
            {streaming && (
                <div className="px-2 mt-2 mb-1 shrink-0" aria-label={translate('Overall progress')}>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                        <span className="truncate">
                            {phaseLabel}
                            {streamStats.totalWaypoints > 0 && streamStats.phase !== 'enriching' && (
                                <span className="text-gray-400 dark:text-gray-500">
                                    {' '}
                                    · {streamStats.completedWaypoints}/{streamStats.totalWaypoints} {translate('cells')}
                                </span>
                            )}
                            {streamStats.phase === 'enriching' && streamStats.enrichTotal > 0 && (
                                <span className="text-gray-400 dark:text-gray-500">
                                    {' '}
                                    · {streamStats.totalLocationsEnriched}/{streamStats.enrichTotal}
                                </span>
                            )}
                        </span>
                        {overallPct != null && (
                            <span className="tabular-nums text-gray-600 dark:text-gray-300">{overallPct}%</span>
                        )}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                                overallPct == null ? 'bg-indigo-400/90 animate-pulse' : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: overallPct != null ? `${overallPct}%` : '36%' }}
                        />
                    </div>
                    {streamStatus && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5" title={streamStatus}>
                            {streamStatus}
                        </p>
                    )}
                </div>
            )}
            <div className={`flex flex-col gap-2 mb-4 px-2 ${streaming ? 'mt-1' : 'mt-2'}`}>
                <div className="flex justify-between items-center">
                {/* Left: sidebar toggle + expand button */}
                <div className="flex items-center gap-2">
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        </button>
                    )}
                    {streaming && (
                        <div className="flex items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/40 px-1 py-0.5">
                            <button
                                type="button"
                                onClick={() => sendRunControl(controlPaused ? 'resume' : 'pause')}
                                disabled={runControlBusy}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50"
                                title={controlPaused ? translate('Resume') : translate('Pause')}
                            >
                                {runControlBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : controlPaused ? (
                                    <Play className="h-3.5 w-3.5" />
                                ) : (
                                    <Pause className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden sm:inline">{controlPaused ? translate('Resume') : translate('Pause')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => sendRunControl('cancel')}
                                disabled={runControlBusy}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50"
                                title={translate('Stop search')}
                            >
                                <Square className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{translate('Stop')}</span>
                            </button>
                        </div>
                    )}
                    {isOwner && freshRegions.length > 0 && (
                        <button
                            onClick={handleExpand}
                            disabled={expanding || streaming}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                            title={`Expand search with ${freshRegions.length} new region(s)`}
                        >
                            {expanding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <PlusCircle className="w-3.5 h-3.5" />
                            )}
                            <T>Expand</T> +{freshRegions.length}
                        </button>
                    )}
                    {isOwner && viewMode === 'map' && (
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-0.5 overflow-hidden">
                            <input
                                type="text"
                                className="px-2 py-1 text-xs border-none focus:ring-0 bg-transparent dark:text-gray-200 min-w-[140px] outline-none"
                                placeholder={translate("business,shop...")}
                                value={discoverQuery}
                                onChange={(e) => setDiscoverQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleViewportExpand();
                                    }
                                }}
                            />
                            <button
                                onClick={handleViewportExpand}
                                disabled={expanding || streaming || !discoverQuery.trim()}
                                className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
                                title={translate("Discover new places in the current viewport")}
                            >
                                {expanding ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Compass className="w-3.5 h-3.5" />
                                )}
                                <T>Discover</T>
                            </button>
                        </div>
                    )}
                    {isOwner && expandError && (
                        <span className="text-xs text-red-500">{expandError}</span>
                    )}
                </div>

                <div className="flex items-center gap-3 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                    <div className="flex">
                        <button
                            onClick={() => handleViewChange('grid')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">List</span>
                        </button>
                        <button
                            onClick={() => handleViewChange('thumb')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'thumb' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Thumbnail View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Grid</span>
                        </button>
                        <button
                            onClick={() => handleViewChange('map')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Map View"
                        >
                            <MapIcon className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Map</span>
                        </button>
                        <button
                            onClick={() => handleViewChange('poster')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'poster' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Poster Map View"
                        >
                            <ImageIcon className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Poster</span>
                        </button>
                        <button
                            onClick={() => handleViewChange('meta')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'meta' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Meta Analysis"
                        >
                            <PieChart className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Meta</span>
                        </button>
                        <button
                            onClick={() => handleViewChange('report')}
                            className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'report' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Markdown Report"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Report</span>
                        </button>
                        {isOwner && import.meta.env.DEV && sseLogs && (
                            <button
                                onClick={() => handleViewChange('log')}
                                className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${viewMode === 'log' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title="SSE Log (Dev)"
                            >
                                <Terminal className="h-4 w-4" />
                                <span className="hidden md:inline text-xs font-medium">Log</span>
                            </button>
                        )}
                    </div>

                    {isOwner && (
                        <>
                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                            <button
                                type="button"
                                onClick={() => setGridFiltersOpen((o) => !o)}
                                className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${
                                    gridFiltersOpen || applySavedExcludesInGrid
                                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                                title={translate(
                                    'Grid filters: type excludes, AI context, and AI column filters',
                                )}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="hidden lg:inline text-xs font-medium max-w-[10rem] truncate">
                                    <T>Grid filters</T>
                                </span>
                            </button>
                        </>
                    )}

                    {isOwner && (
                        <button
                            onClick={() => setShowMergeDialog(true)}
                            className="flex items-center gap-1.5 p-1.5 rounded-md transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Merge results from another search"
                        >
                            <Merge className="h-4 w-4" />
                            <span className="hidden md:inline text-xs font-medium">Merge</span>
                        </button>
                    )}

                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-1.5 p-1.5 rounded-md transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Export Data"
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="hidden md:inline text-xs font-medium">Export</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Export Results</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    const q = restoredState?.run?.request?.search?.types?.[0] || restoredState?.run?.request?.types?.[0] || restoredState?.run?.request?.guided?.query || 'places';
                                    const r = restoredState?.run?.request?.search?.region || restoredState?.run?.request?.region || restoredState?.run?.request?.guided?.areas?.[0]?.name || '';
                                    const baseName = r ? `${q} @ ${r}` : q;
                                    const safeName = baseName.replace(/[\\/:*?"<>|]/g, '_');
                                    exportToCSV(getRowsMatchingCurrentFilters(), `${safeName}.csv`);
                                }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Export as CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const q = restoredState?.run?.request?.search?.types?.[0] || restoredState?.run?.request?.types?.[0] || restoredState?.run?.request?.guided?.query || 'places';
                                    const r = restoredState?.run?.request?.search?.region || restoredState?.run?.request?.region || restoredState?.run?.request?.guided?.areas?.[0]?.name || '';
                                    const baseName = r ? `${q} @ ${r}` : q;
                                    const safeName = baseName.replace(/[\\/:*?"<>|]/g, '_');
                                    exportToJSON(getRowsMatchingCurrentFilters(), `${safeName}.json`);
                                }}>
                                    <Code className="mr-2 h-4 w-4" />
                                    <span>Export as JSON</span>
                                </DropdownMenuItem>

                                {import.meta.env.VITE_ENABLE_CONTACTS === 'true' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowImportToContactsDialog(true)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            <span>Import to Contacts</span>
                                        </DropdownMenuItem>
                                    </>
                                )}

                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {viewMode === 'poster' && (
                        <>
                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1 self-center" />
                            <div className="flex items-center gap-1.5 px-2 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-md">
                                <Palette className="h-3.5 w-3.5 text-indigo-500" />
                                <select
                                    value={posterTheme}
                                    onChange={handleThemeChange}
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer p-0 pr-1 appearance-none outline-none text-gray-700 dark:text-gray-300 max-w-[100px]"
                                >
                                    {Object.keys(POSTER_THEMES).map(k => (
                                        <option key={k} value={k}>{POSTER_THEMES[k].name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    {isOwner && (
                        <>
                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1 self-center" />
                            <button
                                onClick={onTogglePublic}
                                className={`flex items-center gap-1 p-1.5 rounded-md transition-all ${isPublic ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title={isPublic ? "Public Share Enabled" : "Enable Public Share"}
                            >
                                <Share2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
                </div>

                {isOwner && gridFiltersOpen && (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/15 px-3 py-2 space-y-3">
                        <label className="flex items-start gap-2 text-xs text-amber-950 dark:text-amber-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 rounded border-amber-400"
                                checked={applySavedExcludesInGrid}
                                onChange={(e) => handleApplySavedExcludesInGridToggle(e.target.checked)}
                            />
                            <span>
                                <span className="font-medium">
                                    <T>Apply saved type excludes as DataGrid filters</T>
                                </span>
                                <span className="block font-normal text-amber-800/90 dark:text-amber-200/90 mt-0.5">
                                    <T>
                                        When on, saved type excludes apply as DataGrid filters — remove a rule to show that
                                        type. Import to contacts uses the rows you see in List view.
                                    </T>
                                </span>
                            </span>
                        </label>

                        <div className="border-t border-amber-200/80 dark:border-amber-800/40 pt-2">
                            <p className="text-[11px] font-medium text-amber-900 dark:text-amber-100 mb-2">
                                <T>AI grid filters</T>
                            </p>
                            <GridFiltersPanel
                                gridExportRef={gridExportRef}
                                getPlaceIdsAll={getAllPlaceIds}
                                onPlaceLlmUpdated={handlePlaceLlmUpdated}
                                canEdit={!!isOwner}
                                onFiltersPersisted={() => {
                                    getPlacesAiGridFilters().then(setAiFilterDefs).catch(() => { /* ignore */ });
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
                <div id="gridsearch-scroll-area" className="flex-1 min-h-0 flex flex-col overflow-auto bg-white dark:bg-gray-900 rounded-b-2xl">
                    {viewMode === 'grid' && (
                        <CompetitorsGridView
                            key={`gridsearch-grid-${jobId}`}
                            ref={gridExportRef}
                            competitors={applySavedExcludesInGrid ? patchedCompetitors : filteredCompetitors}
                            loading={false}
                            settings={settings}
                            updateExcludedTypes={updateExcludedTypes || (async () => { })}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={handleSelectPlace}
                            isOwner={isOwner}
                            isPublic={isPublic}
                            preset={(isPublic && !isOwner) || showDetails ? 'min' : 'full'}
                            seedExcludeTypeFilters={applySavedExcludesInGrid ? excludedTypes : undefined}
                            persistFiltersInUrl={!applySavedExcludesInGrid}
                            extraColumns={isOwner ? aiGridColumns : undefined}
                        />
                    )}

                    {viewMode === 'thumb' && (
                        <PlacesThumbView
                            places={filteredCompetitors}
                            filters={[]}
                            toggleFilter={() => { }}
                        />
                    )}

                    {(viewMode === 'map' || viewMode === 'poster') && (
                        <PlacesMapView
                            preset="SearchView"
                            customFeatures={mapCustomFeatures}
                            places={filteredCompetitors}
                            isPosterMode={viewMode === 'poster'}
                            posterTheme={posterTheme}
                            setPosterTheme={setPosterTheme}
                            onMapCenterUpdate={handleMapCenterUpdate}
                            enrich={dummyEnrich}
                            isEnriching={false}
                            enrichmentProgress={null}
                            liveAreas={liveAreas}
                            liveRadii={liveRadii}
                            liveNodes={liveNodes}
                            liveScanner={liveScanner}
                            initialGadmRegions={restoredGadmAreas}
                            initialSimulatorSettings={restoredState?.run?.request?.guided?.settings}
                            initialCenter={(() => {
                                const lat = parseFloat(searchParams.get('mapLat') || '');
                                const lng = parseFloat(searchParams.get('mapLng') || '');
                                return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : undefined;
                            })()}
                            initialZoom={(() => {
                                const zoom = parseFloat(searchParams.get('mapZoom') || '');
                                return !isNaN(zoom) ? zoom : undefined;
                            })()}
                            initialPitch={(() => {
                                const p = parseFloat(searchParams.get('mapPitch') || '');
                                return !isNaN(p) ? p : undefined;
                            })()}
                            initialBearing={(() => {
                                const b = parseFloat(searchParams.get('mapBearing') || '');
                                return !isNaN(b) ? b : undefined;
                            })()}
                            onMapMove={handleMapMove}
                            onClosePosterMode={() => handleViewChange('map')}
                            onRegionsChange={setPickedRegions}
                            simulatorSettings={mapSimSettings}
                            onSimulatorSettingsChange={setMapSimSettings}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={handleSelectPlace}
                        />
                    )}

                    {viewMode === 'meta' && (
                        <PlacesMetaView
                            places={filteredCompetitors}
                            settings={settings}
                            updateExcludedTypes={updateExcludedTypes || (async () => { })}
                        />
                    )}

                    {viewMode === 'report' && (
                        <PlacesReportView jobId={jobId} />
                    )}

                    {viewMode === 'log' && import.meta.env.DEV && sseLogs && (
                        <div className="h-full">
                            <ChatLogBrowser
                                logs={sseLogs}
                                clearLogs={() => { }}
                                title="SSE Stream Events"
                            />
                        </div>
                    )}
                </div>

                {/* Global Location Details Sidebar */}
                {showDetails && activeCompetitor && (
                    <div className="flex h-full min-h-0 shrink-0">
                        {/* Drag Handle */}
                        <div
                            className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center z-30 transition-colors shrink-0"
                            onMouseDown={startResizing}
                        >
                            <GripVertical className="w-3 h-3 text-gray-400" />
                        </div>

                        {/* Property Pane */}
                        <div
                            className="h-full bg-white dark:bg-gray-800 z-20 overflow-hidden relative shrink-0 border-l border-gray-200 dark:border-gray-700"
                            style={{ width: sidebarWidth }}
                        >
                            <LocationDetailView
                                competitor={activeCompetitor}
                                onClose={() => setShowDetails(false)}
                                gridSearchRunId={jobId}
                            />
                        </div>
                    </div>
                )}
            </div>
            <MergeDialog
                open={showMergeDialog}
                onOpenChange={setShowMergeDialog}
                targetId={jobId}
                onMergeComplete={() => onMergeSubmitted?.()}
            />
            <ImportContactsDialog
                open={showImportToContactsDialog}
                onOpenChange={setShowImportToContactsDialog}
                type="callback"
                onImport={async (groupId) => {
                    if (viewMode === 'grid' && gridExportRef.current) {
                        const placeIds = gridExportRef.current.getFilteredPlaceIds();
                        return exportGridSearchToContacts(jobId, groupId, { placeIds });
                    }
                    return exportGridSearchToContacts(jobId, groupId, { excludedTypes });
                }}
            />

        </div>
    );
});
