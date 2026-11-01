import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { translate } from "@/i18n";
import { transcribeAudio } from "@/lib/openai";
import { editImage } from "@/image-api";
import { PostMediaItem } from "./types";
import { getUserSettings, updateUserSettings, getUserOpenAIKey } from "@/modules/user/client-user";

export const usePostLLM = (user: any, mediaItem: PostMediaItem | null) => {
    const [promptTemplates, setPromptTemplates] = useState<any[]>([]);
    const [promptHistory, setPromptHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [lightboxPrompt, setLightboxPrompt] = useState('');
    const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const loadPromptTemplates = async () => {
        if (!user) return;
        try {
            const settings = await getUserSettings(user.id);
            setPromptTemplates(settings.promptTemplates || []);
        } catch (error) {
            console.error('Error loading prompt templates:', error);
        }
    };

    const loadPromptHistory = async () => {
        if (!user) return;
        try {
            const settings = await getUserSettings(user.id);
            setPromptHistory(settings.promptHistory || []);
        } catch (error) {
            console.error('Error loading prompt history:', error);
        }
    };

    const savePromptTemplates = async (templates: Array<{ name: string; template: string }>) => {
        if (!user) return;
        try {
            const settings = await getUserSettings(user.id);
            await updateUserSettings(user.id, { ...settings, promptTemplates: templates });
            setPromptTemplates(templates);
        } catch (error) {
            console.error('Error saving prompt templates:', error);
            throw error;
        }
    };

    const addToPromptHistory = async (promptText: string) => {
        if (!user || !promptText.trim()) return;
        try {
            const settings = await getUserSettings(user.id);
            const existingHistory = settings.promptHistory || [];
            const newHistory = [promptText, ...existingHistory.filter((p: string) => p !== promptText)].slice(0, 50);

            await updateUserSettings(user.id, { ...settings, promptHistory: newHistory });
            setPromptHistory(newHistory);
            setHistoryIndex(-1);
        } catch (error) {
            console.error('Error saving prompt history:', error);
        }
    };

    useEffect(() => {
        if (user) {
            loadPromptTemplates();
            loadPromptHistory();
        }
    }, [user]);

    // Actions
    const handleOptimizePrompt = async () => {
        if (!lightboxPrompt.trim()) {
            toast.error(translate('Please enter a prompt first'));
            return;
        }
        setIsOptimizingPrompt(true);
        try {
            const apiKey = await getUserOpenAIKey(user.id);

            if (!apiKey) {
                toast.error(translate('OpenAI API key not configured. Please add it in your profile settings.'));
                return;
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that optimizes image generation prompts. Make them more detailed, specific, and effective while keeping the core intent. Return only the optimized prompt without explanations.',
                        },
                        {
                            role: 'user',
                            content: `Optimize this image generation prompt: "${lightboxPrompt}"`,
                        },
                    ]
                }),
            });

            const data = await response.json();
            const optimizedPrompt = data.choices?.[0]?.message?.content?.trim();
            if (optimizedPrompt) {
                setLightboxPrompt(optimizedPrompt);
                toast.success(translate('Prompt optimized!'));
            }
        } catch (error) {
            console.error('Error optimizing prompt:', error);
            toast.error(translate('Failed to optimize prompt'));
        } finally {
            setIsOptimizingPrompt(false);
        }
    };

    const handleMicrophone = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop());
                    setIsTranscribing(true);
                    try {
                        const apiKey = await getUserOpenAIKey(user.id);
                        if (!apiKey) {
                            toast.error(translate('OpenAI API key not configured'));
                            return;
                        }

                        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
                        const transcription = await transcribeAudio(audioFile, apiKey);
                        if (transcription) {
                            setLightboxPrompt(transcription);
                            toast.success(translate('Voice transcribed successfully!'));
                        }
                    } catch (error) {
                        console.error('Error transcribing audio:', error);
                        toast.error(translate('Failed to transcribe audio'));
                    } finally {
                        setIsTranscribing(false);
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
                toast.info(translate('Recording... Click again to stop'));
            } catch (error) {
                console.error('Error starting recording:', error);
                toast.error(translate('Failed to start recording. Please check microphone permissions.'));
            }
        }
    };

    const handlePromptSubmit = async (prompt: string, isVideo: boolean) => {
        if (!prompt.trim() || !mediaItem || isVideo) {
            toast.error(translate('Please enter a prompt'));
            return;
        }
        await addToPromptHistory(prompt.trim());
        setIsGenerating(true);
        try {
            const response = await fetch(mediaItem.image_url);
            const blob = await response.blob();
            const file = new File([blob], mediaItem.title || 'image.png', { type: blob.type || 'image/png' });
            const result = await editImage(prompt, [file]);

            if (result) {
                const uint8Array = new Uint8Array(result.imageData);
                const imageBlob = new Blob([uint8Array], { type: 'image/png' });
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    setGeneratedImageUrl(dataUrl);
                    toast.success(translate('Image generated successfully!'));
                };
                reader.readAsDataURL(imageBlob);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            toast.error(translate('Failed to generate image. Please check your Google API key.'));
        } finally {
            setIsGenerating(false);
        }
    };

    // Prompt Template Handlers
    const handleApplyTemplate = (template: string) => {
        setLightboxPrompt(template);
    };

    const handleSaveTemplate = async () => {
        if (!lightboxPrompt.trim()) {
            toast.error(translate('Please enter a prompt first'));
            return;
        }
        const templateName = window.prompt(translate('Enter a name for this template:'));
        if (!templateName) return;
        try {
            const newTemplates = [...promptTemplates, { name: templateName.trim(), template: lightboxPrompt }];
            await savePromptTemplates(newTemplates);
            toast.success(translate('Template saved successfully!'));
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(translate('Failed to save template'));
        }
    };

    const handleDeleteTemplate = async (index: number) => {
        try {
            const newTemplates = promptTemplates.filter((_, i) => i !== index);
            await savePromptTemplates(newTemplates);
            toast.success(translate('Template deleted successfully!'));
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error(translate('Failed to delete template'));
        }
    };

    // History Navigation
    const navigatePromptHistory = (direction: 'up' | 'down') => {
        if (promptHistory.length === 0) return;
        let newIndex = historyIndex;
        if (direction === 'up') {
            newIndex = Math.min(historyIndex + 1, promptHistory.length - 1);
        } else {
            newIndex = Math.max(historyIndex - 1, -1);
        }
        setHistoryIndex(newIndex);
        if (newIndex >= 0) {
            setLightboxPrompt(promptHistory[newIndex]);
        } else {
            setLightboxPrompt('');
        }
    };

    return {
        promptTemplates,
        promptHistory,
        historyIndex,
        lightboxPrompt,
        setLightboxPrompt,
        isOptimizingPrompt,
        isRecording,
        isTranscribing,
        isGenerating,
        generatedImageUrl,
        setGeneratedImageUrl,
        handleOptimizePrompt,
        handleMicrophone,
        handlePromptSubmit,
        handleApplyTemplate,
        handleSaveTemplate,
        handleDeleteTemplate,
        navigatePromptHistory,
        setHistoryIndex,
        addToPromptHistory
    };
};
