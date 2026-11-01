import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    DataGrid,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    GridSortModel,
    GridColumnVisibilityModel,
    GridToolbar,
    GridRowSelectionModel,
    GridRowId
} from '@mui/x-data-grid';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useMuiTheme } from '@/hooks/useMuiTheme';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Bookmark, X, Save, Users, List, Server, LayoutList, ShieldBan, BarChart3, Map as MapIcon } from 'lucide-react';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsMapView from './AnalyticsMapView';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { fetchAnalytics, clearAnalytics, subscribeToAnalyticsStream } from '@/modules/analytics/client-analytics';
import { apiClient } from '@/lib/db';
import {
    filterModelToParams,
    paramsToFilterModel,
    sortModelToParams,
    paramsToSortModel,
    visibilityModelToParams,
    paramsToVisibilityModel
} from './gridUtils';
import { format } from 'date-fns';

interface AnalyticsEvent {
    timestamp: string;
    sessionId?: string;
    method: string;
    path: string;
    status: number;
    ip: string;
    userAgent: string;
    userId?: string;
    // userName/userEmail removed — GDPR data minimization
    referer?: string;
    geo?: {
        country?: {
            name: string;
            countryFlagEmoji: string;
            isoAlpha2: string;
        };
        countryName?: string;
        city?: string;
    };
    isBot?: boolean;
    isAI?: boolean;
    durationMs?: number;
    search?: string;
    language?: string;
}

interface SessionSummary {
    id: string;
    sessionId: string;
    firstSeen: string;
    lastSeen: string;
    requestCount: number;
    paths: string[];
    topPath: string;
    uniquePaths: number;
    ip: string;
    country: string;
    countryFlag: string;
    city: string;
    userId: string;
    hasBot: boolean;
    hasAI: boolean;
    errorCount: number;
    avgDuration: number;
    userAgent: string;
}

type ViewMode = 'overview' | 'requests' | 'sessions' | 'users' | 'map';

interface UserSummary {
    id: string;
    ip: string;
    label: string;
    country: string;
    countryFlag: string;
    city: string;
    userId: string;
    sessionCount: number;
    requestCount: number;
    firstSeen: string;
    lastSeen: string;
    topPath: string;
    uniquePaths: number;
    hasBot: boolean;
    hasAI: boolean;
    errorCount: number;
    avgDuration: number;
    userAgent: string;
}

interface SavedFilter {
    name: string;
    filterModel: GridFilterModel;
}

const SERVER_OPTIONS = [
    { label: 'Localhost', value: '' },
    { label: 'Production', value: 'https://service.polymech.info' },
] as const;

const AnalyticsDashboard = () => {
    const muiTheme = useMuiTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const g = searchParams.get('grouped');
        if (g === 'overview') return 'overview';
        if (g === 'map') return 'map';
        if (g === 'user') return 'users';
        if (g === '1') return 'sessions';
        return 'requests';
    });
    const groupBySession = viewMode === 'sessions';
    const groupByUser = viewMode === 'users';
    const [serverUrl, setServerUrl] = useState(() => searchParams.get('server') || '');

    // ── Column order persistence (per view mode) ─────────────────────
    const [columnOrderMap, setColumnOrderMap] = useState<Record<string, string[]>>(() => {
        try {
            const saved = localStorage.getItem('analytics-column-order');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    // Initialize state from URL params
    const [filterModel, setFilterModel] = useState<GridFilterModel>(() => paramsToFilterModel(searchParams));

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(() => {
        const page = parseInt(searchParams.get('page') || '0', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
        return { page, pageSize };
    });

    const [sortModel, setSortModel] = useState<GridSortModel>(() => {
        const urlSort = paramsToSortModel(searchParams);
        return urlSort.length > 0 ? urlSort : [{ field: 'timestamp', sort: 'desc' }];
    });

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => paramsToVisibilityModel(searchParams));

    // Saved Filters State
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
        try {
            const saved = localStorage.getItem('analytics-filter-presets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [newFilterName, setNewFilterName] = useState("");
    const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
    const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set<GridRowId>() };
    const [selectedUserIps, setSelectedUserIps] = useState<GridRowSelectionModel>(EMPTY_SELECTION);
    const [banning, setBanning] = useState(false);

    // Persist saved filters
    useEffect(() => {
        localStorage.setItem('analytics-filter-presets', JSON.stringify(savedFilters));
    }, [savedFilters]);

    const handleSaveFilter = () => {
        if (!newFilterName.trim()) return;
        const newHelper: SavedFilter = {
            name: newFilterName.trim(),
            filterModel: filterModel // Save current filter model
        };
        setSavedFilters([...savedFilters, newHelper]);
        setNewFilterName("");
        setIsSavePopoverOpen(false);
    };

    const handleLoadFilter = (saved: SavedFilter) => {
        setFilterModel(saved.filterModel);
        // Also update URL params
        handleFilterModelChange(saved.filterModel);
    };

    const handleDeleteFilter = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const updated = [...savedFilters];
        updated.splice(index, 1);
        setSavedFilters(updated);
    };

    useEffect(() => {
        let eventSource: EventSource | undefined;
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                // Initial fetch
                const events = await fetchAnalytics({
                    limit: 1000,
                    baseUrl: serverUrl || undefined,
                });

                if (!isMounted) return;

                setData(events.map((e: any, index: number) => ({ ...e, id: `init-${index}` })));

                // Start Streaming
                try {
                    eventSource = await subscribeToAnalyticsStream((newEntry) => {
                        if (!isMounted) return;
                        setData(prev => {
                            // Add new entry, keep max 2000 rows
                            const updated = [{ ...newEntry, id: `stream-${Date.now()}-${Math.random()}` }, ...prev];
                            return updated.slice(0, 2000);
                        });
                    }, serverUrl || undefined);
                    
                    if (!isMounted) {
                        eventSource.close();
                    } else {
                        eventSource.onerror = (err) => {
                            console.error('SSE Error:', err);
                            if (eventSource) eventSource.close();
                        };
                    }
                } catch (err) {
                    console.error('Failed to subscribe to analytics stream', err);
                }

            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [serverUrl]);

    // Update URL when filter model changes
    const handleFilterModelChange = (newFilterModel: GridFilterModel) => {
        setFilterModel(newFilterModel);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            // Clear old filters
            Array.from(newParams.keys()).forEach(key => {
                if (key.startsWith('filter_')) newParams.delete(key);
            });
            // Add new filters
            const filterParams = filterModelToParams(newFilterModel);
            Object.entries(filterParams).forEach(([key, value]) => {
                newParams.set(key, value);
            });
            return newParams;
        }, { replace: true });
    };

    // Update URL when pagination changes
    const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
        setPaginationModel(newPaginationModel);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newPaginationModel.page !== 0 ? newParams.set('page', newPaginationModel.page.toString()) : newParams.delete('page');
            newPaginationModel.pageSize !== 100 ? newParams.set('pageSize', newPaginationModel.pageSize.toString()) : newParams.delete('pageSize');
            return newParams;
        }, { replace: true });
    };

    // Update URL when sort model changes
    const handleSortModelChange = (newSortModel: GridSortModel) => {
        setSortModel(newSortModel);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            const sortParams = sortModelToParams(newSortModel);
            newParams.delete('sort');
            if (sortParams.sort) newParams.set('sort', sortParams.sort);
            return newParams;
        }, { replace: true });
    };

    // Update URL when column visibility changes
    const handleColumnVisibilityModelChange = (newModel: GridColumnVisibilityModel) => {
        setColumnVisibilityModel(newModel);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            const visibilityParams = visibilityModelToParams(newModel);
            newParams.delete('hidden');
            if (visibilityParams.hidden !== undefined) newParams.set('hidden', visibilityParams.hidden);
            return newParams;
        }, { replace: true });
    };

    // Handle column reordering — persist per view mode
    const handleColumnOrderChange = (params: any) => {
        const baseColumns = groupByUser ? userColumns : groupBySession ? sessionColumns : columns;
        const currentOrder = columnOrderMap[viewMode] || baseColumns.map((c: GridColDef) => c.field);
        const newOrder = [...currentOrder];
        // params: { field, targetIndex, oldIndex }
        const oldIdx = newOrder.indexOf(params.field);
        if (oldIdx !== -1) {
            newOrder.splice(oldIdx, 1);
            newOrder.splice(params.targetIndex, 0, params.field);
        }
        setColumnOrderMap(prev => {
            const next = { ...prev, [viewMode]: newOrder };
            localStorage.setItem('analytics-column-order', JSON.stringify(next));
            return next;
        });
    };

    const handleClearDatabase = async () => {
        if (!confirm('Are you sure you want to clear the entire analytics database? This cannot be undone.')) return;
        try {
            await clearAnalytics(serverUrl || undefined);
            setData([]); // Also clear local view
        } catch (error) {
            console.error("Failed to clear analytics database", error);
            alert("Failed to clear database");
        }
    };

    const handleClear = () => {
        setData([]);
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleBanSelected = async () => {
        const ips = Array.from(selectedUserIps.ids) as string[];
        if (ips.length === 0) return;
        if (!confirm(`Ban ${ips.length} IP(s)? They will be blocked from all requests.`)) return;
        setBanning(true);
        try {
            const result = await apiClient<{ banned: number; message: string }>('/api/admin/bans/ban-ip', {
                method: 'POST',
                body: JSON.stringify({ ips }),
            });
            toast.success(`${result.banned} IP(s) banned`, { description: result.message });
            setSelectedUserIps(EMPTY_SELECTION);
        } catch (err: any) {
            toast.error('Ban failed', { description: err.message });
        } finally {
            setBanning(false);
        }
    };

    const cycleViewMode = useCallback(() => {
        setViewMode(prev => {
            const order: ViewMode[] = ['overview', 'requests', 'sessions', 'users'];
            const next = order[(order.indexOf(prev) + 1) % order.length];
            setSearchParams(p => {
                const np = new URLSearchParams(p);
                if (next === 'overview') np.set('grouped', 'overview');
                else if (next === 'sessions') np.set('grouped', '1');
                else if (next === 'users') np.set('grouped', 'user');
                else np.delete('grouped');
                return np;
            }, { replace: true });
            return next;
        });
    }, [setSearchParams]);

    // ── Session aggregation ─────────────────────────────────────────
    const sessionRows = useMemo<SessionSummary[]>(() => {
        if (!groupBySession) return [];
        const map = new Map<string, AnalyticsEvent[]>();
        for (const evt of data) {
            const sid = evt.sessionId || 'unknown';
            let arr = map.get(sid);
            if (!arr) { arr = []; map.set(sid, arr); }
            arr.push(evt);
        }
        const rows: SessionSummary[] = [];
        for (const [sid, events] of map) {
            const sorted = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const uniquePaths = new Set(sorted.map(e => e.path));
            const pathCounts = new Map<string, number>();
            for (const e of sorted) pathCounts.set(e.path, (pathCounts.get(e.path) || 0) + 1);
            let topPath = '';
            let topCount = 0;
            for (const [p, c] of pathCounts) { if (c > topCount) { topPath = p; topCount = c; } }
            const durations = sorted.filter(e => e.durationMs != null).map(e => e.durationMs!);
            const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

            rows.push({
                id: sid,
                sessionId: sid,
                firstSeen: first.timestamp,
                lastSeen: last.timestamp,
                requestCount: events.length,
                paths: [...uniquePaths],
                topPath,
                uniquePaths: uniquePaths.size,
                ip: first.ip,
                country: first.geo?.country?.name || first.geo?.countryName || '',
                countryFlag: first.geo?.country?.countryFlagEmoji || '',
                city: first.geo?.city || '',
                userId: first.userId || '',
                hasBot: sorted.some(e => e.isBot),
                hasAI: sorted.some(e => e.isAI),
                errorCount: sorted.filter(e => e.status >= 400).length,
                avgDuration,
                userAgent: first.userAgent || '',
            });
        }
        // Sort by latest first
        rows.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        return rows;
    }, [data, viewMode]);

    // ── User aggregation (group by IP + geo) ────────────────────────
    const userRows = useMemo<UserSummary[]>(() => {
        if (!groupByUser) return [];
        const map = new Map<string, AnalyticsEvent[]>();
        for (const evt of data) {
            const ip = evt.ip;
            if (!ip || ip === 'unknown') continue;
            let arr = map.get(ip);
            if (!arr) { arr = []; map.set(ip, arr); }
            arr.push(evt);
        }
        const rows: UserSummary[] = [];
        for (const [ip, events] of map) {
            const sorted = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const uniquePaths = new Set(sorted.map(e => e.path));
            const uniqueSessions = new Set(sorted.map(e => e.sessionId).filter(Boolean));
            const pathCounts = new Map<string, number>();
            for (const e of sorted) pathCounts.set(e.path, (pathCounts.get(e.path) || 0) + 1);
            let topPath = '';
            let topCount = 0;
            for (const [p, c] of pathCounts) { if (c > topCount) { topPath = p; topCount = c; } }
            const durations = sorted.filter(e => e.durationMs != null).map(e => e.durationMs!);
            const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

            // Build a display label: prefer authenticated user name, then IP + city
            const authedUser = sorted.find(e => e.userId);
            const country = first.geo?.country?.name || first.geo?.countryName || '';
            const city = first.geo?.city || '';
            const geoTag = [city, country].filter(Boolean).join(', ');
            const label = authedUser?.userId || (geoTag ? `${ip} (${geoTag})` : ip);

            rows.push({
                id: ip,
                ip,
                label,
                country,
                countryFlag: first.geo?.country?.countryFlagEmoji || '',
                city,
                userId: authedUser?.userId || '',
                sessionCount: uniqueSessions.size,
                requestCount: events.length,
                firstSeen: first.timestamp,
                lastSeen: last.timestamp,
                topPath,
                uniquePaths: uniquePaths.size,
                hasBot: sorted.some(e => e.isBot),
                hasAI: sorted.some(e => e.isAI),
                errorCount: sorted.filter(e => e.status >= 400).length,
                avgDuration,
                userAgent: first.userAgent || '',
            });
        }
        rows.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        return rows;
    }, [data, viewMode]);

    const columns: GridColDef[] = [
        {
            field: 'timestamp',
            headerName: 'Timestamp',
            width: 180,
            valueFormatter: (value: any) => {
                try {
                    return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : '';
                } catch (e) {
                    return String(value);
                }
            }
        },
        { field: 'method', headerName: 'Method', width: 90 },
        {
            field: 'country',
            headerName: 'Country',
            width: 150,
            valueGetter: (value: any, row: any) => {
                return row.geo?.country?.name || '';
            },
            renderCell: (params: any) => {
                const country = params.row.geo?.country;
                if (!country) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{country.countryFlagEmoji}</span>
                        <span className="truncate" title={country.name}>{country.name}</span>
                    </div>
                );
            }
        },
        {
            field: 'isBot',
            headerName: 'Bot',
            width: 80,
            renderCell: (params: any) => {
                const isBot = params.value;
                if (!isBot) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex items-center justify-center w-full h-full">
                        <span className="text-lg" title="Bot Request">🤖</span>
                    </div>
                );
            }
        },
        {
            field: 'isAI',
            headerName: 'AI',
            width: 80,
            renderCell: (params: any) => {
                const isAI = params.value;
                if (!isAI) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex items-center justify-center w-full h-full">
                        <span className="text-lg" title="AI Agent">🧠</span>
                    </div>
                );
            }
        },
        {
            field: 'status', headerName: 'Status', width: 90,
            renderCell: (params) => {
                const status = params.value as number;
                let color = 'text-green-600';
                if (status >= 400 && status < 500) color = 'text-yellow-600';
                if (status >= 500) color = 'text-red-600';
                return <span className={`font-bold ${color}`}>{status}</span>;
            }
        },
        { field: 'path', headerName: 'Path', flex: 1, minWidth: 200 },
        { field: 'search', headerName: 'Query', width: 150 },
        { field: 'ip', headerName: 'IP Address', width: 130 },
        { field: 'language', headerName: 'Lang', width: 90 },
        {
            field: 'userAgent', headerName: 'Client (OS / Browser)', width: 220,
            renderCell: (params: any) => {
                const uaRaw = params.value;
                if (!uaRaw) return '-';
                const parser = new UAParser(uaRaw);
                const browser = parser.getBrowser();
                const os = parser.getOS();

                const browserStr = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown Browser';
                const osStr = os.name ? `${os.name} ${os.version || ''}`.trim() : 'Unknown OS';

                return (
                    <div className="truncate w-full text-sm" title={uaRaw}>
                        <span className="font-semibold">{osStr}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span>{browserStr}</span>
                    </div>
                );
            }
        },
        { field: 'referer', headerName: 'Referer', width: 200 },
        { field: 'userId', headerName: 'User ID', width: 150 },
        {
            field: 'sessionId', headerName: 'Session', width: 120,
            renderCell: (params: any) => (
                <span className="font-mono text-xs truncate" title={params.value}>
                    {params.value ? params.value.slice(0, 8) + '…' : '-'}
                </span>
            )
        },
    ];

    const sessionColumns: GridColDef[] = [
        {
            field: 'firstSeen', headerName: 'First Seen', width: 170,
            valueFormatter: (value: any) => {
                try { return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : ''; }
                catch { return String(value); }
            }
        },
        {
            field: 'lastSeen', headerName: 'Last Seen', width: 170,
            valueFormatter: (value: any) => {
                try { return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : ''; }
                catch { return String(value); }
            }
        },
        { field: 'requestCount', headerName: 'Requests', width: 100, type: 'number' },
        {
            field: 'errorCount', headerName: 'Errors', width: 80, type: 'number',
            renderCell: (params: any) => {
                const v = params.value as number;
                if (!v) return <span className="text-muted-foreground">0</span>;
                return <span className="font-bold text-red-600">{v}</span>;
            }
        },
        { field: 'uniquePaths', headerName: 'Pages', width: 80, type: 'number' },
        {
            field: 'topPath', headerName: 'Top Path', flex: 1, minWidth: 180,
            renderCell: (params: any) => (
                <div className="truncate w-full" title={params.row.paths?.join('\n')}>
                    {params.value}
                </div>
            )
        },
        {
            field: 'country', headerName: 'Country', width: 150,
            renderCell: (params: any) => {
                const flag = params.row.countryFlag;
                const name = params.value;
                if (!name) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex items-center gap-2">
                        {flag && <span className="text-lg">{flag}</span>}
                        <span className="truncate">{name}</span>
                    </div>
                );
            }
        },
        { field: 'city', headerName: 'City', width: 120 },
        { field: 'ip', headerName: 'IP', width: 130 },
        { field: 'userName', headerName: 'User', width: 140 },
        {
            field: 'hasBot', headerName: 'Bot', width: 60,
            renderCell: (params: any) => params.value ? <span title="Bot">🤖</span> : <span className="text-muted-foreground">-</span>
        },
        {
            field: 'hasAI', headerName: 'AI', width: 60,
            renderCell: (params: any) => params.value ? <span title="AI">🧠</span> : <span className="text-muted-foreground">-</span>
        },
        { field: 'avgDuration', headerName: 'Avg ms', width: 90, type: 'number' },
        {
            field: 'userAgent', headerName: 'Client', width: 200,
            renderCell: (params: any) => {
                const uaRaw = params.value;
                if (!uaRaw) return <span className="text-muted-foreground">-</span>;
                const parser = new UAParser(uaRaw);
                const browser = parser.getBrowser();
                const os = parser.getOS();
                const browserStr = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : '?';
                const osStr = os.name ? `${os.name} ${os.version || ''}`.trim() : '?';
                return (
                    <div className="truncate w-full text-sm" title={uaRaw}>
                        <span className="font-semibold">{osStr}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span>{browserStr}</span>
                    </div>
                );
            }
        },
        {
            field: 'sessionId', headerName: 'Session ID', width: 130,
            renderCell: (params: any) => (
                <span className="font-mono text-xs truncate" title={params.value}>
                    {params.value?.slice(0, 8) ?? '-'}…
                </span>
            )
        },
    ];

    const userColumns: GridColDef[] = [
        {
            field: 'country', headerName: 'Country', width: 150,
            renderCell: (params: any) => {
                const flag = params.row.countryFlag;
                const name = params.value;
                if (!name) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex items-center gap-2">
                        {flag && <span className="text-lg">{flag}</span>}
                        <span className="truncate">{name}</span>
                    </div>
                );
            }
        },
        { field: 'city', headerName: 'City', width: 120 },
        {
            field: 'hasBot', headerName: 'Bot', width: 60,
            renderCell: (params: any) => params.value ? <span title="Bot">🤖</span> : <span className="text-muted-foreground">-</span>
        },
        {
            field: 'hasAI', headerName: 'AI', width: 60,
            renderCell: (params: any) => params.value ? <span title="AI">🧠</span> : <span className="text-muted-foreground">-</span>
        },
        {
            field: 'label', headerName: 'User', width: 220,
            renderCell: (params: any) => (
                <span className="truncate" title={params.value}>{params.value}</span>
            )
        },
        {
            field: 'firstSeen', headerName: 'First Seen', width: 170,
            valueFormatter: (value: any) => {
                try { return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : ''; }
                catch { return String(value); }
            }
        },
        {
            field: 'lastSeen', headerName: 'Last Seen', width: 170,
            valueFormatter: (value: any) => {
                try { return value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : ''; }
                catch { return String(value); }
            }
        },
        { field: 'sessionCount', headerName: 'Sessions', width: 90, type: 'number' },
        { field: 'requestCount', headerName: 'Requests', width: 100, type: 'number' },
        {
            field: 'errorCount', headerName: 'Errors', width: 80, type: 'number',
            renderCell: (params: any) => {
                const v = params.value as number;
                if (!v) return <span className="text-muted-foreground">0</span>;
                return <span className="font-bold text-red-600">{v}</span>;
            }
        },
        { field: 'uniquePaths', headerName: 'Pages', width: 80, type: 'number' },
        { field: 'topPath', headerName: 'Top Path', flex: 1, minWidth: 180 },
        { field: 'ip', headerName: 'IP', width: 130 },
        { field: 'userName', headerName: 'Auth User', width: 140 },
        { field: 'avgDuration', headerName: 'Avg ms', width: 90, type: 'number' },
        {
            field: 'userAgent', headerName: 'Client', width: 200,
            renderCell: (params: any) => {
                const uaRaw = params.value;
                if (!uaRaw) return <span className="text-muted-foreground">-</span>;
                const parser = new UAParser(uaRaw);
                const browser = parser.getBrowser();
                const os = parser.getOS();
                const browserStr = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : '?';
                const osStr = os.name ? `${os.name} ${os.version || ''}`.trim() : '?';
                return (
                    <div className="truncate w-full text-sm" title={uaRaw}>
                        <span className="font-semibold">{osStr}</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span>{browserStr}</span>
                    </div>
                );
            }
        },
    ];

    // Apply column order from URL if needed (skipping for now based on complexity vs benefit)

    return (
        <Card className="h-[calc(100vh-100px)] flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base sm:text-lg">Analytics</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                <Server className="w-4 h-4" />
                                <span className="hidden sm:inline">{SERVER_OPTIONS.find(s => s.value === serverUrl)?.label || 'Localhost'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Server</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SERVER_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => {
                                        setServerUrl(opt.value);
                                        setSearchParams(prev => {
                                            const np = new URLSearchParams(prev);
                                            opt.value ? np.set('server', opt.value) : np.delete('server');
                                            return np;
                                        }, { replace: true });
                                    }}
                                    className={serverUrl === opt.value ? 'font-bold' : ''}
                                >
                                    {opt.label}
                                    {opt.value && <span className="ml-2 text-xs text-muted-foreground truncate max-w-[160px]">{opt.value}</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <Popover open={isSavePopoverOpen} onOpenChange={setIsSavePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Save className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Save Filter</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Save Filter Preset</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Save the current filters as a preset.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="name"
                                            value={newFilterName}
                                            onChange={(e) => setNewFilterName(e.target.value)}
                                            placeholder="e.g. Errors Only"
                                            className="h-8"
                                        />
                                        <Button size="sm" onClick={handleSaveFilter}>Save</Button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Bookmark className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Load Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {savedFilters.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                    No saved filters
                                </div>
                            ) : (
                                savedFilters.map((filter, index) => (
                                    <DropdownMenuItem key={index} onClick={() => handleLoadFilter(filter)} className="flex justify-between items-center">
                                        <span>{filter.name}</span>
                                        <X
                                            className="w-4 h-4 opacity-50 hover:opacity-100 cursor-pointer"
                                            onClick={(e) => handleDeleteFilter(e, index)}
                                        />
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="inline-flex rounded-md border border-input" role="group">
                        {[
                            { mode: 'overview' as ViewMode, icon: BarChart3, label: 'Overview' },
                            { mode: 'map' as ViewMode, icon: MapIcon, label: 'Map' },
                            { mode: 'requests' as ViewMode, icon: List, label: 'Requests' },
                            { mode: 'sessions' as ViewMode, icon: LayoutList, label: 'Sessions' },
                            { mode: 'users' as ViewMode, icon: Users, label: 'Users' },
                        ].map(({ mode, icon: Icon, label }) => (
                            <Button
                                key={mode}
                                variant={viewMode === mode ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 rounded-none first:rounded-l-md last:rounded-r-md ${viewMode !== mode ? 'border-0' : ''}`}
                                onClick={() => {
                                    setViewMode(mode);
                                    setSearchParams(p => {
                                        const np = new URLSearchParams(p);
                                        if (mode === 'overview') np.set('grouped', 'overview');
                                        else if (mode === 'map') np.set('grouped', 'map');
                                        else if (mode === 'sessions') np.set('grouped', '1');
                                        else if (mode === 'users') np.set('grouped', 'user');
                                        else np.delete('grouped');
                                        return np;
                                    }, { replace: true });
                                }}
                            >
                                <Icon className="w-4 h-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </Button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-8" onClick={handleClear}>
                        <Trash2 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Clear View</span>
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8" onClick={handleClearDatabase}>
                        <Trash2 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Clear DB</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    {groupByUser && selectedUserIps.ids.size > 0 && (
                        <Button variant="destructive" size="sm" className="h-8" onClick={handleBanSelected} disabled={banning}>
                            <ShieldBan className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Ban {selectedUserIps.ids.size} IP(s)</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                {viewMode === 'overview' ? (
                    <AnalyticsOverview serverUrl={serverUrl} />
                ) : viewMode === 'map' ? (
                    <AnalyticsMapView serverUrl={serverUrl} />
                ) : (
                <div style={{ height: '100%', width: '100%' }}>
                    <><MuiThemeProvider theme={muiTheme}>
                    <DataGrid
                        rows={(groupByUser ? userRows : groupBySession ? sessionRows : data) as any[]}
                        columns={(() => {
                            const base = groupByUser ? userColumns : groupBySession ? sessionColumns : columns;
                            const savedOrder = columnOrderMap[viewMode];
                            if (!savedOrder || savedOrder.length === 0) return base;
                            const fieldMap = new Map(base.map((c: GridColDef) => [c.field, c]));
                            const ordered: GridColDef[] = [];
                            for (const f of savedOrder) {
                                const col = fieldMap.get(f);
                                if (col) { ordered.push(col); fieldMap.delete(f); }
                            }
                            // Append any new columns not in saved order
                            for (const col of fieldMap.values()) ordered.push(col);
                            return ordered;
                        })()}
                        loading={loading}
                        filterModel={viewMode === 'requests' ? filterModel : undefined}
                        onFilterModelChange={viewMode === 'requests' ? handleFilterModelChange : undefined}
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={viewMode === 'requests' ? sortModel : undefined}
                        onSortModelChange={viewMode === 'requests' ? handleSortModelChange : undefined}
                        columnVisibilityModel={viewMode === 'requests' ? columnVisibilityModel : undefined}
                        onColumnVisibilityModelChange={viewMode === 'requests' ? handleColumnVisibilityModelChange : undefined}
                        pageSizeOptions={[20, 50, 100]}
                        slots={{
                            toolbar: GridToolbar,
                        }}
                        checkboxSelection={groupByUser}
                        rowSelectionModel={groupByUser ? selectedUserIps : undefined}
                        onRowSelectionModelChange={groupByUser ? (newSel) => setSelectedUserIps(newSel) : undefined}
                        disableRowSelectionOnClick
                        onColumnOrderChange={handleColumnOrderChange}
                        className="border-0 rounded-none h-full"
                        sx={{
                            border: 0,
                            bgcolor: 'transparent',
                            color: 'hsl(var(--foreground))',
                            '& .MuiDataGrid-columnHeaders': {
                                borderColor: 'hsl(var(--border))',
                            },
                            '& .MuiDataGrid-cell': {
                                borderColor: 'hsl(var(--border))',
                                '&:focus, &:focus-within': { outline: 'none' },
                            },
                            '& .MuiDataGrid-columnHeader': {
                                '&:focus, &:focus-within': { outline: 'none' },
                            },
                            '& .MuiDataGrid-row.Mui-selected': {
                                backgroundColor: 'hsl(var(--primary) / 0.05)',
                                '&:hover': {
                                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                                },
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderColor: 'hsl(var(--border))',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'hsl(var(--muted-foreground))',
                            },
                            '& .MuiDataGrid-overlay': {
                                bgcolor: 'transparent',
                            },
                            '& .MuiCheckbox-root': {
                                color: 'hsl(var(--muted-foreground))',
                                '&.Mui-checked': {
                                    color: 'hsl(var(--primary))',
                                },
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                color: 'hsl(var(--border))',
                            },
                            '& .MuiDataGrid-menuIcon button, & .MuiDataGrid-iconButtonContainer button': {
                                color: 'hsl(var(--muted-foreground))',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                overflowX: 'auto',
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                color: 'hsl(var(--foreground))',
                                '& .MuiButtonBase-root': {
                                    color: 'hsl(var(--muted-foreground))',
                                },
                            },
                        }}
                    />
                    </MuiThemeProvider></>
                </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AnalyticsDashboard;
