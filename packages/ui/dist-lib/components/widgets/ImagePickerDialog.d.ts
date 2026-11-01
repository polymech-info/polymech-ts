import { default as React } from 'react';
interface ImagePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (pictureId: string) => void;
    onMultiSelect?: (pictureIds: string[]) => void;
    onMultiSelectPictures?: (pictures: Picture[]) => void;
    currentValue?: string | null;
    currentValues?: string[];
    multiple?: boolean;
}
interface Picture {
    id: string;
    title: string;
    image_url: string;
    thumbnail_url?: string;
    type?: string;
    user_id: string;
    tags: string[] | null;
    meta: any;
}
export declare const ImagePickerDialog: React.FC<ImagePickerDialogProps>;
export {};
