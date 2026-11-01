import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { transcribeAudio, runTools } from '@/lib/openai';
import { useLog } from '@/contexts/LogContext';
import { createPageInDb } from '@/lib/pageTools';

// Define the states for the page generation process
type GenerationStatus = 'idle' | 'transcribing' | 'generating' | 'creating' | 'success' | 'error';

export const usePageGenerator = () => {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addLog } = useLog();

  const cancelGeneration = () => {
    addLog('info', '[PageGenerator] User cancelled page generation.');
    setStatus('idle');
    toast.warning(translate('Page generation cancelled.'));
  };

  const generatePageFromText = async (prompt: string, options: { 
    useImageTools: boolean; 
    model?: string; 
    provider?: string; 
    imageModel?: string; 
    referenceImages?: string[]; 
    parentId?: string;
    toolsEnabled?: boolean;
    webSearchEnabled?: boolean;
    pageToolsEnabled?: boolean;
    vfsToolsEnabled?: boolean;
  }) => {
    if (!user) {
      toast.error(translate('You must be logged in to create a page.'));
      return;
    }

    setStatus('generating');
    setError(null);
    addLog('info', `[PageGenerator] Starting page generation with prompt: ${prompt.substring(0, 50)}...`);
    toast.info(translate('Generating page content...'));

    try {
      const preset = options.useImageTools ? 'page-generator' : 'page-generator-text-only';
      addLog('debug', `[PageGenerator] Using AI preset: ${preset} with model: ${options.model || 'default'} (Image model: ${options.imageModel || 'default'})`);

      // Stage 1: AI generates content and calls the appropriate tool
      const effectivePrompt = options.useImageTools && options.imageModel
        ? `${prompt}\n\n[System Instruction: When generating images, YOU MUST set the 'model' argument to "${options.imageModel}" in the generate_text_with_images tool.]`
        : prompt;

      console.log("[usePageGenerator] runTools options:", {
        preset,
        toolsEnabled: options.toolsEnabled,
        webSearchEnabled: options.webSearchEnabled,
        imageToolsEnabled: options.useImageTools,
        pageToolsEnabled: options.pageToolsEnabled,
        vfsToolsEnabled: options.vfsToolsEnabled
      });

      const result = await runTools({
        prompt: effectivePrompt,
        preset,
        userId: user.id,
        addLog,
        model: options.model,
        provider: options.provider,
        images: options.referenceImages,
        toolsEnabled: options.toolsEnabled,
        webSearchEnabled: options.webSearchEnabled,
        imageToolsEnabled: options.useImageTools,
        pageToolsEnabled: options.pageToolsEnabled,
        vfsToolsEnabled: options.vfsToolsEnabled
      });

      addLog('debug', `[PageGenerator] AI content generation completed. ${JSON.stringify(result)}`);

      if (!result.success) {
        throw new Error(result.error || 'The AI failed to generate the page content.');
      }

      // Stage 2: Handle the result
      let finalPageResult;

      // Check if the AI called the 'create_page' tool directly (backward compatibility)
      const createPageCall = result.toolCalls?.find(tc => tc.function?.name === 'create_page');

      if (createPageCall && createPageCall.function.output) {
        addLog('debug', '[PageGenerator] Found direct create_page tool call.');
        finalPageResult = createPageCall.function.output;
      } else {
        // Fallback: Check if we have content from 'generate_text_with_images' or raw content
        addLog('debug', '[PageGenerator] No create_page tool call found. Attempting to create page from generated content.');

        let content = '';
        const genTextToolCall = result.toolCalls?.find(tc => tc.function?.name === 'generate_text_with_images');

        if (genTextToolCall && genTextToolCall.function.output?.content) {
          content = genTextToolCall.function.output.content;
          addLog('debug', '[PageGenerator] Extracted content from generate_text_with_images tool.');
        } else if (typeof result.content === 'string' && result.content.trim()) {
          content = result.content; // Use raw content if available
          addLog('debug', '[PageGenerator] Using raw message content.');
        }
        
        if (!content && result.messages) {
          const assistantMsg = result.messages.slice().reverse().find(m => m.role === 'assistant' && typeof m.content === 'string' && m.content.trim().length > 0);
          if (assistantMsg) {
            content = assistantMsg.content;
            addLog('debug', '[PageGenerator] Extracted content from a previous assistant message.');
          }
        }

        if (!content) {
          addLog('warning', '[PageGenerator] AI failed to generate final text content. Falling back to placeholder.');
          content = `*The AI process stopped before generating the full text (e.g., due to a tool failure or timeout).* \n\n**Original Request:**\n${prompt}`;
          
          const lastAssistant = result.messages.slice().reverse().find(m => m.role === 'assistant');
          if (lastAssistant && (lastAssistant as any).reasoning) {
            content += `\n\n**AI Thoughts:**\n${(lastAssistant as any).reasoning}`;
          }
        }

        // Generate a title from the prompt or content
        // Simple strategy: Use the first heading, or the first few words of the prompt
        let title = 'Generated Page';
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else {
          // Fallback to prompt-based title
          title = prompt.split('\n')[0].substring(0, 50).trim();
          if (prompt.length > 50) title += '...';
        }

        setStatus('creating');
        addLog('info', `[PageGenerator] Creating page manually with title: "${title}"`);

        // Call the createPageInDb function directly
        finalPageResult = await createPageInDb(user.id, {
          title,
          content,
          is_public: false,
          visible: true,
          parent: options.parentId
        }, addLog);
      }

      if (!finalPageResult.success) {
        throw new Error(`Failed to save page: ${finalPageResult.error}`);
      }

      const newPageUrl = finalPageResult.url || `/user/${user.id}/pages/${finalPageResult.slug}`;
      setStatus('success');
      toast.success(translate('Page created! Redirecting you now...'));
      addLog('info', `[PageGenerator] Navigating to new page: ${newPageUrl}`);
      setTimeout(() => navigate(newPageUrl), 1000);
      return newPageUrl;

    } catch (e: any) {
      addLog('error', '[PageGenerator] Page generation from text failed.', e);
      const errorMessage = e.message || translate('An unknown error occurred during page generation.');
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
    }
  };

  const generatePageFromVoice = async (audioBlob: Blob, options: { useImageTools: boolean }) => {
    if (!user) {
      toast.error(translate('You must be logged in to create a page.'));
      return;
    }

    setStatus('transcribing');
    setError(null);
    addLog('info', '[PageGenerator] Starting page generation from voice...');
    toast.info(translate('Transcribing audio...'));

    try {
      // 1. Transcribe Audio
      const audioFile = new File([audioBlob], "voice_prompt.webm", { type: "audio/webm" });
      const transcribedText = await transcribeAudio(audioFile);

      if (!transcribedText) {
        throw new Error('Transcription failed or returned empty.');
      }

      addLog('info', `[PageGenerator] Transcription complete: ${transcribedText.substring(0, 100)}...`);
      toast.success(translate('Transcription complete!'));

      // 2. Defer to the text-based generation function
      addLog('debug', '[PageGenerator] Deferring to text-based generation from voice input.');
      await generatePageFromText(transcribedText, options);

    } catch (e: any) {
      addLog('error', '[PageGenerator] Page generation from voice failed.', e);
      const errorMessage = e.message || translate('An unknown error occurred during page generation.');
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
    }
  };

  return {
    status,
    error,
    generatePageFromVoice,
    generatePageFromText,
    isGenerating: status !== 'idle' && status !== 'success' && status !== 'error',
    cancelGeneration,
  };
};
