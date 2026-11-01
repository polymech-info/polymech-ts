/**
 * Template selector component for the filter system
 */

import React, { useState, useEffect } from 'react';
import { TemplateContext, TemplateConfig } from '@/llm/filters/types';
import { getContextTemplateConfigs, getContextTemplates } from '@/llm/filters/templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  context: TemplateContext;
  selectedTemplates: string[];
  onTemplatesChange: (templates: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  context,
  selectedTemplates,
  onTemplatesChange,
  disabled = false,
  className = ''
}) => {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const contextTemplates = getContextTemplateConfigs(context);
        setTemplates(contextTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [context]);

  const handleTemplateToggle = (templateName: string) => {
    if (disabled) return;
    
    const newSelection = selectedTemplates.includes(templateName)
      ? selectedTemplates.filter(t => t !== templateName)
      : [...selectedTemplates, templateName];
    
    onTemplatesChange(newSelection);
  };

  const handleEditTemplate = (template: TemplateConfig) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    // TODO: Implement template saving to database
    toast.success('Template saved successfully');
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateName: string) => {
    // TODO: Implement template deletion
    toast.success('Template deleted');
  };

  const handleDuplicateTemplate = (template: TemplateConfig) => {
    const duplicated = {
      ...template,
      name: `${template.name} (Copy)`,
      editable: true
    };
    setEditingTemplate(duplicated);
    setIsEditDialogOpen(true);
  };

  const togglePreview = (templateName: string) => {
    setShowPreview(prev => ({
      ...prev,
      [templateName]: !prev[templateName]
    }));
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">Templates</label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Templates</label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedTemplates.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => (
          <Card key={template.name} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePreview(template.name)}
                    disabled={disabled}
                    className="h-6 w-6 p-0"
                  >
                    {showPreview[template.name] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  {template.editable && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        disabled={disabled}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        disabled={disabled}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.name)}
                        disabled={disabled}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id={template.name}
                  checked={selectedTemplates.includes(template.name)}
                  onCheckedChange={() => handleTemplateToggle(template.name)}
                  disabled={disabled}
                />
                <Label htmlFor={template.name} className="text-sm">
                  Use this template
                </Label>
              </div>

              {showPreview[template.name] && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-2">Prompt Preview:</div>
                  <div className="text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {template.prompt}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {template.filters.map((filter) => (
                      <Badge key={filter} variant="secondary" className="text-xs">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.name === `${editingTemplate?.name} (Copy)` ? 'Create New Template' : 'Edit Template'}
            </DialogTitle>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="template-format">Format</Label>
                  <select
                    id="template-format"
                    value={editingTemplate.format}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      format: e.target.value as any
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="template-prompt">Prompt</Label>
                <Textarea
                  id="template-prompt"
                  value={editingTemplate.prompt}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    prompt: e.target.value
                  })}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
