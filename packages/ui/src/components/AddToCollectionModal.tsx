import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Collection {
  id: string;
  name: string;
  description: string;
  slug: string;
  is_public: boolean;
  created_at: string;
}

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictureId?: string;
  postId?: string;
}

const AddToCollectionModal = ({ isOpen, onClose, pictureId, postId }: AddToCollectionModalProps) => {
  if (!pictureId && !postId) {
    console.error('AddToCollectionModal requires either pictureId or postId');
    return null;
  }
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchCollections();
      fetchItemCollections();
    }
  }, [isOpen, user, pictureId, postId]);

  const fetchCollections = async () => {
    if (!user) return;
    try {
      const data = await apiClient<Collection[]>(`/api/collections?userId=${user.id}`);
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchItemCollections = async () => {
    if (!user) return;
    try {
      if (postId) {
        const data = await apiClient<{ collection_id: string }[]>(`/api/collection-pictures?postId=${postId}`);
        setSelectedCollections(new Set(data.map((item: any) => item.collection_id)));
      } else if (pictureId) {
        const data = await apiClient<{ collection_id: string }[]>(`/api/collection-pictures?pictureId=${pictureId}`);
        setSelectedCollections(new Set(data.map(item => item.collection_id)));
      }
    } catch (error) {
      console.error('Error fetching item collections:', error);
    }
  };

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollection.name.trim()) return;

    setLoading(true);
    const slug = createSlug(newCollection.name);

    try {
      const data = await apiClient<Collection>('/api/collections', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          name: newCollection.name.trim(),
          description: newCollection.description.trim() || null,
          slug,
          is_public: newCollection.is_public,
        }),
      });

      if (postId) {
        await apiClient('/api/collection-pictures', { method: 'POST', body: JSON.stringify({ inserts: [{ collection_id: data.id, post_id: postId }] }) });
      } else if (pictureId) {
        await apiClient('/api/collection-pictures', { method: 'POST', body: JSON.stringify({ inserts: [{ collection_id: data.id, picture_id: pictureId }] }) });
      }

      setCollections(prev => [data, ...prev]);
      setSelectedCollections(prev => new Set([...prev, data.id]));
      setNewCollection({ name: '', description: '', is_public: true });
      setShowCreateForm(false);
      toast({ title: "Success", description: "Collection created and photo added!" });
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({ title: "Error", description: "Failed to create collection", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    if (!user) return;

    const isSelected = selectedCollections.has(collectionId);

    try {
      if (isSelected) {
        const body = postId
          ? { collection_id: collectionId, post_id: postId }
          : { collection_id: collectionId, picture_id: pictureId };
        await apiClient('/api/collection-pictures', { method: 'DELETE', body: JSON.stringify(body) });
        setSelectedCollections(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      } else {
        const insert = postId
          ? { collection_id: collectionId, post_id: postId }
          : { collection_id: collectionId, picture_id: pictureId };
        await apiClient('/api/collection-pictures', { method: 'POST', body: JSON.stringify({ inserts: [insert] }) });
        setSelectedCollections(prev => new Set([...prev, collectionId]));
      }
    } catch (error) {
      console.error('Error toggling collection:', error);
    }
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Collection preferences updated!"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Add to Collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new collection */}
          {!showCreateForm ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Collection
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Collection name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="public"
                    checked={newCollection.is_public}
                    onCheckedChange={(checked) =>
                      setNewCollection(prev => ({ ...prev, is_public: checked as boolean }))
                    }
                  />
                  <label htmlFor="public" className="text-sm">Make public</label>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateCollection}
                    disabled={!newCollection.name.trim() || loading}
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing collections */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className={`cursor-pointer transition-colors ${selectedCollections.has(collection.id)
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted/50'
                  }`}
                onClick={() => handleToggleCollection(collection.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{collection.name}</h4>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={selectedCollections.has(collection.id)}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {collections.length === 0 && !showCreateForm && (
            <p className="text-center text-muted-foreground py-4">
              No collections yet. Create your first one!
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCollectionModal;
