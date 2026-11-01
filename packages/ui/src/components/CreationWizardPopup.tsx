import React, { useState, useRef } from 'react';
import { uploadImage } from '@/lib/uploadUtils';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { T, translate } from '@/i18n';
import { Image, FilePlus, Zap, Mic, Loader2, Upload, Video, Layers, BookPlus, Plus, HardDrive } from 'lucide-react';

import { usePageGenerator } from '@/hooks/usePageGenerator';
import VoiceRecordingPopup from './VoiceRecordingPopup';

import AIPageGenerator from '@/modules/pages/AIPageGenerator';

import PostPicker from '@/modules/posts/components/PostPicker';
import { useWizardContext } from '@/hooks/useWizardContext';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { useAuth } from '@/hooks/useAuth';
import { useMediaRefresh } from '@/contexts/MediaRefreshContext';
import { createPicture } from '@/modules/posts/client-pictures';
import { fetchPostById } from '@/modules/posts/client-posts';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/db';
import { serverUrl } from '@/lib/db';

interface CreationWizardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  preloadedImages?: any[]; // ImageFile[]
  initialMode?: 'default' | 'page';
}

export const CreationWizardPopup: React.FC<CreationWizardPopupProps> = ({
  isOpen,
  onClose,
  preloadedImages = [],
  initialMode = 'default'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearWizardImage } = useWizardContext();
  const { generatePageFromText, isGenerating, status, cancelGeneration } = usePageGenerator();
  const { triggerRefresh } = useMediaRefresh();
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [showTextGenerator, setShowTextGenerator] = useState(initialMode === 'page');
  const [showPostPicker, setShowPostPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    prompt: textPrompt,
    setPrompt: setTextPrompt,
    promptHistory,
    historyIndex,
    navigateHistory,
    addPromptToHistory,
    setHistoryIndex
  } = usePromptHistory();

  // Reset/Sync state when dialog opens
  React.useEffect(() => {
    if (isOpen && initialMode === 'page') {
      setShowTextGenerator(true);
    }
  }, [isOpen, initialMode]);

  const handleImageWizard = (mode: 'direct' | 'agent' | 'voice') => {
    onClose();
    if (mode === 'direct') {
      clearWizardImage();
      // If we have preloaded images, pass them to the wizard
      if (preloadedImages.length > 0) {
        navigate('/wizard', { state: { initialImages: preloadedImages } });
      } else {
        navigate('/wizard');
      }
    } else {
      console.log(`Opening Image Wizard in ${mode} mode`);
    }
  };

  const handleCreatePost = () => {
    onClose();
    clearWizardImage();

    // Check for link metadata to auto-populate post
    let postTitle = '';
    let postDescription = '';

    // Use the first external page's metadata for the post
    const externalPage = preloadedImages.find(img => img.type === 'page-external');
    if (externalPage) {
      postTitle = externalPage.title || '';
      postDescription = externalPage.description || '';
    }

    // If we have preloaded images, pass them to the wizard
    if (preloadedImages.length > 0) {
      navigate('/wizard', {
        state: {
          mode: 'post',
          initialImages: preloadedImages,
          postTitle,
          postDescription
        }
      });
    } else {
      navigate('/post/new');
    }
  };

  const handleAppendToPost = () => {
    if (!user) {
      toast.error(translate('Please sign in to manage posts'));
      return;
    }
    setShowPostPicker(true);
  };

  const handlePostSelected = async (postId: string) => {
    setShowPostPicker(false);

    try {
      const toastId = toast.loading(translate('Loading post...'));

      // Fetch full post via API (returns FeedPost with pictures)
      const post = await fetchPostById(postId);

      if (!post) {
        toast.dismiss(toastId);
        toast.error(translate('Failed to load post'));
        return;
      }

      // Transform existing pictures
      const existingImages = (post.pictures || [])
        .sort((a: any, b: any) => ((a.position || 0) - (b.position || 0)))
        .map((p: any) => ({
          id: p.id,
          path: p.id,
          src: p.image_url,
          title: p.title,
          description: p.description || '',
          selected: false,
          realDatabaseId: p.id,
          type: p.type || 'image',
          isGenerated: false
        }));

      // Merge with preloaded images
      // Mark preloaded images as NEW (no realDatabaseId) so they can be added
      const newImages = (preloadedImages || []).map(img => ({
        ...img,
        selected: true // Select new images by default
      }));

      const combinedImages = [...existingImages, ...newImages];

      toast.dismiss(toastId);
      onClose();
      clearWizardImage();

      // Navigate to wizard with combined images and post details
      navigate('/wizard', {
        state: {
          mode: 'post',
          editingPostId: postId,
          initialImages: combinedImages,
          postTitle: post.title,
          postDescription: post.description
        }
      });

    } catch (err) {
      console.error('Error in handlePostSelected:', err);
      toast.error(translate('An error occurred'));
    }
  };

  const handlePageFromVoice = () => {
    setShowVoicePopup(true);
  };

  const handleGeneratePageFromText = async (options: {
    useImageTools: boolean;
    model?: string;
    provider?: string;
    imageModel?: string;
    referenceImages?: string[];
    webSearchEnabled?: boolean;
    pageToolsEnabled?: boolean;
    vfsToolsEnabled?: boolean;
    toolsEnabled?: boolean;
  }) => {
    if (!textPrompt.trim()) return;

    addPromptToHistory(textPrompt);
    setHistoryIndex(-1);

    const result = await generatePageFromText(textPrompt, options);
    // Only close on success
    if (result) {
      setShowTextGenerator(false);
      onClose();
    }
  };

  const handleGeneratePageFromVoice = async (transcribedText: string) => {
    setShowVoicePopup(false);
    // For voice, we assume the user wants the full experience, including images, as per the button's text "Voice + AI"
    const result = await generatePageFromText(transcribedText, { useImageTools: true });
    if (result) onClose();
  };

  const handleNewPage = () => {
    if (!user) {
      toast.error(translate('Please sign in to create a page'));
      return;
    }
    onClose();
    const url = `/user/${user.id}/pages/new`;
    navigate(url);
  };

  const handleImageUpload = async () => {
    // If we have preloaded images, upload them directly
    if (preloadedImages.length > 0) {
      if (!user) {
        toast.error(translate('Please sign in to upload images'));
        return;
      }
      setIsUploadingImage(true);
      try {
        let organizationId = null;
        for (const img of preloadedImages) {
          // Handle External Pages (Links)
          if (img.type === 'page-external') {
            await createPicture({
              user_id: user.id,
              title: img.title || 'Untitled Link',
              description: img.description || null,
              image_url: img.src,
              thumbnail_url: img.src,
              organization_id: organizationId,
              type: 'page-external',
              meta: img.meta
            } as any);
            continue; // Skip the rest of loop
          }

          const file = img.file;
          if (!file) continue;
          // Skip video files – they must go through the video upload path
          if (file.type.startsWith('video/')) continue;

          const { publicUrl } = await uploadImage(file, user.id);

          let dbData = {
            user_id: user.id,
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: null,
            image_url: publicUrl,
            organization_id: organizationId,
          };

          await createPicture(dbData as any);
        }
        toast.success(translate(`${preloadedImages.length} image(s) uploaded successfully!`));
        triggerRefresh();
        onClose();
        navigate('/');
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error(translate('Failed to upload images'));
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    imageInputRef.current?.click();
  };

  const handleFileUpload = async () => {
    const filesToUpload = preloadedImages.filter(img => img.file);
    if (filesToUpload.length === 0) {
      toast.error(translate('No files to upload'));
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      toast.error(translate('Please sign in to upload files'));
      return;
    }

    setIsUploadingFiles(true);
    setFileUploadProgress(0);
    const mount = 'home';
    let done = 0;

    try {
      await Promise.all(filesToUpload.map(img => new Promise<void>((resolve, reject) => {
        const file = img.file as File;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${serverUrl}/api/vfs/upload/${mount}/${encodeURIComponent(file.name)}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const filePct = (evt.loaded / evt.total) * 100;
            setFileUploadProgress(Math.round(((done * 100) + filePct) / filesToUpload.length));
          }
        };

        xhr.onload = () => {
          done++;
          setFileUploadProgress(Math.round((done / filesToUpload.length) * 100));
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = `Error ${xhr.status}`;
            try { const b = JSON.parse(xhr.responseText); msg = b.message || b.error || msg; } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));

        const formData = new FormData();
        formData.append('file', file);
        xhr.send(formData);
      })));

      toast.success(translate(`${filesToUpload.length} file(s) uploaded to storage`));
      onClose();
    } catch (error: any) {
      toast.error(error.message || translate('Upload failed'));
    } finally {
      setIsUploadingFiles(false);
      setFileUploadProgress(0);
    }
  };

  // Helper function to upload internal video
  const uploadInternalVideo = async (file: File): Promise<void> => {
    const videoToken = await getAuthToken();

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const title = file.name.replace(/\.[^/.]+$/, '');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${serverUrl}/api/videos/upload?userId=${user?.id}&title=${encodeURIComponent(title)}&preset=original`);
      if (videoToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${videoToken}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setVideoUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 202) {
          resolve();
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error'));
      };

      xhr.send(formData);
    });
  };

  const handleVideoUpload = async () => {
    // If we have preloaded images (which might be videos), upload them directly
    if (preloadedImages.length > 0) {
      if (!user) {
        toast.error(translate('Please sign in to upload videos'));
        return;
      }

      const videos = preloadedImages.filter(img => img.file?.type.startsWith('video/'));

      if (videos.length === 0) {
        toast.error(translate('No videos found in selection. Please drop video files.'));
        return;
      }

      setIsUploadingVideo(true);
      setVideoUploadProgress(0);

      try {
        let successCount = 0;
        const total = videos.length;

        for (const [index, img] of videos.entries()) {
          const file = img.file;
          if (!file) continue;

          toast.info(translate(`Uploading video ${index + 1}/${total}...`));
          await uploadInternalVideo(file);
          successCount++;
        }

        toast.success(translate(`${successCount} video(s) uploaded successfully!`));
        triggerRefresh();
        onClose();
        navigate('/');
      } catch (error: any) {
        console.error('Error uploading videos:', error);
        toast.error(translate(`Failed to upload video(s): ${error.message}`));
      } finally {
        setIsUploadingVideo(false);
        setVideoUploadProgress(0);
      }
      return;
    }

    videoInputRef.current?.click();
  };

  const handleImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    // Filter to valid image files
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      toast.error(translate('Please select valid image files'));
      return;
    }

    if (!user) {
      toast.error(translate('Please sign in to upload images'));
      return;
    }

    setIsUploadingImage(true);

    try {
      let organizationId = null;

      for (const file of files) {
        const { publicUrl } = await uploadImage(file, user.id);
        const imageTitle = file.name.replace(/\.[^/.]+$/, '');
        await createPicture({
          user_id: user.id,
          title: imageTitle,
          description: null,
          image_url: publicUrl,
          organization_id: organizationId,
        } as any);
      }

      toast.success(translate(`${files.length} image(s) uploaded successfully!`));
      triggerRefresh();
      onClose();
      navigate('/');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(translate(error?.message || 'Failed to upload image'));
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleVideoFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error(translate('Please select a valid video file'));
      return;
    }

    if (!user) {
      toast.error(translate('Please sign in to upload videos'));
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);

    try {
      toast.info(translate('Uploading video...'));
      await uploadInternalVideo(file);

      toast.success(translate('Video upload started! Processing in background.'));

      // Trigger PhotoGrid refresh
      triggerRefresh();

      onClose();
      navigate('/');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error(translate(`Failed to upload video: ${error.message}`));
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      // Clear the input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showTextGenerator} onOpenChange={(open) => {
        if (!open) {
          onClose();
          setShowTextGenerator(false);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <T>What would you like to create?</T>
            </DialogTitle>
            <DialogDescription className="text-center">
              <T>Choose from the options below to start generating or uploading content.</T>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            {/* Column 1: Images */}
            <div className="flex flex-col gap-4 p-6 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <Image className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold"><T>Images</T></h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <T>Generate AI images or upload your own photos to share.</T>
              </p>
              <div className="flex flex-col gap-2 mt-auto">
                <Button variant="outline" onClick={() => handleImageWizard('direct')}>
                  <Zap className="h-4 w-4 mr-2" />
                  <T>Generate AI Image</T>
                </Button>
                <Button
                  variant="default"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage || !user}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <T>Uploading...</T>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <T>Upload as Picture</T>
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCreatePost}>
                  <Layers className="h-4 w-4 mr-2" />
                  <T>Create Post</T>
                </Button>
                {preloadedImages.length > 0 && (
                  <Button variant="outline" onClick={handleAppendToPost}>
                    <BookPlus className="h-4 w-4 mr-2" />
                    <T>Append to Existing Post</T>
                  </Button>
                )}
                {preloadedImages.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleFileUpload}
                    disabled={isUploadingFiles}
                  >
                    {isUploadingFiles ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <T>Uploading</T> {fileUploadProgress}%
                      </>
                    ) : (
                      <>
                        <HardDrive className="h-4 w-4 mr-2" />
                        <T>Upload as Files</T>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Column 2: Videos */}
            <div className="flex flex-col gap-4 p-6 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <Video className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold"><T>Videos</T></h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <T>Upload videos to share with the community. Automatic processing and optimization.</T>
              </p>
              <div className="flex flex-col gap-2 mt-auto">
                <Button
                  variant="default"
                  onClick={handleVideoUpload}
                  disabled={isUploadingVideo || !user}
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <T>Uploading</T> {videoUploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      <T>Upload Video</T>
                    </>
                  )}
                </Button>
                {isUploadingVideo && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Pages */}
            <div className="flex flex-col gap-4 p-6 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-3">
                <FilePlus className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold"><T>Pages</T></h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <T>Generate complete pages with AI-powered text and images.</T>
              </p>
              <div className="flex flex-col gap-2 mt-auto">
                <Button variant="outline" onClick={() => setShowTextGenerator(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  <T>Generate with AI</T>
                </Button>
                <Button variant="outline" onClick={handleNewPage}>
                  <Plus className="h-4 w-4 mr-2" />
                  <T>New Page</T>
                </Button>
                <Button variant="default" onClick={handlePageFromVoice}>
                  <Mic className="h-4 w-4 mr-2" />
                  <T>Voice + AI</T>
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFileSelected}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoFileSelected}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPostPicker} onOpenChange={setShowPostPicker}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle><T>Select a Post to Append To</T></DialogTitle>
            <DialogDescription>
              <T>Choose one of your existing posts to add these {preloadedImages.length} file(s) to.</T>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            <PostPicker onSelect={handlePostSelected} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTextGenerator} onOpenChange={setShowTextGenerator}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle><T>Create a Page From Scratch</T></DialogTitle>
            <DialogDescription>
              <T>Describe the page you want the AI to create. It can generate text and images for you.</T>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AIPageGenerator
              prompt={textPrompt}
              onPromptChange={setTextPrompt}
              onGenerate={handleGeneratePageFromText}
              isGenerating={isGenerating}
              generationStatus={status}
              onCancel={cancelGeneration}
              promptHistory={promptHistory}
              historyIndex={historyIndex}
              onNavigateHistory={navigateHistory}
              initialReferenceImages={preloadedImages.map(img => img.src || img.image_url).filter(Boolean)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {showVoicePopup && (
        <VoiceRecordingPopup
          isOpen={showVoicePopup}
          onClose={() => setShowVoicePopup(false)}
          onTranscriptionComplete={handleGeneratePageFromVoice}
        />
      )}
    </>
  );
};
