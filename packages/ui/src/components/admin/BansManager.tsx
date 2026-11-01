import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Trash2, RefreshCw } from "lucide-react";
import { T, translate } from "@/i18n";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAdminBanList, postAdminUnbanIp, postAdminUnbanUser, type AdminBanList } from "@/modules/admin/client-admin";

export const BansManager = () => {
    const [banList, setBanList] = useState<AdminBanList>({
        bannedIPs: [],
        bannedUserIds: [],
        bannedTokens: [],
    });
    const [loading, setLoading] = useState(false);
    const [unbanTarget, setUnbanTarget] = useState<{ type: 'ip' | 'user'; value: string } | null>(null);

    const fetchBanList = async () => {
        try {
            setLoading(true);
            const data = await getAdminBanList();
            setBanList(data);
        } catch (err: any) {
            toast.error(translate("Failed to fetch ban list"), {
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnban = async () => {
        if (!unbanTarget) return;

        try {
            const data =
                unbanTarget.type === 'ip'
                    ? await postAdminUnbanIp(unbanTarget.value)
                    : await postAdminUnbanUser(unbanTarget.value);

            if (data.success) {
                toast.success(translate("Unbanned successfully"), {
                    description: data.message
                });
                fetchBanList();
            } else {
                toast.warning(translate("Not found"), {
                    description: data.message
                });
            }
        } catch (err: any) {
            toast.error(translate("Failed to unban"), {
                description: err.message
            });
        } finally {
            setUnbanTarget(null);
        }
    };

    useEffect(() => {
        fetchBanList();
    }, []);

    const totalBans = banList.bannedIPs.length + banList.bannedUserIds.length + banList.bannedTokens.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    <h1 className="text-2xl font-bold"><T>Ban Management</T></h1>
                </div>
                <Button onClick={fetchBanList} disabled={loading} variant="outline">
                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    <T>Refresh</T>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium"><T>Banned IPs</T></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{banList.bannedIPs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium"><T>Banned Users</T></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{banList.bannedUserIds.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium"><T>Banned Tokens</T></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{banList.bannedTokens.length}</div>
                    </CardContent>
                </Card>
            </div>

            {totalBans === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <T>No active bans</T>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {banList.bannedIPs.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle><T>Banned IP Addresses</T></CardTitle>
                                <CardDescription>
                                    <T>IP addresses that have been auto-banned for excessive requests</T>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><T>IP Address</T></TableHead>
                                            <TableHead className="text-right"><T>Actions</T></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {banList.bannedIPs.map((ip) => (
                                            <TableRow key={ip}>
                                                <TableCell className="font-mono">{ip}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setUnbanTarget({ type: 'ip', value: ip })}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        <T>Unban</T>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {banList.bannedUserIds.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle><T>Banned Users</T></CardTitle>
                                <CardDescription>
                                    <T>User accounts that have been auto-banned for excessive requests</T>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><T>User ID</T></TableHead>
                                            <TableHead className="text-right"><T>Actions</T></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {banList.bannedUserIds.map((userId) => (
                                            <TableRow key={userId}>
                                                <TableCell className="font-mono text-sm">{userId}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setUnbanTarget({ type: 'user', value: userId })}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        <T>Unban</T>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {banList.bannedTokens.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle><T>Banned Tokens</T></CardTitle>
                                <CardDescription>
                                    <T>Authentication tokens that have been auto-banned (cannot be unbanned via UI)</T>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><T>Token (truncated)</T></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {banList.bannedTokens.map((token, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-mono text-sm">
                                                    {token.substring(0, 40)}...
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <AlertDialog open={!!unbanTarget} onOpenChange={(open) => !open && setUnbanTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Confirm Unban</T></AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unban this {unbanTarget?.type}?
                            <div className="mt-2 p-2 bg-muted rounded font-mono text-sm">
                                {unbanTarget?.value}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnban}><T>Unban</T></AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
