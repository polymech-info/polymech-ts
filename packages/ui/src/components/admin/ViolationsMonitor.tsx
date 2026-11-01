import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { T, translate } from "@/i18n";
import { getAdminViolationStats, type AdminViolationStats } from "@/modules/admin/client-admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export const ViolationsMonitor = () => {
    const [stats, setStats] = useState<AdminViolationStats>({
        totalViolations: 0,
        violations: [],
    });
    const [loading, setLoading] = useState(false);

    const fetchViolationStats = async () => {
        try {
            setLoading(true);
            const data = await getAdminViolationStats();
            setStats(data);
        } catch (err: any) {
            toast.error(translate("Failed to fetch violation stats"), {
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViolationStats();
        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchViolationStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getViolationType = (key: string) => {
        const [type] = key.split(':', 2);
        return type;
    };

    const getViolationValue = (key: string) => {
        const [, value] = key.split(':', 2);
        return value;
    };

    const getSeverityColor = (count: number) => {
        if (count >= 4) return "destructive";
        if (count >= 2) return "default";
        return "secondary";
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6" />
                    <h1 className="text-2xl font-bold"><T>Violation Monitor</T></h1>
                </div>
                <Button onClick={fetchViolationStats} disabled={loading} variant="outline">
                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    <T>Refresh</T>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium"><T>Active Violations</T></CardTitle>
                        <CardDescription><T>Currently tracked violation records</T></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalViolations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium"><T>Auto-Refresh</T></CardTitle>
                        <CardDescription><T>Updates every 5 seconds</T></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-muted-foreground"><T>Live monitoring</T></span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {stats.totalViolations === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <T>No active violations</T>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle><T>Violation Records</T></CardTitle>
                        <CardDescription>
                            <T>Entities approaching the ban threshold (5 violations within the configured window)</T>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><T>Type</T></TableHead>
                                    <TableHead><T>Identifier</T></TableHead>
                                    <TableHead><T>Count</T></TableHead>
                                    <TableHead><T>First Violation</T></TableHead>
                                    <TableHead><T>Last Violation</T></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.violations
                                    .sort((a, b) => b.count - a.count)
                                    .map((violation) => (
                                        <TableRow key={violation.key}>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {getViolationType(violation.key)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {getViolationValue(violation.key).substring(0, 40)}
                                                {getViolationValue(violation.key).length > 40 && '...'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getSeverityColor(violation.count)}>
                                                    {violation.count} / 5
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatTimestamp(violation.firstViolation)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatTimestamp(violation.lastViolation)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle><T>About Violations</T></CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        <strong><T>Violation Tracking:</T></strong> <T>The system tracks rate limit violations for IPs and authenticated users.</T>
                    </p>
                    <p>
                        <strong><T>Auto-Ban Threshold:</T></strong> <T>When an entity reaches 5 violations within the configured time window, they are automatically banned and moved to the ban list.</T>
                    </p>
                    <p>
                        <strong><T>Cleanup:</T></strong> <T>Violation records are automatically cleaned up after the time window expires.</T>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
