import { useState, useEffect } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { 
  fetchProfileAPI, 
  updateProfileAPI, 
  getUserApiKeys, 
  updateUserSecrets, 
  updateUserEmail 
} from "@/modules/user/client-user";
import { ProfileData } from "../types";

export function useProfile(user: any) {
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    settings: {}
  });
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      setEmail(user.email || '');
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const result = await fetchProfileAPI(user.id);

      if (result?.profile) {
        const data = result.profile;
        setProfile({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          settings: data.settings || {}
        });
      }

      try {
        const apiKeys = await getUserApiKeys(user.id);
        if (apiKeys) {
          const loaded: Record<string, string> = {};
          for (const [key, val] of Object.entries(apiKeys)) {
            if (typeof val === 'string') {
              loaded[key] = val;
            } else if (val && typeof val === 'object' && 'has_key' in val) {
              loaded[key] = val.has_key ? (val.masked || '••••••••') : '';
            }
          }
          setSecrets(loaded);
          setDirtyKeys(new Set());
        }
      } catch (e) {
        console.warn('Could not load API keys:', e);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(translate('Failed to load profile data'));
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setUpdatingProfile(true);
    try {
      await updateProfileAPI({
        username: profile.username || null,
        display_name: profile.display_name || null,
        bio: profile.bio || null,
        avatar_url: profile.avatar_url || null,
        settings: profile.settings || {}
      });

      const keysToSave: Record<string, string> = {};
      for (const key of dirtyKeys) {
        const val = secrets[key];
        if (val && val.trim()) {
          keysToSave[key] = val;
        }
      }
      if (Object.keys(keysToSave).length > 0) {
        await updateUserSecrets(user.id, keysToSave);
      }

      if (email !== user.email && email.trim()) {
        await updateUserEmail(email);
      }

      toast.success(translate('Profile updated successfully'));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(translate('Failed to update profile'));
      return false;
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSecretChange = (key: string, value: string) => {
    setSecrets(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => new Set(prev).add(key));
  };

  const handleSecretFocus = (key: string) => {
    if (secrets[key] && !dirtyKeys.has(key)) {
      setSecrets(prev => ({ ...prev, [key]: '' }));
      setDirtyKeys(prev => new Set(prev).add(key));
    }
  };

  return {
    profile,
    setProfile,
    secrets,
    handleSecretChange,
    handleSecretFocus,
    email,
    setEmail,
    updatingProfile,
    handleProfileUpdate,
    fetchProfile
  };
}
