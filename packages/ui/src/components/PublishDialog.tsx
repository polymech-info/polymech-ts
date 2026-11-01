import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, RefreshCw, GitBranch, Bookmark } from 'lucide-react';
import { apiClient } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (option: 'overwrite' | 'new' | 'version' | 'add-to-post', title?: string, description?: string, parentId?: string, collectionIds?: string[]) => void;
  originalTitle: string;
  originalImageId?: string;
  isPublishing?: boolean;
  editingPostId?: string;
}

export default function PublishDialog({
  isOpen,
  onClose,
  onPublish,
  originalTitle,
  originalImageId,
  isPublishing = false,
  editingPostId
}: PublishDialogProps) {
  const { user } = useAuth();
  const [publishOption, setPublishOption] = useState<'overwrite' | 'new' | 'version' | 'add-to-post'>('new');
  const [title, setTitle] = useState(originalTitle);
  const [description, setDescription] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Load user's collections when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadCollections();
      // Default to "add-to-post" if editing a post
      if (editingPostId) {
        setPublishOption('add-to-post');
      } else {
        setPublishOption('new');
      }
    }
  }, [isOpen, user, editingPostId]);

  const loadCollections = async () => {
    if (!user) return;

    setLoadingCollections(true);
    try {
      const data = await apiClient<Collection[]>(`/api/collections?userId=${user.id}`);
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish(
      publishOption,
      title.trim() || undefined,
      description.trim() || undefined,
      originalImageId,
      selectedCollections.length > 0 ? selectedCollections : undefined
    );
  };

  const handleClose = () => {
    if (!isPublishing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Publish Generated Image
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Publishing Option
              </Label>
              <RadioGroup
                value={publishOption}
                onValueChange={(value) => setPublishOption(value as 'overwrite' | 'new' | 'version' | 'add-to-post')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <div className="flex-1">
                    <Label htmlFor="overwrite" className="font-medium cursor-pointer">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Overwrite Original
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Replace the original image with the generated version
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="new" id="new" />
                  <div className="flex-1">
                    <Label htmlFor="new" className="font-medium cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Create New Post
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save as a new image in your gallery
                    </p>
                  </div>
                </div>

                {originalImageId && (
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="version" id="version" />
                    <div className="flex-1">
                      <Label htmlFor="version" className="font-medium cursor-pointer">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Save as Version
                        </div>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create a new version linked to the original image
                      </p>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </div>

            {(publishOption === 'new' || publishOption === 'version' || publishOption === 'add-to-post') && (
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Title <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title..."
                    className="mt-1"
                    disabled={isPublishing}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for your generated image..."
                    className="mt-1 resize-none"
                    rows={3}
                    disabled={isPublishing}
                  />
                </div>

                {/* Collections Selection */}
                {collections.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      Add to Collections <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                      {loadingCollections ? (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          Loading collections...
                        </div>
                      ) : (
                        collections.map((collection) => (
                          <div key={collection.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`collection-${collection.id}`}
                              checked={selectedCollections.includes(collection.id)}
                              onCheckedChange={() => toggleCollection(collection.id)}
                              disabled={isPublishing}
                            />
                            <label
                              htmlFor={`collection-${collection.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {collection.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedCollections.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Will be added to {selectedCollections.length} collection{selectedCollections.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Publishing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {publishOption === 'overwrite' && <RefreshCw className="h-4 w-4" />}
                    {publishOption === 'new' && <Upload className="h-4 w-4" />}
                    {publishOption === 'version' && <GitBranch className="h-4 w-4" />}
                    {publishOption === 'add-to-post' && <Bookmark className="h-4 w-4" />}
                    {publishOption === 'overwrite' ? 'Overwrite' :
                      publishOption === 'version' ? 'Save Version' :
                        publishOption === 'add-to-post' ? 'Add to Post' : 'Publish New'}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
