import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

/** Active = amber (in progress); finished = emerald (done). */
function liveAreaFillColorExpr(isDark: boolean): maplibregl.ExpressionSpecification {
    return [
        'match',
        ['get', 'liveAreaState'],
        'finished',
        isDark ? 'rgba(52, 211, 153, 0.26)' : 'rgba(16, 185, 129, 0.3)',
        isDark ? 'rgba(250, 204, 21, 0.22)' : 'rgba(234, 179, 8, 0.2)',
    ];
}

function liveAreaLineColorExpr(isDark: boolean): maplibregl.ExpressionSpecification {
    return [
        'match',
        ['get', 'liveAreaState'],
        'finished',
        isDark ? '#34d399' : '#059669',
        isDark ? '#fbbf24' : '#ca8a04',
    ];
}

export function LiveSearchLayers({ map, liveAreas, liveRadii, liveNodes, isDarkStyle }: { map: maplibregl.Map, liveAreas: any[], liveRadii: any[], liveNodes: any[], isDarkStyle: boolean }) {
    useEffect(() => {
        if (!map) return;

        const initSources = () => {
            if (!map.getSource('live-areas')) {
                map.addSource('live-areas', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });
                map.addLayer({
                    id: 'live-areas-fill',
                    type: 'fill',
                    source: 'live-areas',
                    paint: {
                        'fill-color': liveAreaFillColorExpr(isDarkStyle),
                        'fill-opacity': 0.15
                    }
                });
                map.addLayer({
                    id: 'live-areas-line',
                    type: 'line',
                    source: 'live-areas',
                    paint: {
                        'line-color': liveAreaLineColorExpr(isDarkStyle),
                        'line-width': 2,
                        'line-dasharray': [2, 2]
                    }
                });
            }

            if (!map.getSource('live-nodes')) {
                map.addSource('live-nodes', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });
                map.addLayer({
                    id: 'live-nodes-circle',
                    type: 'circle',
                    source: 'live-nodes',
                    paint: {
                        'circle-radius': 4,
                        'circle-color': '#f43f5e',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }
        };

        if (map.isStyleLoaded()) {
            initSources();
        } else {
            map.once('style.load', initSources);
        }

        return () => {
            if (map && map.getStyle()) {
                map.off('style.load', initSources);
            }
        };
    }, [map]);

    useEffect(() => {
        if (!map || !map.getStyle()) return;
        if (!map.getLayer('live-areas-fill')) return;
        try {
            map.setPaintProperty('live-areas-fill', 'fill-color', liveAreaFillColorExpr(isDarkStyle));
            map.setPaintProperty('live-areas-line', 'line-color', liveAreaLineColorExpr(isDarkStyle));
        } catch {
            /* style swap race */
        }
    }, [map, isDarkStyle]);

    useEffect(() => {
        if (!map || !map.getStyle() || !map.getSource('live-areas')) return;

        const features = liveAreas.map(a => {
            // Assuming the boundary comes as geojson
            const geom = a.boundary || a.geojson || a.geom;
            if (geom) {
                return {
                    type: 'Feature',
                    properties: {
                        name: a.name,
                        liveAreaState: a.liveAreaState === 'finished' ? 'finished' : 'active',
                    },
                    geometry: geom
                };
            }
            return null;
        }).filter(Boolean);

        try {
            (map.getSource('live-areas') as maplibregl.GeoJSONSource).setData({
                type: 'FeatureCollection',
                features: features as any
            });
        } catch (e) {}
    }, [map, liveAreas]);

    useEffect(() => {
        if (!map || !map.getStyle() || !map.getSource('live-nodes')) return;

        const features = liveNodes.map(n => {
            // Resolve coordinates from multiple possible formats
            let lat: number | undefined;
            let lng: number | undefined;

            if (n.gps_coordinates) {
                lat = n.gps_coordinates.latitude;
                lng = n.gps_coordinates.longitude;
            } else if (n.location && typeof n.location.lat === 'number') {
                lat = n.location.lat;
                lng = n.location.lng || n.location.lon;
            } else if (typeof n.lat === 'number') {
                lat = n.lat;
                lng = n.lng || n.lon;
            }

            if (lat !== undefined && lng !== undefined && isFinite(lat) && isFinite(lng)) {
                return {
                    type: 'Feature',
                    properties: { name: n.title || n.name || 'Node', type: n.type },
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    }
                };
            }
            return null;
        }).filter(Boolean);

        try {
            (map.getSource('live-nodes') as maplibregl.GeoJSONSource).setData({
                type: 'FeatureCollection',
                features: features as any
            });
        } catch (e) {}
    }, [map, liveNodes]);

    return null;
}
