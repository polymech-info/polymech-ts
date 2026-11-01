import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { fetchAnalyticsOverview, subscribeToAnalyticsStream } from '@/modules/analytics/client-analytics';
import { Button } from '@/components/ui/button';
import {
    Globe, Bot, Loader2, RefreshCw
} from 'lucide-react';
import type { MapLocation } from './AnalyticsMap';
const AnalyticsMap = lazy(() => import('./AnalyticsMap'));

/* ── Types ─────────────────────────────────────────────────────────── */
interface LocationData {
    locations: MapLocation[];
    totalHits: number;
    uniqueVisitors: number;
    countries: number;
}

const PERIODS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
];

/* ── Component ─────────────────────────────────────────────────────── */
interface Props { serverUrl: string; }

const AnalyticsMapView: React.FC<Props> = ({ serverUrl }) => {
    const [data, setData] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const [showBots, setShowBots] = useState(true);
    const [showApi, setShowApi] = useState(false);
    const [tracking, setTracking] = useState('');
    const esRef = useRef<EventSource | null>(null);

    /* ── Fetch ────────────────────────────────────────────────────── */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const json = await fetchAnalyticsOverview({
                period,
                showBots,
                showApi,
                tracking: tracking || undefined,
                baseUrl: serverUrl || undefined,
            });
            const d = {
                locations: json.locations || [],
                totalHits: json.kpis?.totalHits || json.totalEntries || 0,
                uniqueVisitors: json.kpis?.uniqueUsers || 0,
                countries: json.countries?.length || 0,
            }
            console.log(d);
            setData(d);
        } catch (err) {
            console.error('Failed to load map data', err);
        } finally {
            setLoading(false);
        }
    }, [period, showBots, showApi, tracking, serverUrl]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── SSE for "today" ─────────────────────────────────────────── */
    useEffect(() => {
        if (period !== 'today') return;
        let mounted = true;

        (async () => {
            try {
                const es = await subscribeToAnalyticsStream((entry) => {
                    if (!mounted) return;
                    if (!showBots && (entry.isBot || entry.isAI)) return;
                    if (!showApi && (entry.path || '').startsWith('/api/')) return;

                    const geoLat = entry.geo?.latitude;
                    const geoLng = entry.geo?.longitude;
                    if (typeof geoLat === 'number' && typeof geoLng === 'number' && (geoLat !== 0 || geoLng !== 0)) {
                        const city = entry.geo?.city || entry.geo?.locality || '';
                        const country = entry.geo?.country?.name || entry.geo?.countryName || '';
                        setData(prev => {
                            if (!prev) return prev;
                            const locs = [...prev.locations];
                            const gk = `${(Math.round(geoLat * 10) / 10).toFixed(1)},${(Math.round(geoLng * 10) / 10).toFixed(1)}`;
                            const idx = locs.findIndex(l => {
                                const lk = `${(Math.round(l.lat * 10) / 10).toFixed(1)},${(Math.round(l.lng * 10) / 10).toFixed(1)}`;
                                return lk === gk;
                            });
                            if (idx >= 0) {
                                locs[idx] = { ...locs[idx], visitors: locs[idx].visitors + 1, hits: locs[idx].hits + 1 };
                            } else {
                                locs.push({ lat: geoLat, lng: geoLng, city, country, visitors: 1, hits: 1 });
                            }
                            return { ...prev, locations: locs };
                        });
                    }
                }, serverUrl || undefined);
                
                if (!mounted) {
                    es.close();
                    return;
                }
                
                esRef.current = es;
                es.onerror = () => { if (es) es.close(); };
            } catch (err) {
                console.error('Failed to subscribe to analytics map stream:', err);
            }
        })();

        return () => {
            mounted = false;
            esRef.current?.close();
            esRef.current = null;
        };
    }, [period, serverUrl, showBots, showApi]);

    return (
        <div className="flex flex-col h-full">
            {/* ── Toolbar ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap px-4 py-2 border-b">
                {/* Period selector */}
                <div className="inline-flex rounded-md border border-input" role="group">
                    {PERIODS.map(p => (
                        <Button
                            key={p.value}
                            variant={period === p.value ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-7 text-xs rounded-none first:rounded-l-md last:rounded-r-md ${period !== p.value ? 'border-0' : ''}`}
                            onClick={() => setPeriod(p.value)}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>

                {/* Bots toggle */}
                <Button
                    variant={showBots ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowBots(b => !b)}
                >
                    <Bot className="w-3.5 h-3.5" />
                    {showBots ? 'Bots On' : 'Bots Off'}
                </Button>

                {/* API toggle */}
                <Button
                    variant={showApi ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowApi(a => !a)}
                >
                    {showApi ? 'API On' : 'API Off'}
                </Button>

                {/* Refresh */}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>

                {/* Stats */}
                {data && (
                    <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {data.locations.length} locations</span>
                        <span>{data.countries} countries</span>
                        {period === 'today' && (
                            <span className="flex items-center gap-1 text-green-500 font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                                live
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Map ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0">
                {loading && !data ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading map data…
                    </div>
                ) : data && data.locations.length > 0 ? (
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
                        <AnalyticsMap locations={data.locations} className="w-full h-full" />
                    </Suspense>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No location data for this period.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsMapView;
