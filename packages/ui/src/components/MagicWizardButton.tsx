import React from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useWizardContext } from "@/hooks/useWizardContext";
import { toast } from "sonner";
import { translate } from "@/i18n";

interface MagicWizardButtonProps {
  imageUrl: string;
  imageTitle: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
  onClick?: (e: React.MouseEvent) => void;
  editingPostId?: string | null; // Explicitly pass the post ID if known, or null to prevent auto-detection
  pictureId?: string; // Explicitly pass the picture ID if known
  children?: React.ReactNode;
}

const MagicWizardButton: React.FC<MagicWizardButtonProps> = ({
  imageUrl,
  imageTitle,
  className = "",
  size = "sm",
  variant = "ghost",
  onClick,
  editingPostId: explicitPostId,
  pictureId: explicitPictureId,
  children
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setWizardImage } = useWizardContext();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
      return;
    }

    if (!user) {
      toast.error(translate('Please sign in to use the AI wizard'));
      return;
    }

    // Get the real picture ID from the URL path if available
    const urlPath = window.location.pathname;

    // Check if we are in a post context
    // If explicitPostId is provided (even as null), use it.
    // If it is undefined, try to infer from URL.
    let editingPostId: string | null = null;

    if (explicitPostId !== undefined) {
      editingPostId = explicitPostId;
    } else {
      const postMatch = urlPath.match(/\/post\/([a-f0-9-]{36})/);
      if (postMatch) {
        editingPostId = postMatch[1];
      }
    }

    let realPictureId = explicitPictureId || null;

    // Only try to guess from URL if explicitPictureId is not provided
    if (!realPictureId) {
      const pictureIdMatch = urlPath.match(/\/post\/([a-f0-9-]{36})/);
      realPictureId = pictureIdMatch ? pictureIdMatch[1] : null;
    }

    const imageData = {
      id: realPictureId || `external-${Date.now()}`,
      src: imageUrl,
      title: imageTitle,
      selected: true,
      realDatabaseId: realPictureId // Store the real database ID separately
    };
    // Store in Zustand (replaces sessionStorage) with return path
    setWizardImage(imageData, window.location.pathname);
    // Navigate to wizard
    // Note: navigationData is now maintained by Zustand - no manual storage needed!
    navigate('/wizard', {
      state: {
        mode: 'default', // Keep default mode but passing editingPostId allows "Add to Post"
        editingPostId: editingPostId
      }
    });
  };

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={`${className?.includes('p-0')
        ? 'text-foreground hover:text-primary transition-colors'
        : 'text-foreground hover:text-primary transition-colors'
        } ${className}`}
      title={translate("Edit with AI Wizard")}
    >
      <Wand2 className={`${size === 'sm' ? 'h-6 w-6' : 'h-5 w-5'} ${className?.includes('p-0') ? '' : 'mr-1'} drop-shadow-sm`} />
      {children}
    </Button>
  );
};

export default MagicWizardButton;
