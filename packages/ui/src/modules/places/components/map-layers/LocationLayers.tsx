import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { type CompetitorFull } from '@polymech/shared';

export interface LocationLayersProps {
    map: maplibregl.Map | null;
    competitors: (CompetitorFull & { lat: number; lon: number; label: string })[];
    isDarkStyle: boolean;
    onSelect: (competitor: CompetitorFull) => void;
    selectedId?: string;
}

const emptyFc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Keep cluster / point layers above GADM region overlays (picker may add layers later). */
function bringLocationLayersToFront(m: maplibregl.Map) {
    const order = ['clusters', 'cluster-count', 'unclustered-point-circle', 'unclustered-point-label'];
    for (const id of order) {
        if (!m.getLayer(id)) continue;
        try {
            m.moveLayer(id);
        } catch {
            /* style swap race */
        }
    }
}

export function LocationLayers({
    map,
    competitors,
    isDarkStyle,
    onSelect,
    selectedId
}: LocationLayersProps) {
    const data = useMemo(() => {
        if (!competitors.length) return emptyFc;
        return {
            type: 'FeatureCollection',
            features: competitors.map(c => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [c.lon, c.lat]
                },
                properties: {
                    place_id: c.place_id,
                    label: c.label,
                    title: c.title,
                    isSelected: c.place_id === selectedId
                }
            }))
        } as GeoJSON.FeatureCollection;
    }, [competitors, selectedId]);

    const isDarkStyleRef = useRef(isDarkStyle);
    isDarkStyleRef.current = isDarkStyle;

    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    useEffect(() => {
        if (!map) return;

        const setupLayers = () => {
            if (!map.getStyle()) return;

            // Sources
            if (!map.getSource('locations-source')) {
                map.addSource('locations-source', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 40
                });
            }

            // Layer: Clusters (Circles)
            if (!map.getLayer('clusters')) {
                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'locations-source',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6', // < 100
                            100, '#f1f075', // 100-750
                            750, '#f28cb1'  // >= 750
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100, 30,
                            750, 40
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#fff'
                    }
                });
            }

            // Layer: Cluster Count Labels
            if (!map.getLayer('cluster-count')) {
                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'locations-source',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count}',
                        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });
            }

            // Layer: Unclustered Points (Individual Pins)
            if (!map.getLayer('unclustered-point-circle')) {
                map.addLayer({
                    id: 'unclustered-point-circle',
                    type: 'circle',
                    source: 'locations-source',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': [
                            'case',
                            ['get', 'isSelected'],
                            '#f59e0b', // Amber (selected)
                            isDarkStyleRef.current ? '#4f46e5' : '#4f46e5' // Indigo
                        ],
                        'circle-radius': [
                            'case',
                            ['get', 'isSelected'],
                            16,
                            12
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#fff'
                    }
                });
            }

            if (!map.getLayer('unclustered-point-label')) {
                map.addLayer({
                    id: 'unclustered-point-label',
                    type: 'symbol',
                    source: 'locations-source',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'text-field': '{label}',
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 10,
                        'text-allow-overlap': true,
                        'text-ignore-placement': true
                    },
                    paint: {
                        'text-color': '#fff'
                    }
                });
            }

            // Click Handlers
            const handleClusterClick = async (e: maplibregl.MapMouseEvent) => {
                const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                if (!features.length) return;

                const clusterId = features[0].properties.cluster_id;
                const source = map.getSource('locations-source') as maplibregl.GeoJSONSource;

                try {
                    // MapLibre v5+ getClusterExpansionZoom returns a Promise and doesn't take a callback
                    const zoom = await (source as any).getClusterExpansionZoom(clusterId);
                    map.easeTo({
                        center: (features[0].geometry as any).coordinates,
                        //zoom: zoom
                    });
                } catch (err) {
                    console.error('Error expanding cluster', err);
                }
            };

            const handlePointClick = (e: maplibregl.MapMouseEvent) => {
                const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point-circle'] });
                if (features.length > 0) {
                    const placeId = features[0].properties.place_id;
                    const competitor = competitors.find(c => c.place_id === placeId);
                    if (competitor) {
                        onSelectRef.current(competitor);
                        map.easeTo({ center: (features[0].geometry as any).coordinates });
                    }
                }
            };

            map.on('click', 'clusters', handleClusterClick);
            map.on('click', 'unclustered-point-circle', handlePointClick);
            map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseenter', 'unclustered-point-circle', () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
            map.on('mouseleave', 'unclustered-point-circle', () => map.getCanvas().style.cursor = '');

            queueMicrotask(() => bringLocationLayersToFront(map));

            return () => {
                map.off('click', 'clusters', handleClusterClick);
                map.off('click', 'unclustered-point-circle', handlePointClick);
            };
        };

        if (map.getStyle()) setupLayers();
        map.on('styledata', setupLayers);
        map.on('style.load', setupLayers);

        return () => {
            if (map && map.getStyle()) {
                map.off('styledata', setupLayers);
                map.off('style.load', setupLayers);
                if (map.getSource('locations-source')) {
                    if (map.getLayer('clusters')) map.removeLayer('clusters');
                    if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
                    if (map.getLayer('unclustered-point-circle')) map.removeLayer('unclustered-point-circle');
                    if (map.getLayer('unclustered-point-label')) map.removeLayer('unclustered-point-label');
                    map.removeSource('locations-source');
                }
            }
        };
    }, [map, competitors]);

    // Update data when it changes
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        const source = map.getSource('locations-source') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(data);
        }
    }, [map, data]);

    // Update style-dependent properties
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        if (map.getLayer('unclustered-point-circle')) {
            map.setPaintProperty('unclustered-point-circle', 'circle-color', [
                'case',
                ['get', 'isSelected'],
                '#f59e0b',
                isDarkStyle ? '#4f46e5' : '#4f46e5'
            ]);
        }
    }, [map, isDarkStyle]);

    return null;
}
