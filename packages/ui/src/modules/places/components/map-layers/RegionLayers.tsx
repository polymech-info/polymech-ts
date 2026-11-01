import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export interface RegionLayersProps {
    map: maplibregl.Map | null;
    isDarkStyle: boolean;
    bboxesFeatureCollection?: any;
    polygonsFeatureCollection?: any;
    pickerPolygons?: any[];
    showDensity?: boolean;
    showCenters?: boolean;
}

const emptyFc = { type: 'FeatureCollection', features: [] };

export function RegionLayers({
    map,
    isDarkStyle,
    bboxesFeatureCollection,
    polygonsFeatureCollection,
    pickerPolygons,
    showDensity = false,
    showCenters = false
}: RegionLayersProps) {

    const isDarkStyleRef = useRef(isDarkStyle);
    isDarkStyleRef.current = isDarkStyle;
    
    const showDensityRef = useRef(showDensity);
    showDensityRef.current = showDensity;

    const bboxesCollectionRef = useRef(bboxesFeatureCollection);
    bboxesCollectionRef.current = bboxesFeatureCollection;
    
    const polygonsCollectionRef = useRef(polygonsFeatureCollection);
    polygonsCollectionRef.current = polygonsFeatureCollection;

    const ghsCentersDataRef = useRef<any>(emptyFc);

    // Add Sources and Layers
    useEffect(() => {
        if (!map) return;

        const setupMapLayers = () => {
            if (!map.getStyle()) return;

            const currentIsDark = isDarkStyleRef.current;
            const currentShowDensity = showDensityRef.current;

            // Add Sources
            if (!map.getSource('grid-bboxes')) map.addSource('grid-bboxes', { type: 'geojson', data: bboxesCollectionRef.current || emptyFc as any });
            if (!map.getSource('grid-polygons')) map.addSource('grid-polygons', { type: 'geojson', data: polygonsCollectionRef.current || emptyFc as any });
            if (!map.getSource('ghs-centers')) map.addSource('ghs-centers', { type: 'geojson', data: ghsCentersDataRef.current || emptyFc as any });

            // Add Layers
            if (!map.getLayer('polygons-fill')) {
                map.addLayer({ 
                    id: 'polygons-fill', type: 'fill', source: 'grid-polygons', 
                    paint: { 'fill-color': currentIsDark ? '#3b82f6' : '#2563eb', 'fill-opacity': currentIsDark ? 0.3 : 0.5 },
                    layout: { visibility: currentShowDensity ? 'none' : 'visible' }
                });
            }

            if (!map.getLayer('polygons-line')) {
                map.addLayer({ 
                    id: 'polygons-line', type: 'line', source: 'grid-polygons', 
                    paint: { 'line-color': currentIsDark ? '#2563eb' : '#1d4ed8', 'line-width': currentIsDark ? 2 : 3 },
                    layout: { visibility: currentShowDensity ? 'none' : 'visible' }
                });
            }

            if (!map.getLayer('bboxes-fill')) {
                map.addLayer({ 
                    id: 'bboxes-fill', type: 'fill', source: 'grid-bboxes', 
                    paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0 } 
                });
            }

            if (!map.getLayer('bboxes-line')) {
                map.addLayer({ 
                    id: 'bboxes-line', type: 'line', source: 'grid-bboxes', 
                    paint: { 'line-color': '#d97706', 'line-width': 2, 'line-dasharray': [2, 2] } 
                });
            }

            if (!map.getLayer('density-fill')) {
                map.addLayer({
                    id: 'density-fill', type: 'fill', source: 'grid-bboxes',
                    layout: { visibility: currentShowDensity ? 'visible' : 'none' },
                    paint: {
                        'fill-color': [
                            'case',
                            ['all', ['has', 'population'], ['has', 'areaSqKm'], ['>', ['get', 'areaSqKm'], 0]],
                            ['interpolate', ['linear'], ['/', ['get', 'population'], ['get', 'areaSqKm']],
                                0, '#f7fcf5', 50, '#c7e9c0', 200, '#74c476', 500, '#31a354', 1000, '#006d2c', 5000, '#00441b'],
                            '#cccccc'
                        ],
                        'fill-opacity': 0.65
                    }
                });
            }

            if (!map.getLayer('ghs-centers-points')) {
                map.addLayer({
                    id: 'ghs-centers-points',
                    type: 'circle',
                    source: 'ghs-centers',
                    paint: {
                        'circle-radius': [
                            'case',
                            ['==', ['get', 'isMain'], true],
                            ['match', ['get', 'type'], 'pop', 7, 'built', 6, 5],
                            ['match', ['get', 'type'], 'pop', 4, 'built', 3, 3]
                        ],
                        'circle-color': ['match', ['get', 'type'], 'pop', '#facc15', 'built', '#f87171', '#aaaaaa'],
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#000000',
                        'circle-opacity': [
                            'case',
                            ['==', ['get', 'isMain'], true],
                            0.9,
                            0.7
                        ]
                    }
                });
            }
        };

        if (map.getStyle()) setupMapLayers();
        map.on('styledata', setupMapLayers);
        map.on('style.load', setupMapLayers);

        return () => {
            if (map && map.getStyle()) {
                map.off('styledata', setupMapLayers);
                map.off('style.load', setupMapLayers);
                if (map.getLayer('polygons-fill')) map.removeLayer('polygons-fill');
                if (map.getLayer('polygons-line')) map.removeLayer('polygons-line');
                if (map.getLayer('bboxes-fill')) map.removeLayer('bboxes-fill');
                if (map.getLayer('bboxes-line')) map.removeLayer('bboxes-line');
                if (map.getLayer('density-fill')) map.removeLayer('density-fill');
                if (map.getLayer('ghs-centers-points')) map.removeLayer('ghs-centers-points');
                if (map.getSource('grid-bboxes')) map.removeSource('grid-bboxes');
                if (map.getSource('grid-polygons')) map.removeSource('grid-polygons');
                if (map.getSource('ghs-centers')) map.removeSource('ghs-centers');
            }
        };
    }, [map]);

    // Update Styles
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        
        if (map.getLayer('polygons-fill')) {
            map.setPaintProperty('polygons-fill', 'fill-color', isDarkStyle ? '#3b82f6' : '#2563eb');
            map.setPaintProperty('polygons-fill', 'fill-opacity', isDarkStyle ? 0.3 : 0.5);
            map.setLayoutProperty('polygons-fill', 'visibility', showDensity ? 'none' : 'visible');
        }

        if (map.getLayer('polygons-line')) {
            map.setPaintProperty('polygons-line', 'line-color', isDarkStyle ? '#2563eb' : '#1d4ed8');
            map.setPaintProperty('polygons-line', 'line-width', isDarkStyle ? 2 : 3);
            map.setLayoutProperty('polygons-line', 'visibility', showDensity ? 'none' : 'visible');
        }

        if (map.getLayer('density-fill')) {
            map.setLayoutProperty('density-fill', 'visibility', showDensity ? 'visible' : 'none');
        }
    }, [map, isDarkStyle, showDensity]);

    // Update GHS Centers Source
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        try {
            if (showCenters && pickerPolygons && pickerPolygons.length > 0) {
                const features: any[] = [];
                pickerPolygons.forEach(fc => {
                    if (fc && fc.features) {
                        fc.features.forEach((f: any) => {
                            if (f.properties?.ghsBuiltCenter) {
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: f.properties.ghsBuiltCenter },
                                    properties: { type: 'built', isMain: true }
                                });
                            }
                            if (f.properties?.ghsPopCenter) {
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: f.properties.ghsPopCenter },
                                    properties: { type: 'pop', isMain: true }
                                });
                            }
                            if (Array.isArray(f.properties?.ghsBuiltCenters)) {
                                f.properties.ghsBuiltCenters.forEach((c: number[]) => {
                                    features.push({
                                        type: 'Feature',
                                        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
                                        properties: { type: 'built', isMain: false, value: c[2] }
                                    });
                                });
                            }
                            if (Array.isArray(f.properties?.ghsPopCenters)) {
                                f.properties.ghsPopCenters.forEach((c: number[]) => {
                                    features.push({
                                        type: 'Feature',
                                        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
                                        properties: { type: 'pop', isMain: false, value: c[2] }
                                    });
                                });
                            }
                        });
                    }
                });
                const newData = { type: 'FeatureCollection', features };
                ghsCentersDataRef.current = newData;
                if (map.getSource('ghs-centers')) (map.getSource('ghs-centers') as maplibregl.GeoJSONSource).setData(newData as any);
            } else {
                ghsCentersDataRef.current = emptyFc;
                if (map.getSource('ghs-centers')) (map.getSource('ghs-centers') as maplibregl.GeoJSONSource).setData(emptyFc as any);
            }
        } catch (e) {
            console.warn("Could not set ghs-centers", e);
        }
    }, [map, showCenters, pickerPolygons]);

    // Update Bboxes and Polygons Features
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        if ((window as any).__MAP_PERF_DEBUG__) {
            const fc = polygonsFeatureCollection as any;
            console.log(`[MapPerf] RegionLayers setData() called — polygons features: ${fc?.features?.length ?? 0}`);
        }
        try {
            if (map.getSource('grid-bboxes')) (map.getSource('grid-bboxes') as maplibregl.GeoJSONSource).setData(bboxesFeatureCollection || emptyFc as any);
            if (map.getSource('grid-polygons')) (map.getSource('grid-polygons') as maplibregl.GeoJSONSource).setData(polygonsFeatureCollection || emptyFc as any);
        } catch (e) {
            console.warn("Could not update grid-bboxes or grid-polygons", e);
        }
    }, [map, bboxesFeatureCollection, polygonsFeatureCollection]);

    return null;
}
