import { ImageFile } from '../types';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { transcribeAudio, runTools } from '@/lib/openai';
import { PromptPreset } from '@/components/PresetManager';
import { Logger } from '../utils/logger';
import { getUserOpenAIKey } from '@/modules/user/client-user';

/**
 * Voice Handlers
 * - Microphone recording
 * - Audio transcription
 * - Voice-to-image workflow
 */

export const handleMicrophone = async (
  isRecording: boolean,
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>,
  setIsTranscribing: React.Dispatch<React.SetStateAction<boolean>>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  lightboxOpen: boolean,
  setLightboxPrompt: React.Dispatch<React.SetStateAction<string>>,
  setPrompt: React.Dispatch<React.SetStateAction<string>>
) => {
  if (isRecording) {
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  } else {
    // Start recording
    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(translate('Audio recording is not supported in your browser'));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder with common audio format
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback without options if the format is not supported
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

          toast.info(translate('Transcribing audio...'));
          const transcribedText = await transcribeAudio(audioFile);

          if (transcribedText) {
            // Update the appropriate prompt field based on whether lightbox is open
            if (lightboxOpen) {
              setLightboxPrompt(prev => {
                const trimmed = prev.trim();
                if (trimmed) {
                  return `${trimmed} ${transcribedText}`;
                }
                return transcribedText;
              });
            } else {
              setPrompt(prev => {
                const trimmed = prev.trim();
                if (trimmed) {
                  return `${trimmed} ${transcribedText}`;
                }
                return transcribedText;
              });
            }
            toast.success(translate('Audio transcribed successfully!'));
          } else {
            toast.error(translate('Failed to transcribe audio. Please check your OpenAI API key.'));
          }
        } catch (error: any) {
          console.error('Error transcribing audio:', error);
          toast.error(error.message || translate('Failed to transcribe audio'));
        } finally {
          setIsTranscribing(false);
          audioChunksRef.current = [];

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info(translate('Recording started... Click again to stop'));

    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        toast.error(translate('Microphone access denied. Please allow microphone access in your browser settings.'));
      } else {
        toast.error(translate('Failed to access microphone') + ': ' + error.message);
      }
    }
  }
};

export const handleVoiceToImage = async (
  transcribedText: string,
  userId: string | undefined,
  selectedPreset: PromptPreset | null,
  selectedModel: string,
  setPrompt: React.Dispatch<React.SetStateAction<string>>,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  setPostTitle: React.Dispatch<React.SetStateAction<string>>,
  setPostDescription: React.Dispatch<React.SetStateAction<string>>,
  voicePopupRef: any,
  logger: Logger
) => {
  setPrompt(transcribedText);

  // Use Agent mode for voice input to get optimization and metadata
  voicePopupRef.current?.setGenerating(true);

  // Create placeholder for voice agent
  const placeholderId = `voice-placeholder-${Date.now()}`;
  const placeholderImage: ImageFile = {
    id: placeholderId,
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==',
    title: '🎤 Voice Agent working...',
    selected: false,
    isGenerated: true,
  };
  setImages(prev => [...prev.map(img => ({ ...img, selected: false })), placeholderImage]);
  logger.info(`Voice Agent started with prompt: "${transcribedText.substring(0, 50)}..."`);

  try {
    // Get user's OpenAI API key
    const openaiApiKey = await getUserOpenAIKey(userId || '');

    const fullPrompt = selectedPreset
      ? `Context: ${selectedPreset.prompt}\n\nPrompt: ${transcribedText}`
      : transcribedText;

    const result = await runTools({
      prompt: `${fullPrompt}\n\nIMPORTANT: When calling generate_image, you MUST use model="${selectedModel}"`,
      preset: 'smart-generation',
      apiKey: openaiApiKey || undefined,
      onToolCall: (toolCall) => {
        if ('function' in toolCall) {
          const toolName = toolCall.function?.name || 'unknown';
          logger.debug(`Voice Agent calling tool: ${toolName}`);

          const toolDisplayNames: Record<string, string> = {
            'optimize_prompt': 'Optimizing prompt',
            'generate_image': 'Generating image',
            'generate_image_metadata': 'Creating title & description',
            'publish_image': 'Preparing for publish',
          };

          const displayName = toolDisplayNames[toolName] || toolName;
          voicePopupRef.current?.addToolCall(displayName);
        }
      }
    });

    if (result.success) {
      // Extract and add generated images
      const imageToolCall = result.toolCalls?.find(
        tc => 'function' in tc && tc.function?.name === 'generate_image'
      );

      if (imageToolCall && 'function' in imageToolCall) {
        let imageResult: any;

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
          console.warn('🎤 No image result found in voice agent tool responses');
          logger.warning('Voice Agent completed but no images were returned');
          setImages(prev => prev.filter(img => img.id !== placeholderId));
          voicePopupRef.current?.setGenerating(false);
          return;
        }

        // Handle multiple images
        if (imageResult.images && Array.isArray(imageResult.images)) {
          const newImages: ImageFile[] = [];
          for (let i = 0; i < imageResult.images.length; i++) {
            const img = imageResult.images[i];
            const newImage: ImageFile = {
              id: `voice-agent-${Date.now()}-${i}`,
              src: img.imageUrl,
              title: `Voice: ${transcribedText.substring(0, 40)}...`,
              selected: i === imageResult.images.length - 1,
              isGenerated: true,
              aiText: img.text
            };
            newImages.push(newImage);
          }

          setImages(prev => {
            const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
            return [...withoutPlaceholder, ...newImages];
          });

          logger.success(`Voice Agent generated ${newImages.length} image(s)`);
        } else if (imageResult.imageUrl) {
          // Single image format
          const newImage: ImageFile = {
            id: `voice-agent-${Date.now()}`,
            src: imageResult.imageUrl,
            title: `Voice: ${transcribedText.substring(0, 40)}...`,
            selected: true,
            isGenerated: true,
            aiText: imageResult.text
          };

          setImages(prev => {
            const withoutPlaceholder = prev.filter(img => img.id !== placeholderId);
            return [...withoutPlaceholder, newImage];
          });

          logger.success('Voice Agent generated image');
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
        }
        if (metadataResult.description) {
          setPostDescription(metadataResult.description);
        }
      }

      toast.success('Voice Agent completed!');
      logger.success('Voice Agent workflow completed');

      // Close popup after showing results
      setTimeout(() => {
        voicePopupRef.current?.setGenerating(false);
      }, 2000);
    } else {
      toast.error('Voice Agent failed: ' + (result.error || 'Unknown error'));
      logger.error(`Voice Agent failed: ${result.error || 'Unknown error'}`);
      voicePopupRef.current?.setGenerating(false);
      setImages(prev => prev.filter(img => img.id !== placeholderId));
    }
  } catch (error: any) {
    console.error('Error in voice agent:', error);
    logger.error(`Voice Agent error: ${error.message}`);
    toast.error('Voice Agent error: ' + error.message);
    voicePopupRef.current?.setGenerating(false);
    setImages(prev => prev.filter(img => img.id !== placeholderId));
  }
};





