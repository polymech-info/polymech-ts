import React, { useRef, useState, useCallback } from 'react';
import { ImagePickerDialog } from '@/components/widgets/ImagePickerDialog';
import { fetchPictureById } from '@/modules/posts/client-pictures';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className = "",
  onKeyDown
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'raw'>('editor');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const pendingImageResolveRef = useRef<((url: string) => void) | null>(null);

  // Handler for image selection from picker
  const handleImageSelect = useCallback(async (pictureId: string) => {
    try {
      // Fetch the image URL via API
      const data = await fetchPictureById(pictureId);
      if (!data) throw new Error('Picture not found');

      const imageUrl = data.image_url;

      const resolveFunc = pendingImageResolveRef.current;

      if (resolveFunc) {
        pendingImageResolveRef.current = null;
        resolveFunc(imageUrl);
      }

      setImagePickerOpen(false);
    } catch (error) {
      if (pendingImageResolveRef.current) {
        pendingImageResolveRef.current('');
        pendingImageResolveRef.current = null;
      }
      setImagePickerOpen(false);
    }
  }, []);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <>
      <div className={`border rounded-md bg-background ${className}`}>
        <div className="flex border-b">
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
          <React.Suspense fallback={<div className="p-3 text-muted-foreground">Loading editor...</div>}>
            <div></div>
          </React.Suspense>
        )}
        {activeTab === 'raw' && (
          <textarea
            value={value || ''}
            onChange={handleRawChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full p-3 bg-transparent border-0 rounded-b-md focus:ring-0 focus:outline-none resize-none font-mono text-sm"
            style={{ height: '120px', minHeight: '120px' }}
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
          if (pendingImageResolveRef.current) {
            pendingImageResolveRef.current('');
            pendingImageResolveRef.current = null;
          }
        }}
        onSelect={handleImageSelect}
        currentValue={null}
      />
    </>
  );
};

MarkdownEditor.displayName = 'MarkdownEditor';

// Memoize with custom comparison
export default React.memo(MarkdownEditor, (prevProps, nextProps) => {
  // Re-render if value, placeholder, className, or onKeyDown change
  return (
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.onKeyDown === nextProps.onKeyDown
    // onChange is intentionally omitted to prevent unnecessary re-renders
  );
});
