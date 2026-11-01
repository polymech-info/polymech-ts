import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { T, translate } from "@/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AclEntry } from "./client-acl";

export type AclGrantInput = {
    userId?: string;
    group?: string;
    permissions: string[];
};

export type AclRevokeInput = {
    userId?: string;
    group?: string;
};

/** Context passed to renderGrantSection. */
export type GrantSectionContext = {
    entries: AclEntry[];
    grant: (input: AclGrantInput) => Promise<void>;
    revoke: (input: AclRevokeInput) => Promise<void>;
    refresh: () => void;
};

export interface ACLBaseEditorProps {
    compact?: boolean;
    resourceDescription: React.ReactNode;
    resourceContextNote?: React.ReactNode;
    loadEntries: () => Promise<AclEntry[]>;
    grant: (input: AclGrantInput) => Promise<void>;
    revoke: (input: AclRevokeInput) => Promise<void>;
    fetchProfiles?: (
        userIds: string[],
    ) => Promise<Record<string, { display_name?: string; username?: string }>>;
    renderGrantSection?: (ctx: GrantSectionContext) => React.ReactNode;
}

export function ACLBaseEditor({
    compact = false,
    resourceDescription,
    resourceContextNote,
    loadEntries,
    grant,
    revoke,
    fetchProfiles,
    renderGrantSection,
}: ACLBaseEditorProps) {
    const [entries, setEntries] = useState<AclEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<Record<string, { display_name?: string; username?: string }>>({});

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const list = await loadEntries();
            setEntries(list || []);
        } catch (e) {
            console.error(e);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [loadEntries]);

    useEffect(() => { refresh(); }, [refresh]);

    useEffect(() => {
        const userIds = Array.from(
            new Set(
                entries
                    .map((e) => e.userId)
                    .filter(Boolean),
            ),
        ) as string[];
        if (userIds.length === 0 || !fetchProfiles) return;
        let cancelled = false;
        fetchProfiles(userIds)
            .then((map) => { if (!cancelled && map) setProfiles((prev) => ({ ...prev, ...map })); })
            .catch((err) => console.error("Profile fetch error:", err));
        return () => { cancelled = true; };
    }, [entries, fetchProfiles]);

    const handleRevoke = async (entry: AclEntry) => {
        if (!confirm(translate("Are you sure you want to revoke this permission?"))) return;
        try {
            await revoke({ userId: entry.userId, group: entry.group });
            toast.success(translate("Access revoked"));
            refresh();
        } catch (e: any) { toast.error(e.message); }
    };

    const sortedEntries = [...entries]
        .sort((a, b) => (a.userId || a.group || "").localeCompare(b.userId || b.group || ""));

    const ctx: GrantSectionContext = { entries, grant, revoke, refresh };

    return (
        <Card className={`h-full border-0 shadow-none bg-transparent ${compact ? "compact-acl" : ""}`}>
            {!compact && (
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <T>Access Control</T>
                    </CardTitle>
                    <CardDescription>
                        <T>Manage permissions for</T> {resourceDescription}
                    </CardDescription>
                </CardHeader>
            )}
            <CardContent className={compact ? "px-0 space-y-3" : "px-0 space-y-6"}>

                {renderGrantSection && renderGrantSection(ctx)}

                {/* Active Permissions table */}
                {!compact && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            <T>Active Permissions</T>
                            {resourceContextNote != null ? <> {resourceContextNote}</> : null}
                        </h3>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><T>Subject</T></TableHead>
                                        <TableHead><T>Permissions</T></TableHead>
                                        <TableHead className="w-[50px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                <T>No active permissions found.</T>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedEntries.map((entry, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    {entry.userId ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">
                                                                {profiles[entry.userId]?.display_name || profiles[entry.userId]?.username || "User"}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono" title={entry.userId}>
                                                                {entry.userId.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    ) : entry.group ? (
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-primary" />
                                                            <Badge variant="secondary">{entry.group}</Badge>
                                                        </div>
                                                    ) : "Unknown"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {entry.permissions.map((p) => (
                                                            <Badge key={p} variant="outline" className="text-[10px] px-1 h-5">{p}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRevoke(entry)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
