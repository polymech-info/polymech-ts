/**
 * ChatComposer — input area with textarea, attachment thumbnails,
 * drag-drop zone, image picker, send/cancel, and prompt history.
 */

import React from 'react';
import {
    Send, Square, Paperclip, ImageIcon, Upload,
    ChevronUp, ChevronDown, X, FileText, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import type { ImageAttachment, FileContext } from '../types';

interface ChatComposerProps {
    input: string;
    onInputChange: (v: string) => void;
    attachments: ImageAttachment[];
    isGenerating: boolean;
    isDragging: boolean;
    canSend: boolean;
    showImagePicker: boolean;
    isRecording?: boolean;
    isTranscribing?: boolean;
    // Refs
    composerRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    // Prompt history
    promptHistory: string[];
    historyIndex: number;
    navigateHistory: (dir: 'up' | 'down') => void;
    // Handlers
    onSend: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onRemoveAttachment: (id: string) => void;
    onToggleRecording?: () => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onOpenFilePicker: () => void;
    onOpenGallery: () => void;
    onCloseGallery: () => void;
    onPickerSelect: (pics: any[]) => void;
    onPickerSelectSingle: (pic: any) => void;
    // File contexts
    fileContexts?: FileContext[];
    onRemoveFileContext?: (path: string) => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({
    input, onInputChange, attachments, isGenerating, isDragging, canSend,
    showImagePicker, isRecording, isTranscribing,
    composerRef, inputRef, fileInputRef,
    promptHistory, historyIndex, navigateHistory,
    onSend, onCancel, onKeyDown, onPaste,
    onRemoveAttachment, onToggleRecording, onFileInputChange,
    onDragEnter, onDragLeave, onDragOver, onDrop,
    onOpenFilePicker, onOpenGallery, onCloseGallery,
    onPickerSelect, onPickerSelectSingle,
    fileContexts, onRemoveFileContext,
}) => (
    <>
        <div
            ref={composerRef}
            className={`border-t p-2 sm:p-3 flex flex-col h-full min-w-0 w-full relative transition-all duration-200 ${isDragging ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}`}
            data-testid="chat-composer"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center rounded-b-lg z-10 pointer-events-none border-2 border-dashed border-primary">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Upload className="h-5 w-5 animate-bounce" />
                        Drop images to attach
                    </div>
                </div>
            )}

            {/* Attachment thumbnails */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap flex-shrink-0" data-testid="chat-attachments">
                    {attachments.map(att => (
                        <div
                            key={att.id}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted/30 group flex-shrink-0"
                        >
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            <button
                                onClick={() => onRemoveAttachment(att.id)}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 truncate">
                                {att.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* File context chips */}
            {fileContexts && fileContexts.length > 0 && (
                <div className="flex gap-1.5 mb-2 flex-wrap flex-shrink-0" data-testid="chat-file-contexts">
                    {fileContexts.map(fc => (
                        <div
                            key={`${fc.mount}:${fc.path}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-xs font-mono group"
                            title={`${fc.mount}:/${fc.path} (${fc.content.length} chars)`}
                        >
                            <FileText className="h-3 w-3 text-teal-500 flex-shrink-0" />
                            <span className="text-teal-300 truncate max-w-[120px]">{fc.name}</span>
                            {onRemoveFileContext && (
                                <button
                                    onClick={() => onRemoveFileContext(fc.path)}
                                    className="p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove file context"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="flex gap-2 items-end flex-1 min-w-0 min-h-0">
                {/* Attach buttons */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                        variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={onOpenFilePicker}
                        disabled={isGenerating}
                        title="Attach image file"
                        data-testid="chat-attach-file-btn"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={onOpenGallery}
                        disabled={isGenerating}
                        title="Pick from gallery"
                        data-testid="chat-attach-gallery-btn"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileInputChange}
                />

                <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => onInputChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder={
                        attachments.length > 0
                            ? 'Add a message about these images... (Enter to send)'
                            : 'Type a message... (Enter to send, Ctrl+↑/↓ for history)'
                    }
                    rows={2}
                    className="resize-none flex-1 h-full min-h-[44px] sm:min-h-[56px] text-sm"
                    disabled={isGenerating}
                    data-testid="chat-input"
                />

                {/* History navigation — desktop only */}
                {promptHistory.length > 0 && (
                    <div className="hidden sm:flex flex-col gap-0.5">
                        <Button
                            variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => navigateHistory('up')}
                            disabled={isGenerating}
                            title={`Previous prompt (${historyIndex + 1}/${promptHistory.length}) — Ctrl+↑`}
                        >
                            <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => navigateHistory('down')}
                            disabled={isGenerating || historyIndex <= -1}
                            title="Next prompt — Ctrl+↓"
                        >
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <div className="flex flex-col gap-1 items-center justify-end">
                    {onToggleRecording && (
                        <Button
                            variant={isRecording ? 'destructive' : 'ghost'}
                            size="icon" className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${isRecording ? 'animate-pulse ring-2 ring-destructive ring-offset-2 ring-offset-background' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={onToggleRecording}
                            disabled={isGenerating || isTranscribing}
                            title={isRecording ? "Stop recording" : "Record audio"}
                            data-testid="chat-record-btn"
                        >
                            {isTranscribing ? <Upload className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : 
                             isRecording ? <Square className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                             <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </Button>
                    )}
                    {isGenerating ? (
                        <Button
                            onClick={onCancel}
                            variant="destructive" size="icon"
                            className="h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] flex-shrink-0"
                            data-testid="chat-cancel-btn"
                        >
                            <Square className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={onSend}
                            disabled={!canSend}
                            size="icon"
                            className="h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] flex-shrink-0"
                            data-testid="chat-send-btn"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>

        {/* Image Picker Dialog */}
        <ImagePickerDialog
            isOpen={showImagePicker}
            onClose={onCloseGallery}
            onSelectPicture={onPickerSelectSingle}
            onMultiSelectPictures={onPickerSelect}
            multiple={true}
        />
    </>
);

export default ChatComposer;
