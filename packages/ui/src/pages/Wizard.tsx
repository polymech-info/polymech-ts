import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useWizardContext } from "@/hooks/useWizardContext";
import ImageWizard from "@/components/ImageWizard";

const Wizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { wizardReturnPath, clearWizardImage } = useWizardContext();

  const mode = location.state?.mode || 'default';
  const initialImages = location.state?.initialImages || [];
  const postTitle = location.state?.postTitle || "";
  const postDescription = location.state?.postDescription || "";
  const postSettings = location.state?.postSettings;
  const editingPostId = location.state?.editingPostId;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleClose = () => {
    // Clear wizard data when closing
    clearWizardImage();

    // Return to the path we came from, or go back
    if (wizardReturnPath) {
      navigate(wizardReturnPath);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="pt-4"> {/* Add padding top to account for TopNavigation */}
      <ImageWizard
        isOpen={true}
        onClose={handleClose}
        initialImages={initialImages}
        mode={mode}
        initialPostTitle={postTitle}
        initialPostDescription={postDescription}
        initialPostSettings={postSettings}
        editingPostId={editingPostId}
      />
    </div>
  );
};


export default Wizard;