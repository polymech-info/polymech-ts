import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Save, Wand2, X, Brain, Mic, Plus, ChevronDown, AlertTriangle } from "lucide-react";
import { T } from "@/i18n";
import { PromptPreset } from "@/components/PresetManager";
import PresetManager from "@/components/PresetManager";
import { Workflow } from "@/components/WorkflowManager";
import WorkflowManager from "@/components/WorkflowManager";
import CollapsibleSection from "@/components/ui/collapsible-section";
import { ModelSelectorPanel } from "@/modules/ai/images/components";
import { ImageFile } from "../types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WizardSidebarProps {
  // Model
  selectedModel: string;
  onModelChange: (model: string) => void;
  onLoadModel?: (userId: string) => Promise<string | null>;
  onSaveModel?: (userId: string, model: string) => Promise<void>;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  resolution: string;
  onResolutionChange: (res: string) => void;
  searchGrounding: boolean;
  onSearchGroundingChange: (enabled: boolean) => void;
  imageSearch: boolean;
  onImageSearchChange: (enabled: boolean) => void;

  // Presets
  selectedPreset: PromptPreset | null;
  presets: PromptPreset[];
  loadingPresets: boolean;
  onPresetSelect: (preset: PromptPreset) => void;
  onPresetClear: () => void;
  onSavePreset: (preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePreset: (id: string, preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePreset: (id: string) => Promise<void>;

  // Workflows
  workflows: Workflow[];
  loadingWorkflows: boolean;
  onSaveWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateWorkflow: (id: string, workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onExecuteWorkflow: (workflow: Workflow) => Promise<void>;

  // Prompt (children will be rendered in the prompt section)
  children: React.ReactNode;

  // Generation
  isGenerating: boolean;
  isAgentMode: boolean;
  isSplitMode: boolean;
  prompt: string;
  onGenerate: () => void;
  onGenerateSplit: () => void;
  onAgentGenerate: () => void;
  onVoiceGenerate: () => void;
  onAbort: () => void;

  // Publishing
  images: ImageFile[];
  generatedImage: string | null;
  postTitle: string;
  onPostTitleChange: (title: string) => void;
  isPublishing: boolean;
  onQuickPublish: () => void;
  onPublish: () => void;
  onPublishToGallery?: () => void;
  onAppendToPost?: () => void;
  /** When true, show “Save as file” in the Quick Publish menu (VFS-backed session). */
  showSaveAsVfsFile?: boolean;
  onSaveAsVfsFile?: () => void;
  onAddToPost?: () => void;
  editingPostId?: string | null;
  lastError?: string | null;
  retryInfo?: { attempt: number; secondsLeft: number } | null;
  onDismissError?: () => void;
}

export const WizardSidebar: React.FC<WizardSidebarProps> = ({
  selectedModel,
  onModelChange,
  onLoadModel,
  onSaveModel,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  searchGrounding,
  onSearchGroundingChange,
  imageSearch,
  onImageSearchChange,
  selectedPreset,
  presets,
  loadingPresets,
  onPresetSelect,
  onPresetClear,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
  workflows,
  loadingWorkflows,
  onSaveWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow,
  onExecuteWorkflow,
  children,
  isGenerating,
  isAgentMode,
  isSplitMode,
  prompt,
  onGenerate,
  onGenerateSplit,
  onAgentGenerate,
  onVoiceGenerate,
  onAbort,
  images,
  generatedImage,
  postTitle,
  onPostTitleChange,
  isPublishing,
  onQuickPublish,
  onPublish,
  onPublishToGallery,
  onAppendToPost,
  showSaveAsVfsFile,
  onSaveAsVfsFile,
  onAddToPost,
  editingPostId,
  lastError,
  retryInfo,
  onDismissError,
}) => {
  return (
    <div className="lg:col-span-1 space-y-3 md:space-y-6">
      <Card>
        <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
          {/* Step 1: Model Selector (Collapsible) */}
          <CollapsibleSection
            title={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">1.</span>
                <T>AI Model</T>
              </div>
            }
            initiallyOpen={true}
            storageKey="wizard-model-section"
            minimal={false}
            titleClassName="text-sm font-medium"
            buttonClassName="h-6 w-6 p-0"
            contentClassName="p-2"
            className="mb-3"
          >
            <ModelSelectorPanel
              value={selectedModel}
              onChange={onModelChange}
              onLoadModel={onLoadModel}
              onSaveModel={onSaveModel}
              aspectRatio={aspectRatio}
              onAspectRatioChange={onAspectRatioChange}
              resolution={resolution}
              onResolutionChange={onResolutionChange}
              searchGrounding={searchGrounding}
              onSearchGroundingChange={onSearchGroundingChange}
              imageSearch={imageSearch}
              onImageSearchChange={onImageSearchChange}
            />
          </CollapsibleSection>

          {/* Step 2: Prompt Presets Manager */}
          <div className="hidden md:block">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">2.</span>
                  <T>Context Preset (Optional)</T>
                </div>
              }
              headerContent={
                selectedPreset && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPresetClear();
                    }}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    <T>Clear Context</T>
                  </Button>
                )
              }
              initiallyOpen={false}
              storageKey="wizard-presets-section"
              minimal={false}
              titleClassName="text-sm font-medium"
              buttonClassName="h-6 w-6 p-0"
              contentClassName="p-2"
              className="mb-3"
            >
              {selectedPreset && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Active Context: {selectedPreset.name}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-2">
                    {selectedPreset.prompt}
                  </p>
                </div>
              )}

              <PresetManager
                presets={presets}
                currentPrompt={prompt}
                onSelectPreset={onPresetSelect}
                onSavePreset={onSavePreset}
                onUpdatePreset={onUpdatePreset}
                onDeletePreset={onDeletePreset}
                loading={loadingPresets}
                selectedPresetId={selectedPreset?.id}
              />
            </CollapsibleSection>
          </div>

          {/* Step 2.5: Workflow Manager */}
          <div className="hidden md:block">
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">2.5.</span>
                  <T>Workflows</T>
                </div>
              }
              initiallyOpen={false}
              storageKey="wizard-workflows-section"
              minimal={false}
              titleClassName="text-sm font-medium"
              buttonClassName="h-6 w-6 p-0"
              contentClassName="p-2"
              className="mb-3"
            >
              <WorkflowManager
                workflows={workflows}
                onSaveWorkflow={onSaveWorkflow}
                onUpdateWorkflow={onUpdateWorkflow}
                onDeleteWorkflow={onDeleteWorkflow}
                onExecuteWorkflow={onExecuteWorkflow}
                loading={loadingWorkflows}
              />
            </CollapsibleSection>
          </div>

          {/* Step 3: Prompt Section - Render children */}
          {children}

          {/* Inline Error */}
          {lastError && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-300 text-xs">
              <span className="flex-1">
                {lastError}
                {retryInfo && (
                  <span className="flex items-center gap-1.5 mt-1.5 text-orange-600 dark:text-orange-400 font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Retrying in {Math.floor(retryInfo.secondsLeft / 60)}:{String(retryInfo.secondsLeft % 60).padStart(2, '0')} (attempt {retryInfo.attempt}/5)
                  </span>
                )}
              </span>
              {onDismissError && (
                <button onClick={onDismissError} className="shrink-0 mt-0.5 opacity-60 hover:opacity-100" title="Cancel retry">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Step 4: Generate Buttons */}
          <div>
            <label className="text-sm md:text-base font-medium mb-2 block">
              <span className="text-xs text-muted-foreground mr-2">4.</span>
              <T>Generate Image</T>
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {/* Direct Generation */}
              {isGenerating && !isAgentMode ? (
                <Button
                  onClick={onAbort}
                  variant="destructive"
                  className="w-full h-10 text-sm touch-manipulation px-2"
                  title="Cancel generation"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline"><T>Cancel</T></span>
                </Button>
              ) : (
                <Button
                  onClick={isSplitMode ? onGenerateSplit : onGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  variant="default"
                  className="w-full h-10 text-sm touch-manipulation px-2"
                  title={isSplitMode ? "Split generation (sequential)" : "Direct image generation (fast)"}
                >
                  <Wand2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{isSplitMode ? <T>Generate Split</T> : <T>Generate</T>}</span>
                </Button>
              )}

              {/* Agent Mode */}
              {isGenerating && isAgentMode ? (
                <Button
                  onClick={onAbort}
                  variant="destructive"
                  className="w-full h-10 text-sm touch-manipulation px-2"
                  title="Cancel agent"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline"><T>Cancel</T></span>
                </Button>
              ) : (
                <Button
                  onClick={onAgentGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  variant="secondary"
                  className="w-full h-10 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white touch-manipulation px-2"
                  title="AI Agent with tools (smart workflows)"
                >
                  <Brain className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline"><T>Agent</T></span>
                </Button>
              )}

              {/* Voice Agent */}
              <Button
                onClick={onVoiceGenerate}
                disabled={isGenerating}
                variant="secondary"
                className="w-full h-10 text-sm bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white touch-manipulation px-2"
                title="Voice to image with AI agent"
              >
                <Mic className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline"><T>Voice</T></span>
              </Button>
            </div>

            {/* Button Descriptions */}
            <div className="hidden sm:grid text-xs text-muted-foreground mt-2 grid-cols-3 gap-2 text-center">
              <div><T>Fast & Direct</T></div>
              <div><T>Smart & Optimized</T></div>
              <div><T>Voice + AI</T></div>
            </div>
          </div>

          {/* Step 5: Title Field */}
          {(generatedImage || images.length > 0) && (
            <div>
              <label className="text-sm md:text-base font-medium mb-2 block">
                <span className="text-xs text-muted-foreground mr-2">5.</span>
                <T>Title for Publishing (Optional)</T>
              </label>
              <input
                type="text"
                placeholder="Enter a title..."
                className="w-full px-3 py-2.5 md:py-2 border border-border rounded-md text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background mb-3"
                value={postTitle}
                onChange={(e) => onPostTitleChange(e.target.value)}
              />
            </div>
          )}

          {/* Step 6: Publish Buttons */}
          {(generatedImage || images.length > 0) && (
            <div>
              <label className="text-sm md:text-base font-medium mb-2 block">
                <span className="text-xs text-muted-foreground mr-2">6.</span>
                <T>Publish</T>
              </label>
              <div className="space-y-1.5">
                {/* Add to Post Button (if editing post) */}
                {editingPostId && (
                  <Button
                    onClick={onAddToPost}
                    variant="default"
                    className="w-full text-sm h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add to Current Post</span>
                        <span className="sm:hidden">Add to Post</span>
                      </>
                    )}
                  </Button>
                )}

                {/* Quick Publish / Dropdown */}
                <div className="flex rounded-md shadow-sm w-full">
                  <Button
                    onClick={onQuickPublish}
                    variant="default"
                    className="w-full text-sm h-10 rounded-r-none"
                    disabled={isPublishing || !prompt.trim()}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline"><T>Quick Publish as Post (Default)</T></span>
                        <span className="sm:hidden"><T>Quick Publish</T></span>
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" className="rounded-l-none border-l border-primary-foreground/20 px-2 h-10" disabled={isPublishing}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onQuickPublish}>
                        <T>Quick Publish as Post (Default)</T>
                      </DropdownMenuItem>
                      {onPublishToGallery && (
                        <DropdownMenuItem onClick={onPublishToGallery}>
                          <T>Publish as Picture</T>
                        </DropdownMenuItem>
                      )}
                      {showSaveAsVfsFile && onSaveAsVfsFile && (
                        <DropdownMenuItem
                          onClick={onSaveAsVfsFile}
                          disabled={isPublishing}
                        >
                          <T>Save as file</T>
                        </DropdownMenuItem>
                      )}
                      {onAppendToPost && (
                        <DropdownMenuItem onClick={onAppendToPost}>
                          <T>Append to Existing Post</T>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default WizardSidebar;




