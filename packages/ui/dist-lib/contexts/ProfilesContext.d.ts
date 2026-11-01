import { default as React } from 'react';
import { UserProfile } from '../pages/Post/types';
interface ProfilesContextType {
    profiles: Record<string, UserProfile>;
    fetchProfile: (userId: string) => Promise<UserProfile | null>;
    fetchProfiles: (userIds: string[]) => Promise<void>;
    isLoading: boolean;
}
export declare const ProfilesProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useProfiles: () => ProfilesContextType;
export {};
