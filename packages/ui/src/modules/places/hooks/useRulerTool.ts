import { useState, useCallback, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

const RULER_SOURCE = 'ruler-source';
const RULER_LINE_LAYER = 'ruler-line-layer';
const RULER_POINT_LAYER = 'ruler-point-layer';
const RULER_LABEL_LAYER = 'ruler-label-layer';

/** Haversine distance between two [lng, lat] points in km */
function haversineKm(a: [number, number], b: [number, number]): number {
    const R = 6371;
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLon = ((b[0] - a[0]) * Math.PI) / 180;
    const lat1 = (a[1] * Math.PI) / 180;
    const lat2 = (b[1] * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 100) return `${km.toFixed(2)} km`;
    return `${Math.round(km).toLocaleString()} km`;
}

function buildGeoJSON(points: [number, number][]) {
    const features: any[] = [];

    // Line segments with segment distance labels
    if (points.length >= 2) {
        features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: points },
            properties: {}
        });
    }

    // Point markers with cumulative distance
    let cumulative = 0;
    points.forEach((p, i) => {
        if (i > 0) cumulative += haversineKm(points[i - 1], p);
        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: p },
            properties: {
                index: i,
                label: i === 0 ? 'Start' : formatDistance(cumulative)
            }
        });
    });

    return { type: 'FeatureCollection', features };
}

export function useRulerTool(map: maplibregl.Map | null) {
    const [active, setActive] = useState(false);
    const [totalDistance, setTotalDistance] = useState(0);
    const pointsRef = useRef<[number, number][]>([]);
    const activeRef = useRef(false);

    const updateSource = useCallback(() => {
        if (!map) return;
        const src = map.getSource(RULER_SOURCE) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        const gj = buildGeoJSON(pointsRef.current);
        src.setData(gj as any);

        // Compute total
        let total = 0;
        const pts = pointsRef.current;
        for (let i = 1; i < pts.length; i++) total += haversineKm(pts[i - 1], pts[i]);
        setTotalDistance(total);
    }, [map]);

    const ensureLayers = useCallback(() => {
        if (!map) return;
        if (map.getSource(RULER_SOURCE)) return;

        map.addSource(RULER_SOURCE, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        map.addLayer({
            id: RULER_LINE_LAYER,
            type: 'line',
            source: RULER_SOURCE,
            filter: ['==', '$type', 'LineString'],
            paint: {
                'line-color': '#f59e0b',
                'line-width': 2.5,
                'line-dasharray': [3, 2]
            }
        });

        map.addLayer({
            id: RULER_POINT_LAYER,
            type: 'circle',
            source: RULER_SOURCE,
            filter: ['==', '$type', 'Point'],
            paint: {
                'circle-radius': 5,
                'circle-color': '#f59e0b',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });

        map.addLayer({
            id: RULER_LABEL_LAYER,
            type: 'symbol',
            source: RULER_SOURCE,
            filter: ['==', '$type', 'Point'],
            layout: {
                'text-field': ['get', 'label'],
                'text-size': 11,
                'text-offset': [0, -1.5],
                'text-anchor': 'bottom',
                'text-allow-overlap': true,
                'text-font': ['Open Sans Bold']
            },
            paint: {
                'text-color': '#92400e',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.5
            }
        });
    }, [map]);

    const removeLayers = useCallback(() => {
        if (!map) return;
        try {
            [RULER_LABEL_LAYER, RULER_POINT_LAYER, RULER_LINE_LAYER].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
            if (map.getSource(RULER_SOURCE)) map.removeSource(RULER_SOURCE);
        } catch (_) { /* map already destroyed */ }
    }, [map]);

    const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
        if (!activeRef.current) return;
        pointsRef.current = [...pointsRef.current, [e.lngLat.lng, e.lngLat.lat]];
        updateSource();
    }, [updateSource]);

    const reset = useCallback(() => {
        pointsRef.current = [];
        setTotalDistance(0);
        updateSource();
    }, [updateSource]);

    const toggle = useCallback(() => {
        setActive(prev => {
            const next = !prev;
            activeRef.current = next;
            if (next && map) {
                ensureLayers();
                map.getCanvas().style.cursor = 'crosshair';
                map.getCanvas().dataset.rulerActive = 'true';
                map.on('click', handleClick);
            } else if (map) {
                map.off('click', handleClick);
                map.getCanvas().style.cursor = '';
                delete map.getCanvas().dataset.rulerActive;
                removeLayers();
                pointsRef.current = [];
                setTotalDistance(0);
            }
            return next;
        });
    }, [map, ensureLayers, removeLayers, handleClick]);

    // Re-add layers after style change (MapLibre loses them)
    useEffect(() => {
        if (!map || !active) return;
        const handler = () => {
            ensureLayers();
            updateSource();
        };
        map.on('style.load', handler);
        return () => { map.off('style.load', handler); };
    }, [map, active, ensureLayers, updateSource]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (map) {
                try {
                    map.off('click', handleClick);
                    removeLayers();
                    map.getCanvas().style.cursor = '';
                } catch (_) { /* map already destroyed */ }
            }
        };
    }, [map, handleClick, removeLayers]);

    return { active, totalDistance, toggle, reset, formattedTotal: formatDistance(totalDistance), pointCount: pointsRef.current.length };
}
