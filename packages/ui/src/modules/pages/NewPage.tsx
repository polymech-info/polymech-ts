import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPage, fetchPageById } from "@/modules/pages/client-pages";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, FolderTree, LayoutTemplate, X, GitMerge } from "lucide-react";
import { T, translate } from "@/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryManager } from "@/components/widgets/CategoryManager";
import { getLayouts } from "@/modules/layout/client-layouts";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, Category } from "@/modules/categories/client-categories";
import { useAppConfig } from '@/hooks/useSystemInfo';

const NewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const [searchParams] = useSearchParams();
  const parentPageId = searchParams.get('parent');
  const appConfig = useAppConfig();
  const srcLang = appConfig?.i18n?.source_language;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [visible, setVisible] = useState(true);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [creating, setCreating] = useState(false);

  // Category picker
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Layout template
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("none");

  // Fetch parent page details if parentPageId is set
  const { data: parentPage } = useQuery({
    queryKey: ['page', parentPageId],
    queryFn: () => fetchPageById(parentPageId!),
    enabled: !!parentPageId,
  });

  // Fetch layout templates
  const { data: templates = [] } = useQuery({
    queryKey: ['layouts', 'canvas'],
    queryFn: async () => {
      const { data } = await getLayouts({ type: 'canvas' });
      return data || [];
    }
  });

  // Fetch categories for display
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories({ includeChildren: true, sourceLang: srcLang })
  });

  // Flatten categories for name lookup
  const flattenCategories = (cats: Category[]): Category[] => {
    let flat: Category[] = [];
    cats.forEach(c => {
      flat.push(c);
      if (c.children) {
        c.children.forEach(childRel => {
          flat = [...flat, ...flattenCategories([childRel.child])];
        });
      }
    });
    return flat;
  };

  const allCatsFlat = flattenCategories(allCategories);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (autoGenerateSlug) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreatePage = async () => {
    if (!user) {
      toast.error(translate('Please sign in to create a page'));
      return;
    }

    if (!title.trim()) {
      toast.error(translate('Please enter a page title'));
      return;
    }

    if (!slug.trim()) {
      toast.error(translate('Please enter a page slug'));
      return;
    }

    try {
      setCreating(true);

      // Parse tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Build meta with categories
      const meta: any = {};
      if (selectedCategoryIds.length > 0) {
        meta.categoryIds = selectedCategoryIds;
      }

      // Build content from selected layout template
      let content: any = null;
      if (selectedLayoutId && selectedLayoutId !== 'none') {
        const template = templates.find((t: any) => t.id === selectedLayoutId);
        if (template?.layout_json) {
          content = template.layout_json;
        }
      }

      // Create via server API (ensures cache flush)
      const newPage = await createPage({
        title: title.trim(),
        slug: slug.trim(),
        tags: tagArray.length > 0 ? tagArray : null,
        is_public: isPublic,
        visible: visible,
        content,
        meta: Object.keys(meta).length > 0 ? meta : null,
        ...(parentPageId ? { parent: parentPageId } : {}),
      });

      toast.success(translate('Page created successfully!'));

      // Navigate to the new page
      const pageUrl = orgSlug
        ? `/org/${orgSlug}/user/${user.id}/pages/${newPage.slug}`
        : `/user/${user.id}/pages/${newPage.slug}`;

      navigate(pageUrl);
    } catch (error: any) {
      console.error('Error creating page:', error);
      const msg = error?.message?.includes('slug already exists')
        ? translate('A page with this slug already exists')
        : translate('Failed to create page');
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    const backUrl = orgSlug
      ? `/org/${orgSlug}/user/${user?.id}`
      : `/user/${user?.id}`;
    navigate(backUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle><T>Create New Page</T></CardTitle>
                <CardDescription>
                  <T>Add a new page to your profile</T>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Parent Page */}
            {parentPage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <GitMerge className="h-4 w-4 shrink-0 text-orange-500" />
                <span><T>Child of</T></span>
                <span className="font-medium text-foreground">{parentPage.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => navigate(window.location.pathname, { replace: true })}
                  title={translate('Remove parent')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                <T>Page Title</T> <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={translate('Enter page title...')}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">
                  <T>URL Slug</T> <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoGenerateSlug}
                    onCheckedChange={setAutoGenerateSlug}
                  />
                  <span className="text-xs text-muted-foreground">
                    <T>Auto-generate</T>
                  </span>
                </div>
              </div>
              <Input
                id="slug"
                placeholder={translate('page-url-slug')}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={autoGenerateSlug}
              />
              <p className="text-xs text-muted-foreground">
                <T>URL:</T> /user/{user?.id}/pages/<span className="text-primary">{slug || 'slug'}</span>
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>
                <T>Category</T>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCategoryPicker(true)}
                >
                  <FolderTree className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedCategoryIds.length > 0 ? (
                    <span className="truncate">
                      {selectedCategoryIds.map(id => allCatsFlat.find(c => c.id === id)?.name || id).join(', ')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground"><T>Select categories...</T></span>
                  )}
                </Button>
                {selectedCategoryIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategoryIds([])}
                    className="text-muted-foreground"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            {/* Layout Template */}
            <div className="space-y-2">
              <Label htmlFor="layout">
                <T>Layout Template</T>
              </Label>
              <Select value={selectedLayoutId} onValueChange={setSelectedLayoutId}>
                <SelectTrigger id="layout">
                  <SelectValue placeholder={translate('Select a layout...')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none"><T>Empty (blank page)</T></SelectItem>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="h-3 w-3" />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                <T>Start with a pre-built layout or blank page</T>
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">
                <T>Tags</T>
              </Label>
              <Input
                id="tags"
                placeholder={translate('tag1, tag2, tag3...')}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                <T>Separate tags with commas</T>
              </p>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm"><T>Visibility Settings</T></h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">
                    <T>Public Page</T>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    <T>Anyone can view this page</T>
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="visible">
                    <T>Visible on Profile</T>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    <T>Show this page on your profile</T>
                  </p>
                </div>
                <Switch
                  id="visible"
                  checked={visible}
                  onCheckedChange={setVisible}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreatePage}
                disabled={creating || !title.trim() || !slug.trim()}
                className="flex-1"
              >
                {creating ? <T>Creating...</T> : <T>Create Page</T>}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={creating}
              >
                <T>Cancel</T>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Picker Dialog */}
      <CategoryManager
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        mode="pick"
        selectedCategoryIds={selectedCategoryIds}
        onPick={setSelectedCategoryIds}
      />
    </div>
  );
};

export default NewPage;
