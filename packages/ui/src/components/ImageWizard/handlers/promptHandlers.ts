/**
 * Prompt Handlers for ImageWizard
 * Handles prompt splitting, processing, and related operations
 */

import { toast } from "sonner";
import { translate } from "@/i18n";
import { splitPromptByLines, MAX_SPLIT_PROMPTS } from "@/constants";
import { ImageFile } from "../types";
import { createImage, editImage } from "@/lib/image-router";
import { Logger } from "../utils/logger";

/**
 * Generate images from split prompts (sequential generation)
 * Each line in the prompt becomes a separate generation step
 * Each generated image feeds into the next step as input
 */
export const generateImageSplit = async (
  prompt: string,
  images: ImageFile[],
  selectedModel: string,
  abortControllerRef: React.MutableRefObject<AbortController | null>,
  setIsGenerating: (value: boolean) => void,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  addToPromptHistory: (prompt: string) => Promise<void>,
  logger: Logger
) => {
  // Use the raw prompt directly, not the preset-combined version
  const rawPrompt = prompt.trim();
  
  if (!rawPrompt) {
    toast.error(translate('Please enter a prompt'));
    return;
  }

  // Split the raw prompt by lines
  const promptLines = splitPromptByLines(rawPrompt, MAX_SPLIT_PROMPTS);
  
  logger.debug(`Raw prompt: "${rawPrompt.substring(0, 100)}..."`);
  logger.debug(`Split into ${promptLines.length} lines`);
  
  if (promptLines.length === 0) {
    toast.error(translate('No valid prompts found'));
    return;
  }
  
  if (promptLines.length === 1) {
    toast.warning(translate('Only one line detected. Add more lines or turn off Split mode.'));
  }

  if (promptLines.length > MAX_SPLIT_PROMPTS) {
    toast.warning(translate(`Only the first ${MAX_SPLIT_PROMPTS} prompts will be processed`));
  }

  // Add to history before generating
  if (rawPrompt) {
    await addToPromptHistory(rawPrompt);
  }

  // Create new abort controller for split generation
  abortControllerRef.current = new AbortController();

  setIsGenerating(true);
  logger.info(`Starting split generation with ${promptLines.length} prompts`);
  toast.info(`Processing ${promptLines.length} prompts sequentially...`);

  try {
    // Check if there are selected images to use as starting point
    const selectedImages = images.filter(img => img.selected);
    
    // Track the previous image data URL directly (simpler than state lookups)
    let previousImageDataUrl: string | null = null;
    
    // If we have selected images, use the first one as the starting point
    if (selectedImages.length > 0) {
      previousImageDataUrl = selectedImages[0].src;
      logger.info(`Using ${selectedImages.length} selected image(s) as starting point`);
      toast.info(`Starting from selected image...`);
    }

    for (let i = 0; i < promptLines.length; i++) {
      // Check if aborted before each step
      if (abortControllerRef.current?.signal.aborted) {
        logger.info(`Split generation aborted at step ${i + 1}`);
        toast.info(`Split generation cancelled at step ${i + 1}/${promptLines.length}`);
        break;
      }
      
      const currentPrompt = promptLines[i];
      logger.info(`[${i + 1}/${promptLines.length}] Generating: "${currentPrompt.substring(0, 50)}..."`);
      
      // Create placeholder with current prompt instruction
      const placeholderId = `placeholder-split-${Date.now()}-${i}`;
      const truncatedPrompt = currentPrompt.length > 60 
        ? currentPrompt.substring(0, 60) + '...' 
        : currentPrompt;
      const placeholderImage: ImageFile = {
        id: placeholderId,
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==',
        title: `Generating ${i + 1}/${promptLines.length}: ${truncatedPrompt}`,
        selected: false,
        isGenerated: true,
      };
      setImages(prev => [...prev.map(img => ({ ...img, selected: false })), placeholderImage]);

      let result: { imageData: ArrayBuffer; text?: string } | null = null;

      // If we have a previous image (either from selection or previous generation), use it as input
      if (previousImageDataUrl) {
        logger.debug(`Using previous image as input for step ${i + 1}`);
        
        // Convert previous image data URL to File
        try {
          const response = await fetch(previousImageDataUrl);
          const blob = await response.blob();
          const file = new File([blob], `step-${i}.png`, { 
            type: 'image/png' 
          });
          
          // If we have multiple selected images and this is the first iteration, use all of them
          if (i === 0 && selectedImages.length > 1) {
            logger.debug(`Using all ${selectedImages.length} selected images for first step`);
            const files: File[] = [];
            for (const selectedImg of selectedImages) {
              try {
                const resp = await fetch(selectedImg.src);
                const imgBlob = await resp.blob();
                const imgFile = new File([imgBlob], selectedImg.title || 'image.png', { 
                  type: imgBlob.type || 'image/png' 
                });
                files.push(imgFile);
              } catch (error) {
                console.error('Error converting selected image:', error);
              }
            }
            result = await editImage(currentPrompt, files, selectedModel);
          } else {
            // Single image or subsequent iterations
            result = await editImage(currentPrompt, [file], selectedModel);
          }
        } catch (error) {
          console.error('Error converting previous image:', error);
          logger.error(`Failed to convert previous image for prompt ${i + 1}`);
          toast.error(translate(`Failed at step ${i + 1}: Could not process previous image`));
          // Remove placeholder on failure
          setImages(prev => prev.filter(img => img.id !== placeholderId));
          break;
        }
      } else {
        // First image with no selection - generate from text
        logger.debug(`Generating first image from text`);
        result = await createImage(currentPrompt, selectedModel);
      }

      if (result) {
        logger.debug(`Successfully generated image for step ${i + 1}, converting to data URL`);
        
        // Convert ArrayBuffer to base64 data URL
        const uint8Array = new Uint8Array(result.imageData);
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        const newImage: ImageFile = {
          id: `split-generated-${Date.now()}-${i}`,
          src: dataUrl,
          title: `[${i + 1}/${promptLines.length}] ${currentPrompt.substring(0, 40)}${currentPrompt.length > 40 ? '...' : ''}`,
          selected: i === promptLines.length - 1, // Only select the last one
          isGenerated: true,
          aiText: result.text,
        };

        // Replace placeholder with actual image
        setImages(prev => {
          const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
          return [...withoutPlaceholder, newImage];
        });

        // Store this image data URL for next iteration
        previousImageDataUrl = dataUrl;
        
        logger.success(`[${i + 1}/${promptLines.length}] Generated successfully, ready for next step`);
      } else {
        // Remove placeholder on failure
        setImages(prev => prev.filter(img => img.id !== placeholderId));
        logger.error(`Failed to generate image for prompt ${i + 1} - result was null`);
        toast.error(translate(`Failed at step ${i + 1}`));
        break;
      }

      // Small delay between generations to allow UI to update
      if (i < promptLines.length - 1) {
        logger.debug(`Waiting before next step...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again after delay
        if (abortControllerRef.current?.signal.aborted) {
          logger.info(`Split generation aborted after step ${i + 1}`);
          toast.info(`Split generation cancelled after step ${i + 1}/${promptLines.length}`);
          break;
        }
      }
    }

    // Only show success if not aborted
    if (!abortControllerRef.current?.signal.aborted) {
      toast.success(translate(`Split generation completed! Generated ${promptLines.length} images.`));
      logger.success(`Split generation completed: ${promptLines.length} images`);
    }
  } catch (error: any) {
    // Don't show error if it was just aborted
    if (abortControllerRef.current?.signal.aborted) {
      logger.info('Split generation aborted by user');
    } else {
      console.error('Error in split generation:', error);
      logger.error(`Split generation failed: ${error.message}`);
      toast.error(translate(`Split generation failed: ${error.message}`));
    }
  } finally {
    setIsGenerating(false);
    // Clean up abort controller
    abortControllerRef.current = null;
  }
};
