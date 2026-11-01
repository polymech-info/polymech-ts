import React, { useRef, useState } from 'react';
import { Copy, Download, Upload, Settings2, Sparkles } from 'lucide-react';
import { DeferredNumberInput, DeferredRangeSlider } from './DeferredInputs';
import { GridSimulatorSettings } from '../types';
import { T, translate } from '@/i18n';
import { Slider } from '@/components/ui/slider';

interface SimulatorSettingsPanelProps {
    // Current State
    settings: GridSimulatorSettings;
    ghsBounds: { minPop: number; maxPop: number; minBuilt: number; maxBuilt: number; };

    // Setters

    // Actions
    getCurrentSettings: () => GridSimulatorSettings;
    applySettings: (settings: Partial<GridSimulatorSettings>) => void;
}

export function SimulatorSettingsPanel(props: SimulatorSettingsPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAdvanced, setIsAdvanced] = useState(() => {
        return !(
            props.settings.gridMode === 'centers' &&
            props.settings.pathOrder === 'shortest' &&
            props.settings.bypassFilters === true &&
            props.settings.cellSize === 10
        );
    });

    const handleModeChange = (advanced: boolean) => {
        setIsAdvanced(advanced);
        if (!advanced) {
            props.applySettings({
                gridMode: 'centers',
                pathOrder: 'shortest',
                bypassFilters: true,
                cellSize: 5
            });
        }
    };

    const handleCopySettings = () => {
        navigator.clipboard.writeText(JSON.stringify(props.getCurrentSettings(), null, 2))
            .then(() => alert(translate("Settings copied to clipboard!")))
            .catch(err => console.error(translate("Failed to copy"), err));
    };

    const handleExportSettings = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(props.getCurrentSettings(), null, 2));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = "grid-simulator-settings.json";
        anchor.click();
    };

    const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                props.applySettings(json);
            } catch (err) {
                alert(translate("Invalid JSON file"));
                console.error(err);
            }
        };
        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700/50 mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <T>Settings</T>
                </h4>
                <div className="flex bg-gray-200 dark:bg-gray-700 p-0.5 rounded-md">
                    <button
                        onClick={() => handleModeChange(false)}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${!isAdvanced ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <Sparkles className="w-3 h-3" />
                        <T>Simple</T>
                    </button>
                    <button
                        onClick={() => handleModeChange(true)}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${isAdvanced ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <Settings2 className="w-3 h-3" />
                        <T>Advanced</T>
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCopySettings} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title={translate("Copy settings to clipboard")}>
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportSettings} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title={translate("Download settings JSON")}>
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" title={translate("Import settings JSON")}>
                        <Upload className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="application/json" onChange={handleImportSettings} />
                </div>
            </div>

            <div className="flex flex-col gap-3 mb-3">
                {isAdvanced && (
                    <div className="bg-white dark:bg-gray-800 p-2 border dark:border-gray-700 rounded-md">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2"><T>Grid Simulation Mode</T></label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => props.applySettings({ gridMode: 'hex' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.gridMode === 'hex' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Hex Geometric Grid</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ gridMode: 'square' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.gridMode === 'square' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Square Geometric Grid</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ gridMode: 'admin' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.gridMode === 'admin' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Native GADM Regions</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ gridMode: 'centers' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.gridMode === 'centers' ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>GHS Centers</T>
                            </button>
                        </div>
                    </div>
                )}

                {isAdvanced && (
                    <div className="bg-white dark:bg-gray-800 p-2 border dark:border-gray-700 rounded-md">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2"><T>Scan Trajectory</T></label>
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => props.applySettings({ pathOrder: 'zigzag' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.pathOrder === 'zigzag' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Zig-Zag</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ pathOrder: 'snake' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.pathOrder === 'snake' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Snake</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ pathOrder: 'spiral-out' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.pathOrder === 'spiral-out' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Spiral Out</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ pathOrder: 'spiral-in' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.pathOrder === 'spiral-in' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Spiral In</T>
                            </button>
                            <button
                                onClick={() => props.applySettings({ pathOrder: 'shortest' })}
                                className={`flex-1 py-1.5 text-xs rounded transition-colors ${props.settings.pathOrder === 'shortest' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                            >
                                <T>Shortest</T>
                            </button>
                        </div>

                        <label className="flex items-center text-xs text-gray-700 dark:text-gray-300 mt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={props.settings.groupByRegion}
                                onChange={e => props.applySettings({ groupByRegion: e.target.checked })}
                                className="mr-2"
                            />
                            <T>Constrain process sequentially per boundary</T>
                        </label>
                    </div>
                )}

                {isAdvanced && (
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t dark:border-gray-700">
                        <div className={props.settings.enableElevation ? '' : 'opacity-40'}>
                            <label className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                                <input type="checkbox" checked={props.settings.enableElevation} onChange={(e) => props.applySettings({ enableElevation: e.target.checked })} className="mr-2" />
                                <T>Max Elevation (m)</T>
                            </label>
                            <div className={props.settings.enableElevation ? '' : 'pointer-events-none select-none'}>
                                <DeferredNumberInput
                                    className="w-full border rounded p-1 text-xs dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                    value={props.settings.maxElevation}
                                    onChange={(num: number) => props.applySettings({ maxElevation: num })}
                                />
                                <span className="text-[10px] text-gray-500"><T>Drop &gt;</T> {props.settings.maxElevation}m</span>
                            </div>
                        </div>
                        <div className={props.settings.enableDensity ? '' : 'opacity-40'}>
                            <label className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                                <input type="checkbox" checked={props.settings.enableDensity} onChange={(e) => props.applySettings({ enableDensity: e.target.checked })} className="mr-2" />
                                <T>Min Density (p/km²)</T>
                            </label>
                            <div className={props.settings.enableDensity ? '' : 'pointer-events-none select-none'}>
                                <DeferredNumberInput
                                    className="w-full border rounded p-1 text-xs dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                    value={props.settings.minDensity}
                                    onChange={(num: number) => props.applySettings({ minDensity: num })}
                                />
                                <span className="text-[10px] text-gray-500"><T>Drop &lt;</T> {props.settings.minDensity}</span>
                            </div>
                        </div>

                        <div className="col-span-2 flex flex-col border-b pb-2 mb-2 mt-2 dark:border-gray-700 gap-2">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200"><T>GHS Data Thresholds</T></h3>
                                <p className="text-[10px] text-gray-500"><T>Logic when filters are active.</T></p>
                            </div>
                            <div className="flex flex-col gap-3 items-start mt-2">
                                <label className="flex items-center text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer" title={translate("If enabled, it ignores ALL density, elevation, geometry overlap, and custom filters. Will push all raw items")}>
                                    <input type="checkbox" checked={props.settings.bypassFilters} onChange={e => props.applySettings({ bypassFilters: e.target.checked })} className="mr-1" />
                                    <T>Bypass All Filters</T>
                                </label>
                                <label className="flex items-center text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer" title={translate("If a region is physically missing GHS raster data, allow it to pass instead of auto-failing")}>
                                    <input type="checkbox" checked={props.settings.allowMissingGhs} onChange={e => props.applySettings({ allowMissingGhs: e.target.checked })} className="mr-1" />
                                    <T>Allow Missing Data Gaps</T>
                                </label>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => props.applySettings({ ghsFilterMode: props.settings.ghsFilterMode === 'AND' ? 'OR' : 'AND' })}>
                                    <span className={`text-[10px] font-semibold ${props.settings.ghsFilterMode === 'AND' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>AND</span>
                                    <button
                                        type="button"
                                        className="relative inline-flex h-4 w-8 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none"
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${props.settings.ghsFilterMode === 'OR' ? 'translate-x-4' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-[10px] font-semibold ${props.settings.ghsFilterMode === 'OR' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>OR</span>
                                </div>
                            </div>
                        </div>

                        <div className={`col-span-2 ${props.settings.enableGhsPop ? '' : 'opacity-50'}`}>
                            <label className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                                <span className="flex items-center">
                                    <input type="checkbox" checked={props.settings.enableGhsPop} onChange={(e) => props.applySettings({ enableGhsPop: e.target.checked })} className="mr-2" />
                                    <T>Min GHS Population</T>
                                </span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{props.settings.minGhsPop.toLocaleString()}</span>
                            </label>
                            <div className={`flex gap-2 items-center ${props.settings.enableGhsPop ? '' : 'pointer-events-none select-none'}`}>
                                <span className="text-[10px] text-gray-400">{props.ghsBounds.minPop > 0 ? props.ghsBounds.minPop.toLocaleString() : '0'}</span>
                                <DeferredRangeSlider
                                    min={Math.floor(props.ghsBounds.minPop)}
                                    max={Math.ceil(props.ghsBounds.maxPop)}
                                    step={parseInt(((props.ghsBounds.maxPop - props.ghsBounds.minPop) / 100).toFixed(0)) || 1}
                                    value={props.settings.minGhsPop}
                                    onChange={(num: number) => props.applySettings({ minGhsPop: num })}
                                    className="flex-1"
                                />
                                <span className="text-[10px] text-gray-400">{props.ghsBounds.maxPop > 0 ? props.ghsBounds.maxPop.toLocaleString() : translate('Max')}</span>
                            </div>
                        </div>
                        <div className={`col-span-2 ${props.settings.enableGhsBuilt ? '' : 'opacity-50'}`}>
                            <label className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                                <span className="flex items-center">
                                    <input type="checkbox" checked={props.settings.enableGhsBuilt} onChange={(e) => props.applySettings({ enableGhsBuilt: e.target.checked })} className="mr-2" />
                                    <T>Min GHS Built Area</T>
                                </span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{props.settings.minGhsBuilt.toLocaleString()}</span>
                            </label>
                            <div className={`flex gap-2 items-center ${props.settings.enableGhsBuilt ? '' : 'pointer-events-none select-none'}`}>
                                <span className="text-[10px] text-gray-400">{props.ghsBounds.minBuilt > 0 ? props.ghsBounds.minBuilt.toLocaleString() : '0'}</span>
                                <DeferredRangeSlider
                                    min={Math.floor(props.ghsBounds.minBuilt)}
                                    max={Math.ceil(props.ghsBounds.maxBuilt)}
                                    step={parseInt(((props.ghsBounds.maxBuilt - props.ghsBounds.minBuilt) / 100).toFixed(0)) || 1}
                                    value={props.settings.minGhsBuilt}
                                    onChange={(num: number) => props.applySettings({ minGhsBuilt: num })}
                                    className="flex-1"
                                />
                                <span className="text-[10px] text-gray-400">{props.ghsBounds.maxBuilt > 0 ? props.ghsBounds.maxBuilt.toLocaleString() : translate('Max')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`bg-white dark:bg-gray-800 p-2 border dark:border-gray-700 rounded-md space-y-3 transition-opacity ${props.settings.gridMode === 'admin' ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                            <T>Resolution (km)</T>: <span className="text-blue-600 dark:text-blue-400 font-medium">{props.settings.cellSize}</span>
                        </label>
                        <Slider
                            className="w-full py-2"
                            value={[props.settings.cellSize]}
                            onValueChange={(val: number[]) => props.applySettings({ cellSize: val[0] })}
                            min={1}
                            max={1000}
                            step={1}
                            disabled={props.settings.gridMode === 'admin'}
                        />
                    </div>
                </div>
                {isAdvanced && (
                    <div className="grid grid-cols-2 gap-4 mt-2 border-t dark:border-gray-700 pt-3">
                        {props.settings.gridMode === 'centers' ? (
                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1"><T>Centroid Overlap Allowed %</T></label>
                                <DeferredRangeSlider
                                    className="w-full"
                                    value={props.settings.centroidOverlap}
                                    onChange={(num: number) => props.applySettings({ centroidOverlap: num })}
                                    min={0}
                                    max={100}
                                    step={1}
                                    title={translate("0% means centroids must be at least 1 cell-size apart. 100% allows exact duplicates.")}
                                />
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span><T>No Overlap (Dist)</T></span>
                                    <span><T>Full Overlap</T></span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1"><T>Overlap %</T></label>
                                <DeferredNumberInput
                                    className="w-full border rounded p-1 text-xs dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                    value={props.settings.cellOverlap}
                                    onChange={(num: number) => props.applySettings({ cellOverlap: num })}
                                    min={0}
                                    max={100}
                                    step={1}
                                    title={translate("Increase to balloon the geometric cells and ensure no places are missed at the seams.")}
                                    disabled={props.settings.gridMode === 'admin'}
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1"><T>Grid Generation Limit</T></label>
                            <DeferredNumberInput
                                className="w-full border rounded p-1 text-xs dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                value={props.settings.maxCellsLimit}
                                onChange={(num: number) => props.applySettings({ maxCellsLimit: num })}
                                step={500}
                                disabled={props.settings.gridMode === 'admin'}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
