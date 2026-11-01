import { useCallback, useState } from "react";
import { ACLBaseEditor, type AclGrantInput, type AclRevokeInput, type GrantSectionContext } from "@/modules/acl/ACLBaseEditor";
import { fetchAclSettings, grantAclPermission, revokeAclPermission } from "@/modules/acl/client-acl";
import { fetchProfilesByUserIds } from "@/modules/user/client-user";
import { UserPicker } from "@/components/admin/UserPicker";
import { GroupPicker } from "@/components/admin/GroupPicker";
import { PermissionPicker } from "@/components/admin/PermissionPicker";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { T, translate } from "@/i18n";

interface AclEditorProps {
    resourceType?: string;
    mount: string;
    path: string;
    compact?: boolean;
}

type GrantTab = "user" | "group";

const STORAGE_PERMISSIONS = ['read', 'list', 'write', 'delete'] as const;

export function AclEditor({ resourceType = "vfs", mount, path, compact = false }: AclEditorProps) {
    const loadEntries = useCallback(async () => {
        const settings = await fetchAclSettings(resourceType, mount);
        const normPath = (p: string) => p.replace(/^\/+/, "") || "/";
        const targetPath = normPath(path);
        // AclEditor takes ownership of filtering the entries to the current path
        return (settings.acl || []).filter(e => normPath(e.path || "") === targetPath);
    }, [resourceType, mount, path]);

    const grant = useCallback(async (input: Omit<AclGrantInput, "path">) => {
        await grantAclPermission(resourceType, mount, { ...input, path });
    }, [resourceType, mount, path]);

    const revoke = useCallback(async (input: Omit<AclRevokeInput, "path">) => {
        await revokeAclPermission(resourceType, mount, { ...input, path });
    }, [resourceType, mount, path]);

    const renderGrantSection = useCallback((ctx: GrantSectionContext) => (
        <StorageGrantSection ctx={ctx} path={path} />
    ), [path]);

    return (
        <ACLBaseEditor
            compact={compact}
            resourceDescription={<code>{mount}:{path}</code>}
            resourceContextNote={<>(Mount: {mount})</>}
            loadEntries={loadEntries}
            grant={grant}
            revoke={revoke}
            fetchProfiles={fetchProfilesByUserIds}
            renderGrantSection={renderGrantSection}
        />
    );
}

/** Full grant section: anon/auth toggles + user/group picker. */
function StorageGrantSection({ ctx, path }: { ctx: GrantSectionContext; path: string }) {
    const { grant, refresh } = ctx;

    // User / Group grant
    const [tab, setTab] = useState<GrantTab>("user");
    const [selectedUser, setSelectedUser] = useState("");
    const [userPerms, setUserPerms] = useState<string[]>(["read", "list"]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [groupPerms, setGroupPerms] = useState<string[]>(["read", "list"]);
    const [granting, setGranting] = useState(false);

    const handleGrant = async () => {
        const isUser = tab === "user";
        const subject = isUser ? selectedUser : selectedGroup;
        const perms = isUser ? userPerms : groupPerms;
        if (!subject || perms.length === 0) return;
        setGranting(true);
        try {
            await grant({ ...(isUser ? { userId: subject } : { group: subject }), permissions: perms });
            toast.success(isUser ? translate("User access granted") : translate("Group access granted"));
            refresh();
            if (isUser) setSelectedUser(""); else setSelectedGroup("");
        } catch (e: any) { toast.error(e.message); }
        finally { setGranting(false); }
    };

    const canSubmit = tab === "user" ? !!selectedUser && userPerms.length > 0 : !!selectedGroup && groupPerms.length > 0;

    return (
        <div className="space-y-3">
            {/* User / Group grant */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium"><T>Grant Access</T></h3>
                    <div className="flex rounded-md border overflow-hidden text-xs">
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${tab === "user" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                            onClick={() => setTab("user")}
                        >
                            <User className="h-3 w-3" /><T>User</T>
                        </button>
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${tab === "group" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                            onClick={() => setTab("group")}
                        >
                            <Shield className="h-3 w-3" /><T>Group</T>
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        {tab === "user"
                            ? <UserPicker value={selectedUser} onSelect={setSelectedUser} />
                            : <GroupPicker value={selectedGroup} onSelect={(name) => setSelectedGroup(name)} />}
                    </div>
                    <Button onClick={handleGrant} disabled={!canSubmit || granting}>
                        {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        <T>Grant</T>
                    </Button>
                </div>
                {tab === "user"
                    ? <PermissionPicker value={userPerms} onChange={setUserPerms} availablePermissions={STORAGE_PERMISSIONS} />
                    : <PermissionPicker value={groupPerms} onChange={setGroupPerms} availablePermissions={STORAGE_PERMISSIONS} />}
            </div>
        </div>
    );
}
