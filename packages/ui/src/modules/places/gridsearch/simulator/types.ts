import { GridGeneratorOptions, GridFeature, SimulatorGridCell } from '@polymech/shared';
import type { FeatureCollection, Polygon, MultiPolygon, Point, LineString, Feature } from 'geojson';

type SimulatorBaseConfig = Required<Omit<GridGeneratorOptions, 'features' | 'onFilterCell' | 'skipPolygons'>>;

export interface GridSimulatorSettings extends SimulatorBaseConfig {
    enableElevation: boolean;
    enableDensity: boolean;
    enableGhsPop: boolean;
    enableGhsBuilt: boolean;
}

export interface GridSearchSimulatorProps {
    pickerRegions: any[];
    pickerPolygons: FeatureCollection<Polygon | MultiPolygon>[];
    onFilterCell?: (cell: GridFeature | SimulatorGridCell | Feature<any, any>) => boolean;
    setSimulatorData: (data: FeatureCollection<Polygon | MultiPolygon | Point, any>) => void;
    setSimulatorPath: (data: FeatureCollection<LineString, any>) => void;
    setSimulatorScanner: (data: FeatureCollection<Point, any>) => void;
    initialSettings?: Partial<GridSimulatorSettings>;
    simulatorSettings?: GridSimulatorSettings;
    onSimulatorSettingsChange?: (settings: GridSimulatorSettings) => void;
    canDebug?: boolean;
    canPlaybackSpeed?: boolean;
}
