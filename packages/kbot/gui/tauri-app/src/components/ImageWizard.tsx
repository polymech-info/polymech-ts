import React, { useState, useEffect } from "react";
import { ImageFile, PromptTemplate } from "../types";
import { useTauriListeners } from "../hooks/useTauriListeners";
import { tauriApi } from "../lib/tauriApi";
import { saveToStore } from "../lib/init";
import { QUICK_STYLES, QUICK_ACTIONS } from "../constants";
import log from "../lib/log";
import Header from "./Header";
import PromptForm from "./PromptForm";
import DebugPanel from "./DebugPanel";
import { T } from "../i18n";

function arrayBufferToBase64(buffer: number[]) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface ImageWizardProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ImageWizard: React.FC<ImageWizardProps> = ({
  apiKey,
  setApiKey,
  isDarkMode,
  toggleTheme,
}) => {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [dst, setDst] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugMessages, setDebugMessages] = useState<any[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize logging system and connect to UI
  useEffect(() => {
    log.setMessageCallback((message) => {
      setDebugMessages(prev => [...prev.slice(-99), message]);
    });
    
    // Load existing messages
    setDebugMessages(log.getLocalMessages());
  }, []);

  const [ipcInitialized, setIpcInitialized] = useState(false);
  const [messageToSend, setMessageToSend] = useState("");
  const [generationTimeoutId, setGenerationTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fileHistory, setFileHistory] = useState<string[]>([]);
  
  // Debug wrapper for setFileHistory
  const setFileHistoryWithLogging = (history: string[]) => {
    log.debug(`🔧 setFileHistory called with ${history.length} files`, {
      files: history.map(f => f.split(/[/\\]/).pop())
    });
    setFileHistory(history);
  };
  const [showFileHistory, setShowFileHistory] = useState(false);

  // All the existing functions from App.tsx...
  const appendStyle = (style: string) => {
    setPrompt(prev => {
      const trimmed = prev.trim();
      
      // Remove any existing styles from QUICK_STYLES
      let cleanPrompt = trimmed;
      QUICK_STYLES.forEach(existingStyle => {
        // Remove style if it exists (with or without comma)
        const patterns = [
          new RegExp(`,\\s*${existingStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi'),
          new RegExp(`^${existingStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?\\s*`, 'gi'),
          new RegExp(`\\s*,\\s*${existingStyle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'gi')
        ];
        patterns.forEach(pattern => {
          cleanPrompt = cleanPrompt.replace(pattern, '');
        });
      });
      
      // Clean up any double commas or trailing/leading commas
      cleanPrompt = cleanPrompt.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
      
      // Add the new style
      if (cleanPrompt) {
        return `${cleanPrompt}, ${style}`;
      } else {
        return style;
      }
    });
    log.info(`🎨 Style replaced with: ${style}`);
  };

  const executeQuickAction = async (action: { name: string; prompt: string; iconName: string }) => {
    const selectedImages = getSelectedImages();
    
    if (selectedImages.length === 0) {
      log.warn('Please select an image first to use quick actions');
      return;
    }
    
    // Use the first selected image
    const targetImage = selectedImages[0];
    
    // Set the action prompt
    setPrompt(action.prompt);
    
    // Generate with the selected image
    log.info(`🚀 Executing quick action: ${action.name} on selected image ${targetImage.path}`);
    await generateImage(action.prompt, [targetImage]);
  };

  const addToHistory = async (promptText: string) => {
    if (promptText.trim() && !promptHistory.includes(promptText.trim())) {
      const newHistory = [...promptHistory, promptText.trim()];
      setPromptHistory(newHistory);
      setHistoryIndex(-1); // Reset to end of history
      log.info(`📝 Added to history: "${promptText.substring(0, 50)}..."`);
      
      // Auto-save to store
      try {
        await saveToStore({ history: newHistory });
        log.info('💾 History saved to store');
      } catch (error) {
        log.error('Failed to save history', { error: (error as Error).message });
      }
    }
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (promptHistory.length === 0) return;
    
    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = historyIndex === -1 ? promptHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : historyIndex + 1;
      if (newIndex >= promptHistory.length) newIndex = -1;
    }
    
    setHistoryIndex(newIndex);
    
    if (newIndex === -1) {
      setPrompt('');
    } else {
      setPrompt(promptHistory[newIndex]);
      log.info(`📜 History: ${newIndex + 1}/${promptHistory.length}`);
    }
  };

  const addToFileHistory = async (filePath: string) => {
    if (!filePath) return;
    
    // Use functional update to get current state
    setFileHistory(currentHistory => {
      // Remove if already exists, then add to front, then limit to 8
      const filteredHistory = currentHistory.filter(path => path !== filePath);
      const newFileHistory = [filePath, ...filteredHistory].slice(0, 8);
      
      log.info(`📁 Adding to file history: ${filePath.split(/[/\\]/).pop()}`, {
        currentHistoryLength: currentHistory.length,
        newHistoryLength: newFileHistory.length,
        fullPath: filePath,
        maxEntries: 8
      });
      
      // Auto-save to store
      saveToStore({ fileHistory: newFileHistory }).then(() => {
        log.info('💾 File history saved to store', {
          savedCount: newFileHistory.length,
          savedFiles: newFileHistory.map(f => f.split(/[/\\]/).pop())
        });
      }).catch(error => {
        log.error('Failed to save file history', { error: error.message });
      });
      
      return newFileHistory;
    });
  };

  const openFileFromHistory = async (filePath: string) => {
    try {
      if (await tauriApi.fs.readFile(filePath)) {
        await addFiles([filePath]);
        setShowFileHistory(false);
        log.info(`📂 Reopened from history: ${filePath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      log.error(`File no longer exists: ${filePath.split(/[/\\]/).pop()}`);
      // Remove from history if file doesn't exist
      const updatedHistory = fileHistory.filter(f => f !== filePath);
      setFileHistoryWithLogging(updatedHistory);
      await saveToStore({ fileHistory: updatedHistory });
    }
  };

  const onFileHistoryCleanup = async (validFiles: string[]) => {
    setFileHistoryWithLogging(validFiles);
    await saveToStore({ fileHistory: validFiles });
  };

  const handleLightboxPromptSubmit = async (promptText: string, imagePath: string) => {
    // Set the prompt and select the image for editing
    setPrompt(promptText);
    
    // Find and select the image
    setFiles(prev => prev.map(file => ({
      ...file,
      selected: file.path === imagePath
    })));
    
    // Add to history and generate
    await addToHistory(promptText);
    await generateImage(promptText, [{ path: imagePath, src: '', isGenerated: false }]);
    
    log.info(`🎨 Lightbox edit: "${promptText}" on ${imagePath.split(/[/\\]/).pop()}`);
  };

  const importPrompts = async () => {
    try {
      const selected = await tauriApi.dialog.open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (typeof selected === 'string') {
        const contents = await tauriApi.fs.readTextFile(selected);
        const newPrompts = JSON.parse(contents);
        if (newPrompts.prompts && Array.isArray(newPrompts.prompts)) {
            setPrompts(newPrompts.prompts);
            savePrompts(newPrompts.prompts);
            log.info(`✅ Prompts imported successfully from: ${selected}`);
        } else {
            log.error('Invalid prompts file format.');
        }
      }
    } catch (error) {
      log.error('Failed to import prompts', { error: (error as Error).message });
    }
  };

  const exportPrompts = async () => {
    log.info('Attempting to export prompts...');
    try {
      const path = await tauriApi.dialog.save({
        defaultPath: 'kbot-prompts.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (path) {
        log.debug(`📂 Export path selected: ${path}`);
        const dataToWrite = JSON.stringify({ prompts }, null, 2);
        log.debug('📋 Data to be exported:', { promptCount: prompts.length, dataLength: dataToWrite.length });
        log.debug('💾 About to call writeTextFile...');
        await tauriApi.fs.writeTextFile(path, dataToWrite);
        log.info(`✅ Prompts exported successfully to: ${path}`);
      } else {
        log.info('Export dialog was cancelled.');
      }
    } catch (error) {
      log.error('Failed to export prompts', { error: (error as Error).message });
    }
  };

  const deleteFilePermanently = async (pathToDelete: string) => {
    log.info(`Requesting deletion of file: ${pathToDelete}`);
    // This will be the new tauri command
    await tauriApi.requestFileDeletion({ path: pathToDelete });
  };

  const saveImageAs = async (imagePath: string) => {
    const imageFile = files.find(f => f.path === imagePath);
    if (!imageFile) {
      log.error(`Could not find image to save: ${imagePath}`);
      return;
    }

    try {
      const defaultPath = imagePath.split(/[/\\]/).pop() || 'saved_image.png';
      const newPath = await tauriApi.dialog.save({
        defaultPath,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
      });

      if (newPath) {
        // Convert data URL to binary using fetch
        const response = await fetch(imageFile.src);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        await tauriApi.fs.writeFile(newPath, uint8Array);
        log.info(`✅ Image saved successfully to: ${newPath}`);
      } else {
        log.info('Save dialog was cancelled.');
      }
    } catch (error) {
      log.error(`Failed to save image: ${(error as Error).message}`);
    }
  };

  const generateDefaultDst = (fileCount: number, firstFilePath?: string) => {
    if (fileCount === 1 && firstFilePath) {
      const parsedPath = firstFilePath.split(/[/\\]/).pop() || 'image';
      const nameWithoutExt = parsedPath.replace(/\.[^/.]+$/, "");
      return `${nameWithoutExt}_out.png`;
    } else {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `data_${hours}_${minutes}.png`;
    }
  };

  const addImageFromUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newImageFile: ImageFile = {
          path: `url_${Date.now()}.jpg`,
          src: base64data,
        };
        setFiles(prevFiles => [...prevFiles, newImageFile]);
      };
    } catch (error) {
      console.error('Failed to add image from URL:', error);
    }
  };

  useTauriListeners({
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
    setFileHistory: setFileHistoryWithLogging,
    addToFileHistory,
    setErrorMessage,
  });

  const addFiles = async (newPaths: string[]) => {
    const uniqueNewPaths = newPaths.filter(newPath => !files.some(f => f.path === newPath));
    
    if (uniqueNewPaths.length === 0) {
      return;
    }
    
    // Update destination directory
    const firstPath = uniqueNewPaths[0];
    
    // Check if this is a clipboard image (from temp directory)
    const isClipboardImage = firstPath.includes('kbot_clipboard_') || 
                            firstPath.includes('\\Temp\\') || // Windows temp
                            firstPath.includes('/tmp/') || // Unix/Linux temp
                            firstPath.includes('AppData\\Local\\Temp') || // Windows user temp
                            firstPath.includes('/var/folders/'); // macOS temp
    
    let newDir: string;
    if (isClipboardImage) {
      // For clipboard images, use current working directory or user's Documents folder
      newDir = './'; // Use current working directory
      log.info('📋 Clipboard image detected, using current working directory for output');
    } else {
      // For regular files, use the directory of the first file
      const lastSeparatorIndex = Math.max(firstPath.lastIndexOf('/'), firstPath.lastIndexOf('\\'));
      newDir = firstPath.substring(0, lastSeparatorIndex);
    }
    
    const currentFilename = dst.split(/[/\\]/).pop() || generateDefaultDst(1, firstPath);
    const separator = firstPath.includes('\\') ? '\\' : '/';
    const newDst = newDir === './' ? currentFilename : `${newDir}${separator}${currentFilename}`;
    setDst(newDst);

    // Read files
    const newImageFiles: ImageFile[] = [];
    for (const path of uniqueNewPaths) {
      try {
        const buffer = await tauriApi.fs.readFile(path);
        const base64 = arrayBufferToBase64(Array.from(buffer));
        const mimeType = path.toLowerCase().endsWith('.png') ? 'image/png' : 
                        path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
            'image/png';
        const src = `data:${mimeType};base64,${base64}`;
        newImageFiles.push({ path, src, selected: false, isGenerated: false });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
        console.error(`Failed to read file: ${path}`, e);
        tauriApi.logErrorToConsole(`[Frontend Error] Failed to read file ${path}: ${errorMessage}`);
      }
    }
    
    const lastPath = uniqueNewPaths[uniqueNewPaths.length - 1];

    setFiles(prevFiles => {
      const combinedFiles = [...prevFiles, ...newImageFiles];
      const newIndex = combinedFiles.findIndex(f => f.path === lastPath);
      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
      }
      
      return combinedFiles.map(file => ({
          ...file,
          selected: file.path === lastPath
      }));
    });
  };

  const removeFile = (pathToRemove: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.path !== pathToRemove));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleImageSelection = (imagePath: string, isMultiSelect: boolean) => {
    setFiles(prev => 
      prev.map(file => {
        if (file.path === imagePath) {
          // For multi-select, toggle the current state. For single-select, always select it.
          return { ...file, selected: isMultiSelect ? !file.selected : true };
        }
        // For single-select, deselect all other images.
        if (!isMultiSelect) {
          return { ...file, selected: false };
        }
        // For multi-select, leave other images as they are.
        return file;
      })
    );
  };

  const getSelectedImages = () => {
    return files.filter(file => file.selected);
  };

  const saveAndClose = async () => {
    // Find the last generated image
    const generatedFiles = files.filter(file => file.isGenerated);
    if (generatedFiles.length === 0) {
      log.warn('No generated images to save');
      return;
    }

    const lastGenerated = generatedFiles[generatedFiles.length - 1];
    log.info(`💾 Saving and closing with: ${lastGenerated.path}`);

    try {
      // Send the final result back to images.ts for saving
      const result = {
        prompt,
        files: files.filter(f => !f.isGenerated).map(f => f.path),
        dst,
        generatedImage: {
          src: lastGenerated.src,
          filename: lastGenerated.path
        }
      };

      await tauriApi.submitPrompt(result);

      log.info('✅ Final result sent, closing app');
    } catch (error) {
      log.error('Failed to save and close', { error: (error as Error).message });
    }
  };

  const generateImage = async (promptText: string, includeImages: ImageFile[] = []) => {
    if (!apiKey) {
      log.error('No API key available for image generation');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null); // Clear any previous error messages
    log.info(`🎨 Starting image generation via backend: "${promptText}"`);
    
    // Add placeholder image with spinner to the files grid
    const placeholderFile: ImageFile = {
      path: `generating_${Date.now()}`,
      src: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f1f5f9"/>
          <circle cx="100" cy="100" r="20" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round">
            <animate attributeName="stroke-dasharray" values="0 126;63 63;0 126" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" values="0;-63;-126" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <text x="100" y="140" text-anchor="middle" fill="#64748b" font-size="12">Generating...</text>
        </svg>
      `)
    };
    
    setFiles(prev => [...prev, placeholderFile]);
    
    try {
      // Use the images.ts backend instead of direct API calls
      const filePaths = includeImages.map(img => img.path);
      const genDst = dst || `generated_${Date.now()}.png`;
      
      log.info('Sending generation request to images.ts backend', {
        prompt: promptText,
        files: filePaths,
        dst: genDst
      });
      
      // Send generation request via Tauri command
      await tauriApi.generateImageViaBackend({
              prompt: promptText,
        files: filePaths,
        dst: genDst
      });
      
      log.info('📤 Generation request sent to backend');
      
      // Clear any existing timeout
      if (generationTimeoutId) {
        clearTimeout(generationTimeoutId);
      }
      
      const timeoutId = setTimeout(() => {
        log.warn('⏰ Generation timeout - resetting state');
        setIsGenerating(false);
        setFiles(prev => prev.filter(file => !file.path.startsWith('generating_')));
        setGenerationTimeoutId(null);
      }, 30000);
      
      setGenerationTimeoutId(timeoutId);
      
    } catch (error) {
      log.error('Failed to send generation request', {
        error: error instanceof Error ? error.message : JSON.stringify(error)
      });
      setIsGenerating(false);
      setFiles(prev => prev.filter(file => !file.path.startsWith('generating_')));
    }
  };

  // Auto-generate default destination file when files change
  useEffect(() => {
    if (files.length > 0 && !dst) {
      const defaultDst = generateDefaultDst(files.length, files[0]?.path);
      setDst(defaultDst);
    }
  }, [files, dst]);

  useEffect(() => {
    const logBaseDirectories = async () => {
    };
    logBaseDirectories();
  }, []);

  async function submit() {
    if (!prompt.trim()) {
      log.warn('Please enter a prompt first');
      return;
    }
    
    if (apiKey) {
      // Add to history before generating
      await addToHistory(prompt);
      
      // Generate image via backend (always chat mode now)
      // Only use explicitly selected images. If none are selected, generate from prompt alone.
      const imagesToUse = getSelectedImages();
      
      await generateImage(prompt, imagesToUse);
      // Don't clear prompt - let user iterate
    } else {
      log.error('API key required for image generation');
    }
  }

  const clearDebugMessages = async () => {
    setDebugMessages([]);
    log.clearLocalMessages();
    await tauriApi.clearDebugMessages();
  };

  const sendIPCMessage = async (messageType: string, data: any) => {
    await tauriApi.sendIPCMessage(messageType, data);
    log.info(`IPC message sent: ${messageType}`, data);
  };

  const sendMessageToImages = async () => {
    if (!messageToSend.trim()) return;
    
    const message = {
      message: messageToSend,
      timestamp: Date.now(),
      source: 'gui'
    };

    try {
      await tauriApi.sendMessageToStdout(JSON.stringify(message));
      log.info(`📤 Sent to images.ts: ${messageToSend}`, message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      log.error(`Failed to send message: ${errorMessage}`);
    }
    
    // Clear the input
    setMessageToSend('');
  };

  const savePrompts = async (promptsToSave: PromptTemplate[]) => {
    try {
      await saveToStore({ prompts: promptsToSave });
    } catch (error) {
      log.error('Failed to save prompts', { 
        error: (error as Error).message 
      });
    }
  };

  async function openFilePicker() {
    const { isTauri: isTauriEnv } = await tauriApi.ensureTauriApi();
    if (!isTauriEnv) {
      // Browser fallback: create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          const fileArray = Array.from(target.files);
          const newImageFiles: ImageFile[] = [];
          let loadedCount = 0;
          
          fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                newImageFiles.push({
                  path: file.name,
                  src: e.target.result as string
                });
                loadedCount++;
                if (loadedCount === fileArray.length) {
                  setFiles(prevFiles => [...prevFiles, ...newImageFiles]);
                }
              }
            };
            reader.readAsDataURL(file);
          });
        }
      };
      input.click();
      return;
    }
    
    try {
      if (!tauriApi.dialog.open) {
        console.error('Open function not available');
        return;
      }
      
      const selected = await tauriApi.dialog.open({
        multiple: true,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpeg', 'jpg']
        }]
      });
      if (Array.isArray(selected)) {
        addFiles(selected);
      }
    } catch (e) {
        console.error('File picker error:', e);
      tauriApi.logErrorToConsole(`[Frontend Error] File picker error: ${JSON.stringify(e)}`);
    }
  }

  async function openSaveDialog() {
    try {
      // Extract current filename from dst for default, or use smart default
      const currentFilename = dst.split(/[/\\]/).pop() || generateDefaultDst(files.length, files[0]?.path);
      
      const selected = await tauriApi.dialog.save({
        defaultPath: currentFilename,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg']
        }]
      });
      
      if (selected) {
        setDst(selected);
      }
    } catch (e) {
        console.error('Save dialog error:', e);
      tauriApi.logErrorToConsole(`[Frontend Error] Save dialog error: ${JSON.stringify(e)}`);
    }
  }

  return (
    <main className="h-full w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex flex-col items-center overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-200/30 to-blue-200/30 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-4xl relative z-10 h-full flex flex-col overflow-hidden p-2 sm:p-6">
        <Header
          showDebugPanel={showDebugPanel}
          setShowDebugPanel={setShowDebugPanel}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        
        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Generation Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  className="inline-flex bg-red-50 dark:bg-red-900/30 rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setErrorMessage(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <PromptForm
          prompt={prompt}
          setPrompt={setPrompt}
          dst={dst}
          setDst={setDst}
          openSaveDialog={openSaveDialog}
          openFilePicker={openFilePicker}
          files={files}
          getSelectedImages={getSelectedImages}
          clearAllFiles={clearAllFiles}
          handleImageSelection={handleImageSelection}
          removeFile={removeFile}
          isGenerating={isGenerating}
          saveAndClose={saveAndClose}
          submit={submit}
          addImageFromUrl={addImageFromUrl}
          onImageDelete={deleteFilePermanently}
          onImageSaveAs={saveImageAs}
          addFiles={addFiles}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          prompts={prompts}
          setPrompts={setPrompts}
          savePrompts={savePrompts}
          importPrompts={importPrompts}
          exportPrompts={exportPrompts}
          quickStyles={QUICK_STYLES}
          appendStyle={appendStyle}
          quickActions={QUICK_ACTIONS}
          executeQuickAction={executeQuickAction}
          promptHistory={promptHistory}
          historyIndex={historyIndex}
          navigateHistory={navigateHistory}
          fileHistory={fileHistory}
          showFileHistory={showFileHistory}
          setShowFileHistory={setShowFileHistory}
          openFileFromHistory={openFileFromHistory}
          onFileHistoryCleanup={onFileHistoryCleanup}
          onLightboxPromptSubmit={handleLightboxPromptSubmit}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <DebugPanel
            debugMessages={debugMessages}
            sendIPCMessage={sendIPCMessage}
            clearDebugMessages={clearDebugMessages}
            ipcInitialized={ipcInitialized}
            messageToSend={messageToSend}
            setMessageToSend={setMessageToSend}
            sendMessageToImages={sendMessageToImages}
          />
        )}
      </div>

    </main>
  );
};

export default ImageWizard;
