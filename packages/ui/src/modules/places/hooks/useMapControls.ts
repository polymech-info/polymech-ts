import { useState, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { fetchReverseGeocode, fetchIpLocation } from '../client-gridsearch';

export function useMapControls(onMapCenterUpdate?: (loc: string, zoom?: number) => void) {
    const [currentCenterLabel, setCurrentCenterLabel] = useState<string | null>(null);
    const [mapInternals, setMapInternals] = useState<{ zoom: number; lat: number; lng: number, pitch?: number, bearing?: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Optional reference to user's location marker
    const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

    const setupMapListeners = useCallback((map: maplibregl.Map, onMapMove?: (state: { lat: number; lng: number; zoom: number, pitch?: number, bearing?: number }) => void) => {
        const handleMoveEnd = async () => {
            const z = Math.round(map.getZoom() * 100) / 100;
            const c = map.getCenter();
            const lat = Math.round(c.lat * 10000) / 10000;
            const lng = Math.round(c.lng * 10000) / 10000;
            const p = Math.round(map.getPitch());
            const b = Math.round(map.getBearing());

            if ((window as any).__MAP_PERF_DEBUG__) {
                console.log(`[MapPerf] moveend fired — lat=${lat} lng=${lng} z=${z}`);
            }

            // ONLY set state at the end of movement to avoid high-frequency re-renders
            setMapInternals({ zoom: z, lat, lng, pitch: p, bearing: b });

            if (onMapMove) {
                onMapMove({ lat: c.lat, lng: c.lng, zoom: z, pitch: p, bearing: b });
            }

            try {
                const geo = await fetchReverseGeocode(c.lat, c.lng);
                if (geo) {
                    const parts: string[] = [];
                    if (geo.city && geo.city !== 'unknown') parts.push(geo.city);
                    else if (geo.locality && geo.locality !== 'unknown') parts.push(geo.locality);
                    else if (geo.principalSubdivision && geo.principalSubdivision !== 'unknown') parts.push(geo.principalSubdivision);
                    if (geo.countryName) parts.push(geo.countryName);

                    const label = parts.length > 0 ? parts.join(', ') : null;
                    setCurrentCenterLabel(label);
                    if (onMapCenterUpdate && label) {
                        onMapCenterUpdate(label, z);
                    }
                }
            } catch (e) {
                console.error("Failed to reverse geocode center", e);
            }
        };

        map.on('moveend', handleMoveEnd);

        // Initial set
        handleMoveEnd();

        return () => {
            map.off('moveend', handleMoveEnd);
        };
    }, [onMapCenterUpdate]);

    const handleLocate = useCallback(async (map: maplibregl.Map | null) => {
        if (!map) return;
        setIsLocating(true);
        try {
            const data = await fetchIpLocation();
            if (!data.error && data.latitude && data.longitude) {
                if (userLocationMarkerRef.current) {
                    userLocationMarkerRef.current.remove();
                }
                const marker = new maplibregl.Marker({ color: '#ef4444' })
                    .setLngLat([data.longitude, data.latitude])
                    .setPopup(new maplibregl.Popup({ closeButton: false }).setText('Your Location (IP)'))
                    .addTo(map);

                userLocationMarkerRef.current = marker;

                map.flyTo({
                    center: [data.longitude, data.latitude],
                    zoom: 12
                });
            }
        } catch (e) {
            console.error("Error during IP geolocation", e);
        } finally {
            setIsLocating(false);
        }
    }, []);

    const cleanupLocateMarker = useCallback(() => {
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
        }
    }, []);

    return {
        mapInternals,
        currentCenterLabel,
        isLocating,
        setupMapListeners,
        handleLocate,
        cleanupLocateMarker
    };
}
