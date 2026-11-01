import { useState } from "react";
import UserManager from "@/components/admin/UserManager";
import StorageManager from "@/components/admin/StorageManager";
import VideoManager from "@/components/admin/VideoManager";
import ProductsManager from "@/components/admin/ProductsManager";
import { AclPlayground } from "@/components/admin/AclPlayground";
import { useAuth } from "@/hooks/useAuth";
import { T, translate } from "@/i18n";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Server, RefreshCw, Power, Cpu } from "lucide-react";
import { BansManager } from "@/components/admin/BansManager";
import { ViolationsMonitor } from "@/components/admin/ViolationsMonitor";
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { postFlushCache, postAdminSystemRestart } from "@/modules/admin/client-admin";

// Lazy load AnalyticsDashboard
const AnalyticsDashboard = React.lazy(() => import("@/modules/analytics").then(module => ({ default: module.AnalyticsDashboard })));
const LogsPage = React.lazy(() => import("@/components/logging/LogsPage"));
const ZitadelManager = React.lazy(() => import("@/components/admin/ZitadelManager"));
const SitesManager = import.meta.env.VITE_ENABLE_SITE_ADMIN === 'true'
    ? React.lazy(() => import("@/components/admin/SitesManager"))
    : null;
const SiteStepsPage = import.meta.env.VITE_ENABLE_SITE_ADMIN === 'true'
    ? React.lazy(() => import("@/components/admin/SiteStepsPage"))
    : null;

const AdminPage = () => {
    const { user, loading, roles } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-muted-foreground"><T>Loading...</T></div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (!roles.includes('admin')) {
        return <Navigate to="/" replace />;
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex flex-col md:flex-row w-full bg-background pt-14">
                <AdminSidebar />
                <main className="flex-1 p-3 sm:p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Routes>
                            <Route path="/" element={<Navigate to="users" replace />} />
                            <Route path="users" element={<UserManagerSection />} />
                            <Route path="dashboard" element={<DashboardSection />} />
                            <Route path="server" element={<ServerSection />} />
                            <Route path="bans" element={<BansSection />} />
                            <Route path="violations" element={<ViolationsSection />} />
                            <Route path="analytics" element={
                                <Suspense fallback={<div><T>Loading analytics...</T></div>}>
                                    <AnalyticsDashboard />
                                </Suspense>
                            } />
                            <Route path="logs" element={
                                <Suspense fallback={<div><T>Loading logs...</T></div>}>
                                    <LogsPage />
                                </Suspense>
                            } />
                            <Route path="zitadel" element={
                                <Suspense fallback={<div><T>Loading...</T></div>}>
                                    <ZitadelManager />
                                </Suspense>
                            } />
                            <Route path="storage" element={<StorageManager />} />
                            <Route path="videos" element={<VideoManager />} />
                            <Route path="products" element={<ProductsManagerSection />} />
                            <Route path="acl" element={<AclPlaygroundSection />} />
                            {SitesManager && (
                                <Route path="sites" element={
                                    <Suspense fallback={<div><T>Loading sites...</T></div>}>
                                        <SitesManagerSection />
                                    </Suspense>
                                } />
                            )}
                            {SiteStepsPage && (
                                <Route path="sites/:name/steps" element={
                                    <Suspense fallback={<div><T>Loading...</T></div>}>
                                        <SiteStepsPage />
                                    </Suspense>
                                } />
                            )}
                        </Routes>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

const UserManagerSection = () => (
    <div>
        <h1 className="text-2xl font-bold mb-4"><T>User Management</T></h1>
        <UserManager />
    </div>
);

const ProductsManagerSection = () => (
    <div>
        <h1 className="text-2xl font-bold mb-4"><T>Products Management</T></h1>
        <ProductsManager />
    </div>
);

const AclPlaygroundSection = () => (
    <div>
        <h1 className="text-2xl font-bold mb-4"><T>ACL Playground</T></h1>
        <AclPlayground />
    </div>
);

const SitesManagerSection = () => (
    <div>
        <h1 className="text-2xl font-bold mb-4"><T>Sites</T></h1>
        {SitesManager && <SitesManager />}
    </div>
);

const DashboardSection = () => (
    <div>
        <h1 className="text-2xl font-bold mb-4"><T>Dashboard</T></h1>
        <p><T>Welcome to the admin dashboard. More features coming soon!</T></p>
    </div>
);

const BansSection = () => (
    <BansManager />
);

const ViolationsSection = () => (
    <ViolationsMonitor />
);

const ServerSection = () => {
    const [loading, setLoading] = useState(false);

    const handleFlushCache = async () => {
        try {
            setLoading(true);
            await postFlushCache();

            toast.success(translate("Cache flushed successfully"), {
                description: translate("Access and Content caches have been cleared.")
            });
        } catch (err: any) {
            toast.error(translate("Failed to flush cache"), {
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = async () => {
        if (!confirm(translate('Are you sure you want to restart the server? This will cause a brief downtime.'))) {
            return;
        }

        try {
            const data = await postAdminSystemRestart();
            toast.success(translate("Server restarting"), {
                description: data.message
            });
        } catch (err: any) {
            toast.error(translate("Failed to restart server"), {
                description: err.message
            });
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Server className="h-6 w-6" />
                <h1 className="text-2xl font-bold"><T>Server Management</T></h1>
            </div>

            <div className="bg-card border rounded-lg p-6 max-w-2xl">
                <h2 className="text-lg font-semibold mb-4"><T>Cache Control</T></h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium"><T>Flush System Cache</T></p>
                        <p className="text-sm text-muted-foreground mt-1">
                            <T>Clears the server-side content cache (memory) and the disk-based image cache. Use this if content is not updating correctly.</T>
                        </p>
                    </div>

                    <Button
                        onClick={handleFlushCache}
                        disabled={loading}
                        variant="destructive"
                    >
                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        <T>Flush Cache</T>
                    </Button>
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6 max-w-2xl mt-6">
                <h2 className="text-lg font-semibold mb-4"><T>System Resources</T></h2>
                <SystemStats />
            </div>

            <div className="bg-card border rounded-lg p-6 max-w-2xl mt-6">
                <h2 className="text-lg font-semibold mb-4"><T>System Control</T></h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium"><T>Restart Server</T></p>
                        <p className="text-sm text-muted-foreground mt-1">
                            <T>Gracefully restart the server process. Systemd will automatically bring it back online. This will cause a brief downtime.</T>
                        </p>
                    </div>

                    <Button
                        onClick={handleRestart}
                        variant="destructive"
                    >
                        <Power className="mr-2 h-4 w-4" />
                        <T>Restart</T>
                    </Button>
                </div>
            </div>
        </div>
    );
};

// System Stats Hook & Component
//import { useEffect } from "react";
import { Activity } from "lucide-react";

interface SystemData {

    osCpu: { models: string[], cores: number, currentLoadPercent: number, maxLoadPercent: number };
    processCpu: { currentLoadPercent: number, maxLoadPercent: number };
    processMemory: { totalMemMB: number, freeMemMB: number, usedMemMB: number, usagePercent: number };
    systemMemory: { totalMemMB: number, freeMemMB: number, usedMemMB: number, usagePercent: number };
    uptime: number;
    tasks: { id: string, module: string, method: string, intervalMs: number, status: string, lastRunMs: number }[];
    workers: { id: string, threadId: number }[];
}

interface WorkerPing {
    id: string;
    threadId: number;
    status: 'alive' | 'timeout';
    activeJobs: number;
    latencyMs: number;
    heapUsedMB?: number;
    heapTotalMB?: number;
    eluPercent?: number;
    cpuPercent?: number;
}

//import { useWebSocket } from '@/contexts/WS_Socket';

const SystemStats = () => {
    const [stats, setStats] = useState<SystemData | null>(null);
    //const { addListener, removeListener, sendCommand } = useWebSocket();
/*
    useEffect(() => {
        const handler = (msg: any) => {
            if (msg.type === 'sys-stats' && msg.stats) {
                setStats(msg.stats);
            }
        };

        addListener(handler);

        // Request stats immediately, then every 2 s while this component is mounted
        sendCommand('get-sys-stats');
        const timer = setInterval(() => sendCommand('get-sys-stats'), 2000);

        return () => {
            removeListener(handler);
            clearInterval(timer);
        };
    }, [addListener, removeListener, sendCommand]);
    */

    if (!stats) return <div className="text-sm text-muted-foreground animate-pulse"><T>Loading system metrics...</T></div>;

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d}d ${h}h ${m}m`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">System CPU (Host OS)</h3>
                </div>
                <div className="text-sm space-y-1">
                    <div className="w-full bg-secondary rounded-full h-2.5 mb-2 mt-1 relative overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${stats.osCpu.currentLoadPercent > 85 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${stats.osCpu.currentLoadPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-muted-foreground truncate mb-1" title={stats.osCpu.models[0]}>{stats.osCpu.models[0]}</p>
                    <p className="flex justify-between">
                        <span>Cores:</span> <span className="font-medium">{stats.osCpu.cores}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Current Load:</span> <span className="font-medium">{stats.osCpu.currentLoadPercent}%</span>
                    </p>
                    <p className="flex justify-between text-muted-foreground border-t pt-1 mt-1">
                        <span>Max Peak Load:</span> <span>{stats.osCpu.maxLoadPercent}%</span>
                    </p>
                </div>
            </div>

            <div className="p-4 border rounded bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Process CPU (Node Event Loop)</h3>
                </div>
                <div className="text-sm space-y-1">
                    <div className="w-full bg-secondary rounded-full h-2.5 mb-2 mt-1 relative overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${stats.processCpu.currentLoadPercent > 85 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${stats.processCpu.currentLoadPercent}%` }}
                        ></div>
                    </div>
                    <p className="flex justify-between mt-4">
                        <span>Current Load:</span> <span className="font-medium">{stats.processCpu.currentLoadPercent}%</span>
                    </p>
                    <p className="flex justify-between text-muted-foreground border-t pt-1 mt-1">
                        <span>Max Peak Load:</span> <span>{stats.processCpu.maxLoadPercent}%</span>
                    </p>

                </div>
            </div>

            <div className="p-4 border rounded bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Process Memory</h3>
                </div>
                <div className="text-sm space-y-1">
                    <div className="w-full bg-secondary rounded-full h-2.5 mb-2 mt-1 relative overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${stats.processMemory.usagePercent > 85 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${stats.processMemory.usagePercent}%` }}
                        ></div>
                    </div>
                    <p className="flex justify-between">
                        <span>Heap Used:</span> <span className="font-medium">{stats.processMemory.usedMemMB} MB</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Heap Free:</span> <span className="font-medium">{stats.processMemory.freeMemMB} MB</span>
                    </p>
                    <p className="flex justify-between text-muted-foreground border-t pt-1 mt-1">
                        <span>Total (RSS):</span> <span>{stats.processMemory.totalMemMB} MB</span>
                    </p>
                </div>
            </div>

            <div className="p-4 border rounded bg-muted/30 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">System Memory (Host OS)</h3>
                </div>
                <div className="text-sm space-y-1">
                    <div className="w-full bg-secondary rounded-full h-2.5 mb-2 mt-1 relative overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${stats.systemMemory.usagePercent > 85 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${stats.systemMemory.usagePercent}%` }}
                        ></div>
                    </div>
                    <p className="flex justify-between">
                        <span>Used:</span> <span className="font-medium">{(stats.systemMemory.usedMemMB / 1024).toFixed(2)} GB</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Free:</span> <span className="font-medium">{(stats.systemMemory.freeMemMB / 1024).toFixed(2)} GB</span>
                    </p>
                    <p className="flex justify-between text-muted-foreground border-t pt-1 mt-1">
                        <span>Total:</span> <span>{(stats.systemMemory.totalMemMB / 1024).toFixed(2)} GB</span>
                    </p>
                </div>
            </div>

            {/* Worker Threads */}
            <WorkerThreadStats />

            {/* Task Runner Stats */}
            {stats.tasks && stats.tasks.length > 0 && (
                <div className="p-4 border rounded bg-muted/30 col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Background Tasks</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.tasks.map((task) => (
                            <div key={task.id} className="border bg-background p-3 rounded-md shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-xs">{task.id}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${task.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        task.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="flex justify-between">
                                        <span>Target:</span> <span className="truncate ml-2" title={`${task.module}::${task.method}`}>{task.module}::{task.method}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Interval:</span> <span>{Math.round(task.intervalMs / 1000)}s</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Last Run:</span> <span>{task.lastRunMs >= 0 ? `${Math.round(task.lastRunMs / 1000)}s ago` : 'Never'}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="col-span-1 md:col-span-2 text-xs text-muted-foreground mt-2 text-right">
                Uptime: {formatUptime(stats.uptime)}
            </div>
        </div>
    );
};

const WorkerThreadStats = () => {
    const [pings, setPings] = useState<WorkerPing[]>([]);
    //const { addListener, removeListener } = useWebSocket();
/*
    useEffect(() => {
        const handler = (msg: any) => {
            if (msg.type === 'sys-stats' && msg.pings) {
                setPings(msg.pings);
            }
        };

        addListener(handler);
        return () => removeListener(handler);
    }, [addListener, removeListener]);
    */

    if (pings.length === 0) return null;

    return (
        <div className="p-4 border rounded bg-muted/30 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Worker Threads</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pings.map((w) => (
                    <div key={w.id} className="border bg-background p-3 rounded-md shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-xs">{w.id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${w.status === 'alive'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {w.status}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="flex justify-between">
                                <span>Thread ID:</span> <span className="font-medium">{w.threadId}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Active Jobs:</span>
                                <span className={`font-medium ${w.activeJobs > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                    {w.activeJobs >= 0 ? w.activeJobs : '-'}
                                </span>
                            </p>
                            {w.eluPercent !== undefined && (
                                <p className="flex justify-between">
                                    <span>CPU / ELU:</span>
                                    <span className="font-medium text-purple-600 dark:text-purple-400">
                                        {w.cpuPercent ?? '-'}% / {w.eluPercent}%
                                    </span>
                                </p>
                            )}
                            {w.heapUsedMB !== undefined && (
                                <p className="flex justify-between">
                                    <span>V8 Heap (Used):</span>
                                    <span className="font-medium">
                                        {w.heapUsedMB} MB
                                    </span>
                                </p>
                            )}
                            <p className="flex justify-between">
                                <span>Latency:</span>
                                <span className={w.latencyMs < 0 ? 'text-destructive' : 'font-medium'}>
                                    {w.latencyMs < 0 ? 'timeout' : `${w.latencyMs}ms`}
                                </span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;
