import { useEffect, useRef, useState } from "react";

const useDropZone = ({ onDrop }: { onDrop: (paths: string[]) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragIn, setDragIn] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setDragIn(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setDragIn(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounterRef.current = 0;
      setDragIn(false);

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        onDrop(files.map(file => file.name));
      }
    };

    // Also handle document-level events to reset state when dragging outside
    const handleDocumentDragLeave = (e: DragEvent) => {
      if (!element.contains(e.target as Node)) {
        dragCounterRef.current = 0;
        setDragIn(false);
      }
    };

    const handleDocumentDrop = () => {
      dragCounterRef.current = 0;
      setDragIn(false);
    };

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);

    // Document-level listeners to handle edge cases
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, [onDrop]);

  return { ref, dragIn };
};

export { useDropZone };
