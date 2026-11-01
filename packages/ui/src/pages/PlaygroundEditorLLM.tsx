/**
 * Playground for testing AITextGenerator with real LLM integration
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MarkdownEditor from '@/components/MarkdownEditorEx';
import AITextGenerator from '@/components/AITextGenerator';
import { getUserApiKeys as getUserSecrets } from '@/modules/user/client-user';
import { useAuth } from '@/hooks/useAuth';
import { generateText, transcribeAudio, runTools } from '@/lib/openai';
import { createMarkdownToolPreset } from '@/lib/markdownImageTools';
import { toast } from 'sonner';
import OpenAI from 'openai';
import SimpleLogViewer from '@/components/SimpleLogViewer';
import { getUserSettings, updateUserSettings } from '@/modules/user/client-user';
import { getProviderConfig } from '@/modules/providers/client-providers';
import { usePromptHistory } from '@/hooks/usePromptHistory';

const PlaygroundEditorLLM: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('# Test Document\n\nClick in the editor to place your cursor.\n\nThen use AI to generate content at that position.');
  const [selectedText, setSelectedText] = useState('');

  // AI Text Generator state
  // AI Text Generator state
  const {
    prompt,
    setPrompt,
    promptHistory,
    historyIndex,
    setHistoryIndex,
    navigateHistory,
    addPromptToHistory
  } = usePromptHistory();

  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-5');
  const [imageToolsEnabled, setImageToolsEnabled] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [contextMode, setContextMode] = useState<'clear' | 'selection' | 'all'>('all');
  const [applicationMode, setApplicationMode] = useState<'replace' | 'insert' | 'append'>('append');
  const [templates, setTemplates] = useState<Array<{ name: string; template: string }>>([]);
  const [streamMode, setStreamMode] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [streamLogs, setStreamLogs] = useState<any[]>([]);

  const editorRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastSelectionRef = useRef<{ isAtStart: boolean } | null>(null);
  const insertTransactionRef = useRef<{ text: string, onComplete: () => void } | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettingsLoaded(true);
        return;
      }

      try {
        const settings = await getUserSettings(user.id);
        const aiTextSettings = settings?.aiTextGenerator;
        const savedTemplates = settings?.promptTemplates || [];

        if (aiTextSettings) {
          if (aiTextSettings.provider) setSelectedProvider(aiTextSettings.provider);
          if (aiTextSettings.model) setSelectedModel(aiTextSettings.model);
          if (typeof aiTextSettings.imageToolsEnabled === 'boolean') setImageToolsEnabled(aiTextSettings.imageToolsEnabled);
          if (aiTextSettings.contextMode) setContextMode(aiTextSettings.contextMode);
          if (aiTextSettings.applicationMode) setApplicationMode(aiTextSettings.applicationMode);
        }

        if (savedTemplates.length > 0) {
          setTemplates(savedTemplates);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings (debounced)
  useEffect(() => {
    if (!user || !settingsLoaded) return;

    const saveSettings = async () => {
      try {
        const currentSettings = await getUserSettings(user.id);

        const updatedSettings = {
          ...currentSettings,
          aiTextGenerator: {
            provider: selectedProvider,
            model: selectedModel,
            imageToolsEnabled,
            // webSearchEnabled: false, // Not locally managed yet
            contextMode,
            applicationMode,
          }
        };

        await updateUserSettings(user.id, updatedSettings);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    const timeoutId = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, settingsLoaded, selectedProvider, selectedModel, imageToolsEnabled, contextMode, applicationMode]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);

    // Check if an insert transaction is pending and if it's now complete
    if (insertTransactionRef.current && newContent.includes(insertTransactionRef.current.text)) {
      insertTransactionRef.current.onComplete();
      insertTransactionRef.current = null; // Clear the transaction
    }
  }, []);

  const handleSelectionChange = useCallback((newSelectedText: string) => {
    setSelectedText(newSelectedText);

    // Simple check to see if cursor is at the start of the document
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Collapsed means no text is selected (it's a cursor)
      // startOffset === 0 means the cursor is at the beginning of its container node
      if (range.collapsed && range.startOffset === 0) {
        // A simple heuristic: if the selection is collapsed at offset 0,
        // and there's no selected text, we assume it's at the start.
        // This is not perfect but good enough for this use case.
        if (newSelectedText.trim() === '') {
          lastSelectionRef.current = { isAtStart: true };
          return;
        }
      }
    }
    lastSelectionRef.current = { isAtStart: false };

  }, []);

  // History handlers replaced by hook

  const getProviderApiKey = useCallback(async (provider: string): Promise<string | null> => {
    if (!user) return null;

    // Use centralized user secrets for OpenAI
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
      const userProvider = await getProviderConfig(user.id, provider);

      if (!userProvider) {
        if (provider !== 'openai') {
          // console.warn(\`No provider configuration found for \${provider}\`);
        }
        return null; // Return null silently to avoid spamming logs if just missing
      }
      const settings = userProvider.settings as any;
      return settings?.apiKey || null;
    } catch (error) {
      console.error(`Error fetching API key for ${provider}:`, error);
      return null;
    }
  }, [user]);

  const generateWithProvider = useCallback(async (
    prompt: string,
    provider: string,
    model: string,
    signal?: AbortSignal,
    onChunk?: (chunk: string) => void
  ): Promise<string | null> => {
    try {
      switch (provider) {
        case 'openai':
          const openaiKey = await getProviderApiKey('openai');
          return await generateText(prompt, model, openaiKey || undefined, signal, onChunk);

        case 'openrouter':
          const openrouterKey = await getProviderApiKey('openrouter');
          if (!openrouterKey) {
            throw new Error('No OpenRouter API key found');
          }

          const client = new OpenAI({
            apiKey: openrouterKey,
            baseURL: 'https://openrouter.ai/api/v1',
            dangerouslyAllowBrowser: true,
            defaultHeaders: {
              'HTTP-Referer': window.location.origin,
              'X-Title': 'PM-Pics Playground'
            }
          });

          // Streaming for OpenRouter
          if (onChunk) {
            const stream = await client.chat.completions.create({
              model: model,
              messages: [{ role: "user", content: prompt }],
              stream: true,
            }, { signal });

            let fullContent = '';
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;
                onChunk(delta);
              }
            }
            return fullContent;
          }

          const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }]
          }, { signal });

          return response.choices[0]?.message?.content || null;

        default:
          throw new Error(`Provider ${provider} not supported`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return null;
      }
      throw error;
    }
  }, [getProviderApiKey]);

  const handleGenerate = useCallback(async () => {
    if (!editorRef.current) {
      toast.error('Editor is not ready yet, please wait a moment.');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use AI features');
      return;
    }

    if (streamMode) {
      setStreamLogs([]);
    }

    console.log('[Playground] Generate started', {
      applicationMode,
      contextMode,
      hasSelection: !!selectedText,
      contentLength: content.length,
      editorRefAvailable: !!editorRef.current,
    });

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setIsGenerating(true);
    addPromptToHistory(prompt);

    try {
      // Build context prompt
      let contextPrompt = '';
      switch (contextMode) {
        case 'clear':
          contextPrompt = `${prompt}\n\nReturn ONLY raw markdown.`;
          break;
        case 'selection':
          if (selectedText?.trim()) {
            contextPrompt = `CONTEXT:\n\`\`\`\n${selectedText}\n\`\`\`\n\nREQUEST: ${prompt}\n\nReturn ONLY raw markdown.`;
          } else {
            contextPrompt = `${prompt}\n\nReturn ONLY raw markdown.`;
          }
          break;
        case 'all':
          if (content?.trim()) {
            contextPrompt = `CONTEXT:\n\`\`\`\n${content}\n\`\`\`\n\nREQUEST: ${prompt}\n\nReturn ONLY raw markdown.`;
          } else {
            contextPrompt = `${prompt}\n\nReturn ONLY raw markdown.`;
          }
          break;
      }

      let generatedText: string | null = null;

      if (imageToolsEnabled) {
        const openaiKey = await getProviderApiKey('openai');
        const toolPreset = createMarkdownToolPreset(user.id, selectedModel);

        const onLog = (log: any) => {
          if (streamMode) {
            setStreamLogs(prev => [...prev, log]);
          }
        };

        const result = await runTools({
          prompt: contextPrompt,
          preset: toolPreset,
          model: selectedProvider === 'openai' ? selectedModel : 'gpt-4o-mini',
          apiKey: openaiKey || undefined,
          onMessage: (message) => onLog({ type: 'message', data: message }),
          onToolCall: (toolCall) => onLog({ type: 'tool_call', data: toolCall }),
          onContent: (content) => onLog({ type: 'content_chunk', data: content }),
        });
        generatedText = result.success ? result.content || null : null;
      } else {
        if (streamMode) {
          generatedText = await generateWithProvider(
            contextPrompt,
            selectedProvider,
            selectedModel,
            signal,
            (chunk) => {
              setStreamLogs(prev => {
                const lastLog = prev[prev.length - 1];
                // Coalesce content chunks for cleaner logging
                if (lastLog && lastLog.type === 'content_chunk') {
                  return [...prev.slice(0, -1), { ...lastLog, data: lastLog.data + chunk }];
                }
                return [...prev, { type: 'content_chunk', data: chunk }];
              });
            }
          );
        } else {
          generatedText = await generateWithProvider(contextPrompt, selectedProvider, selectedModel, signal);
        }
      }

      if (signal.aborted) return;

      if (generatedText) {
        generatedText = generatedText
          .replace(/^```markdown\s*\n/i, '')
          .replace(/^```\s*\n/, '')
          .replace(/\n```\s*$/i, '')
          .trim();

        console.log('[Playground] Generated text', { length: generatedText.length });

        // This check is now redundant because of the guard clause, but safe to keep.
        if (!editorRef.current) {
          toast.error('Editor not ready');
          setIsGenerating(false); // Ensure we reset state
          return;
        }

        const { getMarkdown, setMarkdown, insertMarkdown } = editorRef.current;

        switch (applicationMode) {
          case 'replace':
            if (selectedText && selectedText.trim()) {
              const newContent = getMarkdown().replace(selectedText, generatedText);
              setMarkdown(newContent);
              toast.success('Selection replaced!');
              setSelectedText('');
            } else {
              toast.warning('Select text to replace.');
            }
            break;

          case 'append': {
            const currentContent = getMarkdown();
            const newContent = currentContent ? `${currentContent}\n\n---\n\n${generatedText}` : generatedText;
            setMarkdown(newContent);
            toast.success('Content appended!');
            break;
          }

          case 'insert': {
            if (insertMarkdown) {
              insertTransactionRef.current = {
                text: generatedText,
                onComplete: () => toast.success('Content inserted at cursor!')
              };
              insertMarkdown(`\n${generatedText}\n`);
              setPrompt('');
              return; // Return because handleContentChange will finalize
            }
            // Fallback
            const newContent = getMarkdown() ? `${getMarkdown()}\n${generatedText}` : generatedText;
            setMarkdown(newContent);
            toast.success('Content added!');
            break;
          }
        }

        setPrompt('');
      } else {
        toast.error('No content generated');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return;
      }
      console.error('[Playground] Generation error:', error);
      toast.error('Error: ' + error.message);
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, [
    prompt, user, applicationMode, contextMode, selectedText, content, imageToolsEnabled,
    selectedProvider, selectedModel, addPromptToHistory, generateWithProvider, getProviderApiKey, streamMode
  ]);

  const handleOptimize = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to optimize');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimizationPrompt = `Optimize this prompt for better results:\n\n"${prompt}"\n\nReturn ONLY the optimized prompt.`;
      const optimized = await generateWithProvider(optimizationPrompt, selectedProvider, selectedModel);
      if (optimized) {
        setPrompt(optimized.trim());
        toast.success('Prompt optimized!');
      }
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast.error('Error optimizing prompt');
    } finally {
      setIsOptimizing(false);
    }
  }, [prompt, selectedProvider, selectedModel, generateWithProvider]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      toast.info('Generation cancelled');
    }
  }, []);

  const handleMicrophoneToggle = useCallback(async () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        try {
          const transcription = await transcribeAudio(audioFile, 'whisper-1');
          if (transcription) {
            setPrompt(prev => prev ? `${prev} ${transcription}` : transcription);
            toast.success('Audio transcribed!');
          } else {
            toast.error('Failed to transcribe audio');
          }
        } catch (error: any) {
          console.error('Transcription error:', error);
          toast.error('Error transcribing audio');
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error: any) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone');
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSaveTemplate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to save');
      return;
    }

    const name = window.prompt('Enter template name:');
    if (name) {
      const newTemplates = [...templates, { name, template: prompt }];
      setTemplates(newTemplates);
      toast.success('Template saved!');

      // Save to server
      if (user) {
        try {
          const currentSettings = await getUserSettings(user.id);
          await updateUserSettings(user.id, {
            ...currentSettings,
            promptTemplates: newTemplates
          });
        } catch (err) {
          console.error('Error saving templates', err);
        }
      }
    }
  }, [prompt, templates, user]);

  const handleDeleteTemplate = useCallback(async (index: number) => {
    const newTemplates = templates.filter((_, i) => i !== index);
    setTemplates(newTemplates);
    toast.success('Template deleted');

    // Save to server
    if (user) {
      try {
        const currentSettings = await getUserSettings(user.id);
        await updateUserSettings(user.id, {
          ...currentSettings,
          promptTemplates: newTemplates
        });
      } catch (err) {
        console.error('Error saving templates', err);
      }
    }
  }, [templates, user]);

  const handleApplyTemplate = useCallback((template: string) => {
    setPrompt(template);
    toast.success('Template applied');
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AITextGenerator Playground</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">Mode: {applicationMode}</Badge>
              <Badge variant="outline">Context: {contextMode}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Markdown Editor</label>
              <div className="text-xs text-muted-foreground">
                Content: {content.length} chars | Selection: {selectedText.length} chars
              </div>
            </div>
            <MarkdownEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Start typing..."
              onSelectionChange={handleSelectionChange}
              editorRef={editorRef}
            />
          </div>

          {/* AITextGenerator Component */}
          <div className="border-t pt-4">
            <AITextGenerator
              prompt={prompt}
              onPromptChange={(newPrompt) => {
                setPrompt(newPrompt);
                if (historyIndex !== -1) setHistoryIndex(-1);
              }}
              provider={selectedProvider}
              model={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              imageToolsEnabled={imageToolsEnabled}
              onImageToolsChange={setImageToolsEnabled}
              webSearchEnabled={webSearchEnabled}
              onWebSearchChange={setWebSearchEnabled}
              contextMode={contextMode}
              onContextModeChange={setContextMode}
              hasSelection={!!selectedText && selectedText.trim().length > 0}
              hasContent={!!content && content.trim().length > 0}
              applicationMode={applicationMode}
              onApplicationModeChange={setApplicationMode}
              streamMode={streamMode}
              onStreamModeChange={setStreamMode}
              templates={templates}
              onApplyTemplate={handleApplyTemplate}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onGenerate={handleGenerate}
              onOptimize={handleOptimize}
              onCancel={handleCancel}
              isGenerating={isGenerating}
              isOptimizing={isOptimizing}
              onMicrophoneToggle={handleMicrophoneToggle}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              promptHistory={promptHistory}
              historyIndex={historyIndex}
              onNavigateHistory={navigateHistory}
            />
          </div>

          {streamMode && <SimpleLogViewer logs={streamLogs} className="mt-4" />}

          {/* Debug Panel */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-xs font-semibold">Debug Info</h4>
              <div className="text-xs font-mono space-y-1">
                <div>User: {user ? '✅ Signed in' : '❌ Not signed in'}</div>
                <div>Editor Ref: {editorRef.current ? '✅ Available' : '❌ Not set'}</div>
                <div>insertMarkdown: {editorRef.current?.insertMarkdown ? '✅ Available' : '❌ Not available'}</div>
                <div>getMarkdown: {editorRef.current?.getMarkdown ? '✅ Available' : '❌ Not available'}</div>
                <div>Selected Text: {selectedText.length > 0 ? `"${selectedText.substring(0, 50)}..."` : 'None'}</div>
                <div>Application Mode: {applicationMode}</div>
                <div>Context Mode: {contextMode}</div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">How to Test</h4>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li><strong>Sign in first</strong> to access AI providers</li>
                <li><strong>Configure providers</strong> at /settings/providers if needed</li>
                <li><strong>Select provider/model</strong> from Settings panel</li>
                <li><strong>Choose context mode</strong>: Clear, Selection, or All</li>
                <li><strong>Choose application mode</strong>: Replace, Insert, or Append</li>
                <li><strong>Enter prompt</strong> and click Generate</li>
                <li><strong>Watch console</strong> for detailed logs</li>
              </ol>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-3 space-y-1">
                <div>💡 <strong>Replace</strong>: Select text in editor first</div>
                <div>💡 <strong>Insert</strong>: Click in editor to place cursor</div>
                <div>💡 <strong>Append</strong>: Adds at end with --- separator</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaygroundEditorLLM;

