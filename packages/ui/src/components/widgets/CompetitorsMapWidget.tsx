import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { PlacesMapView } from '@/modules/places/PlacesMapView';
import { LocationDetailView } from '@/modules/places/LocationDetail';
import { T } from '@/i18n';
import { Loader2, GripVertical } from 'lucide-react';
import { usePlacesMapData, type PlacesMapWidgetHandle } from './useCompetitorsMapData';

// Re-export the handle type so consumers can import from the widget file
export type { PlacesMapWidgetHandle as CompetitorsMapWidgetHandle } from './useCompetitorsMapData';

interface CompetitorsMapWidgetProps {
    isEditMode?: boolean;
    jobId?: string;
    // Widget instance management
    widgetInstanceId?: string;
    id?: string;
    onPropsChange?: (props: Record<string, any>) => void;
    // Map Features (Customizable via configSchema)
    enableSimulator?: boolean;
    enableRuler?: boolean;
    enableInfoPanel?: boolean;
    enableLayerToggles?: boolean;
    preset?: 'SearchView' | 'Minimal';
    targetLocation?: any;
    showRegions?: boolean;
    showSettings?: boolean;
    showLocations?: boolean;
    posterMode?: boolean;
    enableLocationDetails?: boolean;
    maxHeight?: string;
    /** Fired once the widget is ready with its imperative API handle. */
    onReady?: (handle: PlacesMapWidgetHandle) => void;
}

const CompetitorsMapWidget = forwardRef<PlacesMapWidgetHandle, CompetitorsMapWidgetProps>(({
    isEditMode = false,
    jobId,
    enableSimulator = true,
    enableRuler = true,
    enableInfoPanel = true,
    enableLayerToggles = true,
    preset = 'Minimal',
    targetLocation = null,
    showRegions = true,
    showSettings = true,
    showLocations = true,
    posterMode = false,
    enableLocationDetails = true,
    maxHeight = '60vh',
    onReady,
}, ref) => {
    // -----------------------------------------------------------------------
    // Data layer (hook)
    // -----------------------------------------------------------------------
    const {
        competitors,
        loading,
        initialCenter,
        finalGadmRegions,
        initialSimulatorSettings,
        handle,
        handleMapReady: hookMapReady,
    } = usePlacesMapData({ jobId, targetLocation });

    useImperativeHandle(ref, () => handle, [handle]);

    // -----------------------------------------------------------------------
    // UI-only state: selection sidebar
    // -----------------------------------------------------------------------
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(340);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeCompetitor = useMemo(() => {
        if (!selectedPlaceId) return null;
        return competitors.find(c => String(c.place_id || (c as any).placeId || (c as any).id) === selectedPlaceId);
    }, [selectedPlaceId, competitors]);

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

    // Sidebar resize
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startW = sidebarWidth;
        const onMove = (ev: MouseEvent) => setSidebarWidth(Math.max(240, Math.min(600, startW - (ev.clientX - startX))));
        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [sidebarWidth]);

    // -----------------------------------------------------------------------
    // Map ready: bridge hook + onReady callback
    // -----------------------------------------------------------------------
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const handleMapReady = useCallback((m: import('maplibre-gl').Map) => {
        hookMapReady(m);
        onReadyRef.current?.(handle);
    }, [hookMapReady, handle]);

    // -----------------------------------------------------------------------
    // Stubs
    // -----------------------------------------------------------------------
    const dummyEnrich = useCallback(async () => { }, []);
    const handleMapCenterUpdate = useCallback(() => { }, []);

    const effectiveMaxHeight = showDetails && activeCompetitor ? '60vh' : maxHeight;

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm min-h-[400px] relative" style={{ maxHeight: effectiveMaxHeight, transition: 'max-height 0.3s ease' }}>
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground"><T>Loading map data...</T></p>
                </div>
            ) : (
                <div className="flex-1 w-full min-h-0 flex overflow-hidden">
                    <div className="flex-1 min-w-0 h-full">
                        <PlacesMapView
                            preset={preset}
                            customFeatures={{
                                enableSimulator: showSettings === false ? false : enableSimulator,
                                enableSidebarTools: showSettings === false ? false : undefined,
                                enableRuler,
                                enableInfoPanel,
                                enableLayerToggles,
                                enableLocationDetails,
                                showRegions,
                                showSettings,
                                showLocations,
                            }}
                            initialCenter={initialCenter}
                            initialGadmRegions={finalGadmRegions}
                            initialSimulatorSettings={initialSimulatorSettings}
                            places={competitors}
                            onMapCenterUpdate={handleMapCenterUpdate}
                            enrich={dummyEnrich}
                            isEnriching={false}
                            enrichmentProgress={null}
                            isPosterMode={posterMode}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={enableLocationDetails ? handleSelectPlace : undefined}
                            onMapReady={handleMapReady}
                        />
                    </div>

                    {/* Location Detail Sidebar — mirrors GridSearchResults pattern */}
                    {enableLocationDetails && showDetails && activeCompetitor && (
                        <div className="flex h-full shrink-0 overflow-hidden">
                            <div
                                className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center z-30 transition-colors shrink-0"
                                onMouseDown={startResizing}
                            >
                                <GripVertical className="w-3 h-3 text-gray-400" />
                            </div>
                            <div
                                className="h-full bg-white dark:bg-gray-800 z-20 overflow-y-auto relative shrink-0 border-l border-gray-200 dark:border-gray-700"
                                style={{ width: sidebarWidth }}
                            >
                                <LocationDetailView
                                    competitor={activeCompetitor}
                                    onClose={() => setShowDetails(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

CompetitorsMapWidget.displayName = 'CompetitorsMapWidget';

export default CompetitorsMapWidget;
