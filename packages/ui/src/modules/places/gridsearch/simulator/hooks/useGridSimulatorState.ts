import { useState, useEffect, useCallback, useRef } from 'react';
import * as turf from '@turf/turf';
import { generateGridSearchCells, extractGridWaypoints, SimulatorGridCell, GridSearchHop, GridFeature } from '@polymech/shared';
import { GridSimulatorSettings, GridSearchSimulatorProps } from '../types';
import { fetchRegionBoundary } from '../../../client-gridsearch';

export function useGridSimulatorState({
    pickerRegions,
    pickerPolygons,
    onFilterCell,
    setSimulatorData,
    setSimulatorPath,
    setSimulatorScanner,
    initialSettings,
    simulatorSettings,
    onSimulatorSettingsChange
}: GridSearchSimulatorProps) {

    const [gridCells, setGridCells] = useState<SimulatorGridCell[]>([]);
    const [progressIndex, setProgressIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(0.5);
    const [skippedTotal, setSkippedTotal] = useState(0);

    // Config
    const defaultSettings: GridSimulatorSettings = {
        gridMode: 'centers',
        pathOrder: 'shortest',
        groupByRegion: true,
        cellSize: 5,
        cellOverlap: 0,
        centroidOverlap: 50,
        ghsFilterMode: 'AND',
        maxCellsLimit: 50000,
        maxElevation: 700,
        minDensity: 10,
        minGhsPop: 0,
        minGhsBuilt: 0,
        enableElevation: false,
        enableDensity: false,
        enableGhsPop: false,
        enableGhsBuilt: false,
        allowMissingGhs: false,
        bypassFilters: true
    };

    const [localSettings, setLocalSettings] = useState<GridSimulatorSettings>(defaultSettings);
    const settings = simulatorSettings || localSettings;

    const {
        gridMode, pathOrder, groupByRegion, cellSize, cellOverlap, centroidOverlap,
        ghsFilterMode, maxCellsLimit, maxElevation, minDensity, minGhsPop, minGhsBuilt,
        enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters
    } = settings;

    const [isCalculating, setIsCalculating] = useState(false);
    const [calcStats, setCalcStats] = useState({ current: 0, total: 0, valid: 0 });
    const skippedCellsRef = useRef<SimulatorGridCell[]>([]);

    const applySettings = useCallback((updates: Partial<GridSimulatorSettings>) => {
        if (!updates) return;
        if (onSimulatorSettingsChange) {
            onSimulatorSettingsChange({ ...settings, ...updates });
        } else {
            setLocalSettings(prev => ({ ...prev, ...updates }));
        }
    }, [onSimulatorSettingsChange, settings]);

    // Apply restored settings once on mount
    const appliedInitialRef = useRef(false);
    useEffect(() => {
        if (!initialSettings || appliedInitialRef.current) return;
        appliedInitialRef.current = true;
        applySettings(initialSettings);
    }, [initialSettings, applySettings]);

    const stopRequestedRef = useRef<boolean>(false);
    const reqRef = useRef<number>();
    const lastTickRef = useRef<number>(0);
    const globalProcessedHopsRef = useRef<SimulatorGridCell[]>([]);

    const [ghsBounds, setGhsBounds] = useState({ minPop: 0, maxPop: 1000000, minBuilt: 0, maxBuilt: 1000000 });

    useEffect(() => {
        if (!pickerPolygons || pickerPolygons.length === 0) return;
        let minPop = Infinity;
        let maxPop = -Infinity;
        let minBuilt = Infinity;
        let maxBuilt = -Infinity;

        pickerPolygons.forEach(fc => {
            if (fc && fc.features) {
                fc.features.forEach((f: any) => {
                    const raw = f.properties || {};
                    const pop = raw.ghsPopulation;
                    const built = raw.ghsBuiltWeight;
                    if (typeof pop === 'number') {
                        if (pop < minPop) minPop = pop;
                        if (pop > maxPop) maxPop = pop;
                    }
                    if (typeof built === 'number') {
                        if (built < minBuilt) minBuilt = built;
                        if (built > maxBuilt) maxBuilt = built;
                    }
                });
            }
        });

        if (minPop !== Infinity) {
            setGhsBounds({
                minPop, maxPop, minBuilt: minBuilt === Infinity ? 0 : minBuilt, maxBuilt: maxBuilt === -Infinity ? 1000000 : maxBuilt
            });
        }
    }, [pickerPolygons]);

    const getFinalHopList = (): GridSearchHop[] => {
        return extractGridWaypoints(gridCells.filter(c => c.properties.sim_status !== 'skipped'));
    };

    const getCurrentSettings = (): GridSimulatorSettings => ({
        gridMode, pathOrder, groupByRegion, cellSize, cellOverlap, centroidOverlap,
        ghsFilterMode, maxCellsLimit, maxElevation, minDensity, minGhsPop, minGhsBuilt,
        enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters
    });

    const computeGrid = useCallback(async (autoPlay: boolean | 'preview' = false) => {
        if (!pickerRegions || pickerRegions.length === 0 || !pickerPolygons) {
            setGridCells([]);
            setSimulatorData(turf.featureCollection([]));
            setSimulatorPath(turf.featureCollection([]));
            setSimulatorScanner(turf.featureCollection([]));
            return;
        }

        // For GHS Centers mode, use pickerPolygons directly — they're already fetched
        // at the effective level and enriched with GHS data. Re-fetching at region.level
        // can merge all features into one when the requested level exceeds available GADM depth
        // (e.g., L5 requested but country only has data through L4).
        const features: GridFeature[] = [];
        if (gridMode === 'centers' && pickerPolygons && pickerPolygons.length > 0) {
            for (const fc of pickerPolygons) {
                if (fc && fc.features) {
                    features.push(...(fc.features as GridFeature[]));
                }
            }
        } else {
            for (const region of pickerRegions) {
                const geojson = await fetchRegionBoundary(
                    region.gid,
                    region.gadmName || '',
                    region.level,
                    true // enrich
                );
                if (geojson && geojson.features) {
                    features.push(...(geojson.features as GridFeature[]));
                }
            }
        }

        if (features.length === 0) return;
        setIsCalculating(true);
        stopRequestedRef.current = false;
        setCalcStats({ current: 0, total: 0, valid: 0 });

        await new Promise(r => setTimeout(r, 10));

        try {
            const result = await generateGridSearchCells({
                features, gridMode, cellSize, pathOrder, groupByRegion, onFilterCell,
                maxElevation: enableElevation ? maxElevation : 0,
                minDensity: enableDensity ? minDensity : 0,
                minGhsPop: enableGhsPop ? minGhsPop : 0,
                minGhsBuilt: enableGhsBuilt ? minGhsBuilt : 0,
                allowMissingGhs,
                bypassFilters,
                cellOverlap: cellOverlap / 100,
                centroidOverlap: centroidOverlap / 100,
                ghsFilterMode,
                maxCellsLimit,
                skipPolygons: globalProcessedHopsRef.current
            }, async (stats) => {
                setCalcStats({ current: stats.current, total: stats.total, valid: stats.validCells.length });
                if (stopRequestedRef.current) return false;
                await new Promise(r => setTimeout(r, 0));
                return true;
            });

            if (result.error) {
                alert(result.error);
                setIsCalculating(false);
                return;
            }

            setGridCells(result.validCells);
            skippedCellsRef.current = result.skippedCells || [];
            setSkippedTotal(result.skippedCells ? result.skippedCells.length : 0);

            if (autoPlay === 'preview') {
                setProgressIndex(result.validCells.length);
                setIsPlaying(false);
            } else {
                setProgressIndex(0);
                setIsPlaying(stopRequestedRef.current ? false : autoPlay);
            }

            setSimulatorData(turf.featureCollection(result.validCells));
            setSimulatorPath(turf.featureCollection([]));
            setSimulatorScanner(turf.featureCollection([]));
            setIsCalculating(false);
        } catch (err) {
            console.error("Turf Error:", err);
            alert("An error occurred during grid generation.");
            setIsCalculating(false);
        }
    }, [pickerRegions, pickerPolygons, gridMode, pathOrder, groupByRegion, cellSize, cellOverlap, centroidOverlap, maxCellsLimit, maxElevation, minDensity, minGhsPop, minGhsBuilt, ghsFilterMode, onFilterCell, enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters, setSimulatorData, setSimulatorPath, setSimulatorScanner]);

    const activeSettingsRef = useRef({ gridMode, cellSize, cellOverlap, centroidOverlap, maxElevation, minDensity, minGhsPop, minGhsBuilt, ghsFilterMode, pathOrder, groupByRegion, maxCellsLimit, enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters });

    useEffect(() => {
        const prev = activeSettingsRef.current;
        let changed = false;

        if (prev.gridMode !== gridMode) changed = true;
        if (prev.cellSize !== cellSize) changed = true;
        if (prev.cellOverlap !== cellOverlap) changed = true;
        if (prev.centroidOverlap !== centroidOverlap) changed = true;
        if (prev.maxElevation !== maxElevation) changed = true;
        if (prev.minDensity !== minDensity) changed = true;
        if (prev.minGhsPop !== minGhsPop) changed = true;
        if (prev.minGhsBuilt !== minGhsBuilt) changed = true;
        if (prev.ghsFilterMode !== ghsFilterMode) changed = true;
        if (prev.pathOrder !== pathOrder) changed = true;
        if (prev.groupByRegion !== groupByRegion) changed = true;
        if (prev.maxCellsLimit !== maxCellsLimit) changed = true;
        if (prev.enableElevation !== enableElevation) changed = true;
        if (prev.enableDensity !== enableDensity) changed = true;
        if (prev.enableGhsPop !== enableGhsPop) changed = true;
        if (prev.enableGhsBuilt !== enableGhsBuilt) changed = true;
        if (prev.allowMissingGhs !== allowMissingGhs) changed = true;
        if (prev.bypassFilters !== bypassFilters) changed = true;

        if (changed) {
            globalProcessedHopsRef.current = [];
            activeSettingsRef.current = { gridMode, cellSize, cellOverlap, centroidOverlap, maxElevation, minDensity, minGhsPop, minGhsBuilt, ghsFilterMode, pathOrder, groupByRegion, maxCellsLimit, enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters };
            if (pickerPolygons && pickerPolygons.length > 0) {
                setTimeout(() => computeGrid('preview'), 0);
            }
        }
    }, [gridMode, cellSize, cellOverlap, centroidOverlap, maxElevation, minDensity, minGhsPop, minGhsBuilt, ghsFilterMode, pathOrder, groupByRegion, maxCellsLimit, pickerPolygons, computeGrid, enableElevation, enableDensity, enableGhsPop, enableGhsBuilt, allowMissingGhs, bypassFilters]);

    const prevRegionsRef = useRef<string>('');
    useEffect(() => {
        const currentRegions = (pickerRegions || []).map(r => r.gid).sort().join(',');
        if (prevRegionsRef.current !== currentRegions) {
            prevRegionsRef.current = currentRegions;
            setGridCells([]);
            setIsPlaying(false);
            setProgressIndex(0);
            setSimulatorData(turf.featureCollection([]));
            setSimulatorPath(turf.featureCollection([]));
            setSimulatorScanner(turf.featureCollection([]));
        }
    }, [pickerRegions, setSimulatorData, setSimulatorPath, setSimulatorScanner]);

    const handleClear = useCallback(() => {
        setGridCells([]);
        setIsPlaying(false);
        setProgressIndex(0);
        setSimulatorData(turf.featureCollection([]));
        setSimulatorPath(turf.featureCollection([]));
        setSimulatorScanner(turf.featureCollection([]));
        globalProcessedHopsRef.current = [];
    }, [setSimulatorData, setSimulatorPath, setSimulatorScanner]);

    // Animation Loop
    useEffect(() => {
        if (!isPlaying || progressIndex >= gridCells.length) {
            if (progressIndex >= gridCells.length && isPlaying) setIsPlaying(false);
            return;
        }

        const tick = (time: number) => {
            if (time - lastTickRef.current > (1000 / (10 * speed))) {
                setProgressIndex(prev => {
                    if (prev < gridCells.length) {
                        const cell = gridCells[prev];
                        if (cell.properties.sim_status !== 'skipped') {
                            globalProcessedHopsRef.current.push(cell);
                        }
                    }
                    const next = prev + 1;
                    return next > gridCells.length ? gridCells.length : next;
                });
                lastTickRef.current = time;
            }
            reqRef.current = requestAnimationFrame(tick);
        };

        reqRef.current = requestAnimationFrame(tick);
        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [isPlaying, progressIndex, gridCells.length, speed]);

    // Sync State to GeoJSON
    useEffect(() => {
        if (gridCells.length === 0) return;

        const updatedCells = gridCells.map((cell, i) => {
            if (cell.properties.sim_status === 'skipped') return cell;
            return {
                ...cell,
                properties: {
                    ...cell.properties,
                    sim_status: i < progressIndex ? 'processed' : 'pending'
                }
            };
        });
        setSimulatorData(turf.featureCollection(updatedCells));

        const pathCoords = gridCells
            .slice(0, progressIndex)
            .filter(c => c.properties.sim_status !== 'skipped')
            .map(c => turf.centroid(c).geometry.coordinates);

        if (pathCoords.length > 1) {
            setSimulatorPath(turf.featureCollection([turf.lineString(pathCoords)]));
        } else {
            setSimulatorPath(turf.featureCollection([]));
        }

        const activeCells = gridCells.filter(c => c.properties.sim_status !== 'skipped');
        const currentIndex = gridCells.slice(0, progressIndex).filter(c => c.properties.sim_status !== 'skipped').length;

        if (currentIndex > 0 && currentIndex <= activeCells.length) {
            const currentCell = activeCells[currentIndex - 1];
            const centroid = turf.centroid(currentCell);

            // Always face the NEXT waypoint (forward-looking bearing)
            let angle = 0;
            if (currentIndex < activeCells.length) {
                // Next cell exists — face toward it
                const nextCell = activeCells[currentIndex];
                angle = turf.bearing(centroid, turf.centroid(nextCell));
            } else if (currentIndex > 1) {
                // Last cell — keep facing the same direction as the last move
                const prevCell = activeCells[currentIndex - 2];
                angle = turf.bearing(turf.centroid(prevCell), centroid);
            }

            centroid.properties = {
                bearing: angle,
                icon_state: (progressIndex % 2 === 0) ? 'pacman-open' : 'pacman-closed'
            };
            setSimulatorScanner(turf.featureCollection([centroid]));
        } else {
            setSimulatorScanner(turf.featureCollection([]));
        }

    }, [progressIndex, gridCells, setSimulatorData, setSimulatorPath, setSimulatorScanner]);

    const processedCount = progressIndex;
    const skippedCount = skippedTotal;
    const validCount = gridCells.length;

    return {
        // State
        gridCells,
        progressIndex,
        isPlaying,
        speed,
        isCalculating,
        calcStats,
        skippedCellsRef,
        stopRequestedRef,

        // Metrics
        processedCount,
        skippedCount,
        validCount,
        ghsBounds,

        // Configuration actions
        settings,
        applySettings,

        // Core Actions
        setIsPlaying,
        setProgressIndex,
        setSpeed,
        computeGrid,
        handleClear,
        getFinalHopList,
        getCurrentSettings,
    };
}
