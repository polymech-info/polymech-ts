/**
 * AI Text Generator Component
 * 2-column layout: Settings (left) + Prompt Input (right)
 * Mobile-friendly: Stacks vertically on small screens
 */

import React, { useState, useCallback } from 'react';
import { T, translate } from '@/i18n';
import {
  Sparkles,
  Mic,
  MicOff,
  Loader2,
  FileTextIcon,
  Plus,
  Trash2,
  ArrowUp,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import CollapsibleSection from '@/components/CollapsibleSection';

// Define Picture type locally if not imported (matches usages in other files)
interface Picture {
  id: string;
  image_url: string;
  title: string;
  [key: string]: any;
}
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProviderSelector } from '@/components/filters/ProviderSelector';

interface AITextGeneratorProps {
  // Prompt state
  prompt: string;
  onPromptChange: (prompt: string) => void;

  // Provider state
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;

  // Image tools
  imageToolsEnabled: boolean;
  onImageToolsChange: (enabled: boolean) => void;

  // Web Search
  webSearchEnabled: boolean;
  onWebSearchChange: (enabled: boolean) => void;

  // Context mode
  contextMode: 'clear' | 'selection' | 'all';
  onContextModeChange: (mode: 'clear' | 'selection' | 'all') => void;
  hasSelection: boolean;
  selectionLength?: number;
  hasContent: boolean;
  contentLength?: number;

  // Application mode
  applicationMode: 'replace' | 'insert' | 'append';
  onApplicationModeChange: (mode: 'replace' | 'insert' | 'append') => void;

  // Stream mode
  streamMode?: boolean;
  onStreamModeChange?: (enabled: boolean) => void;

  // Templates
  templates: Array<{ name: string; template: string }>;
  onApplyTemplate: (template: string) => void;
  onSaveTemplate: () => void;
  onDeleteTemplate: (index: number) => void;

  // Actions
  onGenerate: (options?: { referenceImages?: string[] }) => void;
  onOptimize: () => void;
  onCancel?: () => void;

  // State flags
  isGenerating: boolean;
  isOptimizing: boolean;
  disabled?: boolean;

  // Voice recording
  onMicrophoneToggle?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;

  // Prompt history
  promptHistory?: string[];
  historyIndex?: number;
  onNavigateHistory?: (direction: 'up' | 'down') => void;
}

export const AITextGenerator: React.FC<AITextGeneratorProps> = ({
  prompt,
  onPromptChange,
  provider,
  model,
  onProviderChange,
  onModelChange,
  imageToolsEnabled,
  onImageToolsChange,
  webSearchEnabled,
  onWebSearchChange,
  contextMode,
  onContextModeChange,
  hasSelection,
  selectionLength = 0,
  hasContent,
  contentLength = 0,
  applicationMode,
  onApplicationModeChange,
  streamMode,
  onStreamModeChange,
  templates,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onGenerate,
  onOptimize,
  onCancel,
  isGenerating,
  isOptimizing,
  disabled = false,
  onMicrophoneToggle,
  isRecording = false,
  isTranscribing = false,
  promptHistory = [],
  historyIndex = -1,
  onNavigateHistory,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter to generate
    if ((e.key === 'Enter' && e.ctrlKey) && prompt.trim() && !isGenerating) {
      e.preventDefault();
      onGenerate();
    }
    // Ctrl+Up to navigate to previous prompt in history
    else if (e.key === 'ArrowUp' && e.ctrlKey && onNavigateHistory) {
      console.log('up');
      e.preventDefault();
      onNavigateHistory('up');
    }
    // Ctrl+Down to navigate to next prompt in history
    else if (e.key === 'ArrowDown' && e.ctrlKey && onNavigateHistory) {
      console.log('down');
      e.preventDefault();
      onNavigateHistory('down');
    }
  };

  const [referenceImages, setReferenceImages] = useState<Picture[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleReferenceImagesSelect = (pictures: Picture[]) => {
    // Merge new pictures with existing ones, avoiding duplicates by ID
    setReferenceImages(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newPictures = pictures.filter(p => !existingIds.has(p.id));
      return [...prev, ...newPictures];
    });
    setShowImagePicker(false);
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Layout: Settings (left) + Prompt (right) */}
      {/* Single Column Layout for Side Panel */}
      <div className="flex flex-col gap-4">
        {/* Settings Area */}
        {/* Settings Area */}
        <CollapsibleSection
          title={<T>Settings</T>}
          initiallyOpen={true}
          storageKey="ai-generator-settings-main"
          asCard={true}
          className="bg-muted/30"
          contentClassName="p-4 space-y-3"
        >

          {/* Provider & Model Selection */}
          {/* Provider & Model Selection */}
          <CollapsibleSection
            title={<T>AI Provider</T>}
            initiallyOpen={true}
            storageKey="ai-text-gen-provider-settings"
            minimal={true}
            className="border-none p-0"
            contentClassName="pt-2"
          >
            <ProviderSelector
              provider={provider}
              model={model}
              onProviderChange={onProviderChange}
              onModelChange={onModelChange}
              disabled={disabled || isGenerating || isOptimizing}
              showManagement={true}
            />
          </CollapsibleSection>

          {/* Image Tools Toggle */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="flex items-center space-x-2">
              <Switch
                id="image-tools"
                checked={imageToolsEnabled}
                onCheckedChange={onImageToolsChange}
                disabled={disabled || isGenerating || isOptimizing}
              />
              <Label htmlFor="image-tools" className="text-sm font-medium cursor-pointer">
                <T>Image Tools</T>
              </Label>
            </div>
            <Badge variant={imageToolsEnabled ? 'default' : 'secondary'} className="text-xs">
              {imageToolsEnabled ? <T>Enabled</T> : <T>Text Only</T>}
            </Badge>
          </div>

          {/* Web Search Toggle */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="flex items-center space-x-2">
              <Switch
                id="web-search"
                checked={webSearchEnabled}
                onCheckedChange={onWebSearchChange}
                disabled={disabled || isGenerating || isOptimizing}
              />
              <Label htmlFor="web-search" className="text-sm font-medium cursor-pointer">
                <T>Web Search</T>
              </Label>
            </div>
            <Badge variant={webSearchEnabled ? 'default' : 'secondary'} className="text-xs">
              {webSearchEnabled ? <T>On</T> : <T>Off</T>}
            </Badge>
          </div>

          {/* Context Mode Selection */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">
              <T>Context Source</T>
            </h4>
            <Card className="border-muted bg-background">
              <CardContent className="p-3 space-y-2">
                <RadioGroup value={contextMode} onValueChange={(value: 'clear' | 'selection' | 'all') => onContextModeChange(value)}>
                  {/* Prompt Only */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clear" id="ctx-clear" />
                    <Label htmlFor="ctx-clear" className="text-sm cursor-pointer">
                      <T>Prompt Only</T>
                      <Badge variant="outline" className="ml-2 text-xs text-muted-foreground font-normal">
                        <T>No context</T>
                      </Badge>
                    </Label>
                  </div>

                  {/* Selected Text */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selection" id="ctx-selection" disabled={!hasSelection} />
                    <Label htmlFor="ctx-selection" className={`text-sm cursor-pointer ${!hasSelection ? 'opacity-50' : ''}`}>
                      <T>Selected Text</T>
                      {hasSelection ? (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectionLength} chars
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 text-xs text-muted-foreground font-normal">
                          <T>None</T>
                        </Badge>
                      )}
                    </Label>
                  </div>

                  {/* Entire Document */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="ctx-all" disabled={!hasContent} />
                    <Label htmlFor="ctx-all" className={`text-sm cursor-pointer ${!hasContent ? 'opacity-50' : ''}`}>
                      <T>Entire Document</T>
                      {hasContent ? (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {contentLength} chars
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 text-xs text-muted-foreground font-normal">
                          <T>Empty</T>
                        </Badge>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Templates Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className="flex-1"
                >
                  <FileTextIcon className="h-3 w-3 mr-2" />
                  <T>Templates</T>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {templates.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    <T>No templates saved yet</T>
                  </div>
                ) : (
                  <>
                    {templates.map((template, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => onApplyTemplate(template.template)}
                        className="flex items-center justify-between group"
                      >
                        <span className="flex-1 truncate">{template.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate(index);
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={onSaveTemplate}>
                  <Plus className="h-3 w-3 mr-2" />
                  <T>Save current as template</T>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Optimize Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOptimize}
              disabled={disabled || isOptimizing || !prompt.trim()}
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  <T>Optimizing...</T>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-2" />
                  <T>Optimize</T>
                </>
              )}
            </Button>
          </div>

        </CollapsibleSection>

        {/* Prompt Input Area */}
        <div className="space-y-3">
          {/* Application Mode Toggle - Above Prompt */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
            <span className="text-xs font-medium text-muted-foreground">
              <T>Apply:</T>
            </span>
            <div className="grid grid-cols-3 gap-1 flex-1">
              <Button
                variant={applicationMode === 'replace' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onApplicationModeChange('replace')}
                disabled={disabled || isGenerating || isOptimizing || !hasSelection}
                className="h-7 text-xs"
                title={!hasSelection ? 'Select text to enable replace mode' : 'Replace selected text with generated content'}
              >
                <T>Replace</T>
              </Button>
              <Button
                variant={applicationMode === 'insert' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onApplicationModeChange('insert')}
                disabled={disabled || isGenerating || isOptimizing}
                className="h-7 text-xs"
                title="Add with single line break (clean append)"
              >
                <T>Insert</T>
              </Button>
              <Button
                variant={applicationMode === 'append' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onApplicationModeChange('append')}
                disabled={disabled || isGenerating || isOptimizing}
                className="h-7 text-xs"
                title="Append at end of document with separator"
              >
                <T>Append</T>
              </Button>
            </div>
          </div>

          {/* Stream Toggle */}
          {onStreamModeChange && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <Label htmlFor="stream-mode" className="text-sm font-medium cursor-pointer">
                <T>Stream Output</T>
              </Label>
              <Switch
                id="stream-mode"
                checked={streamMode}
                onCheckedChange={onStreamModeChange}
                disabled={disabled || isGenerating || isOptimizing}
              />
            </div>
          )}

          {/* History Navigation - Above Textarea */}
          {promptHistory.length > 0 && onNavigateHistory && (
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border">
              <span className="text-xs text-muted-foreground">
                <T>History</T>: {historyIndex >= 0 ? `${historyIndex + 1}/${promptHistory.length}` : 'Current'}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateHistory('up')}
                  disabled={promptHistory.length === 0 || historyIndex === promptHistory.length - 1}
                  className="h-7 px-2"
                  title="Previous prompt (Ctrl+↑)"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateHistory('down')}
                  disabled={historyIndex === -1}
                  className="h-7 px-2"
                  title="Next prompt (Ctrl+↓)"
                >
                  <ArrowUp className="h-3 w-3 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={translate("Describe what you want to generate...\n\nKeyboard shortcuts:\n• Ctrl+Enter: Generate\n• Ctrl+↑/↓: Navigate history")}
              rows={imageToolsEnabled ? 8 : 6}
              className="resize-none pr-10"
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
            {onMicrophoneToggle && (
              <button
                onClick={onMicrophoneToggle}
                disabled={isTranscribing || disabled}
                className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${isRecording
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                title={isRecording ? 'Stop recording' : 'Record audio'}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Reference Images Section */}
          {imageToolsEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  <T>Reference Images</T>
                </h4>
                <span className="text-xs text-muted-foreground">
                  {referenceImages.length} selected
                </span>
              </div>

              {referenceImages.length === 0 ? (
                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed flex flex-col items-center justify-center mb-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/50 transition-all"
                  onClick={() => setShowImagePicker(true)}
                  disabled={disabled}
                >
                  <ImageIcon className="h-4 w-4 mb-1 opacity-50" />
                  <span className="text-xs font-medium"><T>Select Reference Images</T></span>
                </Button>
              ) : (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {referenceImages.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border group bg-muted/30">
                      <img
                        src={img.image_url || img.src}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={() => setReferenceImages(prev => prev.filter(i => i.id !== img.id))}
                        className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="aspect-square flex flex-col items-center justify-center p-0 border-dashed hover:border-primary hover:text-primary hover:bg-accent/50 transition-all"
                    onClick={() => setShowImagePicker(true)}
                    disabled={disabled}
                    title="Add more images"
                  >
                    <Plus className="h-4 w-4 mb-0.5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground"><T>Add</T></span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <ImagePickerDialog
            isOpen={showImagePicker}
            onClose={() => setShowImagePicker(false)}
            onSelect={(url) => {
              // Fallback for single select, though we prefer multi-select
              console.log('Single select fallback:', url);
              setShowImagePicker(false);
            }}
            onMultiSelectPictures={handleReferenceImagesSelect}
            multiple={true}
          />

          {/* Generate/Cancel Button */}
          {isGenerating && onCancel ? (
            <Button
              onClick={onCancel}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <T>Cancel Generation</T>
            </Button>
          ) : (
            <Button
              onClick={() => onGenerate({ referenceImages: referenceImages.map(img => img.image_url || img.src) })}
              disabled={disabled || isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <T>Generating...</T>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <T>{imageToolsEnabled ? 'Generate with Images' : webSearchEnabled ? 'Generate with Web Search' : 'Generate Text'}</T>
                </>
              )}
            </Button>
          )}

          {/* Helper Text */}
          {(imageToolsEnabled || webSearchEnabled) && (
            <div className="space-y-2">
              {imageToolsEnabled && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    💡 <T>Image Tools enabled: AI can generate and embed images in the content</T>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    ℹ️ <T>Note: Image Tools require OpenAI provider and will use your selected OpenAI model</T>
                  </div>
                </div>
              )}

              {webSearchEnabled && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 space-y-1">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300">
                    🌐 <T>Web Search enabled: AI can search the web for up-to-date information</T>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITextGenerator;
