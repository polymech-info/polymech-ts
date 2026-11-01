/**
 * Wizard Context
 * Provides shared state and actions for ImageWizard components
 * Eliminates prop drilling through component hierarchy
 */

import React, { createContext, useContext } from 'react';
import { ImageFile } from '../types';
import { PromptPreset } from '@/components/PresetManager';
import { Workflow } from '@/components/WorkflowManager';
import { QuickAction } from '@/constants';
import { Logger } from '../utils/logger';

interface WizardContextValue {
  // User
  userId: string | undefined;
  
  // Images
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  availableImages: ImageFile[];
  generatedImage: string | null;
  
  // Generation state
  isGenerating: boolean;
  isAgentMode: boolean;
  isSplitMode: boolean;
  setIsSplitMode: React.Dispatch<React.SetStateAction<boolean>>;
  isOptimizingPrompt: boolean;
  
  // Form state
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  postTitle: string;
  setPostTitle: React.Dispatch<React.SetStateAction<string>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  
  // Settings
  selectedPreset: PromptPreset | null;
  promptPresets: PromptPreset[];
  loadingPresets: boolean;
  workflows: Workflow[];
  loadingWorkflows: boolean;
  promptTemplates: Array<{name: string; template: string}>;
  quickActions: QuickAction[];
  
  // Prompt history
  promptHistory: string[];
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  
  // Voice
  isRecording: boolean;
  isTranscribing: boolean;
  
  // UI state
  isPublishing: boolean;
  dragIn: boolean;
  setDragIn: React.Dispatch<React.SetStateAction<boolean>>;
  loadingImages: boolean;
  dragLeaveTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  
  // Actions - Image operations
  toggleImageSelection: (imageId: string, isMultiSelect?: boolean, fromGallery?: boolean) => void;
  openLightbox: (index: number) => void;
  setAsSelected: (imageId: string) => void;
  removeImage: (imageId: string) => void;
  deleteSelectedImages: () => void;
  
  // Actions - Generation
  generateImage: () => Promise<void>;
  generateImageSplit: () => Promise<void>;
  handleAgentGeneration: () => void;
  handleOptimizePrompt: () => void;
  handleMicrophone: () => void;
  
  // Actions - Settings
  handlePresetSelect: (preset: PromptPreset) => void;
  handlePresetClear: () => void;
  savePreset: (preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  updatePreset: (id: string, preset: Omit<PromptPreset, 'id' | 'createdAt'>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  
  saveWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkflow: (id: string, workflow: Omit<Workflow, 'id' | 'createdAt'>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  executeWorkflow: (workflow: Workflow) => Promise<void>;
  
  applyTemplate: (template: string) => void;
  deleteTemplate: (index: number) => Promise<void>;
  handleSaveCurrentPromptAsTemplate: () => void;
  
  executeQuickAction: (action: QuickAction) => void;
  openEditActionsDialog: () => void;
  
  navigateHistory: (direction: 'up' | 'down') => void;
  
  // Actions - Publishing
  quickPublishAsNew: () => Promise<void>;
  publishImage: () => Promise<void>;
  
  // Actions - Misc
  setShowVoicePopup: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Logger
  logger: Logger;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export const WizardProvider: React.FC<{
  value: WizardContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};
