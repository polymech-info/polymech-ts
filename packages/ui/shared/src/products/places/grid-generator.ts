import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson';

export interface GridSearchHop {
    step: number;
    lng: number;
    lat: number;
    radius_km?: number;
}

export interface GridFeatureProperties {
    areaSqKm?: number;
    avgElevation?: number;
    population?: number;
    ghsPopulation?: number;
    ghsBuiltWeight?: number;
    ghsPopCenter?: [number, number];
    ghsBuiltCenter?: [number, number];
    ghsPopCenters?: number[][];
    ghsBuiltCenters?: number[][];
    [key: string]: any;
}

export interface SimulatorGridCellProperties extends GridFeatureProperties {
    sim_status: 'pending' | 'processed' | 'skipped';
    sim_region_idx: number;
    _reason?: string;
    search_center?: [number, number] | null;
    search_radius_km?: number;
    sim_index?: number;
    is_center_cell?: boolean;
    sim_skip_reason?: string;
}

export type GridFeature = Feature<Polygon | MultiPolygon, GridFeatureProperties>;
export type SimulatorGridCell = Feature<Polygon | MultiPolygon, SimulatorGridCellProperties>;

export interface GridGeneratorProgressStats {
    current: number;
    total: number;
    validCells: SimulatorGridCell[];
    skippedCells: SimulatorGridCell[];
}

export interface GridGeneratorOptions {
    features: GridFeature[];
    gridMode: 'hex' | 'square' | 'admin' | 'centers';
    cellSize: number;
    cellOverlap?: number;
    centroidOverlap?: number;
    maxCellsLimit?: number;
    maxElevation: number;
    minDensity: number;
    minGhsPop?: number;
    minGhsBuilt?: number;
    pathOrder: 'zigzag' | 'snake' | 'spiral-out' | 'spiral-in' | 'shortest';
    groupByRegion: boolean;
    ghsFilterMode?: 'AND' | 'OR';
    allowMissingGhs?: boolean;
    onFilterCell?: (cell: Feature<any, any>) => boolean;
    skipPolygons?: Feature<Polygon | MultiPolygon, any>[];
    bypassFilters?: boolean;
}

export interface GridGeneratorResult {
    validCells: SimulatorGridCell[];
    skippedCells: SimulatorGridCell[];
    waypoints: GridSearchHop[];
    error?: string;
}

// ============================================================================
// Core Utility Functions
// ============================================================================

export function extractGridWaypoints(cells: SimulatorGridCell[]): GridSearchHop[] {
    return cells.map((cell, i) => {
        const pt = turf.centroid(cell).geometry.coordinates;
        return {
            step: cell.properties.sim_index !== undefined ? cell.properties.sim_index + 1 : i + 1,
            lng: Number(pt[0].toFixed(6)),
            lat: Number(pt[1].toFixed(6)),
            radius_km: cell.properties.search_radius_km ? Number(cell.properties.search_radius_km.toFixed(2)) : undefined
        };
    });
}

function checkCellFilters(props: GridFeatureProperties, options: GridGeneratorOptions, areaSqKm: number): { allowed: boolean, reason: string } {
    const { maxElevation, minDensity, minGhsPop = 0, minGhsBuilt = 0, ghsFilterMode = 'AND', allowMissingGhs = false, bypassFilters } = options;
    let allowed = true;
    let reason = '';

    if (bypassFilters) return { allowed, reason };

    if (props.avgElevation !== undefined && maxElevation > 0 && props.avgElevation > maxElevation) {
        return { allowed: false, reason: `Elevation ${Math.round(props.avgElevation)}m > ${maxElevation}m` };
    }

    if (props.population !== undefined && areaSqKm > 0 && minDensity > 0) {
        const density = props.population / areaSqKm;
        if (density < minDensity) {
            return { allowed: false, reason: `Density ${density.toFixed(1)} < ${minDensity}` };
        }
    }

    const checkPop = minGhsPop > 0;
    const checkBuilt = minGhsBuilt > 0;

    if (checkPop || checkBuilt) {
        const hasPopData = props.ghsPopulation !== undefined;
        const hasBuiltData = props.ghsBuiltWeight !== undefined;
        const ghsPop = typeof props.ghsPopulation === 'number' ? props.ghsPopulation : 0;
        const ghsBuilt = typeof props.ghsBuiltWeight === 'number' ? props.ghsBuiltWeight : 0;
        const popPass = checkPop && ((!hasPopData && allowMissingGhs) || ghsPop >= minGhsPop);
        const builtPass = checkBuilt && ((!hasBuiltData && allowMissingGhs) || ghsBuilt >= minGhsBuilt);

        if (ghsFilterMode === 'OR') {
            if (checkPop && checkBuilt && !popPass && !builtPass) {
                return { allowed: false, reason: `GHS (OR) Pop < ${minGhsPop} & Built < ${minGhsBuilt}` };
            } else if (checkPop && !checkBuilt && !popPass) {
                return { allowed: false, reason: `GHS Pop < ${minGhsPop}` };
            } else if (checkBuilt && !checkPop && !builtPass) {
                return { allowed: false, reason: `GHS Built < ${minGhsBuilt}` };
            }
        } else {
            if (checkPop && !popPass) {
                return { allowed: false, reason: `GHS Pop ${Math.round(ghsPop)} < ${minGhsPop}` };
            } else if (checkBuilt && !builtPass) {
                return { allowed: false, reason: `GHS Built ${Math.round(ghsBuilt)} < ${minGhsBuilt}` };
            }
        }
    }
    return { allowed, reason };
}

function checkSkipPolygons(pt: Feature<Point>, skipPolygons?: Feature<Polygon | MultiPolygon, any>[]): boolean {
    if (!skipPolygons || skipPolygons.length === 0) return false;
    for (const oldPoly of skipPolygons) {
        if (turf.booleanPointInPolygon(pt, oldPoly)) {
            return true;
        }
    }
    return false;
}

function sortGridCells(
    validCells: SimulatorGridCell[],
    pathOrder: GridGeneratorOptions['pathOrder'],
    cellSize: number,
    groupByRegion: boolean,
    featuresLength: number
): SimulatorGridCell[] {
    let cellsToSort = [...validCells];

    const sortArray = (cells: SimulatorGridCell[]) => {
        const rowTolerance = Math.min((cellSize / 111.32) * 0.5, 0.5);

        if (pathOrder === 'zigzag' || pathOrder === 'snake') {
            cells.sort((a, b) => {
                const centA = turf.centroid(a).geometry.coordinates;
                const centB = turf.centroid(b).geometry.coordinates;
                if (Math.abs(centA[1] - centB[1]) > rowTolerance) {
                    return centB[1] - centA[1];
                }
                return centA[0] - centB[0];
            });

            if (pathOrder === 'snake') {
                const rows: SimulatorGridCell[][] = [];
                let currentRow: SimulatorGridCell[] = [];
                let lastY = cells.length > 0 ? turf.centroid(cells[0]).geometry.coordinates[1] : 0;

                cells.forEach(cell => {
                    const y = turf.centroid(cell).geometry.coordinates[1];
                    if (Math.abs(y - lastY) > rowTolerance) {
                        rows.push(currentRow);
                        currentRow = [cell];
                        lastY = y;
                    } else {
                        currentRow.push(cell);
                    }
                });
                if (currentRow.length > 0) rows.push(currentRow);

                cells.length = 0;
                rows.forEach((row, i) => {
                    if (i % 2 === 1) cells.push(...row.reverse());
                    else cells.push(...row);
                });
            }

        } else if (pathOrder === 'spiral-out' || pathOrder === 'spiral-in') {
            if (cells.length > 0) {
                const fc = turf.featureCollection(cells);
                const center = turf.center(fc).geometry.coordinates;

                cells.sort((a, b) => {
                    const centA = turf.centroid(a).geometry.coordinates;
                    const centB = turf.centroid(b).geometry.coordinates;
                    const distA = turf.distance(center, centA);
                    const distB = turf.distance(center, centB);
                    return pathOrder === 'spiral-out' ? distA - distB : distB - distA;
                });
            }
        } else if (pathOrder === 'shortest') {
            if (cells.length > 1) {
                const sorted = [];
                const pts = cells.map(c => ({
                    cell: c,
                    pt: turf.centroid(c).geometry.coordinates
                }));

                let current = pts.shift()!;
                sorted.push(current.cell);

                while (pts.length > 0) {
                    let nearestIdx = 0;
                    let minDistSq = Infinity;
                    for (let i = 0; i < pts.length; i++) {
                        const dx = pts[i].pt[0] - current.pt[0];
                        const dy = pts[i].pt[1] - current.pt[1];
                        const distSq = dx * dx + dy * dy;
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            nearestIdx = i;
                        }
                    }
                    current = pts[nearestIdx];
                    sorted.push(current.cell);
                    pts.splice(nearestIdx, 1);
                }

                cells.length = 0;
                cells.push(...sorted);
            }
        }
    };

    if (groupByRegion && featuresLength > 1) {
        const grouped: Record<number, SimulatorGridCell[]> = {};
        cellsToSort.forEach(c => {
            const idx = c.properties.sim_region_idx;
            if (!grouped[idx]) grouped[idx] = [];
            grouped[idx].push(c);
        });

        cellsToSort = [];
        Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).forEach(k => {
            const cells = grouped[Number(k)];
            sortArray(cells);
            cellsToSort.push(...cells);
        });
    } else {
        sortArray(cellsToSort);
    }

    return cellsToSort.map((c, i) => ({
        ...c,
        properties: { ...c.properties, sim_index: i }
    }));
}

// ============================================================================
// Generators by Mode
// ============================================================================

async function generateAdminCells(
    options: GridGeneratorOptions,
    onProgress?: (stats: GridGeneratorProgressStats) => Promise<boolean>
): Promise<GridGeneratorResult> {
    const { features, onFilterCell, skipPolygons } = options;
    const validCells: SimulatorGridCell[] = [];
    const skippedCells: SimulatorGridCell[] = [];

    for (let i = 0; i < features.length; i++) {
        const f = features[i];

        if (i % 50 === 0 && onProgress) {
            const shouldContinue = await onProgress({ current: i, total: features.length, validCells, skippedCells });
            if (!shouldContinue) break;
        }

        const props = f.properties || {};
        const areaSqKm = props.areaSqKm !== undefined ? props.areaSqKm : (turf.area(f) / 1000000);

        let { allowed, reason } = checkCellFilters(props, options, areaSqKm);
        if (allowed && onFilterCell && !onFilterCell(f)) {
            allowed = false;
            reason = 'Failed custom filter function';
        }

        const center = turf.centroid(f).geometry.coordinates;
        const b = turf.bbox(f);
        const radiusKm = turf.distance(center, [b[2], b[3]], { units: 'kilometers' });

        if (allowed && checkSkipPolygons(turf.point(center), skipPolygons)) {
            allowed = false;
            reason = 'Already Simulated';
        }

        const cell = {
            ...f,
            properties: {
                ...props,
                sim_status: allowed ? 'pending' : 'skipped',
                sim_region_idx: i,
                _reason: reason,
                search_center: center,
                search_radius_km: radiusKm
            }
        } as SimulatorGridCell;

        if (allowed) validCells.push(cell);
        else skippedCells.push(cell);
    }

    return { validCells, skippedCells, waypoints: [] };
}

async function generateCenterCells(
    options: GridGeneratorOptions,
    onProgress?: (stats: GridGeneratorProgressStats) => Promise<boolean>
): Promise<GridGeneratorResult> {
    const { features, cellSize, centroidOverlap = 0.5, onFilterCell, skipPolygons } = options;
    const validCells: SimulatorGridCell[] = [];
    const skippedCells: SimulatorGridCell[] = [];
    const acceptedCenters: Feature<Point>[] = [];

    for (let i = 0; i < features.length; i++) {
        const f = features[i];
        const props = f.properties || {};

        if (i % 50 === 0 && onProgress) {
            const shouldContinue = await onProgress({ current: i, total: features.length, validCells, skippedCells });
            if (!shouldContinue) break;
        }

        const centersMap = new Map<string, { coord: [number, number], popWeight?: number, builtWeight?: number }>();
        const addCenter = (coord: [number, number], type: 'pop' | 'built', weight?: number) => {
            const key = `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
            if (!centersMap.has(key)) centersMap.set(key, { coord });
            const entry = centersMap.get(key)!;
            if (type === 'pop' && weight !== undefined) entry.popWeight = weight;
            if (type === 'built' && weight !== undefined) entry.builtWeight = weight;
        };

        if (props.ghsPopCenter && Array.isArray(props.ghsPopCenter)) addCenter(props.ghsPopCenter as [number, number], 'pop', props.ghsPopulation);
        if (props.ghsBuiltCenter && Array.isArray(props.ghsBuiltCenter)) addCenter(props.ghsBuiltCenter as [number, number], 'built', props.ghsBuiltWeight);

        if (Array.isArray(props.ghsPopCenters)) {
            props.ghsPopCenters.forEach((c: number[]) => addCenter([c[0], c[1]], 'pop', c[2]));
        }
        if (Array.isArray(props.ghsBuiltCenters)) {
            props.ghsBuiltCenters.forEach((c: number[]) => addCenter([c[0], c[1]], 'built', c[2]));
        }

        const uniqueCenters = Array.from(centersMap.values());
        //console.log(`[GHS Centers] Feature ${i} (${props.NAME_2 || props.NAME_1 || props.name || '?'}): popCenter=${props.ghsPopCenter ? 'yes' : 'no'}, builtCenter=${props.ghsBuiltCenter ? 'yes' : 'no'}, popCenters=${Array.isArray(props.ghsPopCenters) ? props.ghsPopCenters.length : 'none'}, builtCenters=${Array.isArray(props.ghsBuiltCenters) ? props.ghsBuiltCenters.length : 'none'}, unique=${uniqueCenters.length}`);

        for (let j = 0; j < uniqueCenters.length; j++) {
            const { coord, popWeight, builtWeight } = uniqueCenters[j];
            const pt = turf.point(coord);
            const areaSqKm = props.areaSqKm !== undefined ? props.areaSqKm : (turf.area(f) / 1000000);

            const centerProps = {
                ...props,
                ghsPopulation: popWeight !== undefined ? popWeight : props.ghsPopulation,
                ghsBuiltWeight: builtWeight !== undefined ? builtWeight : props.ghsBuiltWeight
            };

            let { allowed, reason } = checkCellFilters(centerProps, options, areaSqKm);

            if (allowed && acceptedCenters.length > 0) {
                const minAllowedDistance = cellSize * (1 - centroidOverlap);
                for (const existingPt of acceptedCenters) {
                    const dist = turf.distance(pt, existingPt, { units: 'kilometers' });
                    if (dist < minAllowedDistance) {
                        allowed = false;
                        reason = `overlaps another centroid (${dist.toFixed(2)}km < ${minAllowedDistance.toFixed(2)}km)`;
                        break;
                    }
                }
            }

            if (allowed && checkSkipPolygons(pt, skipPolygons)) {
                allowed = false;
                reason = 'already processed';
            }

            const cell = turf.buffer(pt, cellSize / 2, { units: 'kilometers', steps: 6 }) as unknown as SimulatorGridCell;
            if (cell) {
                cell.properties = { ...props, is_center_cell: true } as SimulatorGridCellProperties;
                if (allowed && onFilterCell && !onFilterCell(cell)) {
                    allowed = false;
                    reason = `custom filter`;
                }
                cell.properties!.sim_region_idx = i;
                cell.properties!.sim_status = allowed ? 'pending' : 'skipped';
                cell.properties!._reason = reason;

                if (allowed) {
                    validCells.push(cell);
                    acceptedCenters.push(pt);
                } else {
                    cell.properties!.sim_skip_reason = reason;
                    skippedCells.push(cell);
                }
            }
        }
    }

    return { validCells, skippedCells, waypoints: [] };
}

async function generatePolygonGrid(
    options: GridGeneratorOptions,
    onProgress?: (stats: GridGeneratorProgressStats) => Promise<boolean>
): Promise<GridGeneratorResult> {
    const { features, gridMode, cellSize, maxCellsLimit = 15000, cellOverlap = 0, onFilterCell, skipPolygons } = options;
    const validCells: SimulatorGridCell[] = [];
    const skippedCells: SimulatorGridCell[] = [];
    const fc = turf.featureCollection(features);
    const bbox = turf.bbox(fc);

    const width = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: 'kilometers' });
    const height = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: 'kilometers' });
    const approxCellArea = cellSize * cellSize * 2.6; // approx area of hexagon
    const approxCells = Math.ceil((width * height) / approxCellArea);

    if (approxCells > maxCellsLimit) {
        return {
            validCells: [],
            skippedCells: [],
            waypoints: [],
            error: `Grid is too massive (approx ${approxCells.toLocaleString()} cells). Please increase the cell size or select a smaller region to prevent your browser from freezing.`
        };
    }

    const grid = gridMode === 'square'
        ? turf.squareGrid(bbox, cellSize, { units: 'kilometers' })
        : turf.hexGrid(bbox, cellSize, { units: 'kilometers' });

    if (cellOverlap > 0) {
        turf.featureEach(grid, (cell) => {
            const scaled = turf.transformScale(cell, 1 + cellOverlap);
            cell.geometry = scaled.geometry;
        });
    }

    const totalFeatures = grid.features.length;
    for (let idx = 0; idx < totalFeatures; idx++) {
        const cell = grid.features[idx];

        if (idx % 50 === 0 && onProgress) {
            const shouldContinue = await onProgress({ current: idx, total: totalFeatures, validCells, skippedCells });
            if (!shouldContinue) break;
        }

        let intersects = false;
        let regionIndex = -1;
        for (let i = 0; i < features.length; i++) {
            const regionFeature = features[i];
            if (!regionFeature) continue;
            if (turf.booleanIntersects(cell, regionFeature as any)) {
                intersects = true;
                regionIndex = i;
                break;
            }
        }

        if (intersects) {
            const regionFeature = features[regionIndex];
            const props = regionFeature?.properties || {};
            const areaSqKm = props.areaSqKm !== undefined ? props.areaSqKm : (turf.area(regionFeature) / 1000000);

            let { allowed, reason } = checkCellFilters(props, options, areaSqKm);
            if (allowed && onFilterCell && !onFilterCell(cell)) {
                allowed = false;
                reason = 'Failed custom filter function';
            }

            const center = turf.centroid(cell).geometry.coordinates;
            const cellBbox = turf.bbox(cell);
            const radiusKm = turf.distance(center, [cellBbox[2], cellBbox[3]], { units: 'kilometers' });

            if (allowed && checkSkipPolygons(turf.point(center), skipPolygons)) {
                allowed = false;
                reason = 'Already Simulated';
            }

            cell.properties = {
                ...cell.properties,
                sim_status: allowed ? 'pending' : 'skipped',
                sim_region_idx: regionIndex,
                _reason: reason,
                search_center: center,
                search_radius_km: radiusKm
            };

            if (allowed) validCells.push(cell as unknown as SimulatorGridCell);
            else skippedCells.push(cell as unknown as SimulatorGridCell);
        }
    }

    return { validCells, skippedCells, waypoints: [] };
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function generateGridSearchCells(
    options: GridGeneratorOptions,
    onProgress?: (stats: GridGeneratorProgressStats) => Promise<boolean>
): Promise<GridGeneratorResult> {

    let result: GridGeneratorResult;

    if (options.gridMode === 'admin') {
        result = await generateAdminCells(options, onProgress);
    } else if (options.gridMode === 'centers') {
        result = await generateCenterCells(options, onProgress);
    } else {
        result = await generatePolygonGrid(options, onProgress);
    }

    if (result.error) {
        return result;
    }

    // Sort valid cells according to paths
    if (result.validCells.length > 0) {
        result.validCells = sortGridCells(
            result.validCells,
            options.pathOrder,
            options.cellSize,
            options.groupByRegion,
            options.features.length
        );
    }

    return {
        ...result,
        waypoints: extractGridWaypoints(result.validCells)
    };
}
