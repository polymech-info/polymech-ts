import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const NewCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a collection");
      navigate("/auth");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    setIsCreating(true);

    try {
      const slug = generateSlug(name);

      const data = await apiClient<any>('/api/collections', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          slug,
          is_public: isPublic,
        }),
      });

      toast.success("Collection created successfully!");
      navigate(`/collections/${user.id}/${data.slug || slug}`);
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error("Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
            <CardDescription>
              Organize your photos into collections that you can share with others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Collection Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer 2024, Nature Photography"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this collection is about..."
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can view this collection
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="flex-1"
                >
                  {isCreating ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCollection;


