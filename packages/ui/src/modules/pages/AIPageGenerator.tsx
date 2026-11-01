/**
 * AI Page Generator Component
 * A specialized version of AITextGenerator for creating new pages from scratch.
 * It removes application-specific logic like 'Apply', 'Replace', 'Append'.
 */

import React from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProviderSelector } from '@/components/filters/ProviderSelector';

import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useProviderSettings } from '@/hooks/useProviderSettings';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { Image as ImageIcon, X } from 'lucide-react';
import { useLog } from '@/contexts/LogContext';
import CollapsibleSection from '@/components/CollapsibleSection';
import ToolSections from '@/modules/ai/components/ToolSections';

// Persisted toggle helper
const usePersistedToggle = (key: string, defaultValue: boolean): [boolean, (v: boolean) => void] => {
  const [value, setValue] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  const set = React.useCallback((v: boolean) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { }
  }, [key]);
  return [value, set];
};

interface AIPageGeneratorProps {
  // Prompt state
  prompt: string;
  onPromptChange: (prompt: string) => void;

  onGenerate: (options: { 
    useImageTools: boolean; 
    model?: string; 
    provider?: string; 
    imageModel?: string; 
    referenceImages?: string[];
    webSearchEnabled?: boolean;
    pageToolsEnabled?: boolean;
    vfsToolsEnabled?: boolean;
    toolsEnabled?: boolean;
  }) => void;
  onCancel?: () => void;

  // State flags
  isGenerating: boolean;
  generationStatus?: 'idle' | 'transcribing' | 'generating' | 'creating' | 'success' | 'error';
  disabled?: boolean;
  promptHistory?: string[];
  historyIndex?: number;
  onNavigateHistory?: (direction: 'up' | 'down') => void;
  initialReferenceImages?: string[];
}

export const AIPageGenerator: React.FC<AIPageGeneratorProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  onCancel,
  isGenerating,
  generationStatus,
  disabled = false,
  promptHistory = [],
  historyIndex = -1,
  onNavigateHistory,
  initialReferenceImages = []
}) => {
  const {
    loading: loadingSettings,
    selectedProvider,
    selectedModel,
    onProviderChange,
    onModelChange,
  } = useProviderSettings();

  // Tool toggles — persisted via localStorage
  const [toolsEnabled, setToolsEnabled] = usePersistedToggle('aipg-tools-search', false);
  const [pageToolsEnabled, setPageToolsEnabled] = usePersistedToggle('aipg-tools-page', true);
  const [imageToolsEnabled, setImageToolsEnabled] = usePersistedToggle('aipg-tools-image', true);
  const [vfsToolsEnabled, setVfsToolsEnabled] = usePersistedToggle('aipg-tools-vfs', false);
  const [webSearchEnabled, setWebSearchEnabled] = usePersistedToggle('aipg-tools-web-search', false);

  const [referenceImages, setReferenceImages] = React.useState<any[]>([]);
  const [showImagePicker, setShowImagePicker] = React.useState(false);

  // Initialize reference images from prop
  React.useEffect(() => {
    if (initialReferenceImages.length > 0) {
      const initialPics = initialReferenceImages.map((url, index) => ({
        id: `preload-${index}`,
        url: url,
        title: 'Selected Image',
        image_url: url,
        width: 0,
        height: 0,
        created_at: new Date().toISOString(),
        user_id: 'current-user'
      }));
      setReferenceImages(initialPics);
    }
  }, [initialReferenceImages]);

  // Image model state with persistence
  const [imageModel, setImageModel] = React.useState<string>(() => {
    return localStorage.getItem('aipagegenerator-image-model') || 'google/gemini-3-pro-image-preview';
  });

  React.useEffect(() => {
    if (imageModel) {
      localStorage.setItem('aipagegenerator-image-model', imageModel);
    }
  }, [imageModel]);

  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const { isRecording, isTranscribing, handleMicrophoneToggle } = useVoiceInput(onPromptChange);
  const { logs } = useLog();
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isGenerating && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isGenerating]);

  const getStatusMessage = () => {
    switch (generationStatus) {
      case 'transcribing': return 'Transcribing audio...';
      case 'generating': return 'Generating content...';
      case 'creating': return 'Creating page...';
      case 'success': return 'Success!';
      default: return onCancel ? 'Cancel Generation' : 'Generating...';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Enter' && e.ctrlKey) && prompt.trim() && !isGenerating) {
      e.preventDefault();
      onGenerate({
        useImageTools: imageToolsEnabled,
        model: selectedModel,
        provider: selectedProvider,
        imageModel,
        referenceImages: referenceImages.map(img => img.image_url || img.src),
        toolsEnabled: toolsEnabled,
        webSearchEnabled: webSearchEnabled,
        pageToolsEnabled: pageToolsEnabled,
        vfsToolsEnabled: vfsToolsEnabled
      });
    } else if (e.key === 'ArrowUp' && e.ctrlKey && onNavigateHistory) {
      e.preventDefault();
      onNavigateHistory('up');
    } else if (e.key === 'ArrowDown' && e.ctrlKey && onNavigateHistory) {
      e.preventDefault();
      onNavigateHistory('down');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Settings */}
        <div className="space-y-2">
          {/* Provider & Model */}
          <CollapsibleSection title={translate("Provider & Model")} storageKey="aipg-section-provider" minimal>
            <div className="p-3 space-y-3">
              <ProviderSelector
                provider={selectedProvider}
                model={selectedModel}
                onProviderChange={onProviderChange}
                onModelChange={onModelChange}
                disabled={disabled || isGenerating || isOptimizing || loadingSettings}
                showManagement={true}
              />
            </div>
          </CollapsibleSection>

          {/* Tools */}
          <CollapsibleSection title={translate("Tools")} storageKey="aipg-section-tools" minimal>
              <ToolSections
                  storagePrefix="aipg-tool"
                  idPrefix="aipg-"
                  toolsEnabled={toolsEnabled}
                  onToolsEnabledChange={setToolsEnabled}
                  pageToolsEnabled={pageToolsEnabled}
                  onPageToolsEnabledChange={setPageToolsEnabled}
                  imageToolsEnabled={imageToolsEnabled}
                  onImageToolsEnabledChange={setImageToolsEnabled}
                  imageModel={imageModel}
                  onImageModelChange={setImageModel}
                  vfsToolsEnabled={vfsToolsEnabled}
                  onVfsToolsEnabledChange={setVfsToolsEnabled}
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchEnabledChange={setWebSearchEnabled}
                  isGenerating={isGenerating}
              />
          </CollapsibleSection>

          {/* Reference Images — only when image tools active */}
          {imageToolsEnabled && (
            <CollapsibleSection title={translate("Reference Images")} storageKey="aipg-section-refimg" minimal initiallyOpen={false}>
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {referenceImages.length} selected
                  </span>
                </div>
                {referenceImages.length === 0 ? (
                  <Button
                    variant="outline"
                    className="w-full h-16 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent/50 transition-all"
                    onClick={() => setShowImagePicker(true)}
                    disabled={disabled}
                  >
                    <ImageIcon className="h-4 w-4 mb-1 opacity-50" />
                    <span className="text-xs font-medium"><T>Select Reference Images</T></span>
                  </Button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
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
                          className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
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
                      <Plus className="h-5 w-5 mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground"><T>Add</T></span>
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  <T>Images to help guide the AI generation</T>
                </p>
              </div>
            </CollapsibleSection>
          )}

          <ImagePickerDialog
            isOpen={showImagePicker}
            onClose={() => setShowImagePicker(false)}
            multiple={true}
            currentValues={referenceImages.map(img => img.id)}
            onMultiSelectPictures={(pictures) => {
              setReferenceImages(pictures);
              setShowImagePicker(false);
            }}
          />

          <div className="flex flex-wrap gap-2">
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
                {/* Templates logic would go here */}
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  <T>No templates saved yet</T>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Plus className="h-3 w-3 mr-2" />
                  <T>Save current as template</T>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { /* Optimize logic */ }}
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
        </div>

        {/* Right Column: Prompt Input */}
        <div className="space-y-3 flex flex-col">
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
                  disabled={historyIndex >= promptHistory.length - 1}
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
                  disabled={historyIndex < 0}
                  className="h-7 px-2"
                  title="Next prompt (Ctrl+↓)"
                >
                  <ArrowUp className="h-3 w-3 rotate-180" />
                </Button>
              </div>
            </div>
          )}
          <div className="relative flex-grow flex flex-col">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={"Describe the page you want to generate...\\n\\nKeyboard shortcuts:\\n• Ctrl+Enter: Generate\\n• Ctrl+↑/↓: Navigate history"}
              className="resize-none pr-10 flex-grow"
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={10}
            />
            <button
              onClick={handleMicrophoneToggle}
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
          </div>

          {isGenerating && (
            <div className="mb-2 p-3 bg-zinc-950 text-green-400 font-mono text-xs rounded-md h-32 overflow-y-auto border border-zinc-800 shadow-inner">
              <div className="flex flex-col gap-1.5">
                {logs.slice(-20).map((log) => (
                  <div key={log.id} className="break-words leading-tight">
                    <span className="opacity-40 select-none mr-2">
                      {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-yellow-400' : ''}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          <Button
            onClick={isGenerating && onCancel ? onCancel : () => onGenerate({
              useImageTools: imageToolsEnabled,
              model: selectedModel,
              provider: selectedProvider,
              imageModel,
              referenceImages: referenceImages.map(img => img.image_url || img.src),
              toolsEnabled,
              webSearchEnabled,
              pageToolsEnabled,
              vfsToolsEnabled
            })}
            disabled={disabled || (!isGenerating && !prompt.trim())}
            className="w-full"
            size="lg"
            variant={isGenerating && onCancel ? 'destructive' : 'default'}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <T>{getStatusMessage()}</T>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <T>{imageToolsEnabled ? 'Generate with Images' : 'Generate Text Only'}</T>
              </>
            )}
          </Button>

          {imageToolsEnabled && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                💡 <T>Image Tools enabled: AI can generate and embed images in the content</T>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                ℹ️ <T>Note: Image Tools require an OpenAI provider and will use your selected OpenAI model</T>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPageGenerator;
