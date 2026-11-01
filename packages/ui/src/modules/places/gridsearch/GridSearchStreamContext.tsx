import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPlacesGridSearchStreamUrl } from '../client-gridsearch';
import { getAuthToken } from '@/lib/db';
import { type LogEntry } from '@/contexts/LogContext';

export type StreamPhase = 'idle' | 'grid' | 'searching' | 'enriching' | 'complete' | 'failed';

export interface GridSearchStreamState {
    streaming: boolean;
    connected: boolean;
    /** Worker acknowledged pause (UDS pause_ack). */
    controlPaused: boolean;
    statusMessage: string;
    competitors: any[];
    liveAreas: any[];
    liveRadii: any[];
    liveNodes: any[];
    stats: {
        completedWaypoints: number;
        totalWaypoints: number;
        /** From enrich-start (C++ `locationCount`). */
        enrichTotal: number;
        totalResults: number;
        apiCalls: number;
        totalLocationsEnriched: number;
        errors: number;
        phase: StreamPhase;
    };
    liveScanner: any;
    jobResult: any;
    sseLogs: LogEntry[];
}

const GS_PROGRESS_STORAGE_PREFIX = 'gs-progress-';

/** Overall 0–100 for the run; `null` = unknown / indeterminate (no grid yet). */
export function computeGridSearchOverallPercent(
    stats: GridSearchStreamState['stats'],
): number | null {
    const {
        phase,
        completedWaypoints,
        totalWaypoints,
        totalLocationsEnriched,
        enrichTotal,
    } = stats;

    if (phase === 'complete') return 100;
    if (phase === 'failed') return null;

    if (phase === 'enriching') {
        const et = enrichTotal > 0 ? enrichTotal : Math.max(1, totalLocationsEnriched || 1);
        const en = Math.min(totalLocationsEnriched, et);
        return Math.min(99, Math.round(60 + (en / et) * 39));
    }

    if (totalWaypoints > 0) {
        const tw = totalWaypoints;
        const cw = Math.min(completedWaypoints, tw);
        return Math.round(5 + (cw / tw) * 55);
    }

    if (phase === 'searching' || phase === 'grid') {
        return 5;
    }

    return null;
}

export function clearStoredGridSearchProgress(jobId: string): void {
    try {
        sessionStorage.removeItem(`${GS_PROGRESS_STORAGE_PREFIX}${jobId}`);
    } catch {
        /* ignore */
    }
}

/** Last persisted % from an open tab (see provider sync). */
export function readStoredGridSearchProgress(jobId: string): {
    pct: number;
    phase?: string;
    at: number;
} | null {
    try {
        const raw = sessionStorage.getItem(`${GS_PROGRESS_STORAGE_PREFIX}${jobId}`);
        if (!raw) return null;
        const p = JSON.parse(raw) as { pct: number; phase?: string; at: number };
        if (typeof p.pct !== 'number' || typeof p.at !== 'number') return null;
        if (Date.now() - p.at > 120_000) return null;
        return p;
    } catch {
        return null;
    }
}

const initialState: GridSearchStreamState = {
    streaming: false,
    connected: false,
    controlPaused: false,
    statusMessage: 'Connecting...',
    competitors: [],
    liveAreas: [],
    liveRadii: [],
    liveNodes: [],
    stats: {
        completedWaypoints: 0,
        totalWaypoints: 0,
        enrichTotal: 0,
        totalResults: 0,
        apiCalls: 0,
        totalLocationsEnriched: 0,
        errors: 0,
        phase: 'idle',
    },
    liveScanner: null,
    jobResult: null,
    sseLogs: [],
};

// ── pure helpers ──

function extractCoords(data: any): { lat: number; lng: number } | null {
    // waypoint-start: data.location.location or data.center
    const loc = data.location?.location || data.center;
    if (loc) {
        const lng = loc.lng || loc.lon;
        if (loc.lat && lng) return { lat: loc.lat, lng };
    }
    // node event: gps_coordinates from places table
    if (data.gps_coordinates) {
        return { lat: data.gps_coordinates.latitude, lng: data.gps_coordinates.longitude };
    }
    // fallback
    if (typeof data.lat === 'number') {
        return { lat: data.lat, lng: data.lng || data.lon };
    }
    return null;
}

function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function buildScannerGeoJSON(
    lat: number, lng: number,
    prevLat?: number, prevLng?: number,
    mouthOpen = true
): any {
    const bearing = (prevLat !== undefined && prevLng !== undefined)
        ? bearingBetween(prevLat, prevLng, lat, lng)
        : 0;

    return {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {
                icon_state: mouthOpen ? 'pacman-open' : 'pacman-closed',
                bearing,
            },
            geometry: { type: 'Point', coordinates: [lng, lat] }
        }]
    };
}

function normalizeLocation(type: string, data: any) {
    let comp = type === 'node' ? data : (data?.result || data);
    if (comp?.location) {
        comp = { ...comp.location, areaName: comp.areaName, _parent: comp };
    }
    return comp;
}

function parseStreamEvent(eventType: string, raw: string): { type: string; parsed: any; data: any } {
    const parsed = JSON.parse(raw);
    const type = eventType === 'progress' ? (parsed.type || 'progress') : eventType;
    const data = (eventType === 'progress' && parsed.type) ? (parsed.data || parsed) : parsed;
    return { type, parsed, data };
}

const SSE_LOG_LEVEL: Record<string, LogEntry['level']> = {
    'error': 'error', 'failed': 'error', 'node-error': 'warning', 'nodePage': 'warning',
    'job_result': 'success', 'enrich-start': 'info', 'grid-ready': 'info',
    'area-start': 'info', 'area-finish': 'info', 'log': 'debug',
};

let _logCounter = 0;

function applyEventToState(
    prev: GridSearchStreamState,
    type: string,
    parsed: any,
    data: any
): GridSearchStreamState {
    const next = { ...prev };

    // ── Accumulate SSE log (dev only, cheap push) ──
    next.sseLogs = [...prev.sseLogs, {
        id: `sse-${++_logCounter}`,
        timestamp: new Date(),
        level: SSE_LOG_LEVEL[type] || 'debug',
        message: `[${type}] ${parsed.message || data?.title || data?.name || JSON.stringify(data).slice(0, 120)}`,
        category: type,
        data: data,
    }];

    if (parsed.message) next.statusMessage = parsed.message;

    const stats = parsed.stats || data?.stats;
    if (stats) next.stats = { ...next.stats, ...stats };
    switch (type) {
        case 'grid-ready':
            next.stats = { ...next.stats, totalWaypoints: data?.totalWaypoints || data?.waypoints?.length || 0, phase: 'searching' };
            next.statusMessage = `Grid ready — ${next.stats.totalWaypoints} waypoints`;
            break;

        case 'area-start':
            next.liveAreas = [...next.liveAreas, { ...data, liveAreaState: 'active' as const }];
            next.statusMessage = `Searching area: ${data?.name || '...'}`;
            break;

        case 'area-finish': {
            const gid = data?.gid ?? data?.area_gid;
            if (gid) {
                next.liveAreas = next.liveAreas.map((a: any) =>
                    a.gid === gid ? { ...a, liveAreaState: 'finished' as const } : a,
                );
            }
            next.statusMessage = `Finished area: ${gid || '...'}`;
            break;
        }

        case 'radius-start':
        case 'waypoint-start': {
            // No longer accumulate liveRadii (blue circles removed)
            const wCoords = extractCoords(data);
            if (wCoords) {
                const prevPos = (next as any)._lastScannerPos;
                const mouth = !((next as any)._pacmanOpen ?? true); // toggle
                next.liveScanner = buildScannerGeoJSON(
                    wCoords.lat, wCoords.lng,
                    prevPos?.lat, prevPos?.lng,
                    mouth
                );
                (next as any)._lastScannerPos = wCoords;
                (next as any)._pacmanOpen = mouth;
            }
            break;
        }

        case 'waypoint-finish':
            next.stats = {
                ...next.stats,
                completedWaypoints: next.stats.completedWaypoints + 1,
                apiCalls: data?.apiCalls ?? next.stats.apiCalls,
            };
            break;

        case 'node-start':
            next.liveNodes = [...next.liveNodes, data];
            break;

        case 'location':
        case 'node': {
            const comp = normalizeLocation(type, data);
            const compPid = comp?.place_id || comp?.placeId;
            // Deduplicate by place_id — later (richer) entries overwrite earlier ones
            if (compPid) {
                const existing = next.competitors.findIndex((c: any) => (c.place_id || c.placeId) === compPid);
                if (existing >= 0) {
                    next.competitors = [...next.competitors];
                    next.competitors[existing] = comp;
                } else {
                    next.competitors = [...next.competitors, comp];
                }
            } else {
                next.competitors = [...next.competitors, comp];
            }
            // Also add to liveNodes for map pins — replace any node-start placeholder
            const pid = data?.place_id || data?.placeId;
            if (pid) {
                next.liveNodes = [
                    ...next.liveNodes.filter((n: any) => (n.place_id || n.placeId) !== pid),
                    data
                ];
            } else {
                next.liveNodes = [...next.liveNodes, data];
            }
            // Move pacman to the found location
            const nCoords = extractCoords(data);
            if (nCoords) {
                const prevPos = (next as any)._lastScannerPos;
                const mouth = !((next as any)._pacmanOpen ?? true);
                next.liveScanner = buildScannerGeoJSON(
                    nCoords.lat, nCoords.lng,
                    prevPos?.lat, prevPos?.lng,
                    mouth
                );
                (next as any)._lastScannerPos = nCoords;
                (next as any)._pacmanOpen = mouth;
            }
            next.stats = { ...next.stats, totalResults: next.competitors.length };
            if (type === 'node') next.stats = { ...next.stats, totalLocationsEnriched: next.stats.totalLocationsEnriched + 1 };
            next.statusMessage = `Found: ${comp?.title || comp?.name || 'Location'}`;
            break;
        }

        case 'enrich-start':
            next.stats = {
                ...next.stats,
                phase: 'enriching',
                enrichTotal: typeof data?.locationCount === 'number' ? data.locationCount : (next.stats.enrichTotal || 0),
            };
            next.statusMessage = `Enriching ${data?.locationCount ?? ''} locations...`;
            break;

        case 'node-error':
        case 'nodePage':
            next.stats = { ...next.stats, errors: next.stats.errors + 1 };
            break;

        case 'job_result':
            next.jobResult = data;
            next.stats = {
                ...next.stats,
                phase: 'complete',
                totalResults: data?.totalResults ?? next.stats.totalResults,
                apiCalls: data?.freshApiCalls ?? next.stats.apiCalls,
            };
            next.statusMessage = data?.cancelled ? 'Stopped (partial results)' : 'Search Complete';
            next.controlPaused = false;
            next.liveAreas = next.liveAreas.map((a: any) => ({ ...a, liveAreaState: 'finished' as const }));
            break;

        case 'pause_ack':
            next.controlPaused = true;
            next.statusMessage = 'Paused';
            break;

        case 'resume_ack':
            next.controlPaused = false;
            next.statusMessage = 'Resumed';
            break;

        case 'cancel_ack':
            next.statusMessage = 'Stopping…';
            break;

        case 'failed':
            next.streaming = false;
            next.stats = { ...next.stats, phase: 'failed' };
            next.statusMessage = data?.error || 'Job failed';
            break;

        case 'log':
            break; // cpp logging forward – ignored
    }

    return next;
}

// ── context ──

const STREAM_EVENTS = [
    'progress', 'area-start', 'area-finish', 'waypoint-start',
    'waypoint-finish', 'radius-start', 'node-start', 'location',
    'node', 'node-error', 'nodePage', 'log', 'job_result', 'stats',
    'grid-ready', 'enrich-start', 'failed',
    'pause_ack', 'resume_ack', 'cancel_ack',
] as const;

const GridSearchStreamContext = createContext<GridSearchStreamState>(initialState);

export const useGridSearchStream = () => useContext(GridSearchStreamContext);

export function GridSearchStreamProvider({
    jobId,
    active,
    initialCompetitors = [],
    children
}: {
    jobId: string;
    active: boolean;
    initialCompetitors?: any[];
    children: ReactNode;
}) {
    const [state, setState] = useState<GridSearchStreamState>({
        ...initialState,
        competitors: initialCompetitors,
    });

    useEffect(() => {
        if (!active || !jobId) return;

        let es: EventSource | null = null;
        let isActive = true;

        const handleStreamMessage = (eventType: string) => (e: MessageEvent) => {
            if (!isActive) return;
            try {
                const { type, parsed, data } = parseStreamEvent(eventType, e.data);
                setState(prev => applyEventToState(prev, type, parsed, data));
            } catch (err) {
                console.error('Failed parsing stream event', eventType, err);
            }
        };

        const connect = async () => {
            try {
                const token = await getAuthToken();
                const url = getPlacesGridSearchStreamUrl(jobId, token);

                es = new EventSource(url);
                setState(prev => ({ ...prev, streaming: true, connected: true, controlPaused: false }));

                es.onopen = () => {
                    if (isActive) setState(prev => ({ ...prev, connected: true, statusMessage: 'Stream connected' }));
                };

                STREAM_EVENTS.forEach(ev => es!.addEventListener(ev, handleStreamMessage(ev)));

                es.addEventListener('complete', () => {
                    if (!isActive) return;
                    clearStoredGridSearchProgress(jobId);
                    setState(prev => ({ ...prev, streaming: false, connected: false, statusMessage: 'Search Complete', stats: { ...prev.stats, phase: 'complete' } }));
                    es?.close();
                });

                es.addEventListener('failed', (e: MessageEvent) => {
                    if (!isActive) return;
                    clearStoredGridSearchProgress(jobId);
                    try {
                        const parsed = JSON.parse(e.data);
                        setState(prev => ({ ...prev, streaming: false, connected: false, statusMessage: parsed?.error || 'Job failed', stats: { ...prev.stats, phase: 'failed' } }));
                    } catch { /* ignore */ }
                    es?.close();
                });

                es.onerror = (err) => {
                    console.error('SSE Error:', err);
                    if (isActive) setState(prev => ({ ...prev, connected: false, statusMessage: 'Connection error' }));
                };
            } catch (err) {
                console.error('Error establishing SSE', err);
            }
        };

        connect();
        return () => { isActive = false; es?.close(); };
    }, [jobId, active]);

    // Persist coarse progress so the sidebar list can show a bar without opening SSE per row.
    useEffect(() => {
        if (!jobId || !state.streaming) return;
        const pct = computeGridSearchOverallPercent(state.stats);
        if (pct == null) return;
        try {
            sessionStorage.setItem(
                `${GS_PROGRESS_STORAGE_PREFIX}${jobId}`,
                JSON.stringify({
                    pct,
                    phase: state.stats.phase,
                    at: Date.now(),
                }),
            );
        } catch {
            /* quota / private mode */
        }
    }, [jobId, state.streaming, state.stats]);

    return (
        <GridSearchStreamContext.Provider value={state}>
            {children}
        </GridSearchStreamContext.Provider>
    );
}
