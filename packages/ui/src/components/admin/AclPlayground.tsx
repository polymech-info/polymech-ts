import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchKnownAclResources } from "@/modules/acl/client-acl";
import { T } from "@/i18n";
import { Shield, Loader2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AclEditor as StorageAclEditor } from "@/modules/storage/AclEditor";

export function AclPlayground() {
    const { data: resources, isLoading, error } = useQuery({
        queryKey: ["acl-resources"],
        queryFn: fetchKnownAclResources
    });

    const [editingRes, setEditingRes] = useState<{ type: string, id: string } | null>(null);

    return (
        <Card className="w-full max-w-4xl shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <T>Global ACL Registry</T>
                </CardTitle>
                <CardDescription>
                    <T>List of all resources that have explicit access control configured.</T>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 flex justify-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-destructive">
                        <T>Failed to load ACL resources</T>: {(error as any).message}
                    </div>
                ) : resources?.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <T>No ACL configurations found in the database.</T>
                    </div>
                ) : (
                    <div className="border-t overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead><T>Resource Type</T></TableHead>
                                    <TableHead><T>Resource ID</T></TableHead>
                                    <TableHead><T>Owner ID</T></TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources?.map((res) => (
                                    <TableRow key={`${res.resourceType}-${res.resourceId}`}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {res.resourceType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {res.resourceId}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-mono">
                                            {res.ownerId || <span className="opacity-50">none</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setEditingRes({ type: res.resourceType, id: res.resourceId })}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                <T>Configure</T>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={!!editingRes} onOpenChange={(open) => !open && setEditingRes(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <T>Configure ACL:</T> <Badge variant="outline" className="text-base">{editingRes?.type}</Badge> <span>{editingRes?.id}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {editingRes?.type === "vfs" ? (
                            <StorageAclEditor resourceType="vfs" mount={editingRes.id} path="/" compact={false} />
                        ) : editingRes ? (
                            <div className="p-4 text-center text-muted-foreground border rounded-md">
                                <T>Direct global editing for</T> <Badge variant="outline">{editingRes.type}</Badge> <T>is currently only supported for storage mounts. Please edit this resource via its respective manager.</T>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
