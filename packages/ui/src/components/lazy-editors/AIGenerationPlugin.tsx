import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND, $getSelection, $getRoot, createCommand, LexicalCommand } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { RealmPlugin, addComposerChild$, usePublisher, insertMarkdown$ } from '@mdxeditor/editor';
import { AIPromptPopup } from './AIPromptPopup';
import { generateText } from '@/lib/openai';
import { toast } from 'sonner';
import { getUserApiKeys as getUserSecrets } from '@/modules/user/client-user';
import { fetchProviderConfigs } from '@/modules/providers/client-providers';
import { useAuth } from '@/hooks/useAuth';
import { formatTextGenPrompt } from '@/constants';

export const OPEN_AI_TEXT_GEN_COMMAND: LexicalCommand<void> = createCommand('OPEN_AI_TEXT_GEN_COMMAND');

// Hook to access secrets helper
const useProviderApiKey = () => {
    const { user } = useAuth();

    const getApiKey = useCallback(async (provider: string): Promise<string | null> => {
        if (!user) return null;

        if (provider === 'openai') {
            try {
                const secrets = await getUserSecrets(user.id);
                if (secrets && secrets.openai_api_key) {
                    return secrets.openai_api_key;
                }
            } catch (error) {
                console.error('Error fetching user secrets:', error);
            }
        }

        try {
            console.log('Fetching API key for user:', user.id, 'provider:', provider);
            const configs = await fetchProviderConfigs(user.id, { name: provider, is_active: true });
            const userProvider = configs?.[0];
            if (!userProvider) return null;
            const settings = userProvider.settings as any;
            return settings?.apiKey || null;
        } catch (error) {
            console.error(`Error fetching API key for ${provider}:`, error);
            return null;
        }
    }, [user]);

    return getApiKey;
}

const AIGenerationComponent = () => {
    const [editor] = useLexicalComposerContext();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const getApiKey = useProviderApiKey();
    const [contextData, setContextData] = useState<{ selection: string, content: string }>({ selection: '', content: '' });
    const insertMarkdown = usePublisher(insertMarkdown$);

    const openPopup = useCallback(() => {
        // Capture context before opening
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            const selectionText = selection ? selection.getTextContent() : '';
            const root = $getRoot();
            const contentText = root ? root.getTextContent() : '';

            setContextData({
                selection: selectionText,
                content: contentText
            });
        });

        setIsPopupOpen(true);
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                KEY_DOWN_COMMAND,
                (event: KeyboardEvent) => {
                    // Check for Ctrl+Space
                    if (event.ctrlKey && event.code === 'Space') {
                        event.preventDefault();
                        openPopup();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            ),
            editor.registerCommand(
                OPEN_AI_TEXT_GEN_COMMAND,
                () => {
                    openPopup();
                    return true;
                },
                COMMAND_PRIORITY_NORMAL
            )
        );
    }, [editor, openPopup]);

    const handleGenerate = async (prompt: string, provider: string, model: string, contextMode: 'selection' | 'content' | 'none', applicationMode: 'replace' | 'insert' | 'append') => {
        try {
            const apiKey = await getApiKey(provider);


            // ...

            // Construct prompt with context
            const finalPrompt = formatTextGenPrompt(prompt, {
                selection: contextMode === 'selection' ? contextData.selection : undefined,
                content: contextMode === 'content' ? contextData.content : undefined
            });

            // Generate text
            // Note: We're not using tools or streaming here yet for simplicity, just text generation
            const result = await generateText(finalPrompt, model, apiKey || undefined);

            if (result) {
                // Clean up markdown wrapper
                let cleanedText = result.trim();

                // Smart cleanup:
                // If the entire text is wrapped in ```markdown or ```text or just ``` (no lang), it's likely a metadata wrapper.
                // We want to strip these BUT preserve inner code blocks or code blocks with specific languages (e.g. ```javascript).

                const wrapperMatch = cleanedText.match(/^```(markdown|text|txt)?\s*\n/i);
                if (wrapperMatch && cleanedText.endsWith('```')) {
                    // It is wrapped. Strip the wrapper.
                    cleanedText = cleanedText
                        .substring(wrapperMatch[0].length, cleanedText.length - 3)
                        .trim();
                }


                cleanedText = cleanedText.trim();

                // Handle 'append' mode by moving selection to end first
                if (applicationMode === 'append') {
                    // We need to move selection to end. 
                    // Since insertMarkdown uses the current selection, updating it via editor.update shoud work.
                    editor.update(() => {
                        const root = $getRoot();
                        root.selectEnd();
                    });
                }
                // For 'replace' or 'insert', the current selection is used automatically by insertMarkdown.

                // Insert the markdown
                // Note: insertMarkdown$ is a signal that triggers the editor to insert markdown at the current selection.
                insertMarkdown(cleanedText);

                toast.success('Generated text inserted');
            } else {
                toast.error('No text generated');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(`Error: ${error.message}`);
            throw error; // Re-throw to keep popup open or handle error in popup
        }
    };

    return (
        <AIPromptPopup
            isOpen={isPopupOpen}
            onClose={() => {
                setIsPopupOpen(false);
                editor.focus();
            }}
            onGenerate={handleGenerate}
            hasSelection={!!contextData.selection}
            hasContent={!!contextData.content}
        />
    );
};

export const aiGenerationPlugin = (): RealmPlugin => {
    return {
        init: (realm) => {
            realm.pubIn({
                [addComposerChild$]: () => <AIGenerationComponent />
            })
        }
    }
}

