import React from 'react';
import { Copy, Download } from 'lucide-react';
import { T, translate } from '@/i18n';

interface SimulatorStatsProps {
    progressIndex: number;
    validCount: number;
    skippedCount: number;
    processedCount: number;
    totalCells: number;
    handleCopyWaypoints: () => void;
    handleExportWaypoints: () => void;
}

export function SimulatorStats({
    progressIndex, validCount, skippedCount, processedCount, totalCells, handleCopyWaypoints, handleExportWaypoints
}: SimulatorStatsProps) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1 text-gray-600 dark:text-gray-400">
                <span><T>Scanning...</T></span>
                <span className="font-mono">{progressIndex} / {totalCells}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 transition-all duration-75" style={{ width: totalCells > 0 ? `${(progressIndex / totalCells) * 100}%` : '0%' }}></div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs h-full">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded flex flex-col justify-between h-full">
                    <div>
                        <span className="block text-gray-500 font-semibold mb-1"><T>Target Calls</T></span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">{validCount}</span>
                    </div>
                    {totalCells > 0 && (
                        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 justify-center">
                            <button onClick={handleCopyWaypoints} className="text-gray-400 hover:text-sky-600 focus:outline-none flex items-center gap-1" title={translate("Copy Waypoints (GeoJSON)")}>
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleExportWaypoints} className="text-gray-400 hover:text-sky-600 focus:outline-none flex items-center gap-1" title={translate("Download Waypoints (GeoJSON)")}>
                                <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded flex flex-col justify-center h-full">
                    <span className="block text-red-500 font-semibold mb-1"><T>Skipped Calls</T></span>
                    <span className="font-mono text-red-800 dark:text-red-300">{skippedCount}</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded flex flex-col justify-center h-full">
                    <span className="block text-green-600 font-semibold mb-1"><T>Simulated Processed</T></span>
                    <span className="font-mono text-green-800 dark:text-green-300">{processedCount}</span>
                </div>
            </div>
        </div>
    );
}
