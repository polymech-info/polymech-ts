import React, { useRef, useState, useCallback, useEffect } from 'react';
import { htmlTableToMarkdown } from '@/lib/htmlTableToMarkdown';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { fetchPictureById } from '@/modules/posts/client-pictures';
import { toast } from 'sonner';
import { translate } from '@/i18n';


// Lazy load the heavy editor component
const MDXEditorInternal = React.lazy(() => import('@/components/lazy-editors/MDXEditorInternal'));

// ── Error Boundary for MDXEditor ─────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MDXEditorErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[MDXEditor] Parse error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4zM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
            <span>
              The editor could not parse this content (likely contains invalid characters like bare <code>&lt;</code>).
              Edit below or switch to the <strong>Markdown</strong> tab.
            </span>
          </div>
          <textarea
            value={this.props.value || ''}
            onChange={(e) => this.props.onChange(e.target.value)}
            className="w-full min-h-[200px] bg-transparent border rounded-md p-3 font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none resize-y"
            aria-label="Raw markdown (fallback)"
          />
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onSelectionChange?: (selectedText: string) => void;
  onSave?: () => void;
  editorRef?: React.RefObject<any>;
}

interface MDXEditorWithImagePickerProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder: string;
  onRequestImage: () => Promise<string>;
  onTextInsert: (text: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSave?: () => void;
  editorRef: React.MutableRefObject<any>;
}

export function MDXEditorWithImagePicker(props: MDXEditorWithImagePickerProps) {
  return (
    <React.Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading editor...</div>}>
      <MDXEditorErrorBoundary value={props.value} onChange={props.onChange}>
        <MDXEditorInternal {...props} />
      </MDXEditorErrorBoundary>
    </React.Suspense>
  );
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className = "",
  onKeyDown,
  onSelectionChange,
  onSave,
  editorRef: externalEditorRef
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'raw'>('editor');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastEmittedValue = useRef<string>(value);
  const internalEditorRef = useRef<any>(null);
  const editorRef = externalEditorRef || internalEditorRef;
  const imageResolveRef = useRef<((url: string) => void) | null>(null);
  const imageRejectRef = useRef<(() => void) | null>(null);

  // Handle external value changes (e.g., from filter panel)
  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      lastEmittedValue.current = value;
      // Force update the MDXEditor if it exists
      if (editorRef.current && activeTab === 'editor') {
        try {
          editorRef.current.setMarkdown(value);
        } catch (error) {
          console.warn('Failed to update MDXEditor:', error);
          toast.warning(
            translate('Content may contain characters that the editor cannot display. Switch to the Markdown tab to review.'),
            { duration: 5000 },
          );
        }
      }
    }
  }, [value, activeTab]);

  const handleEditorChange = useCallback((markdown: string) => {
    // Only call onChange if content actually changed
    if (markdown !== lastEmittedValue.current) {
      lastEmittedValue.current = markdown;
      onChange(markdown);
    }
  }, [onChange]);

  const handleTextInsert = useCallback((text: string) => {
    // Append transcribed text to current markdown
    const currentMarkdown = lastEmittedValue.current || '';
    const newMarkdown = currentMarkdown
      ? `${currentMarkdown}\n\n${text}`
      : text;

    lastEmittedValue.current = newMarkdown;
    onChange(newMarkdown);

    // Force update the editor
    if (editorRef.current) {
      editorRef.current.setMarkdown(newMarkdown);
    }
  }, [onChange]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // This function returns a promise that resolves with the image URL
  const handleRequestImage = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      imageResolveRef.current = resolve;
      imageRejectRef.current = reject;
      setImagePickerOpen(true);
    });
  }, []);

  const handleImageSelect = useCallback(async (pictureId: string) => {
    // Immediately clear reject ref so onClose (which fires right after) won't reject the promise
    imageRejectRef.current = null;
    try {
      console.log('[ImagePicker] Selected pictureId:', pictureId);
      const data = await fetchPictureById(pictureId);
      console.log('[ImagePicker] Fetched data:', data);
      if (!data) throw new Error('Picture not found');

      const imageUrl = data.image_url;

      // Resolve the promise with the image URL
      if (imageResolveRef.current) {
        imageResolveRef.current(imageUrl);
        imageResolveRef.current = null;
      }

      setImagePickerOpen(false);
    } catch (error) {
      console.error('[ImagePicker] Error selecting image:', error);
      // Resolve with empty to avoid unhandled rejection
      if (imageResolveRef.current) {
        imageResolveRef.current('');
        imageResolveRef.current = null;
      }
      setImagePickerOpen(false);
    }
  }, []);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    lastEmittedValue.current = newValue;
    onChange(newValue);
  }, [onChange]);

  // ── Clipboard: intercept HTML table paste → markdown table ─────────────
  const handlePasteCapture = useCallback((e: React.ClipboardEvent) => {
    console.log('[paste] capture fired', e.clipboardData.types);
    const html = e.clipboardData?.getData('text/html');
    if (!html) return;

    const md = htmlTableToMarkdown(html);
    if (!md) return; // no <table> → fall through to default

    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // MDXEditor rich tab: use ref API
    if (editorRef.current?.insertMarkdown) {
      editorRef.current.insertMarkdown(md);
    } else {
      // Raw textarea fallback: append at cursor / end
      const newValue = lastEmittedValue.current
        ? `${lastEmittedValue.current}\n\n${md}`
        : md;
      lastEmittedValue.current = newValue;
      onChange(newValue);
    }
  }, [editorRef, onChange]);

  return (
    <>
      <div onPasteCapture={handlePasteCapture} className={`flex flex-col bg-background ${className} ${isFullscreen ? '' : 'border rounded-md'}`}>
        <div className="flex border-b flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'editor'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'raw'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Markdown
          </button>
        </div>

        {activeTab === 'editor' && (
          <div className={`mdx-editor-wrapper flex-1 overflow-y-auto ${isFullscreen ? '' : 'min-h-[120px]'}`}>
            <MDXEditorWithImagePicker
              value={value}
              onChange={handleEditorChange}
              placeholder={placeholder}
              onRequestImage={handleRequestImage}
              onTextInsert={handleTextInsert}
              onSelectionChange={onSelectionChange}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              onSave={onSave}
              editorRef={editorRef}
            />
          </div>
        )}

        {activeTab === 'raw' && (
          <textarea
            value={value || ''}
            onChange={handleRawChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={`flex-1 w-full bg-transparent border-0 focus:ring-0 focus:outline-none resize-none font-mono text-sm ${isFullscreen ? '' : 'p-3 rounded-b-md min-h-[120px]'
              }`}
            aria-label="Raw markdown input"
            autoFocus
          />
        )}
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={imagePickerOpen}
        onClose={() => {
          setImagePickerOpen(false);
          // Reject the promise if closed without selection
          if (imageRejectRef.current) {
            imageRejectRef.current();
            imageRejectRef.current = null;
            imageResolveRef.current = null;
          }
        }}
        onSelect={handleImageSelect}
        currentValue={null}
      />
    </>
  );
};

MarkdownEditor.displayName = 'MarkdownEditor';

// Memoize with default shallow comparison
export default React.memo(MarkdownEditor);
