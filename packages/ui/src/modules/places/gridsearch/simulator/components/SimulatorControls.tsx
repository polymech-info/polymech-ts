import React from 'react';
import { Play, Pause, Square, FastForward, Eye, Bug } from 'lucide-react';
import { T, translate } from '@/i18n';

interface SimulatorControlsProps {
    gridCells: any[];
    progressIndex: number;
    isPlaying: boolean;
    speed: number;
    isCalculating: boolean;
    pickerPolygons: any[];
    skippedCellsRef: React.MutableRefObject<any[]>;
    setIsPlaying: (p: boolean) => void;
    setProgressIndex: (i: number | ((prev: number) => number)) => void;
    setSpeed: (s: number) => void;
    computeGrid: (autoplay: boolean | 'preview') => void;
    handleClear: () => void;
    canDebug?: boolean;
    canPlaybackSpeed?: boolean;
}

export function SimulatorControls({
    gridCells, progressIndex, isPlaying, speed, isCalculating, pickerPolygons, skippedCellsRef,
    setIsPlaying, setProgressIndex, setSpeed, computeGrid, handleClear,
    canDebug = true, canPlaybackSpeed = true
}: SimulatorControlsProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
                <button
                    onClick={() => {
                        if (gridCells.length === 0) {
                            computeGrid(true);
                        } else {
                            if (!isPlaying && progressIndex >= gridCells.length) {
                                setProgressIndex(0);
                            }
                            setIsPlaying(!isPlaying);
                        }
                    }}
                    disabled={isCalculating || !pickerPolygons || pickerPolygons.length === 0}
                    className={`p-2 rounded ${isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    onClick={handleClear}
                    disabled={isCalculating}
                    className="p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={translate("Clear Grid")}
                >
                    <Square className="w-4 h-4" />
                </button>

                {canDebug && (
                    <button
                        onClick={() => {
                            console.log('--- GRID SEARCH DEBUG DUMP ---');
                            console.log(`Valid Cells: ${gridCells.length}`, gridCells.slice(0, 5).map(c => c.properties));

                            const skipped = skippedCellsRef.current;
                            console.log(`Skipped Cells: ${skipped.length}`);
                            const skippedByReason = skipped.reduce((acc: any, cell: any) => {
                                const r = cell.properties?._reason || cell.properties?.sim_skip_reason || 'Unknown';
                                acc[r] = (acc[r] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);
                            console.log('Skipped Breakdown:', skippedByReason);
                            console.log('Skipped Sample (first 5):', skipped.slice(0, 5).map((c: any) => c.properties));
                            console.log('------------------------------');
                        }}
                        disabled={isCalculating}
                        className="p-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title={translate("Print Debug Info to Console")}
                    >
                        <Bug className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs font-semibold pr-1"><T>Debug</T></span>
                    </button>
                )}
            </div>

            {canPlaybackSpeed && (
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded p-1 text-xs">
                    <FastForward className="w-3 h-3 text-gray-500 mr-1" />
                    {[0.5, 1, 5, 10, 50].map(s => (
                        <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 rounded ${speed === s ? 'bg-white dark:bg-gray-600 shadow-sm font-bold' : ''}`}>
                            {s}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
