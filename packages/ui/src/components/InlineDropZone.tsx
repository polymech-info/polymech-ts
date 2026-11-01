import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { T } from '@/i18n';

interface InlineDropZoneProps {
    onDrop: (files: File[]) => void;
    index: number;
}

export const InlineDropZone: React.FC<InlineDropZoneProps> = ({ onDrop, index }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files') && !isDragOver) {
            setIsDragOver(true);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            onDrop(files);
        }
    };

    return (
        <div className={`flex justify-center pt-4 transition-all duration-200 ${isDragOver ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
            <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragOver ? 'border-primary bg-primary/10' : 'hover:bg-muted/50 border-muted-foreground/25'}
        `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                    <Plus className={`h-8 w-8 mb-2 transition-colors ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`text-sm ${isDragOver ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        <span className="font-semibold"><T>Click to upload</T></span> <T>or drag and drop</T>
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        if (e.target.files?.length) {
                            onDrop(Array.from(e.target.files));
                        }
                    }}
                />
            </label>
        </div>
    );
};
