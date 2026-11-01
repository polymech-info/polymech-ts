import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { getUserSettings, updateUserSettings } from '@/modules/user/client-user';

export interface PlacesSettings {
    known_types: string[];
    excluded_types: string[];
}

export const usePlacesSettings = () => {
    const { user } = useAuth();
    const userId = user?.id;
    const [settings, setSettings] = useState<PlacesSettings>({ known_types: [], excluded_types: [] });
    const [loading, setLoading] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const fetchedSettings = (await getUserSettings(userId) as Record<string, any>) || {};
            setSettings({
                known_types: Array.isArray(fetchedSettings.known_types) ? fetchedSettings.known_types : [],
                excluded_types: Array.isArray(fetchedSettings.excluded_types) ? fetchedSettings.excluded_types : [],
            });
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            toast.error(translate('Failed to load settings'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateExcludedTypes = async (newExcludedTypes: string[]) => {
        if (!user) return;
        try {
            setSettings(prev => ({ ...prev, excluded_types: newExcludedTypes }));
            const currentSettings = (await getUserSettings(user.id) as Record<string, any>) || {};
            await updateUserSettings(user.id, { ...currentSettings, excluded_types: newExcludedTypes });
            toast.success(translate('Settings saved'));
        } catch (error: any) {
            console.error('Error updating settings:', error);
            toast.error(translate('Failed to save settings'));
            fetchSettings();
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        updateExcludedTypes,
        refreshSettings: fetchSettings
    };
};
