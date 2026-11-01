/**
 * ImageWizard State Management Hook
 * Centralizes all state declarations with a flat structure for better maintainability
 */

import { useState, useRef } from "react";
import { ImageFile } from "../types";
import { DEFAULT_QUICK_ACTIONS, QuickAction } from "@/constants";
import { PromptPreset } from "@/components/PresetManager";
import { Workflow } from "@/components/WorkflowManager";
import { AVAILABLE_MODELS, getModelString } from "@/lib/image-router";
import { VoiceRecordingPopupHandle } from "@/components/VoiceRecordingPopup";

/**
 * Flat state interface for ImageWizard
 * All state variables are at the top level for easy access
 */
export interface ImageWizardState {
  // Image State
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  availableImages: ImageFile[];
  setAvailableImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  generatedImage: string | null;
  setGeneratedImage: React.Dispatch<React.SetStateAction<string | null>>;

  // Generation State
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isAgentMode: boolean;
  setIsAgentMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSplitMode: boolean;
  setIsSplitMode: React.Dispatch<React.SetStateAction<boolean>>;
  isOptimizingPrompt: boolean;
  setIsOptimizingPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;

  // UI State
  dragIn: boolean;
  setDragIn: React.Dispatch<React.SetStateAction<boolean>>;
  loadingImages: boolean;
  setLoadingImages: React.Dispatch<React.SetStateAction<boolean>>;
  isPublishing: boolean;
  setIsPublishing: React.Dispatch<React.SetStateAction<boolean>>;
  dropZoneRef: React.RefObject<HTMLDivElement>;
  dragLeaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

  // Form State
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  postTitle: string;
  setPostTitle: React.Dispatch<React.SetStateAction<string>>;
  postDescription: string;
  setPostDescription: React.Dispatch<React.SetStateAction<string>>;
  editingPostId: string | undefined;
  setEditingPostId: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  aspectRatio: string;
  setAspectRatio: React.Dispatch<React.SetStateAction<string>>;
  resolution: string;
  setResolution: React.Dispatch<React.SetStateAction<string>>;
  searchGrounding: boolean;
  setSearchGrounding: React.Dispatch<React.SetStateAction<boolean>>;
  imageSearch: boolean;
  setImageSearch: React.Dispatch<React.SetStateAction<boolean>>;

  // Dialog State
  showDeleteConfirmDialog: boolean;
  setShowDeleteConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
  imageToDelete: string | null;
  setImageToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  showSaveTemplateDialog: boolean;
  setShowSaveTemplateDialog: React.Dispatch<React.SetStateAction<boolean>>;
  newTemplateName: string;
  setNewTemplateName: React.Dispatch<React.SetStateAction<string>>;
  showTemplateManager: boolean;
  setShowTemplateManager: React.Dispatch<React.SetStateAction<boolean>>;
  showEditActionsDialog: boolean;
  setShowEditActionsDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showLightboxPublishDialog: boolean;
  setShowLightboxPublishDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showVoicePopup: boolean;
  setShowVoicePopup: React.Dispatch<React.SetStateAction<boolean>>;

  // Lightbox State
  lightboxOpen: boolean;
  setLightboxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  lightboxPrompt: string;
  setLightboxPrompt: React.Dispatch<React.SetStateAction<string>>;
  selectedOriginalImageId: string | null;
  setSelectedOriginalImageId: React.Dispatch<React.SetStateAction<string | null>>;

  // Settings State
  promptTemplates: Array<{ name: string; template: string }>;
  setPromptTemplates: React.Dispatch<React.SetStateAction<Array<{ name: string; template: string }>>>;
  loadingTemplates: boolean;
  setLoadingTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  promptPresets: PromptPreset[];
  setPromptPresets: React.Dispatch<React.SetStateAction<PromptPreset[]>>;
  selectedPreset: PromptPreset | null;
  setSelectedPreset: React.Dispatch<React.SetStateAction<PromptPreset | null>>;
  loadingPresets: boolean;
  setLoadingPresets: React.Dispatch<React.SetStateAction<boolean>>;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  loadingWorkflows: boolean;
  setLoadingWorkflows: React.Dispatch<React.SetStateAction<boolean>>;
  quickActions: QuickAction[];
  setQuickActions: React.Dispatch<React.SetStateAction<QuickAction[]>>;
  editingActions: QuickAction[];
  setEditingActions: React.Dispatch<React.SetStateAction<QuickAction[]>>;
  loadingActions: boolean;
  setLoadingActions: React.Dispatch<React.SetStateAction<boolean>>;
  promptHistory: string[];
  setPromptHistory: React.Dispatch<React.SetStateAction<string[]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;

  // Voice State
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  isTranscribing: boolean;
  setIsTranscribing: React.Dispatch<React.SetStateAction<boolean>>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  voicePopupRef: React.RefObject<VoiceRecordingPopupHandle>;
}

/**
 * Central state management hook for ImageWizard
 * Returns all state directly in a flat structure for easy destructuring
 */
export const useImageWizardState = (
  initialImages: ImageFile[] = [],
  initialPostTitle: string = "",
  initialPostDescription: string = "",
  initialEditingPostId: string | undefined = undefined
): ImageWizardState => {
  // Image State
  const [images, setImages] = useState<ImageFile[]>(initialImages);
  const [availableImages, setAvailableImages] = useState<ImageFile[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // UI State
  const [dragIn, setDragIn] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [prompt, setPrompt] = useState("");
  const [postTitle, setPostTitle] = useState(initialPostTitle);
  const [postDescription, setPostDescription] = useState(initialPostDescription);
  const [editingPostId, setEditingPostId] = useState(initialEditingPostId);
  const [selectedModel, setSelectedModel] = useState<string>(
    getModelString(AVAILABLE_MODELS[0].provider, AVAILABLE_MODELS[0].modelName)
  );
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [resolution, setResolution] = useState<string>("1K");
  const [searchGrounding, setSearchGrounding] = useState<boolean>(false);
  const [imageSearch, setImageSearch] = useState<boolean>(false);

  // Dialog State
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showEditActionsDialog, setShowEditActionsDialog] = useState(false);
  const [showLightboxPublishDialog, setShowLightboxPublishDialog] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxPrompt, setLightboxPrompt] = useState("");
  const [selectedOriginalImageId, setSelectedOriginalImageId] = useState<string | null>(null);

  // Settings State
  const [promptTemplates, setPromptTemplates] = useState<Array<{ name: string; template: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [promptPresets, setPromptPresets] = useState<PromptPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PromptPreset | null>(null);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const [editingActions, setEditingActions] = useState<QuickAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voicePopupRef = useRef<VoiceRecordingPopupHandle>(null);

  // Return flat structure - all state at top level
  return {
    // Image State
    images,
    setImages,
    availableImages,
    setAvailableImages,
    generatedImage,
    setGeneratedImage,

    // Generation State
    isGenerating,
    setIsGenerating,
    isAgentMode,
    setIsAgentMode,
    isSplitMode,
    setIsSplitMode,
    isOptimizingPrompt,
    setIsOptimizingPrompt,
    abortControllerRef,

    // UI State
    dragIn,
    setDragIn,
    loadingImages,
    setLoadingImages,
    isPublishing,
    setIsPublishing,
    dropZoneRef,
    dragLeaveTimeoutRef,

    // Form State
    prompt,
    setPrompt,
    postTitle,
    setPostTitle,
    postDescription,
    setPostDescription,
    editingPostId,
    setEditingPostId,
    selectedModel,
    setSelectedModel,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    searchGrounding,
    setSearchGrounding,
    imageSearch,
    setImageSearch,

    // Dialog State
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    imageToDelete,
    setImageToDelete,
    showSaveTemplateDialog,
    setShowSaveTemplateDialog,
    newTemplateName,
    setNewTemplateName,
    showTemplateManager,
    setShowTemplateManager,
    showEditActionsDialog,
    setShowEditActionsDialog,
    showLightboxPublishDialog,
    setShowLightboxPublishDialog,
    showVoicePopup,
    setShowVoicePopup,

    // Lightbox State
    lightboxOpen,
    setLightboxOpen,
    currentImageIndex,
    setCurrentImageIndex,
    lightboxPrompt,
    setLightboxPrompt,
    selectedOriginalImageId,
    setSelectedOriginalImageId,

    // Settings State
    promptTemplates,
    setPromptTemplates,
    loadingTemplates,
    setLoadingTemplates,
    promptPresets,
    setPromptPresets,
    selectedPreset,
    setSelectedPreset,
    loadingPresets,
    setLoadingPresets,
    workflows,
    setWorkflows,
    loadingWorkflows,
    setLoadingWorkflows,
    quickActions,
    setQuickActions,
    editingActions,
    setEditingActions,
    loadingActions,
    setLoadingActions,
    promptHistory,
    setPromptHistory,
    historyIndex,
    setHistoryIndex,

    // Voice State
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    voicePopupRef,
  };
};
