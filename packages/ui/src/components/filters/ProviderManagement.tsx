/**
 * Full CRUD interface for managing AI provider configurations
 * Manages provider_configs table including API keys in settings field
 * User-scoped: Shows only the current user's providers
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchProviderConfigs,
  createProviderConfig,
  updateProviderConfig,
  deleteProviderConfig,
  type ProviderConfigRow,
} from '@/modules/providers/client-providers';
import { DEFAULT_PROVIDERS, fetchProviderModelInfo } from '@/llm/filters/providers';
import { groupModelsByCompany } from '@/llm/filters/providers/openrouter';
import { groupOpenAIModelsByType } from '@/llm/filters/providers/openai';
import { getUserApiKeys as getUserSecrets, updateUserSecrets } from '@/modules/user/client-user';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Server,
  Brain,
  Zap,
  Globe,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ProviderConfig = ProviderConfigRow;

interface ProviderSettings {
  apiKey?: string;
  defaultModel?: string;
  [key: string]: any;
}

const providerIcons = {
  openai: Brain,
  anthropic: Zap,
  google: Globe,
  openrouter: Server,
};

const getProviderIcon = (name: string) => {
  const IconComponent = providerIcons[name as keyof typeof providerIcons] || Server;
  return IconComponent;
};

export const ProviderManagement: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<ProviderConfig | null>(null);

  // Load user's providers from database
  const loadProviders = async () => {
    if (!user) {
      setProviders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [loadedProvidersRaw, userSecrets] = await Promise.all([
        fetchProviderConfigs(user.id),
        getUserSecrets(user.id)
      ]);

      let loadedProviders = loadedProvidersRaw || [];

      // Merge secrets into provider configurations for display
      if (userSecrets) {
        loadedProviders = loadedProviders.map(p => {
          if (p.name === 'openai' && userSecrets['openai_api_key']) {
            const settings = (p.settings as ProviderSettings) || {};
            return { ...p, settings: { ...settings, apiKey: userSecrets['openai_api_key'] } };
          }
          if (p.name === 'google' && userSecrets['google_api_key']) {
            const settings = (p.settings as ProviderSettings) || {};
            return { ...p, settings: { ...settings, apiKey: userSecrets['google_api_key'] } };
          }
          return p;
        });
      }

      setProviders(loadedProviders);
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load providers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadProviders();
    }
  }, [user, authLoading]);

  const handleCreateProvider = () => {
    setEditingProvider(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteProvider = async () => {
    if (!deletingProvider) return;

    try {
      await deleteProviderConfig(user.id, deletingProvider.id);

      toast.success(`Provider "${deletingProvider.display_name}" deleted successfully`);
      setDeletingProvider(null);
      loadProviders();
    } catch (error: any) {
      console.error('Failed to delete provider:', error);
      toast.error('Failed to delete provider: ' + error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please sign in to manage your AI providers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My AI Providers</h2>
          <p className="text-muted-foreground">
            Manage your personal AI service providers and configurations
          </p>
        </div>
        <Button onClick={handleCreateProvider}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Providers List */}
      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No providers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first AI provider to start using custom LLM services
            </p>
            <Button onClick={handleCreateProvider}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const Icon = getProviderIcon(provider.name);
            const settings = (provider.settings as ProviderSettings) || {};
            const hasApiKey = !!settings.apiKey;

            return (
              <Card key={provider.id} className={!provider.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{provider.display_name}</CardTitle>
                        <CardDescription className="text-xs">{provider.name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProvider(provider)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingProvider(provider)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                        {provider.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API Key:</span>
                      <Badge variant={hasApiKey ? 'default' : 'outline'}>
                        {hasApiKey ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Configured
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Set
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Models:</span>
                      <span className="font-medium">
                        {Array.isArray(provider.models) ? provider.models.length : 0}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground truncate" title={provider.base_url}>
                    {provider.base_url}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ProviderEditDialog
        provider={editingProvider}
        user={user}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={() => {
          loadProviders();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProvider} onOpenChange={() => setDeletingProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProvider?.display_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProvider(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProvider}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Provider Edit Dialog Component
interface ProviderEditDialogProps {
  provider: ProviderConfig | null;
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const ProviderEditDialog: React.FC<ProviderEditDialogProps> = ({
  provider,
  user,
  open,
  onOpenChange,
  onSave,
}) => {
  const isEdit = !!provider;
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    base_url: '',
    models: [] as string[],
    rate_limits: {} as Record<string, number>,
    is_active: true,
    settings: {} as ProviderSettings,
  });

  const [selectedModel, setSelectedModel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [rateLimitRPM, setRateLimitRPM] = useState('');
  const [rateLimitTPM, setRateLimitTPM] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelInfoList, setModelInfoList] = useState<any[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Load preset from DEFAULT_PROVIDERS
  const handleLoadPreset = (presetName: string) => {
    const preset = DEFAULT_PROVIDERS[presetName];
    if (!preset) return;

    setFormData({
      name: preset.name,
      display_name: preset.displayName,
      base_url: preset.baseUrl,
      models: preset.models,
      rate_limits: preset.rateLimits,
      is_active: preset.isActive,
      settings: preset.settings || {},
    });
    setRateLimitRPM(preset.rateLimits.requests_per_minute?.toString() || '');
    setRateLimitTPM(preset.rateLimits.tokens_per_minute?.toString() || '');

    // Set first model as default if available
    if (preset.models.length > 0) {
      setSelectedModel(preset.models[0]);
    }

    toast.success(`Loaded ${preset.displayName} preset`);
  };

  // Fetch models from provider API
  const handleFetchModels = async () => {
    if (!formData.name) {
      toast.error('Please set provider name first');
      return;
    }

    setFetchingModels(true);
    try {
      const models = await fetchProviderModelInfo(formData.name, apiKeyInput);

      // Store full model info
      setModelInfoList(models);

      // Update form data models array
      const modelIds = models.map((m: any) => m.id);
      setFormData(prev => ({ ...prev, models: modelIds }));

      // Set first as default if available
      if (modelIds.length > 0) {
        setSelectedModel(modelIds[0]);
      }

      toast.success(`Fetched ${modelIds.length} models from ${formData.display_name || formData.name}`);
    } catch (error: any) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to fetch models: ' + error.message);
    } finally {
      setFetchingModels(false);
    }
  };

  // Check if provider supports model fetching
  const canFetchModels = () => {
    // OpenRouter and OpenAI are implemented
    return formData.name === 'openrouter' || formData.name === 'openai';
  };

  useEffect(() => {
    if (provider) {
      const settings = (provider.settings as ProviderSettings) || {};
      const models = Array.isArray(provider.models) ? (provider.models as string[]) : [];
      setFormData({
        name: provider.name,
        display_name: provider.display_name,
        base_url: provider.base_url,
        models: models,
        rate_limits: (provider.rate_limits as Record<string, number>) || {},
        is_active: provider.is_active ?? true,
        settings: settings,
      });
      setSelectedModel(settings.defaultModel || '');
      setApiKeyInput(settings.apiKey || '');

      const limits = (provider.rate_limits as Record<string, number>) || {};
      setRateLimitRPM(limits.requests_per_minute?.toString() || '');
      setRateLimitTPM(limits.tokens_per_minute?.toString() || '');

      // For existing providers, create simple modelInfo from saved models
      if (models.length > 0) {
        const simpleModelInfo = models.map(modelId => ({
          id: modelId,
          name: modelId,
          description: '',
          isFree: false,
          supportsTools: false,
          supportsImages: false,
          supportsText: true,
        }));
        setModelInfoList(simpleModelInfo);
      }
    } else {
      // Reset form for new provider
      setFormData({
        name: '',
        display_name: '',
        base_url: '',
        models: [],
        rate_limits: {},
        is_active: true,
        settings: {},
      });
      setSelectedModel('');
      setApiKeyInput('');
      setRateLimitRPM('');
      setRateLimitTPM('');
      setModelInfoList([]);
    }
    setShowApiKey(false);
  }, [provider, open]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Provider name is required');
      return;
    }
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!formData.base_url.trim()) {
      toast.error('Base URL is required');
      return;
    }

    setSaving(true);
    try {
      // Build rate limits object
      const rate_limits: Record<string, number> = {};
      if (rateLimitRPM) {
        rate_limits.requests_per_minute = parseInt(rateLimitRPM, 10);
      }
      if (rateLimitTPM) {
        rate_limits.tokens_per_minute = parseInt(rateLimitTPM, 10);
      }

      // Build settings object
      const settings: ProviderSettings = { ...formData.settings };
      if (apiKeyInput.trim()) {
        settings.apiKey = apiKeyInput.trim();
      }
      if (selectedModel) {
        settings.defaultModel = selectedModel;
      }

      const data = {
        name: formData.name.trim(),
        display_name: formData.display_name.trim(),
        base_url: formData.base_url.trim(),
        models: formData.models,
        rate_limits: rate_limits,
        is_active: formData.is_active,
        settings: settings,
      };

      if (isEdit) {
        // Special handling for OpenAI/Google keys -> user_secrets
        if (formData.name === 'openai' || formData.name === 'google') {
          try {
            const secretUpdate: Record<string, string> = {};
            if (formData.name === 'openai') secretUpdate['openai_api_key'] = settings.apiKey || '';
            if (formData.name === 'google') secretUpdate['google_api_key'] = settings.apiKey || '';

            await updateUserSecrets(user.id, secretUpdate);
          } catch (secretError) {
            console.error('Failed to update user secrets:', secretError);
            toast.error('Failed to update secure storage, but saving config...');
          }
        }

        // Update existing provider
        await updateProviderConfig(user.id, provider.id, data);
        toast.success('Provider updated successfully');
      } else {
        // Create new provider with user_id
        if (formData.name === 'openai' || formData.name === 'google') {
          try {
            const secretUpdate: Record<string, string> = {};
            if (formData.name === 'openai') secretUpdate['openai_api_key'] = settings.apiKey || '';
            if (formData.name === 'google') secretUpdate['google_api_key'] = settings.apiKey || '';
            await updateUserSecrets(user.id, secretUpdate);
          } catch (secretError) {
            console.error('Failed to update user secrets:', secretError);
          }
        }
        await createProviderConfig(user.id, { ...data, user_id: user.id });
        toast.success('Provider created successfully');
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to save provider:', error);
      toast.error('Failed to save provider: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Provider' : 'Create New Provider'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the provider configuration and API settings'
              : 'Add a new AI service provider to the system'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preset Selector - Only show when creating */}
          {!isEdit && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="preset">Load from Preset (Optional)</Label>
                  <Select onValueChange={handleLoadPreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a provider preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DEFAULT_PROVIDERS).map((key) => {
                        const preset = DEFAULT_PROVIDERS[key];
                        return (
                          <SelectItem key={key} value={key}>
                            {preset.displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pre-fill form with default configuration for popular providers
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., openai, anthropic"
                  disabled={isEdit} // Don't allow changing name on edit
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier (lowercase, no spaces)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., OpenAI, Anthropic"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL *</Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Provider is active</Label>
            </div>
          </div>

          <Separator />

          {/* API Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">API Settings</h3>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored securely in the settings field
              </p>
            </div>
          </div>

          <Separator />

          {/* Models */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Available Models</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFetchModels}
                disabled={!canFetchModels() || fetchingModels}
                className="text-xs"
              >
                {fetchingModels ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Server className="h-3 w-3 mr-2" />
                    {canFetchModels() ? 'Fetch Models' : 'Fetch Models (Coming Soon)'}
                  </>
                )}
              </Button>
            </div>

            {/* Show model count when models are available */}
            {formData.models.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium">
                  {formData.models.length} models available
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Models fetched from {formData.display_name || formData.name}
                </div>
              </div>
            )}

            {/* Default Model Selector */}
            {formData.models.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="default_model">Default Model</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between"
                    >
                      {selectedModel ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate">
                            {modelInfoList.find((m: any) => m.id === selectedModel)?.name || selectedModel}
                          </span>
                          {(() => {
                            const modelInfo = modelInfoList.find((m: any) => m.id === selectedModel);
                            return modelInfo && (
                              <div className="flex gap-1">
                                {modelInfo.isFree && (
                                  <Badge variant="default" className="text-xs px-1 py-0">Free</Badge>
                                )}
                                {modelInfo.supportsTools && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">Tools</Badge>
                                )}
                                {modelInfo.supportsImages && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">Images</Badge>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        "Select default model..."
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
                      <div className="max-h-[400px] overflow-y-auto">
                        <CommandList>
                          {(() => {
                            // Use different grouping based on provider
                            const groupedModels = formData.name === 'openai'
                              ? groupOpenAIModelsByType(modelInfoList)
                              : groupModelsByCompany(modelInfoList);

                            return Object.entries(groupedModels)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([groupName, models]) => (
                                <CommandGroup key={groupName} heading={groupName}>
                                  {models.map((modelInfo: any) => (
                                    <CommandItem
                                      key={modelInfo.id}
                                      value={`${modelInfo.id} ${modelInfo.name}`}
                                      onSelect={() => {
                                        setSelectedModel(modelInfo.id);
                                        setComboboxOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <Check
                                          className={cn(
                                            "h-4 w-4",
                                            selectedModel === modelInfo.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">
                                            {modelInfo.name}
                                          </div>
                                          <div className="flex gap-1 mt-1">
                                            <Badge variant={modelInfo.isFree ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                              {modelInfo.isFree ? 'Free' : 'Paid'}
                                            </Badge>
                                            {modelInfo.supportsTools && (
                                              <Badge variant="outline" className="text-xs px-1 py-0">
                                                Tools
                                              </Badge>
                                            )}
                                            {modelInfo.supportsImages && (
                                              <Badge variant="outline" className="text-xs px-1 py-0">
                                                Images
                                              </Badge>
                                            )}
                                            {!modelInfo.supportsImages && modelInfo.supportsText && (
                                              <Badge variant="outline" className="text-xs px-1 py-0">
                                                Text Only
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ));
                          })()}
                        </CommandList>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  This model will be used by default when using this provider
                </p>
              </div>
            )}

            {/* Help text when no models */}
            {formData.models.length === 0 && !canFetchModels() && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Model fetching is not yet available for this provider. You can still create the provider and models will be loaded from presets.
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Rate Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Rate Limits</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpm">Requests per Minute</Label>
                <Input
                  id="rpm"
                  type="number"
                  value={rateLimitRPM}
                  onChange={(e) => setRateLimitRPM(e.target.value)}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tpm">Tokens per Minute</Label>
                <Input
                  id="tpm"
                  type="number"
                  value={rateLimitTPM}
                  onChange={(e) => setRateLimitTPM(e.target.value)}
                  placeholder="150000"
                />
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This provider will be private to your account. API keys are stored securely in the settings field and are only accessible by you.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderManagement;
