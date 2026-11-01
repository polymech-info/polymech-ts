/**
 * Main filter panel widget for the markdown text widget
 */

import React, { useState, useCallback, useEffect } from 'react';
import { TemplateContext, FilterOptions, FilterFlag } from '@/llm/filters/types';
import { filter, filterWithResult, previewFilter } from '@/llm/filters';
import { ContextSelector } from './ContextSelector';
import { ProviderSelector } from './ProviderSelector';
import { TemplateSelector } from './TemplateSelector';
import { FilterSelector } from './FilterSelector';
import { ProviderManagement } from './ProviderManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Wand2,
  Play,
  Eye,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FileText,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';

import { getUserSettings, updateUserSettings } from '@/modules/user/client-user';

interface FilterPanelProps {
  content: string;
  selectedText?: string;
  onFilteredContent: (content: string) => void;
  disabled?: boolean;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  content,
  selectedText,
  onFilteredContent,
  disabled = false,
  className = ''
}) => {
  const { user } = useAuth();

  // State management
  const [context, setContext] = useState<TemplateContext>(TemplateContext.COMMONS);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customFilters, setCustomFilters] = useState<FilterFlag[]>([]);
  const [selectionMode, setSelectionMode] = useState<'entire' | 'selected'>('entire');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showProviderManagement, setShowProviderManagement] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load Filter Panel settings from profile
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettingsLoaded(true);
        return;
      }

      try {
        const settings = await getUserSettings(user.id);
        const filterSettings = settings?.filterPanel;

        if (filterSettings) {
          if (filterSettings.context) setContext(filterSettings.context);
          if (filterSettings.provider) setProvider(filterSettings.provider);
          if (filterSettings.model) setModel(filterSettings.model);
          if (filterSettings.selectionMode) setSelectionMode(filterSettings.selectionMode);
          console.log('FilterPanel settings loaded:', filterSettings);
        }
      } catch (error) {
        console.error('Error loading filter settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [user]);

  // Save Filter Panel settings to profile (debounced)
  useEffect(() => {
    if (!user || !settingsLoaded) return;

    const saveSettings = async () => {
      try {
        // First, get current settings to merge - reusing the cached getter is safe here
        // or we could use updateUserSettings directly if we want to merge properly
        // For now, let's just use what was there before
        const currentSettings = await getUserSettings(user.id);

        // Merge with new Filter Panel settings
        const updatedSettings = {
          ...currentSettings,
          filterPanel: {
            context,
            provider,
            model,
            selectionMode,
          }
        };

        await updateUserSettings(user.id, updatedSettings);
        console.log('FilterPanel settings saved:', updatedSettings.filterPanel);
      } catch (error) {
        console.error('Error saving filter settings:', error);
      }
    };

    const timeoutId = setTimeout(saveSettings, 500);
    return () => clearTimeout(timeoutId);
  }, [user, context, provider, model, selectionMode, settingsLoaded]);

  // Handle filter application
  const handleApplyFilters = useCallback(async () => {
    if (!content || content.trim().length === 0) {
      toast.error(translate('No content to filter'));
      return;
    }

    if (selectedTemplates.length === 0) {
      toast.error(translate('Please select at least one template'));
      return;
    }

    setIsProcessing(true);

    try {
      const targetContent = selectionMode === 'selected' && selectedText
        ? selectedText
        : content;

      const options: FilterOptions = {
        context,
        provider,
        model,
        selection: selectionMode,
        customFilters: customFilters.filter(f => f.enabled),
      };

      // Apply filters for each selected template
      let processedContent = targetContent;

      for (const template of selectedTemplates) {
        console.log('Applying template:', template, 'to content length:', processedContent.length);
        const result = await filterWithResult(processedContent, template, options);

        console.log('Filter result:', { success: result.success, contentLength: result.content?.length, error: result.error });

        if (result.success && result.content) {
          processedContent = result.content;
          setLastResult(result);
          console.log('Processed content:', processedContent);
        } else {
          throw new Error(result.error || 'Filter processing failed');
        }
      }

      // Apply the processed content
      if (selectionMode === 'selected' && selectedText) {
        // Replace selected text in the original content
        const newContent = content.replace(selectedText, processedContent);
        onFilteredContent(newContent);
      } else {
        // Replace entire content
        onFilteredContent(processedContent);
      }

      toast.success(translate('Content filtered successfully!'));

    } catch (error: any) {
      console.error('Filter processing failed:', error);
      toast.error(translate('Filter processing failed: ') + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [content, selectedText, context, provider, model, selectedTemplates, customFilters, selectionMode, onFilteredContent]);

  // Handle preview
  const handlePreview = useCallback(() => {
    if (!content || content.trim().length === 0) {
      toast.error(translate('No content to preview'));
      return;
    }

    if (selectedTemplates.length === 0) {
      toast.error(translate('Please select at least one template'));
      return;
    }

    try {
      const targetContent = selectionMode === 'selected' && selectedText
        ? selectedText
        : content;

      const options: FilterOptions = {
        context,
        provider,
        model,
        selection: selectionMode,
        customFilters: customFilters.filter(f => f.enabled),
      };

      const preview = previewFilter(targetContent, selectedTemplates[0], options);
      setPreviewData(preview);
      setShowPreview(true);

    } catch (error: any) {
      console.error('Preview generation failed:', error);
      toast.error(translate('Preview generation failed: ') + error.message);
    }
  }, [content, selectedText, context, provider, model, selectedTemplates, customFilters, selectionMode]);

  // Reset configuration
  const handleReset = useCallback(() => {
    setContext(TemplateContext.COMMONS);
    setProvider('openai');
    setModel('gpt-4o-mini');
    setSelectedTemplates([]);
    setCustomFilters([]);
    setSelectionMode('entire');
    setLastResult(null);
    toast.success(translate('Configuration reset'));
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            <T>AI Filters</T>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedTemplates.length} templates
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProviderManagement(true)}
            className="h-8 px-2"
          >
            <Server className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            <T>Content Selection</T>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <RadioGroup value={selectionMode} onValueChange={(value: 'entire' | 'selected') => setSelectionMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="entire" id="entire" />
              <Label htmlFor="entire" className="text-sm">
                <T>Entire Document</T>
                <Badge variant="outline" className="ml-2 text-xs">
                  {content.length} chars
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="selected" id="selected" disabled={!selectedText} />
              <Label htmlFor="selected" className="text-sm">
                <T>Selected Text</T>
                {selectedText ? (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {selectedText.length} chars
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs">
                    No selection
                  </Badge>
                )}
              </Label>
            </div>
          </RadioGroup>

          {/* Show selected text preview */}
          {selectedText && selectionMode === 'selected' && (
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Selected Text Preview:</div>
              <div className="text-xs max-h-16 overflow-y-auto">
                {selectedText.length > 150 ? `${selectedText.substring(0, 150)}...` : selectedText}
              </div>
            </div>
          )}

          {/* Help text for selection */}
          {!selectedText && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <T>💡 Select text in editor to filter only selected portion</T>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration - One Picker Per Row */}
      <div className="space-y-2">
        <ContextSelector
          value={context}
          onChange={setContext}
          disabled={disabled || isProcessing}
          className="space-y-1"
        />

        <ProviderSelector
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
          disabled={disabled || isProcessing}
          className="space-y-1"
        />
      </div>

      {/* Templates */}
      <TemplateSelector
        context={context}
        selectedTemplates={selectedTemplates}
        onTemplatesChange={setSelectedTemplates}
        disabled={disabled || isProcessing}
      />

      {/* Custom Filters */}
      <FilterSelector
        context={context}
        customFilters={customFilters}
        onFiltersChange={setCustomFilters}
        disabled={disabled || isProcessing}
      />

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleApplyFilters}
              disabled={disabled || isProcessing || selectedTemplates.length === 0}
              className="flex-1 min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <T>Processing...</T>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  <T>Apply Filters</T>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={disabled || isProcessing || selectedTemplates.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              <T>Preview</T>
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              disabled={disabled || isProcessing}
            >
              <Settings className="h-4 w-4 mr-2" />
              <T>Reset</T>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <CardTitle className="text-sm font-medium">
                <T>Last Result</T>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{lastResult.processingTime}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>{lastResult.filtersApplied?.length || 0} filters</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <T>Filter Preview</T>
            </DialogTitle>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  <T>Generated Prompt</T>
                </Label>
                <Textarea
                  value={previewData.prompt}
                  readOnly
                  rows={6}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    <T>Base Filters</T>
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.baseFilters && previewData.baseFilters.length > 0 ? (
                      previewData.baseFilters.map((filter: string) => (
                        <Badge key={filter} variant="secondary" className="text-xs">
                          {filter}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    <T>Instruction Flags</T>
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.instructionFlags && previewData.instructionFlags.length > 0 ? (
                      previewData.instructionFlags.map((flag: string) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          {flag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Provider Management Dialog */}
      <Dialog open={showProviderManagement} onOpenChange={setShowProviderManagement}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <ProviderManagement />
        </DialogContent>
      </Dialog>
    </div>
  );
};
