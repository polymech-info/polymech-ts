interface PublishDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: (option: 'overwrite' | 'new' | 'version' | 'add-to-post', title?: string, description?: string, parentId?: string, collectionIds?: string[]) => void;
    originalTitle: string;
    originalImageId?: string;
    isPublishing?: boolean;
    editingPostId?: string;
}
export default function PublishDialog({ isOpen, onClose, onPublish, originalTitle, originalImageId, isPublishing, editingPostId }: PublishDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
