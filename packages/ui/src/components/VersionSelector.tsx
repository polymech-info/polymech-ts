import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Image as ImageIcon, Eye, EyeOff, Trash2 } from 'lucide-react';
import { fetchPictureById, updatePicture, deletePictures, fetchUserPictures } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Version {
  id: string;
  title: string;
  image_url: string;
  is_selected: boolean;
  created_at: string;
  parent_id: string | null;
  visible: boolean;
  user_id: string; // Added for storage deletion path
}

interface VersionSelectorProps {
  currentPictureId: string;
  onVersionSelect: (selectedVersionId: string) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({
  currentPictureId,
  onVersionSelect
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [currentPictureId]);

  const loadVersions = async () => {
    if (!user || !currentPictureId) return;

    setLoading(true);
    try {
      // Get the current picture to determine if it's a parent or child
      const currentPicture = await fetchPictureById(currentPictureId);
      if (!currentPicture) throw new Error('Picture not found');

      // Fetch all user pictures and walk the full tree (same as VersionMap)
      const allPictures = await fetchUserPictures(currentPicture.user_id);
      if (!allPictures || allPictures.length === 0) {
        setVersions([]);
        return;
      }

      const pictureMap = new Map(allPictures.map((p: any) => [p.id, p]));

      // Walk up to find the true root
      let trueRootId = currentPicture.id;
      let current: any = pictureMap.get(currentPicture.id);
      while (current?.parent_id && pictureMap.has(current.parent_id)) {
        trueRootId = current.parent_id;
        current = pictureMap.get(current.parent_id);
      }

      // Collect all descendants from root
      const tree: any[] = [];
      const visited = new Set<string>();
      const collect = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        const node = pictureMap.get(nodeId);
        if (!node) return;
        visited.add(nodeId);
        tree.push(node);
        allPictures.filter((p: any) => p.parent_id === nodeId).forEach((child: any) => collect(child.id));
      };
      collect(trueRootId);

      setVersions(tree || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error(translate('Failed to load image versions'));
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = async (versionId: string) => {
    if (!user) return;

    setUpdating(versionId);
    try {
      const targetVersion = versions.find(v => v.id === versionId);
      if (!targetVersion) return;

      // Toggle: if already selected, unselect; otherwise select
      const newSelected = !targetVersion.is_selected;

      await updatePicture(versionId, { is_selected: newSelected } as any);

      // Update local state
      setVersions(prevVersions =>
        prevVersions.map(v => ({
          ...v,
          is_selected: v.id === versionId ? newSelected : v.is_selected
        }))
      );

      toast.success(translate(newSelected ? 'Version selected!' : 'Version unselected!'));
      onVersionSelect(versionId);
    } catch (error) {
      console.error('Error toggling version selection:', error);
      toast.error(translate('Failed to update version'));
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleVisibility = async (versionId: string, currentVisibility: boolean) => {
    if (!user) return;

    setToggling(versionId);
    try {
      await updatePicture(versionId, { visible: !currentVisibility } as any);

      // Update local state
      setVersions(prevVersions =>
        prevVersions.map(v => ({
          ...v,
          visible: v.id === versionId ? !currentVisibility : v.visible
        }))
      );

      toast.success(translate(!currentVisibility ? 'Version made visible successfully!' : 'Version hidden successfully!'));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error(translate('Failed to update visibility'));
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (version: Version) => {
    setVersionToDelete(version);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!versionToDelete || !user) return;

    setIsDeleting(true);
    try {
      // 1. Find all descendants to delete (cascade)
      const allUserPictures = await fetchUserPictures(user.id);

      const findDescendants = (parentId: string): any[] => {
        const descendants: any[] = [];
        const children = allUserPictures.filter((p: any) => p.parent_id === parentId);
        children.forEach((child: any) => {
          descendants.push(child);
          descendants.push(...findDescendants(child.id));
        });
        return descendants;
      };

      const descendantsToDelete = findDescendants(versionToDelete.id);
      const allToDelete = [versionToDelete, ...descendantsToDelete];
      const idsToDelete = allToDelete.map(v => v.id);

      // 2. Batch delete via API (handles storage + db)
      await deletePictures(idsToDelete);

      // 3. Update local state
      const deletedIds = new Set(idsToDelete);
      setVersions(prev => prev.filter(v => !deletedIds.has(v.id)));

      const totalDeleted = allToDelete.length;
      toast.success(translate(`Deleted ${totalDeleted > 1 ? `${totalDeleted} versions` : 'version'} successfully`));

    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error(translate('Failed to delete version'));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setVersionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-muted-foreground"><T>Loading versions...</T></div>
      </div>
    );
  }

  if (versions.length <= 1) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground"><T>No other versions available for this image.</T></p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-5 w-5" />
        <h3 className="font-semibold"><T>Image Versions</T></h3>
        <Badge variant="secondary">{versions.length}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {versions.map((version) => (
          <Card
            key={version.id}
            className={`cursor-pointer transition-all hover:scale-105 ${version.is_selected ? 'ring-2 ring-primary' : ''
              }`}
          >
            <CardContent className="p-2">
              <div className="aspect-square relative mb-2 overflow-hidden rounded-md">
                <img
                  src={version.image_url}
                  alt={version.title}
                  className="w-full h-full object-cover"
                />
                {version.is_selected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium truncate">{version.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(version.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1">
                  {version.parent_id === null && (
                    <Badge variant="outline" className="text-xs"><T>Original</T></Badge>
                  )}
                  {!version.visible && (
                    <Badge variant="secondary" className="text-xs"><T>Hidden</T></Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  variant={version.is_selected ? "default" : "outline"}
                  onClick={() => handleVersionSelect(version.id)}
                  disabled={updating === version.id}
                >
                  <T>{updating === version.id ? 'Updating...' :
                    version.is_selected ? 'Unselect' : 'Select'}</T>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleVisibility(version.id, version.visible)}
                  disabled={toggling === version.id}
                  className="px-2"
                >
                  {toggling === version.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                  ) : version.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(version)}
                  disabled={isDeleting || version.id === currentPictureId} // Disable deleting the currently ACTIVE one? Or just handle correctly?
                  title={translate("Delete version")}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle><T>Delete Version</T></AlertDialogTitle>
            <AlertDialogDescription>
              <T>Are you sure you want to delete this version?</T> "{versionToDelete?.title}"
              <br /><br />
              <span className="text-destructive font-semibold">
                <T>This action cannot be undone.</T>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <T>Deleting...</T> : <T>Delete</T>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VersionSelector;
