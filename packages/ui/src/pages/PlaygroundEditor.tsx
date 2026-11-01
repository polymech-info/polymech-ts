/**
 * Playground for testing markdown editor insert/append/replace modes
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import MarkdownEditor from '@/components/MarkdownEditorEx';
import { toast } from 'sonner';

const PlaygroundEditor: React.FC = () => {
  const [content, setContent] = useState('# Test Document\n\nThis is the first paragraph.\n\nThis is the second paragraph.');
  const [selectedText, setSelectedText] = useState('');
  const [fakePrompt, setFakePrompt] = useState('**NEW CONTENT**');
  const [applicationMode, setApplicationMode] = useState<'replace' | 'insert' | 'append'>('insert');
  const editorRef = useRef<any>(null);
  const insertTransactionRef = useRef<{ text: string, onComplete: () => void } | null>(null);

  const applyModification = (mode: 'replace' | 'insert' | 'append', generatedText: string) => {
    if (!editorRef.current) {
      toast.error('Editor ref not available');
      return;
    }

    const { getMarkdown, setMarkdown, insertMarkdown } = editorRef.current;

    switch (mode) {
      case 'replace':
        if (selectedText) {
          const newContent = getMarkdown().replace(selectedText, generatedText);
          setMarkdown(newContent);
          toast.success('Selection replaced!');
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
        // 1. Set up the transaction
        insertTransactionRef.current = {
          text: generatedText,
          onComplete: () => {
            toast.success('Content inserted at cursor!');
          }
        };

        // 2. Fire the async action
        insertMarkdown(`\n${generatedText}\n`);

        break;
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Check if an insert transaction is pending and if it's now complete
    if (insertTransactionRef.current && newContent.includes(insertTransactionRef.current.text)) {
      insertTransactionRef.current.onComplete();
      insertTransactionRef.current = null; // Clear the transaction
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Editor Playground</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Application Mode</h3>
              <div className="flex gap-2">
                <Badge variant={applicationMode === 'replace' ? 'default' : 'outline'}>
                  Replace {selectedText ? `(${selectedText.length} chars)` : '(no selection)'}
                </Badge>
                <Badge variant={applicationMode === 'insert' ? 'default' : 'outline'}>
                  Insert
                </Badge>
                <Badge variant={applicationMode === 'append' ? 'default' : 'outline'}>
                  Append
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={applicationMode === 'replace' ? 'default' : 'outline'}
                onClick={() => setApplicationMode('replace')}
                disabled={!selectedText}
              >
                Replace
              </Button>
              <Button
                variant={applicationMode === 'insert' ? 'default' : 'outline'}
                onClick={() => setApplicationMode('insert')}
              >
                Insert
              </Button>
              <Button
                variant={applicationMode === 'append' ? 'default' : 'outline'}
                onClick={() => setApplicationMode('append')}
              >
                Append
              </Button>
            </div>
          </div>

          {/* Fake Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Fake Generated Content</label>
            <Textarea
              value={fakePrompt}
              onChange={(e) => setFakePrompt(e.target.value)}
              placeholder="Enter test content to insert..."
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button onClick={() => applyModification(applicationMode, fakePrompt)} className="w-full" size="lg">
            Apply ({applicationMode})
          </Button>

          {/* Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Markdown Editor</label>
              <div className="text-xs text-muted-foreground">
                Content length: {content.length} | Selection: {selectedText.length} chars
              </div>
            </div>
            <MarkdownEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Start typing..."
              onSelectionChange={setSelectedText}
              editorRef={editorRef}
            />
          </div>

          {/* Debug Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-xs font-semibold">Debug Info</h4>
              <div className="text-xs font-mono space-y-1">
                <div>Editor Ref: {editorRef.current ? '✅ Available' : '❌ Not set'}</div>
                <div>insertMarkdown: {editorRef.current?.insertMarkdown ? '✅ Available' : '❌ Not available'}</div>
                <div>getMarkdown: {editorRef.current?.getMarkdown ? '✅ Available' : '❌ Not available'}</div>
                <div>Selected Text: {selectedText.length > 0 ? `"${selectedText.substring(0, 50)}..."` : 'None'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">How to Test</h4>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li><strong>Replace</strong>: Select text in editor, click Apply</li>
                <li><strong>Insert</strong>: Click anywhere in editor (cursor position), click Apply</li>
                <li><strong>Append</strong>: Just click Apply (adds at end with separator)</li>
              </ol>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                💡 Check the browser console for detailed logs
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaygroundEditor;

