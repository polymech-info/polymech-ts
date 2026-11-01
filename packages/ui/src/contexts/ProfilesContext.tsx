import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from "@/modules/posts/views/types";
import { serverUrl } from '@/lib/db';

interface ProfilesContextType {
    profiles: Record<string, UserProfile>;
    fetchProfile: (userId: string) => Promise<UserProfile | null>;
    fetchProfiles: (userIds: string[]) => Promise<void>;
    isLoading: boolean;
}

const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

export const ProfilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
    const [isLoading, setIsLoading] = useState(false);
    const fetchedIds = React.useRef<Set<string>>(new Set());
    const profilesRef = React.useRef(profiles);

    // Keep ref in sync
    useEffect(() => {
        profilesRef.current = profiles;
    }, [profiles]);

    const fetchProfiles = useCallback(async (userIds: string[]) => {
        // Filter out existing AND already requested to prevent loops
        const missingIds = userIds.filter(id => !fetchedIds.current.has(id) && !profilesRef.current[id]);
        const uniqueMissingIds = Array.from(new Set(missingIds));
        if (uniqueMissingIds.length === 0) return;
        // Mark as fetched immediately to prevent re-entry
        uniqueMissingIds.forEach(id => fetchedIds.current.add(id));
        setIsLoading(true);
        try {
            // Use the new batch API endpoint
            const SERVER_URL = serverUrl;
            const res = await fetch(`${SERVER_URL}/api/profiles?ids=${uniqueMissingIds.join(',')}`);
            if (!res.ok) {
                console.error('Error fetching profiles context:', res.statusText);
                return;
            }

            const data: Record<string, UserProfile> = await res.json();

            if (data) {
                setProfiles(prev => {
                    const next = { ...prev, ...data };
                    // If any IDs are missing from response, we might want to mark them as 'not found' 
                    // to prevent refetch loops, but for now we trust the server response map.
                    return next;
                });
            }
        } catch (e) {
            console.error('Error in fetchProfiles context:', e);
        } finally {
            setIsLoading(false);
        }
    }, []); // Stable callback

    // but ideally remove it if logic allows. 
    // Since we check !profiles[id], we depend on it. 
    // However, fetchedIds prevents the loop even if profiles is stale.

    const fetchProfile = useCallback(async (userId: string) => {
        if (profiles[userId]) return profiles[userId];
        await fetchProfiles([userId]);
        return profiles[userId] || null;
    }, [profiles, fetchProfiles]);

    return (
        <ProfilesContext.Provider value={{ profiles, fetchProfile, fetchProfiles, isLoading }}>
            {children}
        </ProfilesContext.Provider>
    );
};

export const useProfiles = () => {
    const context = useContext(ProfilesContext);
    if (context === undefined) {
        throw new Error('useProfiles must be used within a ProfilesProvider');
    }
    return context;
};
