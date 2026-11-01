import React, { useEffect, useMemo } from "react";
import { fetchPostById } from '@/modules/posts/client-posts';
import { Button } from "@/components/ui/button";
import { useWizardContext } from "@/hooks/useWizardContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Wand2,
  Save,
  ArrowLeft,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { createImage, editImage } from "@/lib/image-router";
import PublishDialog from "@/components/PublishDialog";

import { runTools } from "@/lib/openai";
import { T, translate } from "@/i18n";
import { DEFAULT_QUICK_ACTIONS, QuickAction as QuickActionType } from "@/constants";
import { PromptPreset } from "@/components/PresetManager";
import VoiceRecordingPopup from "@/components/VoiceRecordingPopup";
import { Workflow } from "@/components/WorkflowManager";
import { useLog } from "@/contexts/LogContext";
import LogViewer from "@/components/LogViewer";
import ImageLightbox from "@/components/ImageLightbox";
import { uploadInternalVideo } from '@/utils/uploadUtils';
import { ImageEditor } from "@/components/ImageEditor";
import EditImageModal from "@/components/EditImageModal";
import PostPicker from "@/modules/posts/components/PostPicker";

// Import types and handlers
import { ImageFile, ImageWizardProps } from "./ImageWizard/types";
import { getUserApiKeys as getUserSecrets } from "@/modules/user/client-user";
type QuickAction = QuickActionType; // Re-export for compatibility
import {
  handleFileUpload,
  toggleImageSelection as toggleImageSelectionUtil,
  removeImageRequest,
  confirmDeleteImage as confirmDeleteImageUtil,
  setAsSelected as setAsSelectedUtil,
  handleDownloadImage,
} from "./ImageWizard/handlers/imageHandlers";
import {
  handleOptimizePrompt as handleOptimizePromptUtil,
  buildFullPrompt,
  abortGeneration,
} from "./ImageWizard/handlers/generationHandlers";
import {
  publishImage as publishImageUtil,
  quickPublishAsNew as quickPublishAsNewUtil,
  publishToGallery as publishToGalleryUtil,
  saveWizardImageAsVfsFile as saveWizardImageAsVfsFileUtil,
} from "./ImageWizard/handlers/publishHandlers";
import {
  loadFamilyVersions as loadFamilyVersionsUtil,
  loadAvailableImages as loadAvailableImagesUtil,
} from "./ImageWizard/handlers/dataHandlers";
// Settings handlers are now used via useUserSettings hook
import {
  handleMicrophone as handleMicrophoneUtil,
  handleVoiceToImage as handleVoiceToImageUtil,
} from "./ImageWizard/handlers/voiceHandlers";
import {
  handleAgentGeneration as handleAgentGenerationUtil,
} from "./ImageWizard/handlers/agentHandlers";
import {
  generateImageSplit as generateImageSplitUtil,
} from "./ImageWizard/handlers/promptHandlers";
import {
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} from "./ImageWizard/handlers/dropHandlers";
import {
  WizardSidebar,
  Prompt,
  ImageGalleryPanel,
} from "./ImageWizard/components";
import { PostComposer } from "@/modules/posts/components/PostComposer";
import { createLogger } from "./ImageWizard/utils/logger";
import { useImageWizardState } from "./ImageWizard/hooks/useImageWizardState";
import * as wizardDb from "./ImageWizard/db";
import {
  loadPromptTemplates,
  savePromptTemplates,
  loadPromptPresets,
  loadWorkflows,
  loadQuickActions,
  saveQuickActions,
  loadPromptHistory,
  addToPromptHistory,
  navigatePromptHistory,
  savePromptPreset,
  updatePromptPreset,
  deletePromptPreset,
  saveWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "./ImageWizard/handlers/settingsHandlers";
import { WizardProvider } from "./ImageWizard/context/WizardContext";

const ImageWizard: React.FC<ImageWizardProps> = ({
  isOpen,
  onClose,
  initialImages = [],
  onPublish,
  originalImageId,
  mode = 'default',
  initialPostTitle = "",
  initialPostDescription = "",
  initialPostSettings,
  editingPostId = undefined
}) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { addLog, isLoggerVisible, setLoggerVisible } = useLog();

  // Create logger instance for this component
  const logger = createLogger(addLog, 'ImageWizard');

  // Centralized state management - flat destructuring
  const {
    // Image state
    images, setImages, availableImages, setAvailableImages, generatedImage, setGeneratedImage,
    // Generation state
    isGenerating, setIsGenerating, isAgentMode, setIsAgentMode, isSplitMode, setIsSplitMode,
    isOptimizingPrompt, setIsOptimizingPrompt, abortControllerRef,
    // UI state
    dragIn, setDragIn, loadingImages, setLoadingImages, isPublishing, setIsPublishing,
    dropZoneRef, dragLeaveTimeoutRef,
    // Form state
    prompt, setPrompt, postTitle, setPostTitle, postDescription, setPostDescription,
    selectedModel, setSelectedModel,
    // New state for Gemini 3 Pro
    aspectRatio, setAspectRatio,
    resolution, setResolution,
    searchGrounding, setSearchGrounding,
    imageSearch, setImageSearch,
    // Dialog state
    showDeleteConfirmDialog, setShowDeleteConfirmDialog, imageToDelete, setImageToDelete,
    showSaveTemplateDialog, setShowSaveTemplateDialog, newTemplateName, setNewTemplateName,
    showTemplateManager, setShowTemplateManager, showEditActionsDialog, setShowEditActionsDialog,
    showLightboxPublishDialog, setShowLightboxPublishDialog, showVoicePopup, setShowVoicePopup,
    // Lightbox state
    lightboxOpen, setLightboxOpen, currentImageIndex, setCurrentImageIndex,
    lightboxPrompt, setLightboxPrompt, selectedOriginalImageId, setSelectedOriginalImageId,
    // Settings state
    promptTemplates, setPromptTemplates, loadingTemplates, setLoadingTemplates,
    promptPresets, setPromptPresets, selectedPreset, setSelectedPreset,
    loadingPresets, setLoadingPresets, workflows, setWorkflows,
    loadingWorkflows, setLoadingWorkflows, quickActions, setQuickActions,
    editingActions, setEditingActions, loadingActions, setLoadingActions,
    promptHistory, setPromptHistory, historyIndex, setHistoryIndex,
    // Voice state
    isRecording, setIsRecording, isTranscribing, setIsTranscribing,
    mediaRecorderRef, audioChunksRef, voicePopupRef,
    // Add editingPostId to destructuring
    editingPostId: currentEditingPostId,
  } = useImageWizardState(initialImages, initialPostTitle, initialPostDescription, editingPostId);

  const [settings, setSettings] = React.useState<any>(initialPostSettings || { visibility: 'public' }); // Post settings
  const [lastError, setLastError] = React.useState<string | null>(null);

  // Auto-retry state for 503 "high demand" errors
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = React.useRef(0);
  const isRetryCallRef = React.useRef(false);
  const [retryInfo, setRetryInfo] = React.useState<{ attempt: number; secondsLeft: number } | null>(null);

  const cancelRetry = React.useCallback(() => {
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    if (retryCountdownRef.current) { clearInterval(retryCountdownRef.current); retryCountdownRef.current = null; }
    retryCountRef.current = 0;
    isRetryCallRef.current = false;
    setRetryInfo(null);
  }, []);

  const scheduleRetry = React.useCallback((retryFn: () => void, errorMsg: string) => {
    const MAX_RETRIES = 5;
    const RETRY_SECS = 120;
    if (retryCountRef.current >= MAX_RETRIES) {
      retryCountRef.current = 0;
      setLastError(`${errorMsg} — gave up after ${MAX_RETRIES} attempts`);
      return;
    }
    retryCountRef.current++;
    const attempt = retryCountRef.current;
    let seconds = RETRY_SECS;
    setRetryInfo({ attempt, secondsLeft: seconds });
    retryCountdownRef.current = setInterval(() => {
      seconds--;
      if (seconds > 0) { setRetryInfo({ attempt, secondsLeft: seconds }); }
      else if (retryCountdownRef.current) { clearInterval(retryCountdownRef.current); retryCountdownRef.current = null; }
    }, 1000);
    retryTimerRef.current = setTimeout(() => {
      if (retryCountdownRef.current) { clearInterval(retryCountdownRef.current); retryCountdownRef.current = null; }
      retryTimerRef.current = null;
      setRetryInfo(null);
      setLastError(null);
      isRetryCallRef.current = true;
      retryFn();
    }, RETRY_SECS * 1000);
  }, []);

  // Cleanup retry on unmount
  React.useEffect(() => () => cancelRetry(), [cancelRetry]);

  // Editor and Settings state
  const [editingImage, setEditingImage] = React.useState<{ url: string; id: string } | null>(null);
  const [configuringImageId, setConfiguringImageId] = React.useState<{ id: string; title: string; description: string; visible: boolean } | null>(null);
  const [showPostPicker, setShowPostPicker] = React.useState(false);
  // const [isPublishing, setIsPublishing] = React.useState(false); // Using hook state or other defined state
  useEffect(() => {
    if (user?.id) {
      loadPromptTemplates(user.id, setPromptTemplates, setLoadingTemplates);
      loadPromptPresets(user.id, setPromptPresets, setLoadingPresets);
      loadWorkflows(user.id, setWorkflows, setLoadingWorkflows);
      loadQuickActions(user.id, setQuickActions, setLoadingActions, DEFAULT_QUICK_ACTIONS);
      loadPromptHistory(user.id, setPromptHistory);

      // Load saved model selection from user_secrets
      wizardDb.loadWizardModel(user.id).then(model => {
        if (model) setSelectedModel(model);
      });
    }
  }, [user?.id]);

  // Persist model selection when changed
  const modelSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    // Debounce to avoid saving on initial load
    if (modelSaveTimeoutRef.current) clearTimeout(modelSaveTimeoutRef.current);
    modelSaveTimeoutRef.current = setTimeout(() => {
      wizardDb.saveWizardModel(user.id, selectedModel);
    }, 500);
    return () => { if (modelSaveTimeoutRef.current) clearTimeout(modelSaveTimeoutRef.current); };
  }, [selectedModel, user?.id]);

  // Auto-upload effect for videos that come from share target (or other sources) without upload status
  React.useEffect(() => {
    // Find videos that have a file but no upload status (meaning they were just added via prop/state)
    const pendingVideos = images.filter(img =>
      img.type === 'video' &&
      img.file &&
      !img.uploadStatus
    );

    if (pendingVideos.length > 0) {
      console.log('Found pending videos for upload:', pendingVideos.length);

      pendingVideos.forEach(async (video) => {
        if (!video.file || !user?.id) return;

        // Mark as uploading immediately
        setImages(prev => prev.map(img =>
          img.id === video.id ? { ...img, uploadStatus: 'uploading', uploadProgress: 0 } : img
        ));

        try {
          // Perform upload
          await uploadInternalVideo(video.file, user.id, (progress) => {
            setImages(prev => prev.map(img =>
              img.id === video.id ? { ...img, uploadProgress: progress } : img
            ));
          }).then(data => {
            setImages(prev => prev.map(img =>
              img.id === video.id ? {
                ...img,
                id: data.dbId || video.id, // Update ID to DB ID
                realDatabaseId: data.dbId,
                uploadStatus: 'ready',
                src: data.thumbnailUrl || video.src || '',
              } : img
            ));
            toast.success(translate('Video uploaded successfully'));
          });
        } catch (err) {
          console.error("Auto-upload video failed", err);
          setImages(prev => prev.map(img =>
            img.id === video.id ? { ...img, uploadStatus: 'error' } : img
          ));
          toast.error(translate('Failed to upload video'));
        }
      });
    }
  }, [images, user?.id, setImages]);

  // Drop zone handlers are used directly from imported functions

  // Load initial image from Zustand store (replaces sessionStorage)
  const { wizardInitialImage } = useWizardContext();

  useEffect(() => {
    if (wizardInitialImage) {
      setImages(prev => {
        // Load family versions for this image first, then add the initial image
        if (wizardInitialImage.realDatabaseId) {
          // Check the current selection status from database for this image
          wizardDb.getImageSelectionStatus(wizardInitialImage.realDatabaseId)
            .then((isSelected) => {
              const updatedImageData = { ...wizardInitialImage, selected: isSelected };
              setImages(currentImages => {
                // Check if image already exists to avoid duplicates
                const exists = currentImages.find(img => img.id === updatedImageData.id);
                if (exists) return currentImages;
                return [...currentImages, updatedImageData];
              });
            });
          loadFamilyVersions([wizardInitialImage]);
        } else {
          // For non-database images, just add as is
          const exists = prev.find(img => img.id === wizardInitialImage.id);
          if (!exists) {
            return [...prev, wizardInitialImage];
          }
        }
        return prev;
      });

      // Clear wizard image after loading (optional - keep it if you want to persist)
      // clearWizardImage();
    }
  }, [wizardInitialImage]);

  // Load complete family versions when initial images are provided
  useEffect(() => {
    if (initialImages.length > 0) {
      loadFamilyVersions(initialImages);
    }
  }, [initialImages]);

  // Load available images from user and others
  useEffect(() => {
    loadAvailableImages();
  }, []);

  // Settings are now loaded in useUserSettings hook

  // Use extracted handlers with local state
  const loadFamilyVersions = (parentImages: ImageFile[]) =>
    loadFamilyVersionsUtil(parentImages, setImages, logger);

  const loadAvailableImages = () =>
    loadAvailableImagesUtil(setAvailableImages, setLoadingImages);

  // Template operations
  const applyTemplate = (template: string) => {
    if (lightboxOpen) {
      setLightboxPrompt(template);
    } else {
      setPrompt(template);
    }
  };

  const deleteTemplate = async (index: number) => {
    if (!user?.id) {
      toast.error(translate('User not authenticated'));
      return;
    }
    const newTemplates = promptTemplates.filter((_, i) => i !== index);
    await savePromptTemplates(user.id, newTemplates);
    setPromptTemplates(newTemplates);
  };

  const executeWorkflow = async (workflow: Workflow) => {
    if (!user) {
      toast.error(translate('User not authenticated'));
      return;
    }
    toast.info(`🔄 Executing workflow: ${workflow.name}`);
    logger.info(`Starting workflow: ${workflow.name} (${workflow.actions.length} actions)`);
    try {
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        toast.info(`⚙️ Step ${i + 1}/${workflow.actions.length}: ${action.label}`);
        logger.info(`Workflow step ${i + 1}: ${action.label} (${action.type})`);

        switch (action.type) {
          case 'optimize_prompt':
            await handleOptimizePrompt();
            break;

          case 'generate_image':
            await generateImage();
            break;

          case 'generate_metadata':
            // Generate title and description using AI
            if (prompt.trim()) {
              const apiKey = await wizardDb.getUserOpenAIKey(user.id);

              const result = await runTools({
                prompt: `Generate a title and description for this image prompt: "${prompt}"`,
                preset: 'metadata-only',
                apiKey,
              });

              const metadataToolCall = result.toolCalls?.find(
                tc => 'function' in tc && tc.function?.name === 'generate_image_metadata'
              );

              if (metadataToolCall && 'function' in metadataToolCall) {
                const metadata = JSON.parse(metadataToolCall.function.arguments || '{}');
                if (metadata.title) setPostTitle(metadata.title);
                if (metadata.description) setPostDescription(metadata.description);
              }
            }
            break;

          case 'quick_publish':
            await quickPublishAsNew();
            break;

          /* Removed publish_to_gallery from workflow actions as it's not supported in type */

          case 'download_image':
            if (images.length > 0) {
              const lastImage = images[images.length - 1];
              await handleDownloadImage(lastImage);
            }
            break;

          case 'enhance_image':
            if (images.filter(img => img.selected).length > 0) {
              setPrompt('Enhance and improve this image with better quality and details');
              await generateImage();
            }
            break;

          case 'apply_style':
            if (images.filter(img => img.selected).length > 0) {
              setPrompt('Apply artistic style transformation to this image');
              await generateImage();
            }
            break;
        }

        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success(`✅ Workflow "${workflow.name}" completed successfully!`);
      logger.success(`Workflow "${workflow.name}" completed successfully`);
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      logger.error(`Workflow "${workflow.name}" failed: ${error.message}`);
      toast.error(`Workflow failed: ${error.message}`);
    }
  };


  const handleSaveCurrentPromptAsTemplate = () => {
    const currentPrompt = lightboxOpen ? lightboxPrompt : prompt;
    if (!currentPrompt.trim()) {
      toast.error(translate('Please enter a prompt first'));
      return;
    }
    setShowSaveTemplateDialog(true);
  };

  const confirmSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error(translate('Please enter a template name'));
      return;
    }

    if (!user?.id) {
      toast.error(translate('User not authenticated'));
      return;
    }

    const currentPrompt = lightboxOpen ? lightboxPrompt : prompt;
    const newTemplates = [...promptTemplates, { name: newTemplateName.trim(), template: currentPrompt }];
    await savePromptTemplates(user.id, newTemplates);
    setPromptTemplates(newTemplates);
    setNewTemplateName("");
    setShowSaveTemplateDialog(false);
  };

  const toggleImageSelection = (imageId: string, isMultiSelect = false, fromGallery = false) =>
    toggleImageSelectionUtil(imageId, isMultiSelect, fromGallery, availableImages, images, setImages);

  const removeImage = (imageId: string) =>
    removeImageRequest(imageId, setImageToDelete, setShowDeleteConfirmDialog);

  const confirmDeleteImage = () =>
    confirmDeleteImageUtil(imageToDelete, setImages, setImageToDelete, setShowDeleteConfirmDialog, initialImages, loadFamilyVersions);

  const deleteSelectedImages = () => {
    const selectedImages = images.filter(img => img.selected);
    if (selectedImages.length === 0) {
      toast.error(translate('No images selected'));
      return;
    }

    // Show confirmation for bulk delete
    const count = selectedImages.length;
    setShowDeleteConfirmDialog(true);
    setImageToDelete(`bulk:${count}`); // Special marker for bulk delete
  };

  const confirmBulkDelete = () => {
    const selectedImages = images.filter(img => img.selected);
    const selectedIds = selectedImages.map(img => img.id);

    // Remove all selected images
    setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));

    toast.success(translate(`${selectedImages.length} image(s) deleted`));
    logger.info(`Deleted ${selectedImages.length} selected images`);

    setShowDeleteConfirmDialog(false);
    setImageToDelete(null);
  };

  const setAsSelected = (imageId: string) =>
    setAsSelectedUtil(imageId, images, setImages, initialImages, loadFamilyVersions);

  const handleMicrophone = () =>
    handleMicrophoneUtil(
      isRecording,
      mediaRecorderRef,
      setIsRecording,
      setIsTranscribing,
      audioChunksRef,
      lightboxOpen,
      setLightboxPrompt,
      setPrompt
    );

  const handleOptimizePrompt = () =>
    handleOptimizePromptUtil(
      lightboxOpen ? lightboxPrompt : prompt,
      lightboxOpen,
      setLightboxPrompt,
      setPrompt,
      setIsOptimizingPrompt
    );

  const handleVoiceTranscription = (transcribedText: string) => {
    setPrompt(transcribedText);
    toast.success(translate('Voice transcribed successfully!'));
  };

  const handlePresetSelect = (preset: PromptPreset) => {
    setSelectedPreset(preset);
    toast.success(`Preset "${preset.name}" activated as context`);
  };

  const handlePresetClear = () => {
    setSelectedPreset(null);
    toast.info(translate('Preset context cleared'));
  };

  const handleVoiceToImage = (transcribedText: string) =>
    handleVoiceToImageUtil(
      transcribedText,
      user?.id,
      selectedPreset,
      selectedModel,
      setPrompt,
      setImages,
      setPostTitle,
      setPostDescription,
      voicePopupRef,
      logger
    );

  const handleAgentGeneration = () =>
    handleAgentGenerationUtil(
      prompt,
      user?.id,
      buildFullPrompt(selectedPreset, prompt),
      selectedModel,
      setIsAgentMode,
      setIsGenerating,
      setImages,
      setPostTitle,
      setPostDescription,
      logger
    );


  const handlePublishToGallery = async () => {
    await publishToGalleryUtil({
      user: user,
      generatedImage: typeof generatedImage === 'string' ? generatedImage : (generatedImage as any)?.src || null,
      images: images,
      lightboxOpen: lightboxOpen,
      currentImageIndex: currentImageIndex,
      postTitle: '',
      postDescription: '',
      prompt: prompt,
      isOrgContext: false,
      orgSlug: null,
      onPublish: (url) => {
        // No navigation needed for gallery publish, maybe just stay or go specific place?
        // For now stay in wizard or close? Implementation plan said "Verify success message" so staying might be fine, but closing is better UX usually.
        // Let's close.
        onClose();
        navigate('/'); // Or to gallery view if possible
      }
    }, setIsPublishing);
  };

  const handleAppendToPost = () => {
    setShowPostPicker(true);
  };

  const handlePostSelected = async (postId: string) => {
    setShowPostPicker(false);

    // Switch to edit mode for this post
    // This logic mimics CreationWizardPopup's handlePostSelected
    try {
      const toastId = toast.loading(translate('Loading post...'));

      // Fetch full post via API (returns FeedPost with pictures)
      const post = await fetchPostById(postId);

      if (!post) throw new Error('Post not found');

      // Transform existing pictures
      const existingImages = (post.pictures || [])
        .sort((a: any, b: any) => ((a.position || 0) - (b.position || 0)))
        .map((p: any) => ({
          id: p.id,
          path: p.id,
          src: p.image_url,
          title: p.title,
          description: p.description || '',
          selected: false,
          realDatabaseId: p.id,
          type: p.type || 'image',
          isGenerated: false
        }));

      // Merge current wizard images as new
      const newImages = images.map(img => ({
        ...img,
        selected: true
      }));

      const combinedImages = [...existingImages, ...newImages];

      setImages(combinedImages);
      setPostTitle(post.title);
      setPostDescription(post.description || '');

      navigate('/wizard', {
        state: {
          mode: 'post',
          editingPostId: postId,
          initialImages: combinedImages,
          postTitle: post.title,
          postDescription: post.description,
          postSettings: post.settings
        },
        replace: true
      });

      toast.dismiss(toastId);
      toast.success(translate('Switched to post editing mode'));

    } catch (err) {
      console.error("Error loading post for append:", err);
      toast.error(translate('Failed to load post'));
    }
  };



  const executeQuickAction = (action: QuickAction) => {
    const selectedImages = images.filter(img => img.selected);
    if (selectedImages.length === 0) {
      toast.error(translate('Please select at least one image for this action'));
      return;
    }
    setPrompt(action.prompt);
  };

  const openEditActionsDialog = () => {
    setEditingActions([...quickActions]);
    setShowEditActionsDialog(true);
  };

  const addQuickAction = () => {
    const newAction: QuickAction = {
      id: `action_${Date.now()}`,
      name: 'New Action',
      prompt: '',
      icon: '⭐'
    };
    setEditingActions([...editingActions, newAction]);
  };

  const updateQuickAction = (id: string, field: keyof QuickAction, value: string) => {
    setEditingActions(editingActions.map(action =>
      action.id === id ? { ...action, [field]: value } : action
    ));
  };

  const deleteQuickAction = (id: string) => {
    setEditingActions(editingActions.filter(action => action.id !== id));
  };

  const saveEditedActions = async () => {
    // Validate
    const invalid = editingActions.find(a => !a.name.trim() || !a.prompt.trim());
    if (invalid) {
      toast.error(translate('All actions must have a name and prompt'));
      return;
    }

    if (!user?.id) {
      toast.error(translate('User not authenticated'));
      return;
    }

    await saveQuickActions(user.id, editingActions);
    setQuickActions(editingActions);
    setShowEditActionsDialog(false);
  };

  const handleLightboxPromptSubmit = async (promptText: string) => {
    if (!lightboxOpen || currentImageIndex >= images.length) return;

    // Set the prompt and get the current lightbox image for editing
    setPrompt(promptText);

    const targetImage = images[currentImageIndex];
    if (targetImage) {

      // Store current lightbox state
      const wasLightboxOpen = lightboxOpen;

      // Directly pass the target image to avoid state timing issues
      await generateImageWithSpecificImage(promptText, targetImage);
      setLightboxPrompt(""); // Clear the lightbox prompt

      // Keep lightbox open if it was open during generation
      if (wasLightboxOpen && !lightboxOpen) {
        setLightboxOpen(true);
      }
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);

    // Set the parent ID for version creation when opening lightbox
    const currentImage = images[index];
    let parentId = null;

    if (currentImage) {
      // If this image has a parentForNewVersions (from version map), use that
      if (currentImage.parentForNewVersions) {
        parentId = currentImage.parentForNewVersions;
      }
      // If this is the initial image from a database post, use its real ID
      else if (currentImage.realDatabaseId) {
        parentId = currentImage.realDatabaseId;
      }
      // If this is a saved image (has UUID), use it as parent
      else if (currentImage.id && currentImage.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        parentId = currentImage.id;
      }
      // Otherwise, find the first non-generated image in the array
      else {
        const originalImage = images.find(img => !img.isGenerated && img.id && img.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
        parentId = originalImage?.id || null;
      }
    }

    setSelectedOriginalImageId(parentId);

    // Pre-populate lightbox prompt with main prompt for quick publish context
    // Only if lightbox prompt is empty to avoid overwriting user's edits
    if (!lightboxPrompt.trim() && prompt.trim()) {
      setLightboxPrompt(prompt);
    }
  };

  // Auto-update lightbox when images change
  useEffect(() => {
    if (lightboxOpen && currentImageIndex >= images.length && images.length > 0) {
      // If current index is out of bounds, go to the last image (newest)
      const newIndex = images.length - 1;
      setCurrentImageIndex(newIndex);
    }
  }, [images.length, lightboxOpen, currentImageIndex]);

  const generateImageWithSpecificImage = async (promptText: string, targetImage: ImageFile) => {
    if (!isRetryCallRef.current) { cancelRetry(); }
    isRetryCallRef.current = false;
    setIsGenerating(true);
    setLastError(null);
    try {

      let result: { imageData: ArrayBuffer; text?: string } | null = null;

      // Resolve correct API key for the selected provider
      let apiKey: string | undefined = undefined;
      if (user?.id) {
        const secrets = await getUserSecrets(user.id);
        if (secrets) {
          const provider = selectedModel.split('/')[0]?.toLowerCase();
          switch (provider) {
            case 'aimlapi': apiKey = secrets.aimlapi_api_key; break;
            case 'replicate': apiKey = secrets.replicate_api_key; break;
            case 'bria': apiKey = secrets.bria_api_key; break;
            default: apiKey = secrets.google_api_key; break;
          }
        }
      }

      // Edit the specific target image
      if (targetImage.file) {
        result = await editImage(
          promptText,
          [targetImage.file],
          selectedModel,
          apiKey,
          aspectRatio,
          resolution,
          searchGrounding,
          imageSearch
        );
      } else {
        // Convert any image source (data URL or HTTP URL) to File for editing
        try {
          const response = await fetch(targetImage.src);
          const blob = await response.blob();
          const file = new File([blob], targetImage.title || 'image.png', {
            type: blob.type || 'image/png'
          });
          result = await editImage(
            promptText,
            [file],
            selectedModel,
            apiKey,
            aspectRatio,
            resolution,
            searchGrounding,
            imageSearch
          );
        } catch (error) {
          console.error('Error converting image:', error);
          toast.error(translate('Failed to convert image for editing'));
          return;
        }
      }

      if (result) {
        // Convert ArrayBuffer to base64 data URL  
        const uint8Array = new Uint8Array(result.imageData);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;

          // Add generated image to the images list and auto-select it
          const newImage: ImageFile = {
            id: `generated-${Date.now()}`,
            src: dataUrl,
            title: promptText.substring(0, 50) + (promptText.length > 50 ? '...' : ''),
            selected: true,
            isGenerated: true,
            aiText: result.text, // Store AI description
            parentForNewVersions: targetImage.parentForNewVersions || targetImage.realDatabaseId || (targetImage.id && /^[0-9a-f]{8}-/.test(targetImage.id) ? targetImage.id : undefined)
          };
          const newIndex = images.length; // Calculate the new index BEFORE updating state

          // Deselect all other images and add the new one as selected
          setImages(prev => {
            const updated = [...prev.map(img => ({ ...img, selected: false })), newImage];

            // If lightbox is open, update to show the new image immediately after state update
            if (lightboxOpen) {
              // Use setTimeout to ensure React has processed the state update
              setTimeout(() => {
                setCurrentImageIndex(newIndex);
              }, 50); // Reduced timeout
            }

            return updated;
          });
        };

        reader.readAsDataURL(blob);
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      const errMsg = error?.message || String(error);
      // Extract meaningful message from GoogleGenerativeAI errors
      // Pattern: "[GoogleGenerativeAI Error]: Error fetching from <url>: [503 ] Actual message"
      const httpMatch = errMsg.match(/\[\d{3}\s*\]\s*(.+)/s);
      const userMessage = httpMatch ? httpMatch[1].trim() : errMsg.replace(/\[GoogleGenerativeAI Error\][:\s]*/i, '').trim();
      setLastError(userMessage || 'Failed to generate image');
      // Auto-retry for "high demand" / rate-limit errors
      if (userMessage.toLowerCase().includes('later')) {
        scheduleRetry(() => generateImageWithSpecificImage(promptText, targetImage), userMessage);
      } else {
        toast.error(userMessage || translate('Failed to generate image'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImageSplit = async () => {
    await generateImageSplitUtil(
      prompt,
      images,
      selectedModel,
      abortControllerRef,
      setIsGenerating,
      setImages,
      async (promptText: string) => {
        if (user?.id) {
          await addToPromptHistory(user.id, promptText, setPromptHistory, setHistoryIndex);
        }
      },
      logger
    );
  };

  const generateImage = async () => {
    const fullPrompt = buildFullPrompt(selectedPreset, prompt);

    if (!fullPrompt.trim()) {
      toast.error(translate('Please enter a prompt'));
      return;
    }

    // Add to history before generating
    if (prompt.trim() && user?.id) {
      await addToPromptHistory(user.id, prompt.trim(), setPromptHistory, setHistoryIndex);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Clear retry state only for manual triggers (not auto-retries)
    if (!isRetryCallRef.current) { cancelRetry(); }
    isRetryCallRef.current = false;
    setLastError(null);
    setIsGenerating(true);
    logger.info(`Starting image generation with prompt: "${fullPrompt.substring(0, 50)}..."`);
    // Create placeholder image with loading state
    const placeholderId = `placeholder-${Date.now()}`;
    const placeholderImage: ImageFile = {
      id: placeholderId,
      src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Transparent pixel — spinner overlay provides visual
      title: 'Generating...',
      selected: false,
      isGenerated: false,
    };
    // Remember which images were selected before we deselect for the placeholder
    const previouslySelectedIds = images.filter(img => img.selected).map(img => img.id);
    setImages(prev => [...prev.map(img => ({ ...img, selected: false })), placeholderImage]);

    try {
      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        // Remove placeholder on abort
        setImages(prev => prev.filter(img => img.id !== placeholderId));
        return;
      }

      // Get API Key – resolve the correct key based on the selected model's provider
      let apiKey: string | undefined = undefined;
      if (user?.id) {
        const secrets = await getUserSecrets(user.id);
        if (secrets) {
          const provider = selectedModel.split('/')[0]?.toLowerCase();
          switch (provider) {
            case 'aimlapi': apiKey = secrets.aimlapi_api_key; break;
            case 'replicate': apiKey = secrets.replicate_api_key; break;
            case 'bria': apiKey = secrets.bria_api_key; break;
            default: apiKey = secrets.google_api_key; break;
          }
        }
      }


      const selectedImages = images.filter(img => img.selected);

      let result: { imageData: ArrayBuffer; text?: string } | null = null;

      if (selectedImages.length > 0) {
        // Edit existing images - ensure we have File objects for ALL selected images
        const files = selectedImages
          .map(img => img.file)
          .filter((file): file is File => file !== undefined);

        // Check if ALL selected images have File objects
        if (files.length === selectedImages.length) {
          // All images have files, use them directly
          result = await editImage(
            fullPrompt,
            files,
            selectedModel,
            apiKey,
            aspectRatio,
            resolution,
            searchGrounding,
            imageSearch
          );
        } else {
          // Some images don't have File objects, convert all from src to ensure consistency
          const convertedFiles: File[] = [];
          for (const img of selectedImages) {
            try {
              const response = await fetch(img.src);
              const blob = await response.blob();
              const file = new File([blob], img.title || 'image.png', {
                type: blob.type || 'image/png'
              });
              convertedFiles.push(file);
            } catch (error) {
              console.error('Error converting image:', img.title, error);
            }
          }

          if (convertedFiles.length > 0) {
            result = await editImage(
              fullPrompt,
              convertedFiles,
              selectedModel,
              apiKey,
              aspectRatio,
              resolution,
              searchGrounding,
              imageSearch
            );
          } else {
            toast.error(translate('Failed to convert selected images for editing'));
            return;
          }
        }
      } else {
        // Generate new image
        result = await createImage(
          fullPrompt,
          selectedModel,
          apiKey,
          aspectRatio,
          resolution,
          searchGrounding,
          imageSearch
        );
      }

      if (result) {
        logger.success('Image generated successfully');
        // Convert ArrayBuffer to base64 data URL  
        const uint8Array = new Uint8Array(result.imageData);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;
          setGeneratedImage(dataUrl);

          // Determine parent ID inheritance from selected image (if any)
          let inheritedParentId: string | undefined;
          if (selectedImages.length === 1) {
            // If selected image is a Real DB image, it becomes the parent.
            // If it's a generated image that has a parent pointer, we inherit that (sibling/child logic).
            // However, strictly speaking, if we edit 'A', 'B' is a child of 'A'.
            // But if 'A' is unsaved, we can't link to it. We fall back to 'A's parent if available.
            inheritedParentId = selectedImages[0].realDatabaseId || selectedImages[0].parentForNewVersions;
          }

          // Add generated image to the images list and auto-select it
          const newImage: ImageFile = {
            id: `generated-${Date.now()}`,
            src: dataUrl,
            title: (selectedPreset ? `[${selectedPreset.name}] ` : '') + prompt.substring(0, 40) + (prompt.length > 40 ? '...' : ''),
            selected: true,
            isGenerated: true,
            aiText: result.text, // Store AI description
            parentForNewVersions: inheritedParentId // Propagate parent ID
          };
          logger.debug(`Added new image: ${newImage.title}`);
          const newIndex = images.length; // Calculate the new index BEFORE updating state

          // Replace placeholder with actual image
          setImages(prev => {
            const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
            const updated = [...withoutPlaceholder.map(img => ({ ...img, selected: false })), newImage];

            // If lightbox is open, update to show the new image immediately after state update
            if (lightboxOpen) {
              // Use setTimeout to ensure React has processed the state update
              setTimeout(() => {
                setCurrentImageIndex(newIndex);
              }, 50); // Reduced timeout
            }

            return updated;
          });
        };

        reader.readAsDataURL(blob);
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      const errMsg = error?.message || String(error);
      logger.error(`Failed to generate image: ${errMsg}`);
      // Extract meaningful message from GoogleGenerativeAI errors
      // Pattern: "[GoogleGenerativeAI Error]: Error fetching from <url>: [503 ] Actual message"
      const httpMatch = errMsg.match(/\[\d{3}\s*\]\s*(.+)/s);
      const userMessage = httpMatch ? httpMatch[1].trim() : errMsg.replace(/\[GoogleGenerativeAI Error\][:\s]*/i, '').trim();
      setLastError(userMessage || 'Failed to generate image');
      // Auto-retry for "high demand" / rate-limit errors
      if (userMessage.toLowerCase().includes('later')) {
        scheduleRetry(() => generateImage(), userMessage);
      } else {
        toast.error(userMessage || translate('Failed to generate image'));
      }
      // Remove placeholder on error and restore previous selection
      setImages(prev => prev
        .filter(img => img.id !== placeholderId)
        .map(img => ({ ...img, selected: previouslySelectedIds.includes(img.id) }))
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const publishImage = () =>
    publishImageUtil(
      {
        user,
        generatedImage,
        images,
        lightboxOpen,
        currentImageIndex,
        postTitle,
        prompt,
        isOrgContext: false,
        orgSlug: null,
        onPublish,
      },
      setIsPublishing
    );

  // Quick publish function that uses prompt as description
  const quickPublishAsNew = () =>
    quickPublishAsNewUtil(
      {
        user,
        generatedImage,
        images,
        lightboxOpen,
        currentImageIndex,
        postTitle,
        prompt,
        isOrgContext: false,
        orgSlug: null,
        onPublish,
      },
      setIsPublishing
    );

  const handleSaveAsVfsFile = () =>
    saveWizardImageAsVfsFileUtil(
      {
        user,
        generatedImage,
        images,
        lightboxOpen,
        currentImageIndex,
        postTitle,
        prompt,
        isOrgContext: false,
        orgSlug: null,
        accessToken: session?.access_token,
      },
      setIsPublishing,
    );

  const hasVfsFileContext = useMemo(() => images.some((img) => img.meta?.vfs), [images]);

  const handleAddToPost = async (imageSrc: string, title: string, description?: string) => {
    if (!currentEditingPostId) {
      toast.error("No active post to add to");
      return;
    }

    if (!user) {
      toast.error(translate('User not authenticated'));
      return;
    }

    setIsPublishing(true);
    try {
      // Fetch the image
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      await wizardDb.publishImageToPost({
        userId: user.id,
        blob,
        title: title || prompt, // Fallback to prompt if no title
        description: description,
        postId: currentEditingPostId,
        isOrgContext: false,
        orgSlug: null,
        collectionIds: []
      });
      // Navigate back success
      navigate(`/post/${currentEditingPostId}`);
    } catch (error: any) {
      console.error('Error adding to post:', error);

      // Reset loading state
      if (currentImageIndex !== -1) {
        setImages(prev => {
          const newImgs = [...prev];
          // Only reset if it still exists at that index (simple check)
          if (newImgs[currentImageIndex]) {
            newImgs[currentImageIndex] = { ...newImgs[currentImageIndex], isAddingToPost: false };
          }
          return newImgs;
        });
      }

      if (error.code === '23503') {
        toast.error(translate('Could not add to this post. The post might have been deleted or the link is invalid.'));
      } else {
        toast.error(translate('Failed to add image to post'));
      }
    }
  };

  const handleLightboxPublish = async (option: 'overwrite' | 'new' | 'version' | 'add-to-post', imageUrl: string, title: string, description?: string, parentId?: string, collectionIds?: string[]) => {
    if (!user) {
      toast.error(translate('User not authenticated'));
      return;
    }

    if (currentImageIndex >= images.length) {
      toast.error(translate('No image selected'));
      return;
    }

    const currentImage = images[currentImageIndex];
    if (!currentImage) {
      toast.error(translate('No image available to publish'));
      return;
    }

    // Handle Add to Post
    if (option === 'add-to-post' && currentEditingPostId) {
      await handleAddToPost(currentImage.src, title, description);
      setShowLightboxPublishDialog(false);
      return;
    }

    setIsPublishing(true);
    try {
      // Convert image to blob for upload
      const response = await fetch(currentImage.src);
      const blob = await response.blob();

      if (option === 'overwrite') {
        toast.info(translate('Overwrite not supported in wizard, creating new image instead'));
        option = 'new';
      }

      if (option === 'new') {
        await wizardDb.publishImageAsNew({
          userId: user.id,
          blob,
          title,
          description,
          isOrgContext: false,
          orgSlug: null,
          collectionIds,
        });
      } else if (option === 'version' && parentId) {
        await wizardDb.publishImageAsVersion({
          userId: user.id,
          blob,
          title,
          description,
          parentId,
          isOrgContext: false,
          orgSlug: null,
          collectionIds,
        });
      } else if (option === 'version' && !parentId) {
        toast.info(translate('No parent image found, creating as new post instead'));
        // Recursive call with 'new'
        // FIX: call self but ensure we don't loop if logic is wrong. 
        // Here it changes option to 'new', so it should be fine.
        // We need to re-call handleLightboxPublish logic essentially.
        // For simplicity, just run the new logic here:
        await wizardDb.publishImageAsNew({
          userId: user.id,
          blob,
          title,
          description,
          isOrgContext: false,
          orgSlug: null,
          collectionIds,
        });
      }

      setShowLightboxPublishDialog(false);
      // Only navigate/close if NOT "Add to Post" (which handled navigation)
      // For standard publish, we usually close wizard or call onPublish prop
      onPublish?.(currentImage.src, lightboxPrompt);
    } catch (error) {
      console.error('Error publishing image:', error);
      toast.error(translate('Failed to publish image'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditImage = (index: number) => {
    const img = images[index];
    if (img) {
      setEditingImage({ url: img.src, id: img.realDatabaseId || img.id });
    }
  };

  const handleConfigureImage = (index: number) => {
    const img = images[index];
    if (img && img.realDatabaseId) {
      setConfiguringImageId({
        id: img.realDatabaseId,
        title: img.title,
        description: img.aiText || null,
        visible: true // Default
      });
    } else {
      toast.error(translate("Please save the image first to configure settings"));
    }
  };

  // Prepare context value
  const contextValue = {
    // User
    userId: user?.id,

    // Images
    images,
    setImages,
    availableImages,
    generatedImage,

    // Generation state
    isGenerating,
    isAgentMode,
    isSplitMode,
    setIsSplitMode,
    isOptimizingPrompt,

    // Form state
    prompt,
    setPrompt,
    postTitle,
    setPostTitle,
    selectedModel,
    setSelectedModel,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    searchGrounding,
    setSearchGrounding,

    // Settings
    selectedPreset,
    promptPresets,
    loadingPresets,
    workflows,
    loadingWorkflows,
    promptTemplates,
    quickActions,

    // Prompt history
    promptHistory,
    historyIndex,
    setHistoryIndex,

    // Voice
    isRecording,
    isTranscribing,

    // UI state
    isPublishing,
    dragIn,
    setDragIn,
    loadingImages,
    dragLeaveTimeoutRef,

    // Actions - Image operations
    toggleImageSelection,
    openLightbox,
    setAsSelected,
    removeImage,
    deleteSelectedImages,

    // Actions - Generation
    generateImage,
    generateImageSplit,
    handleAgentGeneration,
    handleOptimizePrompt,
    handleMicrophone,

    // Actions - Settings
    handlePresetSelect,
    handlePresetClear,
    savePreset: async (preset: Omit<PromptPreset, 'id' | 'createdAt'>) => {
      if (user?.id) await savePromptPreset(user.id, preset, setPromptPresets);
    },
    updatePreset: async (id: string, preset: Omit<PromptPreset, 'id' | 'createdAt'>) => {
      if (user?.id) await updatePromptPreset(user.id, id, preset, setPromptPresets);
    },
    deletePreset: async (id: string) => {
      if (user?.id) await deletePromptPreset(user.id, id, setPromptPresets);
    },

    saveWorkflow: async (workflow: Omit<Workflow, 'id' | 'createdAt'>) => {
      if (user?.id) await saveWorkflow(user.id, workflow, setWorkflows);
    },
    updateWorkflow: async (id: string, workflow: Omit<Workflow, 'id' | 'createdAt'>) => {
      if (user?.id) await updateWorkflow(user.id, id, workflow, setWorkflows);
    },
    deleteWorkflow: async (id: string) => {
      if (user?.id) await deleteWorkflow(user.id, id, setWorkflows);
    },
    executeWorkflow,

    applyTemplate,
    deleteTemplate,
    handleSaveCurrentPromptAsTemplate,

    executeQuickAction,
    openEditActionsDialog,

    navigateHistory: (direction: 'up' | 'down') =>
      navigatePromptHistory(direction, promptHistory, historyIndex, setHistoryIndex, setPrompt),

    // Actions - Publishing
    quickPublishAsNew,
    publishImage,

    // Actions - Misc
    setShowVoicePopup,

    // Logger
    logger,

    // Add To Post State
    currentEditingPostId,
    handleAddToPost: (imageSrc: string) => handleAddToPost(imageSrc, postTitle || prompt, postDescription)
  };

  if (!isOpen) return null;

  return (
    <WizardProvider value={contextValue}>
      {/* Editor Overlay */}
      {editingImage && (
        <div className="fixed inset-0 z-[60] bg-background">
          <ImageEditor
            imageUrl={editingImage.url}
            pictureId={editingImage.id}
            onClose={() => setEditingImage(null)}
            onSave={(newUrl) => {
              setImages(prev => prev.map(img =>
                (img.id === editingImage.id || img.realDatabaseId === editingImage.id)
                  ? { ...img, src: newUrl, isGenerated: false }
                  : img
              ));
              setEditingImage(null);
            }}
          />
        </div>
      )}

      {/* Settings Modal */}
      {configuringImageId && (
        <EditImageModal
          open={!!configuringImageId}
          onOpenChange={(open) => !open && setConfiguringImageId(null)}
          pictureId={configuringImageId.id}
          currentTitle={configuringImageId.title}
          currentDescription={configuringImageId.description}
          currentVisible={configuringImageId.visible}
          imageUrl={images.find(i => i.realDatabaseId === configuringImageId.id)?.src}
          onUpdateSuccess={() => {
            setConfiguringImageId(null);
            toast.success(translate("Image settings updated"));
          }}
        />
      )}

      <div className="space-y-4 p-2 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 md:h-9 md:w-9 p-0 touch-manipulation">
              <ArrowLeft className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">
                {mode === 'post' ? <T>Post Wizard</T> : <T>AI Image Wizard</T>}
              </h1>
            </div>
          </div>

          {/* Unified Lightbox Component */}
          <ImageLightbox
            isOpen={lightboxOpen && images.length > 0}
            onClose={() => setLightboxOpen(false)}
            imageUrl={images[currentImageIndex]?.src || ''}
            imageTitle={images[currentImageIndex]?.title || 'Generated Image'}
            originalImageId={selectedOriginalImageId || undefined}
            onPromptSubmit={(promptText) => handleLightboxPromptSubmit(promptText)}
            onPublish={handleLightboxPublish}
            isGenerating={isGenerating}
            isPublishing={isPublishing}
            showPrompt={true}
            showPublish={images[currentImageIndex]?.isGenerated}
            generatedImageUrl={undefined}
            currentIndex={currentImageIndex}
            totalCount={images.length}
            onNavigate={(direction) => {
              const newIndex = direction === 'next' ? currentImageIndex + 1 : currentImageIndex - 1;
              if (newIndex >= 0 && newIndex < images.length) {
                setCurrentImageIndex(newIndex);
              }
            }}
            // Wizard features
            showWizardFeatures={true}
            promptTemplates={promptTemplates}
            onApplyTemplate={(template) => setLightboxPrompt(template)}
            onSaveTemplate={handleSaveCurrentPromptAsTemplate}
            onDeleteTemplate={deleteTemplate}
            onOptimizePrompt={handleOptimizePrompt}
            isOptimizing={isOptimizingPrompt}
            onMicrophoneToggle={handleMicrophone}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            showQuickPublish={images[currentImageIndex]?.isGenerated && lightboxPrompt.trim().length > 0}
            onQuickPublish={quickPublishAsNew}
            prompt={lightboxPrompt}
            onPromptChange={setLightboxPrompt}
            // Prompt history
            promptHistory={promptHistory}
            historyIndex={historyIndex}
            onNavigateHistory={(direction) => navigatePromptHistory(direction, promptHistory, historyIndex, setHistoryIndex, setLightboxPrompt)}
            onManualPromptEdit={() => setHistoryIndex(-1)}
          />
        </div>

        {/* Logger Panel - Collapsible */}
        {isLoggerVisible && (
          <div className="mb-4 md:mb-6">
            <div className="h-48 md:h-64">
              <LogViewer onClose={() => setLoggerVisible(false)} />
            </div>
          </div>
        )}

        <div className={mode === 'post' ? "h-[calc(100vh-140px)]" : "grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"}>
          {mode === 'post' ? (
            <PostComposer
              images={images}
              setImages={setImages}
              onRemoveImage={removeImage}
              onFileUpload={(event) => handleFileUpload(event, setImages, user)}
              dropZoneRef={dropZoneRef}
              isDragging={dragIn}
              onDragEnter={(e) => handleDragEnter(e, dragLeaveTimeoutRef, setDragIn)}
              onDragOver={(e) => handleDragOver(e, dragIn, setDragIn)}
              onDragLeave={(e) => handleDragLeave(e, dragLeaveTimeoutRef, setDragIn)}
              onDrop={(e) => handleDrop(e, dragLeaveTimeoutRef, setDragIn, setImages, user)}
              postTitle={postTitle}
              setPostTitle={setPostTitle}
              postDescription={postDescription}
              setPostDescription={setPostDescription}
              isEditing={!!currentEditingPostId}
              postId={currentEditingPostId}
              settings={settings}
              setSettings={setSettings}
              onPublish={() => {
                // Auto-inject link into settings if present
                const externalPage = images.find(img => img.type === 'page-external');
                const publishSettings = { ...settings };

                if (externalPage && externalPage.path && !publishSettings.link) {
                  publishSettings.link = externalPage.path;
                }

                publishImageUtil({
                  user: user,
                  generatedImage: typeof generatedImage === 'string' ? generatedImage : (generatedImage as any)?.src || null,
                  images: images,
                  lightboxOpen: lightboxOpen,
                  currentImageIndex: currentImageIndex,
                  postTitle: postTitle,
                  postDescription: postDescription,
                  settings: publishSettings, // Pass enriched settings
                  prompt: prompt,
                  isOrgContext: false,
                  orgSlug: null,
                  publishAll: mode === 'post',
                  editingPostId: currentEditingPostId,
                  onPublish: (url, postId) => {
                    onClose();
                    // If we have a postId (passed as 2nd arg for posts), navigate to it
                    if (postId && (mode === 'post' || currentEditingPostId)) {
                      navigate(`/post/${postId}`);
                    } else {
                      navigate('/');
                    }
                  }
                }, setIsPublishing);
              }}
              onPublishToGallery={handlePublishToGallery}
              onAppendToPost={handleAppendToPost}
              isPublishing={isPublishing}
            />
          ) : (
            <>
              {/* Left Panel - Controls */}
              <WizardSidebar
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onLoadModel={wizardDb.loadWizardModel}
                onSaveModel={wizardDb.saveWizardModel}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
                resolution={resolution}
                onResolutionChange={setResolution}
                searchGrounding={searchGrounding}
                onSearchGroundingChange={setSearchGrounding}
                imageSearch={imageSearch}
                onImageSearchChange={setImageSearch}
                selectedPreset={selectedPreset}
                presets={promptPresets}
                loadingPresets={loadingPresets}
                onPresetSelect={handlePresetSelect}
                onPresetClear={handlePresetClear}
                onSavePreset={(preset) => user?.id && savePromptPreset(user.id, preset, setPromptPresets)}
                onUpdatePreset={(id, preset) => user?.id && updatePromptPreset(user.id, id, preset, setPromptPresets)}
                onDeletePreset={(id) => user?.id && deletePromptPreset(user.id, id, setPromptPresets)}
                workflows={workflows}
                loadingWorkflows={loadingWorkflows}
                onSaveWorkflow={(workflow) => user?.id && saveWorkflow(user.id, workflow, setWorkflows)}
                onUpdateWorkflow={(id, workflow) => user?.id && updateWorkflow(user.id, id, workflow, setWorkflows)}
                onDeleteWorkflow={(id) => user?.id && deleteWorkflow(user.id, id, setWorkflows)}
                onExecuteWorkflow={executeWorkflow}
                isGenerating={isGenerating}
                isAgentMode={isAgentMode}
                isSplitMode={isSplitMode}
                prompt={prompt}
                onGenerate={generateImage}
                onGenerateSplit={generateImageSplit}
                onAgentGenerate={handleAgentGeneration}
                onVoiceGenerate={() => setShowVoicePopup(true)}
                onAbort={() => { cancelRetry(); abortGeneration(abortControllerRef, setIsGenerating, setIsAgentMode, setImages, logger); }}
                images={images}
                generatedImage={generatedImage}
                postTitle={postTitle}
                onPostTitleChange={setPostTitle}
                isPublishing={isPublishing}
                onQuickPublish={quickPublishAsNew}
                onPublish={() => setShowLightboxPublishDialog(true)}
                onPublishToGallery={handlePublishToGallery}
                onAppendToPost={handleAppendToPost}
                showSaveAsVfsFile={hasVfsFileContext}
                onSaveAsVfsFile={handleSaveAsVfsFile}
                onAddToPost={() => {
                  const currentImage = images[images.length - 1]; // Default to most recent for sidebar action
                  if (currentImage) handleAddToPost(currentImage.src, postTitle || prompt, postDescription)
                }}
                editingPostId={currentEditingPostId}
                lastError={lastError}
                retryInfo={retryInfo}
                onDismissError={() => { cancelRetry(); setLastError(null); }}
              >
                <Prompt
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  isSplitMode={isSplitMode}
                  onSplitModeChange={setIsSplitMode}
                  selectedPreset={selectedPreset}
                  templates={promptTemplates}
                  onApplyTemplate={applyTemplate}
                  onSaveTemplate={handleSaveCurrentPromptAsTemplate}
                  onDeleteTemplate={deleteTemplate}
                  onOptimizePrompt={handleOptimizePrompt}
                  isOptimizing={isOptimizingPrompt}
                  onMicrophoneToggle={handleMicrophone}
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  promptHistory={promptHistory}
                  historyIndex={historyIndex}
                  onNavigateHistory={(direction) => navigatePromptHistory(direction, promptHistory, historyIndex, setHistoryIndex, setPrompt)}
                  onManualEdit={() => setHistoryIndex(-1)}
                  isGenerating={isGenerating}
                  onGenerate={generateImage}
                  onImagePaste={(image) => setImages(prev => [...prev, image])}
                />
              </WizardSidebar>

              {/* Right Panel - Images */}
              <ImageGalleryPanel
                images={images}
                onImageClick={toggleImageSelection}
                onImageDoubleClick={openLightbox}
                onFileUpload={(event) => handleFileUpload(event, setImages, user)}
                onDeleteSelected={deleteSelectedImages}
                onDownload={handleDownloadImage}
                onSetAsSelected={setAsSelected}
                onSaveAsVersion={(img, idx) => {
                  setCurrentImageIndex(idx);
                  const currentImage = images[idx];
                  let parentId = null;

                  if (currentImage.parentForNewVersions) {
                    parentId = currentImage.parentForNewVersions;
                  } else if (currentImage.realDatabaseId) {
                    parentId = currentImage.realDatabaseId;
                  } else {
                    const originalImage = images.find(img => !img.isGenerated && img.id && img.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
                    parentId = originalImage?.id || null;
                  }

                  setSelectedOriginalImageId(parentId);
                  setShowLightboxPublishDialog(true);
                }}
                onEdit={handleEditImage}
                onRemove={removeImage}
                availableImages={availableImages}
                loadingImages={loadingImages}
                onGalleryImageSelect={(imageId, isMultiSelect) => toggleImageSelection(imageId, isMultiSelect, true)}
                quickActions={quickActions}
                onExecuteAction={executeQuickAction}
                onEditActions={openEditActionsDialog}
                onSettings={handleConfigureImage}
                isGenerating={isGenerating}
                dragIn={dragIn}
                onDragEnter={(e) => handleDragEnter(e, dragLeaveTimeoutRef, setDragIn)}
                onDragOver={(e) => handleDragOver(e, dragIn, setDragIn)}
                onDragLeave={(e) => handleDragLeave(e, dragLeaveTimeoutRef, setDragIn)}
                onDrop={(e) => handleDrop(e, dragLeaveTimeoutRef, setDragIn, setImages, user)}
                dropZoneRef={dropZoneRef}
                onAddToPost={(image) => handleAddToPost(image.src, postTitle || prompt, postDescription)}
                editingPostId={currentEditingPostId}
              />
            </>
          )}
        </div>

        <Dialog open={showPostPicker} onOpenChange={setShowPostPicker}>
          <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle><T>Select a Post to Append To</T></DialogTitle>
              <DialogDescription>
                <T>Choose one of your existing posts to add these images to.</T>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0">
              <PostPicker onSelect={handlePostSelected} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Lightbox Publish Dialog */}
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {imageToDelete?.startsWith('bulk:') ? (
                  <T>Delete Multiple Images</T>
                ) : (
                  <T>Delete Image Version</T>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {imageToDelete?.startsWith('bulk:') ? (
                  <>
                    <T>Are you sure you want to delete {imageToDelete.split(':')[1]} selected image(s)? This action cannot be undone.</T>
                  </>
                ) : (
                  <T>Are you sure you want to delete this image version? This action cannot be undone and will permanently remove the image from your account.</T>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirmDialog(false)}>
                <T>Cancel</T>
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={imageToDelete?.startsWith('bulk:') ? confirmBulkDelete : confirmDeleteImage}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <T>Delete</T>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <PublishDialog
          isOpen={showLightboxPublishDialog}
          onClose={() => setShowLightboxPublishDialog(false)}
          onPublish={(option, title, description, parentId, collectionIds) => {
            const currentImage = images[currentImageIndex];
            if (currentImage) {
              // Now accepts 'add-to-post' as option
              handleLightboxPublish(option as any, currentImage.src, title || '', description, parentId, collectionIds);
            }
          }}
          originalTitle={images[currentImageIndex]?.title || 'Generated Image'}
          originalImageId={selectedOriginalImageId || (originalImageId && originalImageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? originalImageId : undefined)}
          isPublishing={isPublishing}
          editingPostId={currentEditingPostId} // Pass prop
        />

        {/* Save Template Dialog */}
        <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle><T>Save Prompt Template</T></DialogTitle>
              <DialogDescription>
                <T>Give your prompt template a name to save it for later use.</T>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium"><T>Template Name</T></label>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={translate("e.g. Cyberpunk Portrait")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmSaveTemplate();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground"><T>Prompt Preview</T></label>
                <div className="text-sm p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                  {lightboxOpen ? lightboxPrompt : prompt}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
                <T>Cancel</T>
              </Button>
              <Button onClick={confirmSaveTemplate} disabled={!newTemplateName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                <T>Save Template</T>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voice Recording Popup */}
        <VoiceRecordingPopup
          ref={voicePopupRef}
          isOpen={showVoicePopup}
          onClose={() => setShowVoicePopup(false)}
          onTranscriptionComplete={handleVoiceTranscription}
          onGenerateImage={handleVoiceToImage}
          showToolCalls={true}
        />

        {/* Edit Quick Actions Dialog */}
        <Dialog open={showEditActionsDialog} onOpenChange={setShowEditActionsDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle><T>Edit Quick Actions</T></DialogTitle>
              <DialogDescription>
                <T>Customize the quick actions that appear above your images. Add, edit, or remove actions.</T>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {editingActions.map((action, index) => (
                <div key={action.id} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg border">
                  <Input
                    placeholder="Icon (emoji)"
                    value={action.icon}
                    onChange={(e) => updateQuickAction(action.id, 'icon', e.target.value)}
                    className="w-16 text-center"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Name"
                    value={action.name}
                    onChange={(e) => updateQuickAction(action.id, 'name', e.target.value)}
                    className="flex-1"
                    maxLength={30}
                  />
                  <Input
                    placeholder="Prompt"
                    value={action.prompt}
                    onChange={(e) => updateQuickAction(action.id, 'prompt', e.target.value)}
                    className="flex-[2]"
                    maxLength={200}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuickAction(action.id)}
                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete action"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuickAction}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                <T>Add Quick Action</T>
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditActionsDialog(false);
                  setEditingActions([]);
                }}
              >
                <T>Cancel</T>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingActions(DEFAULT_QUICK_ACTIONS);
                }}
                variant="secondary"
              >
                <T>Reset to Defaults</T>
              </Button>
              <Button
                type="button"
                onClick={saveEditedActions}
              >
                <Save className="w-4 h-4 mr-2" />
                <T>Save Actions</T>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </WizardProvider >
  );
};

export default ImageWizard;
