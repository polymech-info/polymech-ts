import { ImageFile } from '../types';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { optimizePrompt } from '@/lib/openai';
import { PromptPreset } from '@/components/PresetManager';
import { Logger } from '../utils/logger';

/**
 * Generation Handlers
 * - Direct image generation
 * - Agent mode generation
 * - Voice agent generation
 * - Prompt optimization
 * - Lightbox image generation
 */

export const handleOptimizePrompt = async (
  currentPrompt: string,
  lightboxOpen: boolean,
  setLightboxPrompt: React.Dispatch<React.SetStateAction<string>>,
  setPrompt: React.Dispatch<React.SetStateAction<string>>,
  setIsOptimizingPrompt: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!currentPrompt.trim()) {
    toast.error(translate('Please enter a prompt first'));
    return;
  }

  setIsOptimizingPrompt(true);
  try {
    toast.info(translate('Optimizing your prompt...'));
    const optimized = await optimizePrompt(currentPrompt);

    if (optimized) {
      // Update the appropriate prompt field
      if (lightboxOpen) {
        setLightboxPrompt(optimized);
      } else {
        setPrompt(optimized);
      }
      toast.success(translate('Prompt optimized successfully!'));
    } else {
      toast.error(translate('Failed to optimize prompt. Please check your OpenAI API key.'));
    }
  } catch (error: any) {
    console.error('Error optimizing prompt:', error);
    toast.error(error.message || translate('Failed to optimize prompt'));
  } finally {
    setIsOptimizingPrompt(false);
  }
};

export const buildFullPrompt = (selectedPreset: PromptPreset | null, prompt: string): string => {
  if (selectedPreset) {
    if (prompt.trim()) {
      return `Context: ${selectedPreset.prompt}\n\nPrompt: ${prompt}`;
    } else {
      return selectedPreset.prompt;
    }
  }
  return prompt;
};

export const abortGeneration = (
  abortControllerRef: React.MutableRefObject<AbortController | null>,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setIsAgentMode: React.Dispatch<React.SetStateAction<boolean>>,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  logger: Logger
) => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setIsAgentMode(false);
    // Remove any placeholder images when aborting
    setImages(prev => prev.filter(img =>
      !img.title.includes('Generating') &&
      !img.title.includes('Agent working') &&
      !img.title.includes('Voice Agent working')
    ));
    toast.info('Generation aborted');
    logger.info('Generation aborted by user');
  }
};

