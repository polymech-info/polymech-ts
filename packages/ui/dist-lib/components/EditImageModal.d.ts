interface EditImageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pictureId: string;
    currentTitle: string;
    currentDescription: string | null;
    currentVisible: boolean;
    imageUrl?: string;
    onUpdateSuccess: () => void;
}
declare const EditImageModal: ({ open, onOpenChange, pictureId, currentTitle, currentDescription, currentVisible, imageUrl, onUpdateSuccess }: EditImageModalProps) => import("react/jsx-runtime").JSX.Element;
export default EditImageModal;
