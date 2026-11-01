import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { useGridSimulatorState } from './hooks/useGridSimulatorState';
import { SimulatorControls } from './components/SimulatorControls';
import { SimulatorStats } from './components/SimulatorStats';
import { SimulatorSettingsPanel } from './components/SimulatorSettingsPanel';
import { GridSearchSimulatorProps } from './types';
import { T, translate } from '@/i18n';

export function GridSearchSimulator(props: GridSearchSimulatorProps) {
    const state = useGridSimulatorState(props);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.getElementById('sim-controls-portal');
        if (el) { setPortalTarget(el); return; }
        // Retry until target is available
        const interval = setInterval(() => {
            const el = document.getElementById('sim-controls-portal');
            if (el) { setPortalTarget(el); clearInterval(interval); }
        }, 100);
        const timeout = setTimeout(() => clearInterval(interval), 3000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, []);

    const hasRegions = props.pickerRegions && props.pickerRegions.length > 0;

    const handleCopyWaypoints = () => {
        const hops = state.getFinalHopList();
        navigator.clipboard.writeText(JSON.stringify(hops, null, 2))
            .then(() => alert(translate("Waypoints copied to clipboard!")))
            .catch(err => console.error(translate("Failed to copy"), err));
    };

    const handleExportWaypoints = () => {
        const hops = state.getFinalHopList();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hops, null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = "grid-search-waypoints.json";
        anchor.click();
    };

    return (
        <div className="relative overflow-hidden pt-2 flex flex-col">
            {portalTarget && createPortal(
                <SimulatorControls
                    gridCells={state.gridCells}
                    progressIndex={state.progressIndex}
                    isPlaying={state.isPlaying}
                    speed={state.speed}
                    isCalculating={state.isCalculating}
                    pickerPolygons={props.pickerPolygons}
                    skippedCellsRef={state.skippedCellsRef}
                    setIsPlaying={state.setIsPlaying}
                    setProgressIndex={state.setProgressIndex}
                    setSpeed={state.setSpeed}
                    computeGrid={state.computeGrid}
                    handleClear={state.handleClear}
                    canDebug={props.canDebug}
                    canPlaybackSpeed={props.canPlaybackSpeed}
                />,
                portalTarget
            )}
            {hasRegions && (
                <>
                    <div className="space-y-4 pb-4 mb-4 border-b dark:border-gray-700">
                        <SimulatorStats
                            progressIndex={state.progressIndex}
                            totalCells={state.gridCells.length}
                            validCount={state.validCount}
                            skippedCount={state.skippedCount}
                            processedCount={state.processedCount}
                            handleCopyWaypoints={handleCopyWaypoints}
                            handleExportWaypoints={handleExportWaypoints}
                        />
                    </div>

                    <SimulatorSettingsPanel {...state} />

                    {state.isCalculating && (
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/50 dark:bg-gray-900/50 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                            <div className="bg-white dark:bg-gray-800 shadow-lg border dark:border-gray-700 rounded-md p-4 flex flex-col items-center text-sm font-medium text-blue-600 dark:text-blue-400 max-w-xs text-center">
                                <div className="flex items-center mb-3">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    <span>
                                        <T>Calculating...</T>
                                        {state.calcStats.total > 0 && <span className="block text-xs font-normal text-gray-500 mt-1">{state.calcStats.current} / {state.calcStats.total} <T>cells</T></span>}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { state.stopRequestedRef.current = true; }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded transition-colors text-xs font-semibold"
                                >
                                    <T>Stop</T>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
