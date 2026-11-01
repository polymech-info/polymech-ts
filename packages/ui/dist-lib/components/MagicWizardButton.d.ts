import { default as React } from 'react';
interface MagicWizardButtonProps {
    imageUrl: string;
    imageTitle: string;
    className?: string;
    size?: "sm" | "default" | "lg" | "icon";
    variant?: "default" | "ghost" | "outline";
    onClick?: (e: React.MouseEvent) => void;
    editingPostId?: string | null;
    pictureId?: string;
    children?: React.ReactNode;
}
declare const MagicWizardButton: React.FC<MagicWizardButtonProps>;
export default MagicWizardButton;
