import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PlaceFull } from '@polymech/shared';
import { fetchPlacesGridSearchById } from '@/modules/places/client-gridsearch';
import maplibregl from 'maplibre-gl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PlacesMapWidgetHandle {
    /** Zoom the map to a specific level (0-22). Optionally animate. */
    zoomTo: (zoom: number, options?: { duration?: number }) => void;
    /** Center (and optionally zoom) the map on a lat/lng coordinate. */
    centerTo: (lat: number, lng: number, options?: { zoom?: number; duration?: number }) => void;
    /** Replace the displayed location markers with a new set. */
    setLocations: (locations: PlaceFull[]) => void;
    /** Replace the GADM regions displayed on the map. */
    setRegions: (regions: Array<{ gid: string; name: string; level: number }>) => void;
    /** Update the grid-search simulator settings. */
    setSimSettings: (settings: Record<string, any>) => void;
    /** Direct access to the underlying MapLibre instance (may be null). */
    getMap: () => maplibregl.Map | null;
}

export interface GadmRegion {
    gid: string;
    name: string;
    level: number;
}

interface UsePlacesMapDataOptions {
    jobId?: string;
    targetLocation?: any;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function usePlacesMapData({ jobId, targetLocation }: UsePlacesMapDataOptions) {
    const [competitors, setCompetitors] = useState<PlaceFull[]>([]);
    const [simulatorSettings, setSimulatorSettings] = useState<any>(null);
    const [fetchedRegions, setFetchedRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const mapRef = useRef<maplibregl.Map | null>(null);
    const hasFittedRef = useRef(false);

    // Imperative region override — when set, takes priority over fetched/picker regions
    const [imperativeRegions, setImperativeRegions] = useState<GadmRegion[] | null>(null);

    // -----------------------------------------------------------------------
    // Derived: effective job ID, initial center, GADM regions, sim settings
    // -----------------------------------------------------------------------
    const effectiveJobId = targetLocation?.jobId || jobId;

    const pickerLat = targetLocation?.lat ?? targetLocation?.center?.lat;
    const pickerLng = targetLocation?.lng ?? targetLocation?.center?.lng;
    const initialCenter = useMemo(
        () => (pickerLat && pickerLng ? { lat: pickerLat, lng: pickerLng } : undefined),
        [pickerLat, pickerLng],
    );

    // GADM regions: imperative override > picker > fetched
    const baseRegions = imperativeRegions ?? (targetLocation?.gadmRegions?.length ? targetLocation.gadmRegions : fetchedRegions);
    const normalizedGadmRegions: GadmRegion[] = baseRegions.map((r: any) => ({
        gid: r.gid,
        name: r.gadmName || r.name,
        level: r.level !== undefined ? (typeof r.level === 'string' ? parseInt(r.level.replace(/\D/g, '')) : r.level) : 0,
    }));

    const finalGadmRegions = normalizedGadmRegions.length > 0
        ? normalizedGadmRegions
        : targetLocation?.gid
            ? [{ gid: targetLocation.gid, name: targetLocation.label || targetLocation.name, level: targetLocation.level }]
            : undefined;

    const initialSimulatorSettings = targetLocation?.simulatorSettings || simulatorSettings;

    // -----------------------------------------------------------------------
    // Fetch data when a job ID is available
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!effectiveJobId) {
            setCompetitors([]);
            setSimulatorSettings(null);
            return;
        }

        // Short-circuit when the picker already carries the full payload
        if (targetLocation?.jobId === effectiveJobId && targetLocation?.competitors && targetLocation?.simulatorSettings) {
            setCompetitors(targetLocation.competitors);
            setSimulatorSettings(targetLocation.simulatorSettings);
            return;
        }

        let isMounted = true;
        (async () => {
            setLoading(true);
            try {
                const job = await fetchPlacesGridSearchById(effectiveJobId);
                const data = job?.data || job;

                if (isMounted && data) {
                    const enrichResults = data.result?.enrichResults;
                    if (Array.isArray(enrichResults)) {
                        setCompetitors(enrichResults);
                    } else if (Array.isArray(data.places)) {
                        setCompetitors(data.places);
                    }

                    if (data.request?.guided?.settings) {
                        setSimulatorSettings(data.request.guided.settings);
                    }

                    if (Array.isArray(data.areas)) {
                        setFetchedRegions(data.areas);
                    } else if (data.request?.guided?.areas) {
                        setFetchedRegions(data.request.guided.areas);
                    }
                }
            } catch (err) {
                console.error('Failed to load search job points:', err);
                if (isMounted) setCompetitors([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [effectiveJobId]);

    // -----------------------------------------------------------------------
    // Auto-fit helpers
    // -----------------------------------------------------------------------
    const competitorsRef = useRef(competitors);
    competitorsRef.current = competitors;

    const fitToPlaces = useCallback((m: maplibregl.Map, locs: PlaceFull[]) => {
        if (hasFittedRef.current || locs.length === 0) return;
        const bounds = new maplibregl.LngLatBounds();
        let hasPoints = false;
        for (const c of locs) {
            const lat = (c as any).gps_coordinates?.latitude ?? (c as any).raw_data?.geo?.latitude ?? (c as any).lat;
            const lon = (c as any).gps_coordinates?.longitude ?? (c as any).raw_data?.geo?.longitude ?? (c as any).lon;
            if (lat != null && lon != null) { bounds.extend([Number(lon), Number(lat)]); hasPoints = true; }
        }
        if (hasPoints && !bounds.isEmpty()) {
            m.fitBounds(bounds, { padding: 50, maxZoom: 9, duration: 1000 });
            hasFittedRef.current = true;
        }
    }, []);

    // Case 2: Data arrives after map is ready
    useEffect(() => {
        if (mapRef.current && competitors.length > 0 && !hasFittedRef.current) {
            fitToPlaces(mapRef.current, competitors);
        }
    }, [competitors, fitToPlaces]);

    // -----------------------------------------------------------------------
    // Imperative API handle (stable — never changes identity)
    // -----------------------------------------------------------------------
    const handle: PlacesMapWidgetHandle = useMemo(() => ({
        zoomTo(zoom, options) {
            mapRef.current?.zoomTo(zoom, { duration: options?.duration ?? 500 });
        },
        centerTo(lat, lng, options) {
            if (!mapRef.current) return;
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: options?.zoom ?? mapRef.current.getZoom(),
                duration: options?.duration ?? 1000,
            });
        },
        setLocations(locations) {
            hasFittedRef.current = false; // allow re-fit
            setCompetitors(locations);
        },
        setRegions(regions) {
            setImperativeRegions(regions);
        },
        setSimSettings(settings) {
            setSimulatorSettings(settings);
        },
        getMap() {
            return mapRef.current;
        },
    }), []);

    // -----------------------------------------------------------------------
    // onMapReady — wires map ref + initial fit
    // -----------------------------------------------------------------------
    const handleMapReady = useCallback((m: maplibregl.Map) => {
        mapRef.current = m;
        fitToPlaces(m, competitorsRef.current);
    }, [fitToPlaces]);

    return {
        // Data
        competitors,
        loading,
        initialCenter,
        finalGadmRegions,
        initialSimulatorSettings,
        // Imperative
        handle,
        handleMapReady,
        mapRef,
        hasFittedRef,
    };
}
