interface EditVideoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    videoId: string;
    currentTitle: string;
    currentDescription: string | null;
    currentVisible: boolean;
    onUpdateSuccess: () => void;
}
declare const EditVideoModal: ({ open, onOpenChange, videoId, currentTitle, currentDescription, currentVisible, onUpdateSuccess }: EditVideoModalProps) => import("react/jsx-runtime").JSX.Element;
export default EditVideoModal;
