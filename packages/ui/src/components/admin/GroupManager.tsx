import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    fetchGlobalGroups,
    putGlobalGroup,
    deleteGlobalGroup,
    fetchGroupMembers,
    addGroupMember,
    removeGroupMember,
    GlobalAclGroup
} from "@/modules/user/client-acl";
import { UserPicker } from "@/components/admin/UserPicker";
import { toast } from "sonner";
import {
    Plus,
    Edit2,
    Trash2,
    Users,
    Shield,
    X,
    Loader2,
    UserMinus
} from "lucide-react";

import { cn } from "@/lib/utils";
import { T, translate } from "@/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const GroupManager = () => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [editingGroup, setEditingGroup] = useState<Partial<GlobalAclGroup> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const queryClient = useQueryClient();

    // Fetch Groups
    const { data: groups = [], isLoading: loadingGroups } = useQuery({
        queryKey: ['global-acl-groups'],
        queryFn: () => fetchGlobalGroups()
    });

    // Fetch Members for selected group
    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['group-members', selectedGroupId],
        queryFn: () => selectedGroupId ? fetchGroupMembers(selectedGroupId) : Promise.resolve([]),
        enabled: !!selectedGroupId
    });


    const handleCreateStart = (parentId?: string) => {
        setIsCreating(true);
        setEditingGroup({
            name: "",
            description: "",
            parent_id: parentId,
            native_type: "",
            settings: {}
        });
    };

    const handleEditStart = (group: GlobalAclGroup) => {
        setIsCreating(false);
        setEditingGroup({ ...group });
    };

    const handleSave = async () => {
        if (!editingGroup?.name) {
            toast.error(translate("Group name is required"));
            return;
        }

        setActionLoading(true);
        try {
            await putGlobalGroup(editingGroup);
            toast.success(isCreating ? translate("Group created") : translate("Group updated"));
            setEditingGroup(null);
            queryClient.invalidateQueries({ queryKey: ['global-acl-groups'] });
        } catch (error: any) {
            toast.error(error.message || translate("Failed to save group"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(translate("Are you sure you want to delete this group?"))) return;

        setActionLoading(true);
        try {
            await deleteGlobalGroup(id);
            toast.success(translate("Group deleted"));
            queryClient.invalidateQueries({ queryKey: ['global-acl-groups'] });
            if (selectedGroupId === id) setSelectedGroupId(null);
        } catch (error: any) {
            toast.error(error.message || translate("Failed to delete group"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!selectedGroupId) return;

        // Check if already a member to provide instant feedback
        if (members.some(m => m.user_id === userId)) {
            toast.info(translate("User is already a member of this group"));
            return;
        }

        try {
            await addGroupMember(selectedGroupId, userId);
            toast.success(translate("Member added to group"));
            queryClient.invalidateQueries({ queryKey: ['group-members', selectedGroupId] });
            // Also invalidate user groups to update the UserManager table if visible
            queryClient.invalidateQueries({ queryKey: ['user-groups', userId] });
            queryClient.invalidateQueries({ queryKey: ['user-groups-effective', userId] });
        } catch (error: any) {
            console.error("Add member error:", error);
            toast.error(error.message || translate("Failed to add member"));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedGroupId) return;
        try {
            await removeGroupMember(selectedGroupId, userId);
            toast.success(translate("Member removed from group"));
            queryClient.invalidateQueries({ queryKey: ['group-members', selectedGroupId] });
            queryClient.invalidateQueries({ queryKey: ['user-groups', userId] });
            queryClient.invalidateQueries({ queryKey: ['user-groups-effective', userId] });
        } catch (error: any) {
            console.error("Remove member error:", error);
            toast.error(error.message || translate("Failed to remove member"));
        }
    };

    // Tree Rendering Logic
    const renderGroupItem = (group: GlobalAclGroup, level: number = 0) => {
        const isSelected = selectedGroupId === group.id;
        const children = groups.filter(g => g.parent_id === group.id);

        return (
            <div key={group.id}>
                <div
                    className={cn(
                        "flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer group transition-all",
                        isSelected && "bg-primary/10 border-l-2 border-primary"
                    )}
                    style={{ marginLeft: `${level * 20}px` }}
                    onClick={() => setSelectedGroupId(group.id)}
                >
                    <div className="flex items-center gap-2">
                        <Users className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm", isSelected && "font-semibold")}>{group.name}</span>
                        {group.native_type && (
                            <Badge variant="outline" className="text-[10px] px-1 h-4">{group.native_type}</Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCreateStart(group.id); }}>
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditStart(group); }}>
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => handleDelete(group.id, e)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {children.map(child => renderGroupItem(child, level + 1))}
            </div>
        );
    };

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Left Column: Group Tree */}
            <div className="w-full md:w-1/3 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <T>ACL Groups</T>
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => handleCreateStart()}>
                        <Plus className="h-3 w-3 mr-1" />
                        <T>New Root</T>
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loadingGroups ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                    ) : (
                        <>
                            {groups.filter(g => !g.parent_id).map(g => renderGroupItem(g))}
                            {groups.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground italic">
                                    <T>No groups defined.</T>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right Column: Details & Members */}
            <div className="flex-1 flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden">
                {editingGroup ? (
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-xl font-bold">
                                {isCreating ? translate("Create New Group") : translate("Edit Group")}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setEditingGroup(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground"><T>Group Name</T></Label>
                                <Input
                                    value={editingGroup.name}
                                    onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    placeholder={translate("e.g. Content Managers")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground"><T>Native Type (Optional)</T></Label>
                                <Input
                                    value={editingGroup.native_type || ""}
                                    onChange={e => setEditingGroup({ ...editingGroup, native_type: e.target.value })}
                                    placeholder={translate("e.g. page, post")}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground"><T>Parent Group</T></Label>
                                <Select
                                    value={editingGroup.parent_id || "none"}
                                    onValueChange={val => setEditingGroup({ ...editingGroup, parent_id: val === "none" ? null : val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate("Select parent group")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            <div className="flex items-center gap-2 italic text-muted-foreground">
                                                <X className="h-3 w-3" />
                                                <T>No Parent (Root)</T>
                                            </div>
                                        </SelectItem>
                                        {groups
                                            .filter(g => g.id !== editingGroup.id) // Prevent self-parenting
                                            .map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground"><T>Description</T></Label>
                                <Input
                                    value={editingGroup.description || ""}
                                    onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setEditingGroup(null)}><T>Cancel</T></Button>
                            <Button onClick={handleSave} disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <T>Save Group</T>
                            </Button>
                        </div>
                    </div>
                ) : selectedGroup ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b bg-muted/10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black tracking-tight">{selectedGroup.name}</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditStart(selectedGroup)}>
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        <T>Edit</T>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={(e) => handleDelete(selectedGroup.id, e as any)}>
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        <T>Delete</T>
                                    </Button>
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm">{selectedGroup.description || translate("No description.")}</p>
                            <div className="flex gap-4 mt-4 text-xs font-medium uppercase text-muted-foreground">
                                <div><T>ID</T>: <span className="font-mono text-foreground">{selectedGroup.id}</span></div>
                                {selectedGroup.native_type && <div><T>Type</T>: <span className="text-primary">{selectedGroup.native_type}</span></div>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Members Section */}
                            <section>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <T>Group Members</T>
                                    <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                                </h4>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <UserPicker
                                            onSelect={(userId) => handleAddMember(userId)}
                                            disabled={actionLoading}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {members.map(member => (
                                            <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group/member">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                        <AvatarImage src={member.profiles?.avatar_url} />
                                                        <AvatarFallback>{member.profiles?.display_name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-sm font-bold">{member.profiles?.display_name || translate("Unknown User")}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">{member.user_id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                                <T>No members in this group.</T>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>


                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
                        <Shield className="h-16 w-16 mb-4 opacity-10" />
                        <h3 className="text-lg font-bold mb-1"><T>No Group Selected</T></h3>
                        <p className="text-sm max-w-xs"><T>Select a group from the tree to manage its members, settings, and permissions.</T></p>
                    </div>
                )}
            </div>
        </div>
    );
};
