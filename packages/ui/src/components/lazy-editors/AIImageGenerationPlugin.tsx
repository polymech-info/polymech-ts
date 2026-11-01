import React, { useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, createCommand, LexicalCommand, $insertNodes } from 'lexical';
import { RealmPlugin, addComposerChild$, $createImageNode } from '@mdxeditor/editor';
import { AIImagePromptPopup } from './AIImagePromptPopup';
import { createImage, editImage } from '@/lib/image-router';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import { formatImageGenPrompt } from '@/constants';

export const OPEN_IMAGE_GEN_COMMAND: LexicalCommand<void> = createCommand('OPEN_IMAGE_GEN_COMMAND');

const AIImagePromptPopupWrapper = () => {
    const [editor] = useLexicalComposerContext();
    const [isOpen, setIsOpen] = useState(false);
    const [hasSelection, setHasSelection] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        return editor.registerCommand(
            OPEN_IMAGE_GEN_COMMAND,
            () => {
                // Check selection/content status when opening
                editor.getEditorState().read(() => {
                    const selection = $getSelection();
                    const textContent = editor.getEditorState().read(() => $getRoot().getTextContent());
                    setHasSelection($isRangeSelection(selection) && !selection.isCollapsed());
                    setHasContent(textContent.trim().length > 0);
                });
                setIsOpen(true);
                return true;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    const handleGenerate = async (prompt: string, provider: string, model: string, aspectRatio: string, contextMode: 'selection' | 'content' | 'none', referenceImages?: string[], applicationMode: 'replace' | 'insert' | 'append' = 'insert', resolution?: string, searchGrounding?: boolean, imageSearch?: boolean) => {
        const modelString = `${provider}/${model}`;
        if (!user?.id) {
            toast.error("You must be logged in to generate images.");
            return;
        }


        // ...

        let fullPrompt = prompt;
        // Augment prompt with context if requested
        if (contextMode !== 'none') {
            const contextText = await new Promise<string>((resolve) => {
                editor.getEditorState().read(() => {
                    let text = '';
                    if (contextMode === 'selection') {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            text = selection.getTextContent();
                        }
                    } else if (contextMode === 'content') {
                        text = $getRoot().getTextContent();
                    }
                    resolve(text);
                });
            });
            fullPrompt = formatImageGenPrompt(prompt, contextText);
        }

        try {
            let result;

            if (referenceImages && referenceImages.length > 0) {
                // Image-to-Image Generation (Reference Images)

                // Fetch images first
                const imageFiles = await Promise.all(referenceImages.map(async (url) => {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    // Extract filename from URL or default
                    const filename = url.split('/').pop() || 'reference.png';
                    return new File([blob], filename, { type: blob.type });
                }));

                result = await editImage(
                    fullPrompt,
                    imageFiles,
                    modelString,
                    undefined, // apiKey
                    aspectRatio,
                    resolution,
                    searchGrounding,
                    imageSearch
                );

            } else {
                // Text-to-Image Generation
                result = await createImage(
                    fullPrompt,
                    modelString,
                    undefined, // apiKey handled internally/server-side usually or locally
                    aspectRatio,
                    resolution,
                    searchGrounding,
                    imageSearch
                );
            }

            if (!result || !result.imageData) {
                toast.error("Failed to generate image.");
                return;
            }

            // Convert ArrayBuffer to Blob
            const blob = new Blob([result.imageData], { type: 'image/png' });

            // Upload to Supabase
            const fileName = `${user.id}/gen-${Date.now()}.png`;
            const publicUrl = await uploadFileToStorage(user.id, blob, fileName);

            if (publicUrl) {
                editor.update(() => {
                    const imageNode = $createImageNode({
                        src: publicUrl,
                        altText: prompt,
                        title: prompt
                    });

                    // Handle application modes
                    if (applicationMode === 'append') {
                        // Append to end of document
                        const root = $getRoot();
                        root.append($createParagraphNode().append(imageNode));
                    } else if (applicationMode === 'replace') {
                        // Replace selection
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            selection.insertNodes([imageNode]);
                        } else {
                            // Fallback to insert if no selection
                            $insertNodes([imageNode]);
                        }
                    } else {
                        // Insert at cursor (default)
                        $insertNodes([imageNode]);
                    }
                });
                toast.success("Image generated and inserted!");
            } else {
                toast.error("Failed to upload generated image.");
            }

        } catch (error: any) {
            console.error("Image generation error:", error);
            toast.error(error.message || "Error generating image");
        }
    };

    return (
        <AIImagePromptPopup
            isOpen={isOpen}
            onClose={() => {
                setIsOpen(false);
                editor.focus();
            }}
            onGenerate={handleGenerate}
            hasSelection={hasSelection}
            hasContent={hasContent}
        />
    );
};

export const aiImageGenerationPlugin = (): RealmPlugin => {
    return {
        init: (realm) => {
            realm.pubIn({
                [addComposerChild$]: () => <AIImagePromptPopupWrapper />
            });
        }
    };
};

// Helper to access root node (Lexical hack if import missing)
import { $getRoot } from 'lexical'; import { uploadFileToStorage } from '@/modules/posts/client-pictures';

