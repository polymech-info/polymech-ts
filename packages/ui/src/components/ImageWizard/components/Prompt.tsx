import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  ArrowUp, 
  Mic, 
  MicOff, 
  Sparkles, 
  FileText, 
  Plus, 
  Trash2 
} from "lucide-react";
import { T, translate } from "@/i18n";
import { MAX_SPLIT_PROMPTS } from "@/constants";
import { ImageFile } from "../types";
import { toast } from "sonner";
import { PromptPreset } from "@/components/PresetManager";

interface PromptProps {
  // Prompt value
  prompt: string;
  onPromptChange: (prompt: string) => void;
  
  // Split mode
  isSplitMode: boolean;
  onSplitModeChange: (enabled: boolean) => void;
  
  // Preset context
  selectedPreset: PromptPreset | null;
  
  // Templates
  templates: Array<{name: string; template: string}>;
  onApplyTemplate: (template: string) => void;
  onSaveTemplate: () => void;
  onDeleteTemplate: (index: number) => void;
  
  // Optimization
  onOptimizePrompt: () => void;
  isOptimizing: boolean;
  
  // Voice recording
  onMicrophoneToggle: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  
  // History
  promptHistory: string[];
  historyIndex: number;
  onNavigateHistory: (direction: 'up' | 'down') => void;
  onManualEdit: () => void;
  
  // Generation
  isGenerating: boolean;
  onGenerate: () => void;
  
  // Images (for paste functionality)
  onImagePaste: (image: ImageFile) => void;
}

export const Prompt: React.FC<PromptProps> = ({
  prompt,
  onPromptChange,
  isSplitMode,
  onSplitModeChange,
  selectedPreset,
  templates,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onOptimizePrompt,
  isOptimizing,
  onMicrophoneToggle,
  isRecording,
  isTranscribing,
  promptHistory,
  historyIndex,
  onNavigateHistory,
  onManualEdit,
  isGenerating,
  onGenerate,
  onImagePaste,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm md:text-base font-medium">
          <span className="text-xs text-muted-foreground mr-2">3.</span>
          <T>Prompt</T>
        </label>
        
        {/* Split Mode Toggle */}
        <div className="flex items-center gap-2">
          <label htmlFor="split-mode" className="text-xs text-muted-foreground cursor-pointer">
            <T>Split</T>
          </label>
          <Switch
            id="split-mode"
            checked={isSplitMode}
            onCheckedChange={onSplitModeChange}
            className="h-5 w-9"
          />
        </div>
      </div>
      
      {/* Split Mode Info */}
      {isSplitMode && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <T>Split mode: Each line will be a separate prompt. Max {MAX_SPLIT_PROMPTS} lines. Each image feeds into the next.</T>
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="hidden md:flex gap-2">
          {/* Templates Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                title={translate("Prompt Templates")}
              >
                <FileText className="h-4 w-4 mr-2" />
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
                        title={translate("Delete template")}
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimizePrompt}
            disabled={isOptimizing || !prompt.trim()}
            className="h-8"
            title={translate("Optimize prompt with AI")}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <T>Optimizing...</T>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <T>Optimize</T>
              </>
            )}
          </Button>
          
        </div>
      </div>
      
      <div className="space-y-2">
        {/* History Navigation Buttons */}
        {promptHistory.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              History: {historyIndex >= 0 ? `${historyIndex + 1}/${promptHistory.length}` : 'Current'}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateHistory('up')}
                disabled={promptHistory.length === 0 || historyIndex === promptHistory.length - 1}
                className="h-8 px-2 md:h-6"
                title="Previous prompt (Ctrl+↑)"
              >
                <ArrowUp className="h-4 w-4 md:h-3 md:w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateHistory('down')}
                disabled={historyIndex === -1}
                className="h-8 px-2 md:h-6"
                title="Next prompt (Ctrl+↓)"
              >
                <ArrowUp className="h-4 w-4 md:h-3 md:w-3 rotate-180" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value);
              onManualEdit();
            }}
            placeholder={
              isSplitMode
                ? translate("Enter each prompt on a new line (max 10 lines)...")
                : selectedPreset 
                ? translate("Add specific details to the context above...")
                : translate("Describe the image you want to create or edit... (Ctrl+V to paste images)")
            }
            rows={isSplitMode ? 6 : 3}
            className="resize-none pr-10 text-base md:text-sm"
            onKeyDown={(e) => {
              if ((e.key === 'Enter' && e.ctrlKey) && prompt.trim() && !isGenerating) {
                e.preventDefault();
                onGenerate();
              } else if (e.key === 'ArrowUp' && e.ctrlKey) {
                e.preventDefault();
                onNavigateHistory('up');
              } else if (e.key === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                onNavigateHistory('down');
              }
            }}
            onPaste={async (e) => {
              const items = Array.from(e.clipboardData?.items || []);
              const imageFiles = items.filter(item => item.type.startsWith('image/'));
              
              if (imageFiles.length > 0) {
                e.preventDefault();
                
                for (const item of imageFiles) {
                  const file = item.getAsFile();
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const newImage: ImageFile = {
                        id: `paste-${Date.now()}-${Math.random()}`,
                        file: file,
                        src: event.target?.result as string,
                        title: file.name || `Pasted image ${Date.now()}`,
                        selected: true
                      };
                      onImagePaste(newImage);
                      toast.success(translate('Image pasted successfully!'));
                    };
                    reader.readAsDataURL(file);
                  }
                }
              }
            }}
          />
          <button
            onClick={onMicrophoneToggle}
            disabled={isTranscribing}
            className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${
              isRecording
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
      </div>
    </div>
  );
};

export default Prompt;

