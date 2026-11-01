import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchProviderConfigs, type ProviderConfigRow } from '@/modules/providers/client-providers';

export type ProviderConfig = ProviderConfigRow;

const STORAGE_KEY = 'provider-settings';

const loadSaved = (): { provider?: string; model?: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveSetting = (provider: string, model: string) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, model })); } catch { }
};

export const useProviderSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchProviderConfigs(user.id, { is_active: true });

        setProviders(data || []);

        if (data && data.length > 0) {
          const saved = loadSaved();

          // Try to restore saved provider if it still exists
          const savedProv = saved.provider
            ? data.find(p => p.name === saved.provider)
            : null;

          const targetProvider = savedProv || data[0];
          setSelectedProvider(targetProvider.name);

          const settings = targetProvider.settings as { defaultModel?: string } | null;
          const defaultModel = settings?.defaultModel;
          const models = Array.isArray(targetProvider.models) ? (targetProvider.models as string[]) : [];

          // Try to restore saved model if it belongs to the target provider
          if (savedProv && saved.model && models.includes(saved.model)) {
            setSelectedModel(saved.model);
          } else if (defaultModel && models.includes(defaultModel)) {
            setSelectedModel(defaultModel);
          } else if (models.length > 0) {
            setSelectedModel(models[0]);
          } else {
            setSelectedModel('');
          }
        }
      } catch (error) {
        console.error('Failed to load provider settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadSettings();
    }
  }, [user, authLoading]);

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    
    // Auto-select the default or first model for the new provider
    const provider = providers.find(p => p.name === providerName);
    if (provider) {
      const settings = provider.settings as { defaultModel?: string } | null;
      const defaultModel = settings?.defaultModel;
      const models = Array.isArray(provider.models) ? (provider.models as string[]) : [];

      let model = '';
      if (defaultModel && models.includes(defaultModel)) {
        model = defaultModel;
      } else if (models.length > 0) {
        model = models[0];
      }
      setSelectedModel(model);
      saveSetting(providerName, model);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    saveSetting(selectedProvider, model);
  };

  return {
    loading,
    providers,
    selectedProvider,
    selectedModel,
    setSelectedModel: handleProviderChange,
    onProviderChange: handleProviderChange,
    onModelChange: handleModelChange,
  };
};
