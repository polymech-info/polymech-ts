import { ImageFile } from '../types';
import { getUserOpenAIKey } from '../db';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { runTools } from '@/lib/openai';
import { Logger } from '../utils/logger';

/**
 * Agent Mode Handlers
 * - Agent-based image generation with tools
 */

export const handleAgentGeneration = async (
  prompt: string,
  userId: string | undefined,
  fullPrompt: string,
  selectedModel: string,
  setIsAgentMode: React.Dispatch<React.SetStateAction<boolean>>,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  setPostTitle: React.Dispatch<React.SetStateAction<string>>,
  setPostDescription: React.Dispatch<React.SetStateAction<string>>,
  logger: Logger
) => {
  if (!prompt.trim()) {
    toast.error(translate('Please enter a prompt'));
    return;
  }

  setIsAgentMode(true);
  setIsGenerating(true);
  logger.info('Starting Agent Mode generation');

  // Create placeholder image for agent mode
  const placeholderId = `agent-placeholder-${Date.now()}`;
  const placeholderImage: ImageFile = {
    id: placeholderId,
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==',
    title: '🤖 Agent working...',
    selected: false,
    isGenerated: true,
  };
  setImages(prev => [...prev.map(img => ({ ...img, selected: false })), placeholderImage]);

  try {
    toast.info('🤖 Agent mode: Analyzing your request...');

    // Get user's OpenAI API key
    const openaiApiKey = await getUserOpenAIKey(userId || '');

    logger.debug(`Agent prompt: "${fullPrompt.substring(0, 100)}..."`);

    const result = await runTools({
      prompt: `${fullPrompt}\n\nIMPORTANT: When calling generate_image, you MUST use model="${selectedModel}"`,
      preset: 'smart-generation',
      apiKey: openaiApiKey || undefined,
      onToolCall: (toolCall) => {
        if ('function' in toolCall) {
          const toolName = toolCall.function?.name || 'unknown';
          logger.debug(`Agent calling tool: ${toolName}`);
          const toolMessages: Record<string, string> = {
            'optimize_prompt': '✨ Optimizing your prompt...',
            'generate_image': '🎨 Generating image(s)...',
            'generate_image_metadata': '✍️ Creating title and description...',
            'publish_image': '📋 Preparing for publishing...',
          };
          if (toolMessages[toolName]) {
            toast.info(toolMessages[toolName]);
          }
        }
      },
      onContent: (content) => {
        console.log('🤖 Agent:', content);
      }
    });

    if (!result.success) {
      toast.error('Agent failed: ' + (result.error || 'Unknown error'));
      return;
    }

    // Extract generated images from tool calls
    const imageToolCall = result.toolCalls?.find(
      tc => 'function' in tc && tc.function?.name === 'generate_image'
    );

    if (imageToolCall && 'function' in imageToolCall) {
      try {
        let imageResult: any;

        // Look for the function result in messages
        for (const msg of result.messages || []) {
          if (msg.role === 'tool' && 'content' in msg) {
            try {
              const toolContent = JSON.parse(msg.content as string);
              if (toolContent.images || toolContent.imageUrl) {
                imageResult = toolContent;
                break;
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        }

        if (!imageResult) {
          console.warn('🤖 No image result found in tool responses');
          toast.warning('Agent completed but no images were returned');
          return;
        }

        // Handle multiple images
        if (imageResult.images && Array.isArray(imageResult.images)) {
          const newImages: ImageFile[] = [];
          for (let i = 0; i < imageResult.images.length; i++) {
            const img = imageResult.images[i];
            const newImage: ImageFile = {
              id: `agent-generated-${Date.now()}-${i}`,
              src: img.imageUrl,
              title: `Agent: ${prompt.substring(0, 40)}...`,
              selected: i === imageResult.images.length - 1,
              isGenerated: true,
              aiText: img.text
            };
            newImages.push(newImage);
          }

          // Replace placeholder with actual images
          setImages(prev => {
            const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
            return [...withoutPlaceholder, ...newImages];
          });

          toast.success(`✅ Agent generated ${imageResult.images.length} image${imageResult.images.length > 1 ? 's' : ''}!`);
        } else if (imageResult.imageUrl) {
          // Single image format
          const newImage: ImageFile = {
            id: `agent-generated-${Date.now()}`,
            src: imageResult.imageUrl,
            title: `Agent: ${prompt.substring(0, 40)}...`,
            selected: true,
            isGenerated: true,
            aiText: imageResult.text
          };
          // Replace placeholder with actual image
          setImages(prev => {
            const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
            return [...withoutPlaceholder, newImage];
          });
          toast.success('✅ Agent generated image!');
        }
      } catch (parseError) {
        console.error('🤖 Error parsing image result:', parseError);
        toast.error('Failed to parse Agent results');
      }
    }

    // Extract metadata if available
    const metadataToolCall = result.toolCalls?.find(
      tc => 'function' in tc && tc.function?.name === 'generate_image_metadata'
    );

    if (metadataToolCall && 'function' in metadataToolCall) {
      const metadataResult = JSON.parse(metadataToolCall.function.arguments || '{}');
      if (metadataResult.title) {
        setPostTitle(metadataResult.title);
        toast.info(`📝 Suggested title: "${metadataResult.title}"`);
      }
      if (metadataResult.description) {
        setPostDescription(metadataResult.description);
      }
    }

    toast.success('🤖 Agent completed workflow!');
    logger.success('Agent workflow completed successfully');

  } catch (error: any) {
    console.error('Error in agent mode:', error);
    logger.error(`Agent error: ${error.message}`);
    toast.error('Agent error: ' + error.message);
    // Remove placeholder on error
    setImages(prev => prev.filter(img => img.id !== placeholderId));
  } finally {
    setIsGenerating(false);
    setIsAgentMode(false);
  }
};





