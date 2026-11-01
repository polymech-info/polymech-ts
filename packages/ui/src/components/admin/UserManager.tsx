import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Users, MoreHorizontal, Plus, Edit2, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { EditUserDialog } from './EditUserDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { CreateUserDialog } from './CreateUserDialog';
import { fetchAdminUsersAPI, deleteAdminUserAPI } from '@/modules/admin/client-admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupManager } from './GroupManager';
import { fetchUserGroups, fetchUserEffectiveGroups } from '@/modules/user/client-acl';
import { cn } from '@/lib/utils';

type AdminUserView = Tables<'profiles'> & {
  email?: string;
};

const UserManager = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUserView | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserView | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminUsersAPI();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(translate('Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: AdminUserView) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await deleteAdminUserAPI(deletingUser.user_id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      toast.success(translate('User deleted successfully'));
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(translate('Failed to delete user'));
    } finally {
      setDeletingUser(null);
    }
  };

  if (loading) {
    return <div><T>Loading users...</T></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <T>Identity & Access</T>
          </h1>
          <p className="text-muted-foreground text-sm">
            <T>Manage users, global resource groups, and hierarchical permissions.</T>
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-muted/50 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="mr-2 h-4 w-4" />
            <T>Users</T>
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <T>Global Groups</T>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateUserOpen(true)} className="rounded-full shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" />
              <T>Create User</T>
            </Button>
          </div>
          
          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold"><T>User</T></TableHead>
                  <TableHead className="font-bold"><T>Username</T></TableHead>
                  <TableHead className="font-bold"><T>Groups</T></TableHead>
                  <TableHead className="font-bold text-right"><T>Actions</T></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name ?? ''} />
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-sm leading-tight text-foreground">{user.display_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.username ? (
                        <Badge variant="secondary" className="font-mono text-[11px]">@{user.username}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                       <UserGroupsList userId={user.user_id} />
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer">
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            <T>Edit Profile</T>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 cursor-pointer focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/20"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            <T>Delete</T>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="focus-visible:outline-none">
          <GroupManager />
        </TabsContent>
      </Tabs>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={() => setEditingUser(null)}
        onUserUpdate={handleUserUpdate}
      />
      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        username={deletingUser?.display_name || deletingUser?.username || undefined}
      />
      <CreateUserDialog
        open={isCreateUserOpen}
        onOpenChange={setCreateUserOpen}
        onUserCreated={fetchUsers}
      />
    </div>
  );
};

const UserGroupsList = ({ userId }: { userId: string }) => {
  const { data: directGroups = [] } = useQuery({
    queryKey: ['user-groups', userId],
    queryFn: () => fetchUserGroups(userId)
  });

  const { data: effectiveGroups = [], isLoading } = useQuery({
    queryKey: ['user-groups-effective', userId],
    queryFn: () => fetchUserEffectiveGroups(userId)
  });

  if (isLoading) return <div className="animate-pulse h-4 w-20 bg-muted rounded"></div>;
  if (effectiveGroups.length === 0) return <span className="text-[10px] text-muted-foreground italic"><T>No groups</T></span>;

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {effectiveGroups.map(g => {
        const isDirect = directGroups.some(dg => dg.id === g.id);
        return (
          <Badge 
            key={g.id} 
            variant={isDirect ? "default" : "outline"}
            className={cn(
              "text-[10px] px-1.5 h-5 transition-all",
              isDirect 
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                : "text-muted-foreground border-dashed opacity-70 hover:opacity-100"
            )}
            title={isDirect ? "Direct Member" : "Inherited Member"}
          >
            {g.name}
          </Badge>
        );
      })}
    </div>
  );
};

export default UserManager;
