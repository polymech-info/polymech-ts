import React, { useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { Map as MapIcon, Loader2, Locate, Maximize, Minimize, Focus, Sun, Moon } from 'lucide-react';
import type { MapStyleKey } from './map-styles';

export interface MapFooterProps {
    map?: maplibregl.Map | null;
    currentCenterLabel?: string | null;
    mapInternals?: { lat: number; lng: number; zoom: number } | null;
    isLocating?: boolean;
    onLocate?: () => void;
    onZoomToFit?: () => void;
    isFullscreen?: boolean;
    onFullscreenToggle?: () => void;
    activeStyleKey?: MapStyleKey;
    onStyleChange?: (styleKey: MapStyleKey) => void;
    children?: React.ReactNode;
}

export function MapFooter({
    map,
    currentCenterLabel,
    mapInternals,
    isLocating = false,
    onLocate,
    onZoomToFit,
    isFullscreen = false,
    onFullscreenToggle,
    activeStyleKey,
    onStyleChange,
    children
}: MapFooterProps) {
    const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

    // Attach localized move listener for live coordinate display
    // This avoids triggering parent re-renders while still providing live info
    useEffect(() => {
        if (!map) return;

        const handleMove = () => {
            const center = map.getCenter();
            setLiveCoords({
                lat: center.lat,
                lng: center.lng,
                zoom: map.getZoom()
            });
        };

        map.on('move', handleMove);
        // Initial sync
        handleMove();

        return () => {
            map.off('move', handleMove);
        };
    }, [map]);

    // Use liveCoords for high-frequency display, fallback to mapInternals prop for static initialization
    const displayCoords = liveCoords || mapInternals;

    return (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs flex justify-between items-center z-20 shrink-0 w-full overflow-hidden">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                {currentCenterLabel ? (
                    <div className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1">
                        <MapIcon className="w-3 h-3 text-indigo-500" />
                        {currentCenterLabel}
                    </div>
                ) : (
                    <span>Pan map to view details</span>
                )}

                {displayCoords && (
                    <div className="font-mono flex gap-4 opacity-80 pl-4 border-l border-gray-300 dark:border-gray-600">
                        <span>Lat: {displayCoords.lat.toFixed(4)}</span>
                        <span>Lng: {displayCoords.lng.toFixed(4)}</span>
                        <span>Zoom: {displayCoords.zoom.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Style Toggles & Actions */}
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-4">
                {onLocate && (
                    <button
                        onClick={onLocate}
                        disabled={isLocating}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isLocating ? 'text-indigo-500' : 'text-gray-500'}`}
                        title="Locate Me (IP)"
                    >
                        {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Locate className="w-3.5 h-3.5" />}
                    </button>
                )}
                
                {onZoomToFit && (
                    <button
                        onClick={onZoomToFit}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                        title="Zoom to Fit"
                    >
                        <Focus className="w-3.5 h-3.5" />
                    </button>
                )}

                {onFullscreenToggle && (
                    <button
                        onClick={onFullscreenToggle}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isFullscreen ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    </button>
                )}

                {onStyleChange && [
                    { key: 'light', icon: Sun, title: 'Light 2D' },
                    { key: '3d', icon: MapIcon, title: '3D Terrain' },
                    { key: 'dark', icon: Moon, title: 'Dark Mode' }
                ].map(({ key, icon: Icon, title }) => (
                    <button
                        key={key}
                        onClick={() => onStyleChange(key as MapStyleKey)}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${activeStyleKey === key ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
                        title={title}
                    >
                        <Icon className="w-3.5 h-3.5" />
                    </button>
                ))}

                {children && (
                    <>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                        {children}
                    </>
                )}
            </div>
        </div>
    );
}
