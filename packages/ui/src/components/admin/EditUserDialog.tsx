import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { Tables } from '@/integrations/supabase/types';
import { getUserApiKeys as getUserSecrets, updateUserSecrets } from '@/modules/user/client-user';
import { updateAdminUserAPI } from '@/modules/admin/client-admin';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Shield, Check, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGlobalGroups, fetchUserGroups, addGroupMember, removeGroupMember } from '@/modules/user/client-acl';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Profile = Tables<'profiles'>;

interface EditUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: (updatedUser: Profile) => void;
}

export const EditUserDialog = ({ user, open, onOpenChange, onUserUpdate }: EditUserDialogProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [secrets, setSecrets] = useState<Record<string, { masked: string | null; has_key: boolean }>>({});
  const [newSecrets, setNewSecrets] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { data: allGroups = [] } = useQuery({
    queryKey: ['global-acl-groups'],
    queryFn: () => fetchGlobalGroups(),
    enabled: open
  });

  const { data: userGroups = [] } = useQuery({
    queryKey: ['user-groups', user?.user_id],
    queryFn: () => user ? fetchUserGroups(user.user_id) : Promise.resolve([]),
    enabled: open && !!user
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      // Fetch secrets
      getUserSecrets(user.user_id).then(data => {
        if (data) setSecrets(data);
        else setSecrets({});
      });
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!profile) return;

    setUpdating(true);
    try {
      // 1. Update profile (non-secret fields) via admin API
      const data = await updateAdminUserAPI(profile.user_id, {
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
      });

      // 2. Update secrets
      if (profile.user_id && Object.keys(newSecrets).length > 0) {
        await updateUserSecrets(profile.user_id, newSecrets);
      }

      toast.success(translate('User profile updated successfully'));
      onUserUpdate(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error(translate('Failed to update user profile'));
    } finally {
      setUpdating(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User: {profile.display_name || profile.username}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="general" className="rounded-md"><T>General</T></TabsTrigger>
            <TabsTrigger value="groups" className="rounded-md"><T>Groups</T></TabsTrigger>
            <TabsTrigger value="api-keys" className="rounded-md"><T>API Keys</T></TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profile.display_name || ''}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
          </TabsContent>
          <TabsContent value="api-keys" className="space-y-4 py-4">
            <ApiKeyInput id="google_api_key" label="Google API Key" secret={secrets.google_api_key} newValue={newSecrets.google_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, google_api_key: val })} />
            <ApiKeyInput id="openai_api_key" label="OpenAI API Key" secret={secrets.openai_api_key} newValue={newSecrets.openai_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, openai_api_key: val })} />
            <ApiKeyInput id="replicate_api_key" label="Replicate API Key" secret={secrets.replicate_api_key} newValue={newSecrets.replicate_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, replicate_api_key: val })} />
            <ApiKeyInput id="bria_api_key" label="Bria API Key" secret={secrets.bria_api_key} newValue={newSecrets.bria_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, bria_api_key: val })} />
            <ApiKeyInput id="huggingface_api_key" label="HuggingFace API Key" secret={secrets.huggingface_api_key} newValue={newSecrets.huggingface_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, huggingface_api_key: val })} />
            <ApiKeyInput id="aimlapi_api_key" label="AIMLAPI API Key" secret={secrets.aimlapi_api_key} newValue={newSecrets.aimlapi_api_key} onChange={(val) => setNewSecrets({ ...newSecrets, aimlapi_api_key: val })} />
          </TabsContent>
          <TabsContent value="groups" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
              {allGroups.map(group => {
                const isMember = userGroups.some(ug => ug.id === group.id);
                return (
                  <div 
                    key={group.id} 
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isMember ? "bg-primary/5 border-primary/30 shadow-sm" : "bg-card hover:bg-muted/50"
                    )}
                    onClick={async () => {
                      if (!profile?.user_id) return;
                      try {
                        if (isMember) {
                          await removeGroupMember(group.id, profile.user_id);
                        } else {
                          await addGroupMember(group.id, profile.user_id);
                        }
                        queryClient.invalidateQueries({ queryKey: ['user-groups', profile.user_id] });
                        queryClient.invalidateQueries({ queryKey: ['group-members', group.id] });
                      } catch (err: any) {
                        toast.error(err.message || "Failed to update group membership");
                      }
                    }}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      isMember ? "bg-primary border-primary text-primary-foreground" : "border-input"
                    )}>
                      {isMember && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-bold cursor-pointer">{group.name}</Label>
                      {group.native_type && <div className="text-[10px] text-muted-foreground uppercase">{group.native_type}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {allGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground italic">
                <T>No global groups defined.</T>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <Button onClick={handleUpdate} disabled={updating}>
          <Save className="mr-2 h-4 w-4" />
          {updating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const ApiKeyInput = ({ id, label, secret, newValue, onChange }: { 
  id: string; 
  label: string; 
  secret?: { masked: string | null; has_key: boolean }; 
  newValue?: string;
  onChange: (val: string) => void; 
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label htmlFor={id}>{label}</Label>
      {secret?.has_key && (
        <Badge variant="outline" className="text-[10px] h-4 py-0 bg-green-500/10 text-green-600 border-green-500/20">
          <Check className="h-2 w-2 mr-1" /> <T>Configured</T>
        </Badge>
      )}
    </div>
    <div className="relative">
      <Input
        id={id}
        type="password"
        value={newValue || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={secret?.masked || `Enter ${label}`}
        className={cn(newValue && "border-primary/50 ring-1 ring-primary/20")}
      />
      {newValue && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
           <Loader2 className="h-3 w-3 animate-spin text-primary opacity-50" />
        </div>
      )}
    </div>
  </div>
);
