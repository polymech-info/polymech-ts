import { useEffect } from 'react';
import { tauriApi } from '../lib/tauriApi';
import { initializeApp, completeInitialization, InitCallbacks } from '../lib/init';
import log from '../lib/log';
import { TauriEvent } from '../constants';
import { ImageFile } from '../types';

interface TauriListenersProps extends InitCallbacks {
  setFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  isGenerating: boolean;
  generationTimeoutId: NodeJS.Timeout | null;
  setGenerationTimeoutId: (id: NodeJS.Timeout | null) => void;
  setIsGenerating: (generating: boolean) => void;
  prompt: string;
  setCurrentIndex: (index: number) => void;
  setPromptHistory: (history: string[]) => void;
  setFileHistory: (fileHistory: string[]) => void;
  addToFileHistory: (filePath: string) => Promise<void>;
  setErrorMessage?: (message: string | null) => void;
}

export function useTauriListeners({
  setPrompt,
  setDst,
  setApiKey,
  setIpcInitialized,
  setPrompts,
  setFiles,
  isGenerating,
  generationTimeoutId,
  setGenerationTimeoutId,
  setIsGenerating,
  prompt,
  setCurrentIndex,
  setPromptHistory,
  setFileHistory,
  addToFileHistory,
  setErrorMessage
}: TauriListenersProps) {
  useEffect(() => {
    let unlistenConfig: (() => void) | undefined;
    let unlistenImage: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    let unlistenComplete: (() => void) | undefined;
    let unlistenDeleted: (() => void) | undefined;
    let unlistenDeleteError: (() => void) | undefined;

    const setupListeners = async () => {
      // Initialize APIs first
      const { isTauri: isTauriEnv } = await tauriApi.ensureTauriApi();
      
      if (!isTauriEnv) {
        log.warn('Tauri APIs not available, running in browser mode.');
        return;
      }

      // Set up event listeners FIRST, before sending any requests
      const listeners = await Promise.all([
        tauriApi.listen(TauriEvent.CONFIG_RECEIVED, async (event: any) => {
          const data = event.payload;
          // Process config and update state
          const initCallbacks: InitCallbacks = {
            setPrompt,
            setDst,
            setApiKey,
            setPrompts,
            setIpcInitialized,
            setPromptHistory,
            setFileHistory
          };
          
          try {
            await completeInitialization(data, initCallbacks);
            log.info('✅ App initialization completed');
          } catch (error) {
            log.error('Failed to complete initialization', { 
              error: (error as Error).message 
            });
          }
        }),
        tauriApi.listen(TauriEvent.IMAGE_RECEIVED, (event: any) => {
          const imageData = event.payload;
      

          if (imageData.base64 && imageData.mimeType && imageData.filename) {
            const src = `data:${imageData.mimeType};base64,${imageData.base64}`;
            const isGeneratedImage = isGenerating || document.querySelector('[src^="data:image/svg+xml"]');

            if (isGeneratedImage) {
              const generatedImageFile: ImageFile = { path: imageData.filename, src, isGenerated: true, selected: true };
              setFiles(prev => {
                const withoutPlaceholder = prev.filter(file => !file.path.startsWith('generating_') && file.path !== imageData.filename);
                // Deselect all other images and select the new generated one
                const updatedFiles = withoutPlaceholder.map(file => ({ ...file, selected: false }));
                const newFiles = [...updatedFiles, generatedImageFile];
                
                // Update currentIndex to point to the new generated image
                setCurrentIndex(newFiles.length - 1);
                
                return newFiles;
              });

              if (generationTimeoutId) {
                clearTimeout(generationTimeoutId);
                setGenerationTimeoutId(null);
              }
              setIsGenerating(false);
              // Add to file history for easy reopening
              addToFileHistory(imageData.filename).catch(err => 
                log.error('Failed to add to file history', { error: err.message })
              );
            } else {
              const newImageFile: ImageFile = { path: imageData.filename, src, isGenerated: false };
              setFiles(prevFiles => {
                const exists = prevFiles.some(f => f.path === imageData.filename);
                if (!exists) {
                     return [...prevFiles, newImageFile];
                }
                log.warn(`🔄 Image already exists: ${imageData.filename}`);
                return prevFiles;
              });
            }
          } else {
            log.error('❌ Invalid image data received', {
              hasBase64: !!imageData.base64,
              hasMimeType: !!imageData.mimeType,
              hasFilename: !!imageData.filename,
            });
          }
        }),
        tauriApi.listen(TauriEvent.GENERATION_ERROR, (event: any) => {
          const errorData = event.payload;
          log.error('❌ Generation failed', errorData);
          setIsGenerating(false);
          setFiles(prev => prev.filter(file => !file.path.startsWith('generating_')));
          
          // Display error message to user
          if (setErrorMessage && errorData?.error) {
            setErrorMessage(errorData.error);
          }
        }),
        tauriApi.listen(TauriEvent.GENERATION_COMPLETE, (event: any) => {
            const completionData = event.payload;
            log.info('✅ Simple mode: Image generation completed', {
                dst: completionData.dst,
                prompt: completionData.prompt
            });
            setIsGenerating(false);
            setFiles(prev => prev.filter(file => !file.path.startsWith('generating_')));
        }),
        tauriApi.listen(TauriEvent.FILE_DELETED_SUCCESSFULLY, (event: any) => {
          const deletedPath = event.payload.path;
          log.info(`✅ File deleted successfully: ${deletedPath}`);
          setFiles(prevFiles => prevFiles.filter(file => file.path !== deletedPath));
        }),
        tauriApi.listen(TauriEvent.FILE_DELETION_ERROR, (event: any) => {
          const { path, error } = event.payload;
          log.error(`Failed to delete file: ${path}`, { error });
        })
      ]);

      [unlistenConfig, unlistenImage, unlistenError, unlistenComplete, unlistenDeleted, unlistenDeleteError] = listeners;
      
      // Send config request after listeners are ready
      try {
        await tauriApi.requestConfigFromImages();
        log.info('📤 Config request sent');
      } catch (error) {
        log.error('Failed to request config', { 
          error: (error as Error).message 
        });
      }
    };

    setupListeners();

    return () => {
      unlistenConfig?.();
      unlistenImage?.();
      unlistenError?.();
      unlistenComplete?.();
      unlistenDeleted?.();
      unlistenDeleteError?.();
    };
  }, []); // Empty dependency array to run only once on mount
}
