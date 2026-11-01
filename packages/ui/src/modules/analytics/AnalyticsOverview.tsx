import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchAnalyticsOverview, subscribeToAnalyticsStream } from '@/modules/analytics/client-analytics';
import {
    Clock, Users, Bot, BarChart3, Globe, TrendingUp,
    Loader2, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
} from 'recharts';

/* ── Types ─────────────────────────────────────────────────────────── */
interface TimePoint { t: string; hits: number; users: number; bots: number; contentVisits: number; }

interface OverviewData {
    period: { start: string; end: string; label: string };
    granularity: 'hour' | 'day';
    kpis: {
        longestStayMs: number;
        avgPagesPerSession: number;
        bounceRate: number;
        uniqueUsers: number;
        uniqueBots: number;
    };
    timeSeries: TimePoint[];
    countries: { country: string; visitors: number }[];
    topContent: { path: string; display: string; visits: number; type: string }[];
}

const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'lastWeek', label: 'Last Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'all', label: 'All Time' },
] as const;

/* ── Series definitions ────────────────────────────────────────────── */
const SERIES = [
    { key: 'hits',          label: 'Hits',          color: '#6366f1', defaultOn: true  },
    { key: 'users',         label: 'Users',         color: '#22c55e', defaultOn: true  },
    { key: 'bots',          label: 'Bots',          color: '#ef4444', defaultOn: false },
    { key: 'contentVisits', label: 'Content',       color: '#f59e0b', defaultOn: true  },
] as const;

type SeriesKey = typeof SERIES[number]['key'];

/* ── Helpers ───────────────────────────────────────────────────────── */
function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${rem}s`;
}
function formatPercent(rate: number): string { return `${(rate * 100).toFixed(1)}%`; }

function formatTick(value: string, granularity: 'hour' | 'day'): string {
    if (granularity === 'hour') {
        // "2026-03-17T14:00" → "14:00"
        const match = value.match(/T(\d{2}:\d{2})$/);
        return match ? match[1] : value;
    }
    // "2026-03-17" → "Mar 17"
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/* ── Content visit classification (client-side mirror for SSE) ────── */
const CONTENT_PATH_RE = /^\/($|post\/[^/]+$|user\/[^/]+\/pages\/[^/]+$|app\/.+$)/;
function isContentVisit(p: string): boolean { return CONTENT_PATH_RE.test(p); }

/* ── Component ─────────────────────────────────────────────────────── */
interface Props { serverUrl: string; }

const AnalyticsOverview: React.FC<Props> = ({ serverUrl }) => {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const [tracking, setTracking] = useState('');
    const [showBots, setShowBots] = useState(true);
    const [showApi, setShowApi] = useState(false);
    const [trackingValues, setTrackingValues] = useState<string[]>([]);
    const [visibleSeries, setVisibleSeries] = useState<Set<SeriesKey>>(
        () => new Set(SERIES.filter(s => s.defaultOn).map(s => s.key))
    );
    const esRef = useRef<EventSource | null>(null);

    const toggleSeries = useCallback((key: SeriesKey) => {
        setVisibleSeries(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }, []);

    /* ── Fetch initial data ─────────────────────────────────────────── */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchAnalyticsOverview({
                period,
                tracking: tracking || undefined,
                showBots,
                showApi,
                baseUrl: serverUrl || undefined,
            });
            setData(result);
            if (result.trackingValues) setTrackingValues(result.trackingValues);
        } catch (err) {
            console.error('Failed to load analytics overview:', err);
        } finally {
            setLoading(false);
        }
    }, [period, tracking, showBots, showApi, serverUrl]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── SSE real-time streaming (only for "today") ─────────────────── */
    useEffect(() => {
        if (period !== 'today') return;

        let mounted = true;
        (async () => {
            try {
                const es = await subscribeToAnalyticsStream((entry) => {
                    if (!mounted) return;
                    const isBot = entry.isBot === true || entry.isAI === true;
                    if (!showBots && isBot) return;
                    if (!showApi && (entry.path || '').startsWith('/api/')) return;
                    if (tracking && !(entry.search || '').includes(`tracking=${tracking}`)) return;

                    // Determine bucket key (hourly)
                    const d = new Date(entry.timestamp);
                    const bk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`;
                    const p: string = entry.path || '';
                    const content = isContentVisit(p);

                    setData(prev => {
                        if (!prev) return prev;
                        // Clone timeSeries, find or create bucket
                        const ts = [...prev.timeSeries];
                        let idx = ts.findIndex(pt => pt.t === bk);
                        if (idx === -1) {
                            ts.push({ t: bk, hits: 0, users: 0, bots: 0, contentVisits: 0 });
                            ts.sort((a, b) => a.t.localeCompare(b.t));
                            idx = ts.findIndex(pt => pt.t === bk);
                        }
                        const pt = { ...ts[idx] };
                        pt.hits++;
                        if (isBot) pt.bots++;
                        else pt.users++;
                        if (content) pt.contentVisits++;
                        ts[idx] = pt;

                        // Update KPIs
                        const kpis = { ...prev.kpis };
                        return { ...prev, timeSeries: ts, kpis };
                    });
                }, serverUrl || undefined);
                
                if (!mounted) {
                    es.close();
                    return;
                }
                
                esRef.current = es;
                es.onerror = () => { if (es) es.close(); };
            } catch (err) {
                console.error('Failed to subscribe to analytics overview stream:', err);
            }
        })();

        return () => {
            mounted = false;
            esRef.current?.close();
            esRef.current = null;
        };
    }, [period, serverUrl, showBots, showApi, tracking]);

    const kpis = data?.kpis;
    const granularity = data?.granularity || 'hour';

    /* ── Custom tooltip ─────────────────────────────────────────────── */
    const CustomTooltip = useMemo(() => {
        return ({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;
            return (
                <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-lg text-xs">
                    <div className="font-medium mb-1">{formatTick(label, granularity)}</div>
                    {payload.map((p: any) => (
                        <div key={p.dataKey} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-muted-foreground">{p.name}:</span>
                            <span className="font-medium tabular-nums">{p.value}</span>
                        </div>
                    ))}
                </div>
            );
        };
    }, [granularity]);

    return (
        <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
            {/* ── Toolbar ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-input" role="group">
                    {PERIODS.map(({ key, label }) => (
                        <Button
                            key={key}
                            variant={period === key ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-8 rounded-none first:rounded-l-md last:rounded-r-md text-xs ${period !== key ? 'border-0' : ''}`}
                            onClick={() => setPeriod(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                {/* Campaign filter dropdown */}
                <select
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="">All campaigns</option>
                    {trackingValues.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
                <Button
                    variant={showBots ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setShowBots(prev => !prev)}
                    title={showBots ? 'Showing AI/Bots — click to hide' : 'Hiding AI/Bots — click to show'}
                >
                    {showBots ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="hidden sm:inline text-xs">AI/Bots</span>
                </Button>
                <Button
                    variant={showApi ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setShowApi(prev => !prev)}
                    title={showApi ? 'Showing API requests — click to hide' : 'Hiding API requests — click to show'}
                >
                    {showApi ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="hidden sm:inline text-xs">API</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={loadData} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
            </div>

            {loading && !data ? (
                <div className="flex items-center justify-center flex-1 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
                </div>
            ) : kpis ? (
                <>
                    {/* ── KPI Cards ────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <KPICard icon={Clock} label="Longest Stay" value={formatDuration(kpis.longestStayMs)} />
                        <KPICard icon={BarChart3} label="Avg Pages / Session" value={String(kpis.avgPagesPerSession)} />
                        <KPICard icon={TrendingUp} label="Bounce Rate" value={formatPercent(kpis.bounceRate)} />
                        <KPICard icon={Users} label="Unique Users" value={String(kpis.uniqueUsers)} />
                        <KPICard icon={Bot} label="Unique Bots" value={String(kpis.uniqueBots)} />
                    </div>

                    {/* ── Time-series chart ────────────────────────── */}
                    <Card className="flex flex-col">
                        <CardHeader className="px-4 py-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4" /> Traffic
                                {period === 'today' && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-normal text-green-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
                                    </span>
                                )}
                            </CardTitle>
                            {/* Series toggles */}
                            <div className="flex items-center gap-1">
                                {SERIES.map(s => (
                                    <Button
                                        key={s.key}
                                        variant={visibleSeries.has(s.key) ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-6 px-2 text-[11px] gap-1"
                                        style={visibleSeries.has(s.key) ? { background: s.color, borderColor: s.color } : {}}
                                        onClick={() => toggleSeries(s.key)}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                                        {s.label}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pb-2 pt-0">
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={data?.timeSeries || []} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <defs>
                                        {SERIES.map(s => (
                                            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis
                                        dataKey="t"
                                        tickFormatter={(v) => formatTick(v, granularity)}
                                        tick={{ fontSize: 11 }}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    {SERIES.map(s => visibleSeries.has(s.key) && (
                                        <Area
                                            key={s.key}
                                            type="monotone"
                                            dataKey={s.key}
                                            name={s.label}
                                            stroke={s.color}
                                            fill={`url(#grad-${s.key})`}
                                            strokeWidth={2}
                                            dot={false}
                                            animationDuration={300}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* ── Bottom panes: Countries + Top Content ──── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                        {/* Countries */}
                        <Card className="flex flex-col overflow-hidden">
                            <CardHeader className="px-4 py-2">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Globe className="w-4 h-4" /> Countries
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-card border-b">
                                        <tr>
                                            <th className="text-left px-4 py-1.5 font-medium text-muted-foreground">Country</th>
                                            <th className="text-right px-4 py-1.5 font-medium text-muted-foreground">Visitors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.countries || []).map((c, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-1.5">{c.country}</td>
                                                <td className="px-4 py-1.5 text-right tabular-nums font-medium">{c.visitors}</td>
                                            </tr>
                                        ))}
                                        {data?.countries.length === 0 && (
                                            <tr><td colSpan={2} className="text-center text-muted-foreground py-4">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Top Content */}
                        <Card className="flex flex-col overflow-hidden">
                            <CardHeader className="px-4 py-2">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4" /> Top Content
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-card border-b">
                                        <tr>
                                            <th className="text-left px-4 py-1.5 font-medium text-muted-foreground">Path</th>
                                            <th className="text-left px-4 py-1.5 font-medium text-muted-foreground w-16">Type</th>
                                            <th className="text-right px-4 py-1.5 font-medium text-muted-foreground">Visits</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.topContent || []).map((c, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-1.5 max-w-[300px] truncate" title={c.path}>
                                                    <a href={c.path} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">{c.display || c.path}</a>
                                                </td>
                                                <td className="px-4 py-1.5">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                                        c.type === 'post' ? 'bg-blue-500/10 text-blue-500' :
                                                        c.type === 'page' ? 'bg-purple-500/10 text-purple-500' :
                                                        c.type === 'app' ? 'bg-orange-500/10 text-orange-500' :
                                                        'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {c.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-1.5 text-right tabular-nums font-medium">{c.visits}</td>
                                            </tr>
                                        ))}
                                        {data?.topContent.length === 0 && (
                                            <tr><td colSpan={3} className="text-center text-muted-foreground py-4">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center flex-1 text-muted-foreground">No data available.</div>
            )}
        </div>
    );
};

/* ── Tiny KPI card sub-component ─────────────────────────────────────── */
function KPICard({ icon: Icon, label, value }: { icon: React.FC<any>; label: string; value: string }) {
    return (
        <Card className="p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </div>
            <div className="text-xl font-bold tabular-nums">{value}</div>
        </Card>
    );
}

export default AnalyticsOverview;
