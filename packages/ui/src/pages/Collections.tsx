import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/db';
import { uploadImage } from '@/lib/uploadUtils';
import { createPicture } from '@/modules/posts/client-pictures';
import { fetchCommentsAPI } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PhotoGrid from '@/components/PhotoGrid';
import ImageWizard from '@/components/ImageWizard';
import { Share2, Edit3, Trash2, ArrowLeft, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface Collection {
  id: string;
  name: string;
  description: string;
  slug: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
}

interface Picture {
  id: string;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  comments: { count: number }[];
}

const CollectionsContent = () => {
  const { userId, slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);

  const isOwner = user?.id === userId;

  interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  }
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const uploadingFilesRef = React.useRef<UploadingFile[]>([]);
  uploadingFilesRef.current = uploadingFiles;

  useEffect(() => {
    return () => {
      uploadingFilesRef.current.forEach(f => URL.revokeObjectURL(f.preview));
    }
  }, []);

  useEffect(() => {
    const completedCount = uploadingFiles.filter(f => f.status === 'complete').length;
    const errorCount = uploadingFiles.filter(f => f.status === 'error').length;
    const totalProcessed = completedCount + errorCount;

    if (uploadingFiles.length > 0 && totalProcessed === uploadingFiles.length) {
      if (completedCount > 0) {
        toast({
          title: "Upload complete",
          description: `${completedCount} of ${uploadingFiles.length} files added to the collection.`
        });
        fetchCollection();
      }
      if (errorCount > 0) {
        toast({
          title: "Upload error",
          description: `${errorCount} files failed to upload.`,
          variant: "destructive"
        });
      }

      setTimeout(() => {
        setUploadingFiles([]);
      }, 5000);
    }
  }, [uploadingFiles]);


  const uploadAndProcessFiles = (filesToUpload: UploadingFile[]) => {
    filesToUpload.forEach(async (fileToUpload) => {
      try {
        if (!user || !collection) return;

        setUploadingFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'uploading', progress: 10 } : f));

        setUploadingFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, progress: 30, status: 'uploading' } : f));

        const { publicUrl } = await uploadImage(fileToUpload.file, user.id);

        setUploadingFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, progress: 70, status: 'processing' } : f));

        const newPicture = await createPicture({
          user_id: user.id,
          image_url: publicUrl,
          thumbnail_url: publicUrl,
          title: '',
          description: '',
        } as any) as any;

        await apiClient('/api/collection-pictures', {
          method: 'POST',
          body: JSON.stringify({ inserts: [{ collection_id: collection.id, picture_id: newPicture.id }] }),
        });

        setUploadingFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'complete', progress: 100 } : f));

      } catch (error: any) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => prev.map(f => f.id === fileToUpload.id ? { ...f, status: 'error', error: error.message, progress: 100 } : f));
      }
    });
  };

  const handleFileUpload = (files: File[]) => {
    if (!isOwner) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newFiles: UploadingFile[] = imageFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    uploadAndProcessFiles(newFiles);
  };

  useEffect(() => {
    if (userId && slug) {
      fetchCollection();
    }
  }, [userId, slug]);

  const fetchCollection = async () => {
    try {
      setLoading(true);

      const collections = await apiClient<Collection[]>(`/api/collections?userId=${userId}&slug=${slug}`);
      const collectionData = collections?.[0];

      if (!collectionData) {
        console.error('Collection not found');
        return;
      }

      setCollection(collectionData);

      const picturesData = await apiClient<Picture[]>(`/api/collection-pictures/pictures?collectionId=${collectionData.id}`);
      const flattenedPictures = picturesData || [];

      const picturesWithCommentCounts = await Promise.all(
        flattenedPictures.map(async (picture) => {
          try {
            const result = await fetchCommentsAPI(picture.id);
            return { ...picture, comments: [{ count: result.comments?.length || 0 }] };
          } catch {
            return { ...picture, comments: [{ count: 0 }] };
          }
        })
      );

      setPictures(picturesWithCommentCounts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Collection link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const handleWizardPublish = async (imageUrl: string, prompt: string) => {
    if (!collection || !user) return;

    try {
      const pics = await apiClient<any[]>(`/api/pictures?userId=${user.id}&imageUrl=${encodeURIComponent(imageUrl)}&limit=1`);
      const picture = pics?.[0];

      if (!picture) {
        console.error('Could not find published picture');
        return;
      }

      await apiClient('/api/collection-pictures', {
        method: 'POST',
        body: JSON.stringify({ inserts: [{ collection_id: collection.id, picture_id: picture.id }] }),
      });

      toast({
        title: "Success!",
        description: "Image added to collection"
      });

      // Refresh the collection to show the new image
      fetchCollection();
    } catch (error) {
      console.error('Error in wizard publish handler:', error);
    }
  };

  const handleOpenEditDialog = () => {
    if (!collection) return;
    setEditForm({
      name: collection.name,
      description: collection.description || '',
      is_public: collection.is_public
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!collection || !user || !editForm.name.trim()) return;

    setIsSaving(true);
    try {
      const newSlug = editForm.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      await apiClient(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          is_public: editForm.is_public,
          slug: newSlug,
        }),
      });

      toast({
        title: "Success!",
        description: "Collection updated"
      });

      setEditDialogOpen(false);

      // Navigate to new slug if it changed
      if (newSlug !== slug) {
        navigate(`/collections/${userId}/${newSlug}`);
      } else {
        fetchCollection();
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection || !user) return;

    setIsDeleting(true);
    try {
      await apiClient('/api/collection-pictures', {
        method: 'DELETE',
        body: JSON.stringify({ collection_id: collection.id, deleteAll: true }),
      });
      await apiClient(`/api/collections/${collection.id}`, { method: 'DELETE' });

      toast({
        title: "Success!",
        description: "Collection deleted"
      });

      // Navigate back to user's collections page
      navigate(`/user/${userId}/collections`);
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Collection not found</h2>
          <p className="text-muted-foreground">This collection doesn't exist or is private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/user/${userId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>

        {/* Collection Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground text-lg mb-4">
                    {collection.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{pictures.length} {pictures.length === 1 ? 'photo' : 'photos'}</span>
                  <span>Created {new Date(collection.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    {collection.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {isOwner && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setWizardOpen(true)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Wizard
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {isOwner && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant={isLayoutEditMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {isLayoutEditMode ? 'Done' : 'Edit Layout'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Uploading {uploadingFiles.length} {uploadingFiles.length === 1 ? 'image' : 'images'}...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {uploadingFiles.map(upload => (
                  <div key={upload.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={upload.preview}
                        alt={upload.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <p className="text-white text-xs text-center p-1 truncate">{upload.file.name}</p>
                    </div>

                    {upload.status !== 'pending' && (
                      <Progress value={upload.progress} className="w-full h-1 mt-1" />
                    )}
                    {upload.status === 'error' && (
                      <div className="text-xs text-red-500 mt-1 truncate" title={upload.error}>
                        Upload failed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images Grid */}
        <PhotoGrid
          customPictures={pictures.map(p => ({ ...p, type: 'image', meta: {} }))}
          customLoading={loading}
          navigationSource="collection"
          navigationSourceId={collection?.id}
          isOwner={isOwner}
          onFilesDrop={handleFileUpload}
        />
      </div>

      {/* Image Wizard Modal */}
      {wizardOpen && (
        <ImageWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onPublish={handleWizardPublish}
        />
      )}

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Collection Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Summer 2024"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this collection is about..."
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="edit-public">Public Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can view this collection
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={editForm.is_public}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editForm.name.trim()}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collection?.name}"? This will remove the collection but not the photos in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Collection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Collections = () => (
  <CollectionsContent />
);

export default Collections;