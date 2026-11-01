/**
 * Provider selector component for the filter system
 */

import React, { useState, useEffect } from 'react';
import { ProviderConfig } from '@/llm/filters/types';
import { fetchProviderConfigs } from '@/modules/providers/client-providers';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProviderManagement } from './ProviderManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Zap, Globe, Brain, Server, Settings, Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ProviderSelectorProps {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
  showManagement?: boolean;
}

const providerIcons = {
  openai: Brain,
  anthropic: Zap,
  google: Globe,
  openrouter: Server,
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  provider,
  model,
  onProviderChange,
  onModelChange,
  disabled = false,
  className = '',
  showManagement = true
}) => {
  const { user, loading: authLoading } = useAuth();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProviderManagement, setShowProviderManagement] = useState(false);
  const [modelComboboxOpen, setModelComboboxOpen] = useState(false);

  // Load providers function (extracted for reuse)
  const loadProviders = async () => {
    if (!user) {
      setProviders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userProviders = await fetchProviderConfigs(user.id, { is_active: true });
      if (userProviders) {
        const providers = userProviders.map(dbProvider => ({
          name: dbProvider.name,
          displayName: dbProvider.display_name,
          baseUrl: dbProvider.base_url,
          models: Array.isArray(dbProvider.models) ? dbProvider.models as string[] : [],
          rateLimits: (dbProvider.rate_limits as Record<string, number>) || {},
          isActive: dbProvider.is_active ?? true,
          settings: (dbProvider.settings as Record<string, any>) || {},
        }));
        setProviders(providers);
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadProviders();
    }
  }, [user, authLoading]);

  const handleProviderChange = (newProvider: string) => {
    onProviderChange(newProvider);

    // Reset model when provider changes
    const models = getCurrentModels(newProvider);
    if (models.length > 0) {
      // Use default model from settings if available, otherwise first model
      const selectedProvider = providers.find(p => p.name === newProvider);
      const defaultModel = selectedProvider?.settings?.defaultModel;
      const modelToSelect = defaultModel && models.includes(defaultModel) ? defaultModel : models[0];
      onModelChange(modelToSelect);
    }
  };

  const getProviderIcon = (providerName: string) => {
    const IconComponent = providerIcons[providerName as keyof typeof providerIcons] || Server;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCurrentModels = (providerName?: string) => {
    const targetProvider = providerName || provider;
    const selectedProvider = providers.find(p => p.name === targetProvider);
    return selectedProvider?.models || [];
  };

  if (authLoading || loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">Provider</label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading your providers...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">Provider</label>
        <div className="p-3 border rounded-md border-dashed">
          <div className="text-sm text-muted-foreground text-center">
            Sign in to manage AI providers
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Provider Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Provider</label>
          {showManagement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviderManagement(true)}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select value={provider} onValueChange={handleProviderChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.length === 0 ? (
              <div className="p-3 text-center space-y-2">
                <div className="text-sm text-muted-foreground">No providers configured</div>
                <div className="text-xs text-muted-foreground">
                  Click the settings button to add your first provider
                </div>
              </div>
            ) : (
              providers.map((providerConfig) => (
                <SelectItem key={providerConfig.name} value={providerConfig.name}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(providerConfig.name)}
                      <span>{providerConfig.displayName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {providerConfig.models.length} models
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        {getCurrentModels().length === 0 ? (
          <div className="p-3 border rounded-md border-dashed">
            <div className="text-sm text-muted-foreground text-center">
              No models available
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">
              Select a provider with configured models
            </div>
          </div>
        ) : (
          <Popover open={modelComboboxOpen} onOpenChange={setModelComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={modelComboboxOpen}
                className="w-full justify-between"
                disabled={disabled}
              >
                {model ? (
                  <span className="truncate">{model}</span>
                ) : (
                  "Select a model..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-full p-0"
              align="start"
              side="bottom"
              sideOffset={5}
              style={{ width: 'var(--radix-popover-trigger-width)' }}
            >
              <Command>
                <CommandInput placeholder="Search models..." className="h-9" />
                <CommandEmpty>No models found.</CommandEmpty>
                <div className="max-h-[300px] overflow-y-auto">
                  <CommandList>
                    {getCurrentModels().map((modelName) => (
                      <CommandItem
                        key={modelName}
                        value={modelName}
                        onSelect={() => {
                          onModelChange(modelName);
                          setModelComboboxOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              model === modelName ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{modelName}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Provider Management Dialog */}
      <Dialog open={showProviderManagement} onOpenChange={(open) => {
        setShowProviderManagement(open);
        // Refresh providers when dialog closes to show any new/updated providers
        if (!open && !authLoading) {
          loadProviders();
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <ProviderManagement />
        </DialogContent>
      </Dialog>
    </div>
  );
};
