import React, { useState, useEffect } from 'react';
import { ImageFile, PromptTemplate } from '../types';
import { QUICK_ACTIONS } from '../constants';
import ImageGallery from './ImageGallery';
import { useDropZone } from '../hooks/useDropZone';
import TemplateManager from './TemplateManager';
import { tauriApi } from '../lib/tauriApi';
import log from '../lib/log';
import { Eraser, Sparkles, Crop, Palette, Package, FolderOpen, Plus, History, ChevronUp, ChevronDown } from 'lucide-react';
import { T } from '../i18n';

function arrayBufferToBase64(buffer: number[]) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getActionIcon(iconName: string) {
  const iconMap = {
    'Eraser': Eraser,
    'Sparkles': Sparkles,
    'Crop': Crop,
    'Palette': Palette,
    'Package': Package
  };
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent size={16} /> : <span>{iconName}</span>;
}

interface PromptFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  dst: string;
  setDst: (dst: string) => void;
  openSaveDialog: () => void;
  openFilePicker: () => void;
  files: ImageFile[];
  getSelectedImages: () => ImageFile[];
  clearAllFiles: () => void;
  handleImageSelection: (path: string, isMultiSelect: boolean) => void;
  removeFile: (path: string) => void;
  isGenerating: boolean;
  saveAndClose: () => void;
  submit: () => void;
  addImageFromUrl: (url: string) => void;
  onImageDelete?: (path: string) => void;
  onImageSaveAs?: (path: string) => void;
  addFiles: (paths: string[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  prompts: PromptTemplate[];
  setPrompts: (prompts: PromptTemplate[]) => void;
  savePrompts: (prompts: PromptTemplate[]) => void;
  importPrompts: () => void;
  exportPrompts: () => void;
  quickStyles: readonly string[];
  appendStyle: (style: string) => void;
  quickActions: typeof QUICK_ACTIONS;
  executeQuickAction: (action: { name: string; prompt: string; iconName: string }) => Promise<void>;
  promptHistory: string[];
  historyIndex: number;
  navigateHistory: (direction: 'up' | 'down') => void;
  fileHistory: string[];
  showFileHistory: boolean;
  setShowFileHistory: (show: boolean) => void;
  openFileFromHistory: (filePath: string) => Promise<void>;
  onFileHistoryCleanup: (validFiles: string[]) => Promise<void>;
  onLightboxPromptSubmit: (prompt: string, imagePath: string) => Promise<void>;
  errorMessage?: string | null;
  setErrorMessage?: (message: string | null) => void;
}

const PromptForm: React.FC<PromptFormProps> = ({
  prompt,
  setPrompt,
  dst,
  setDst,
  openSaveDialog,
  openFilePicker,
  files,
  getSelectedImages,
  clearAllFiles,
  handleImageSelection,
  removeFile,
  isGenerating,
  saveAndClose,
  submit,
  addImageFromUrl,
  onImageDelete,
  onImageSaveAs,
  addFiles,
  currentIndex,
  setCurrentIndex,
  prompts,
  setPrompts,
  savePrompts,
  importPrompts,
  exportPrompts,
  quickStyles,
  appendStyle,
  quickActions,
  executeQuickAction,
  promptHistory,
  historyIndex,
  navigateHistory,
  fileHistory,
  showFileHistory,
  setShowFileHistory,
  openFileFromHistory,
  onFileHistoryCleanup,
  onLightboxPromptSubmit,
  errorMessage,
  setErrorMessage,
}) => {
  const selectedCount = getSelectedImages().length;
  const { ref: dropZoneRef, dragIn } = useDropZone({ onDrop: addFiles });
  const [historyImages, setHistoryImages] = useState<ImageFile[]>([]);
  const [historyCurrentIndex, setHistoryCurrentIndex] = useState(0);

  // Handle clipboard paste for images
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    try {
      log.info('📋 Paste event detected, checking for images...');
      
      // Try to get images from clipboard using our stubbed API
      const result = await tauriApi.parseClipboardImages('png', '');
      
      if (result?.success && result.paths && result.paths.length > 0) {
        log.info(`📋 Found ${result.paths.length} image(s) in clipboard`, {
          paths: result.paths.map(p => p.split(/[/\\]/).pop())
        });
        
        // Add the clipboard images to the files
        addFiles(result.paths);
        
        // Prevent default paste behavior since we handled it
        e.preventDefault();
      } else if (result?.error) {
        log.warn('📋 No images found in clipboard or error occurred', { error: result.error });
      } else {
        log.debug('📋 No images in clipboard, allowing normal paste');
      }
    } catch (error) {
      log.error('📋 Failed to parse clipboard', { error: (error as Error).message });
    }
  };

  // Load images for file history when modal opens
  useEffect(() => {
    if (showFileHistory && fileHistory.length > 0) {
      const loadHistoryImages = async () => {
        const imageFiles: ImageFile[] = [];
        const validFiles: string[] = [];
        
        for (const filePath of fileHistory) {
          try {
            // First check if file exists, then read it
            log.debug(`Checking file: ${filePath}`);
            const buffer = await tauriApi.fs.readFile(filePath);
            // Use the same conversion method as main app
            const base64 = arrayBufferToBase64(Array.from(buffer));
            const ext = filePath.toLowerCase().split('.').pop();
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            const src = `data:${mimeType};base64,${base64}`;
            imageFiles.push({ 
              path: filePath, 
              src, 
              isGenerated: true,
              selected: false 
            });
            validFiles.push(filePath);
          } catch (error) {
            // File doesn't exist, skip it and log with full path
            log.warn(`File not found in history: ${filePath}`, {
              filename: filePath.split(/[/\\]/).pop(),
              fullPath: filePath,
              error: (error as Error).message
            });
          }
        }
        
        // If some files were invalid, update the fileHistory and store
        if (validFiles.length !== fileHistory.length) {
          log.info(`Cleaning up file history: ${fileHistory.length - validFiles.length} invalid files removed`);
          try {
            await onFileHistoryCleanup(validFiles);
            log.info('💾 File history cleaned and saved');
          } catch (cleanupError) {
            log.error('Failed to cleanup file history', { error: (cleanupError as Error).message });
          }
        }
        
        setHistoryImages(imageFiles);
        setHistoryCurrentIndex(0);
      };
      loadHistoryImages();
    } else if (showFileHistory) {
      // No file history, show empty state immediately
      setHistoryImages([]);
    }
  }, [showFileHistory, fileHistory]);

  return (
    <form
      className="flex flex-col items-center glass-card p-4 sm:p-8 glass-shimmer shadow-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="w-full space-y-6">
        {/* Two-column layout: Text Input + Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Text input area only */}
          <div>
            <div className="border-2 border-slate-200 dark:border-white/40 rounded-xl p-3 sm:p-4 focus-within:border-indigo-500 dark:focus-within:border-cyan-400 transition-colors duration-200">
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.currentTarget.value)}
                onPaste={handlePaste}
                placeholder="Describe the image you want to generate or edit... (Ctrl+V to paste images)"
                className="w-full bg-transparent border-none outline-none min-h-[120px] resize-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-300"
                rows={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submit();
                  } else if (e.key === 'ArrowUp' && e.ctrlKey) {
                    e.preventDefault();
                    navigateHistory('up');
                  } else if (e.key === 'ArrowDown' && e.ctrlKey) {
                    e.preventDefault();
                    navigateHistory('down');
                  }
                }}
              />
            </div>
          </div>
          
          
          {/* Right column: Action buttons (Generate + Styles + Actions) */}
          <div className="space-y-4">
            {/* Generate Button + History Navigation */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1 glass-button bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <T>Generating...</T>
                  </span>
                ) : (
                  <>🎨 <T>Generate Image</T></>
                )}
              </button>
              
              {/* History Navigation */}
              {promptHistory.length > 0 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => navigateHistory('up')}
                    disabled={isGenerating}
                    className="glass-button px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    title={`Previous prompt (${historyIndex + 1}/${promptHistory.length}) - Ctrl+↑`}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateHistory('down')}
                    disabled={isGenerating}
                    className="glass-button px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    title={`Next prompt - Ctrl+↓`}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>
            {/* Quick Styles - Compact */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2"><T>Styles</T></h4>
              <div className="flex flex-wrap gap-1">
                {quickStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => appendStyle(style)}
                    className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white transition-colors duration-200"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quick Actions - Icons Only */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2"><T>Actions</T></h4>
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action) => {
                  const hasSelectedImages = getSelectedImages().length > 0;
                  const hasAnyImages = files.length > 0;
                  return (
                    <button
                      key={action.name}
                      type="button"
                      onClick={() => executeQuickAction(action)}
                      disabled={isGenerating || !hasSelectedImages}
                      className={`text-lg px-2 py-2 rounded transition-colors duration-200 ${
                        !hasAnyImages 
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : !hasSelectedImages
                          ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 cursor-not-allowed'
                          : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300'
                      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!hasAnyImages ? 'Add an image first' : !hasSelectedImages ? 'Select an image first' : action.name}
                    >
                      {getActionIcon(action.iconName)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <TemplateManager
          prompts={prompts}
          currentPrompt={prompt}
          onSelectPrompt={setPrompt}
          onSavePrompt={(name, text) => {
            const newPrompts = [...prompts, { name, text }];
            setPrompts(newPrompts);
            savePrompts(newPrompts);
          }}
          onImportPrompts={importPrompts}
          onExportPrompts={exportPrompts}
        />

        {/* Two-column layout: Destination + Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Output destination */}
          <div className="border border-slate-200/50 dark:border-white/30 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/90">
            <label htmlFor="output-path" className="block text-sm font-semibold text-slate-700 dark:text-white mb-2">
              <T>Output File Path</T>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="output-path"
                type="text"
                value={dst}
                onChange={(e) => setDst(e.target.value)}
                placeholder="output.png"
                className="flex-1 glass-input p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={openSaveDialog}
                className="glass-button font-semibold py-4 px-4 rounded-xl whitespace-nowrap flex items-center gap-2"
                title="Browse for save location"
              >
                <FolderOpen size={16} />
                <T>Browse</T>
              </button>
            </div>
          </div>

          {/* Right: Source images */}
          <div 
            ref={dropZoneRef}
            className={`p-4 rounded-xl border-2 border-dashed transition-all duration-300 bg-slate-50/30 dark:bg-slate-800/90 ${dragIn ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300/50 dark:border-white/30'}`}
          >
          <div className="space-y-3">
            <button
              type="button"
              onClick={openFilePicker}
              className="w-full glass-button font-semibold py-4 px-6 rounded-xl hover:border-slate-400/60 dark:hover-border-slate-500/60 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            >
              <FolderOpen size={20} />
              <T>Select Images (or Drop Here)</T>
            </button>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => addImageFromUrl('https://picsum.photos/640/640')}
                className="glass-button py-2 px-3 rounded-lg"
                title="Add random image from URL"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowFileHistory(true)}
                disabled={fileHistory.length === 0}
                className="glass-button py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title={fileHistory.length > 0 ? `Open from history (${fileHistory.length} files)` : 'No file history yet'}
              >
                <History size={16} />
              </button>
            </div>
          </div>
          </div>
        </div>

      {files.length > 0 && (
        <div className="w-full mt-4 sm:mt-6 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Images ({files.length})
              {selectedCount > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • {selectedCount} selected
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={clearAllFiles}
              className="glass-button border-red-400/50 text-red-600 hover:bg-red-500/20 text-sm px-3 py-2 rounded-lg"
              title="Remove all images"
            >
              Clear All
            </button>
          </div>

          <div className="border border-slate-200/30 dark:border-slate-700/30 rounded-lg p-4 bg-white/50 dark:bg-slate-900/50">
            <ImageGallery
              images={files}
              onImageSelection={handleImageSelection}
              onImageRemove={removeFile}
              onImageSaveAs={onImageSaveAs}
              showSelection={true}
              onImageDelete={onImageDelete}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onLightboxPromptSubmit={onLightboxPromptSubmit}
              promptHistory={promptHistory}
              historyIndex={historyIndex}
              navigateHistory={navigateHistory}
              isGenerating={isGenerating}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          </div>
        </div>
      )}

      <div className="w-full mt-8 space-y-3">
        {files.some(file => file.path.startsWith('generated_')) && (
          <button
            type="button"
            onClick={saveAndClose}
            className="w-full glass-button border-green-400/50 text-green-700 dark:text-green-400 hover:bg-green-500/20 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isGenerating}
          >
            <span className="flex items-center justify-center gap-2">
              💾 Save Last Generated Image and Close
            </span>
          </button>
        )}
      </div>
      </div>

      {/* File History Modal */}
      {showFileHistory && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">File History</h3>
              <button
                onClick={() => setShowFileHistory(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {historyImages.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  {fileHistory.length === 0 
                    ? "No file history yet. Generated images will appear here."
                    : "Loading images from history..."
                  }
                </div>
              ) : (
                <ImageGallery
                  images={historyImages}
                  onImageSelection={(imagePath: string) => {
                    // Single click selects for preview
                    setHistoryImages(prev => 
                      prev.map(img => ({ 
                        ...img, 
                        selected: img.path === imagePath 
                      }))
                    );
                  }}
                  onImageRemove={undefined}
                  onImageDelete={undefined}
                  onImageSaveAs={undefined}
                  showSelection={false}
                  currentIndex={historyCurrentIndex}
                  setCurrentIndex={setHistoryCurrentIndex}
                  onDoubleClick={(imagePath: string) => {
                    // Double click picks the image and closes modal
                    openFileFromHistory(imagePath);
                  }}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default PromptForm;
