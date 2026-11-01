/**
 * Context selector component for the filter system
 */

import React from 'react';
import { TemplateContext, ContextDefinition } from '@/llm/filters/types';
import { getContextDefinition, getContextIcon } from '@/llm/filters/contexts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, ShoppingCart, List, FileText, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

interface ContextSelectorProps {
  value: TemplateContext;
  onChange: (context: TemplateContext) => void;
  disabled?: boolean;
  className?: string;
  showManagement?: boolean;
}

const contextIcons = {
  [TemplateContext.MAKER_TUTORIALS]: Wrench,
  [TemplateContext.MARKETPLACE]: ShoppingCart,
  [TemplateContext.DIRECTORY]: List,
  [TemplateContext.COMMONS]: FileText,
};

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  showManagement = true
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<ContextDefinition | null>(null);
  const contexts: TemplateContext[] = [
    TemplateContext.MAKER_TUTORIALS,
    TemplateContext.MARKETPLACE,
    TemplateContext.DIRECTORY,
    TemplateContext.COMMONS
  ];

  const getIcon = (context: TemplateContext) => {
    const IconComponent = contextIcons[context];
    return <IconComponent className="h-4 w-4" />;
  };

  const getDescription = (context: TemplateContext) => {
    const definition = getContextDefinition(context);
    return definition.description;
  };

  const handleEditContext = (context: TemplateContext) => {
    const definition = getContextDefinition(context);
    setEditingContext(definition);
    setIsEditDialogOpen(true);
  };

  const handleSaveContext = () => {
    // TODO: Implement context saving to database
    console.log('Saving context:', editingContext);
    setIsEditDialogOpen(false);
    setEditingContext(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Context</label>
        {showManagement && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditContext(value)}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a context" />
        </SelectTrigger>
        <SelectContent>
          {contexts.map((context) => (
            <SelectItem key={context} value={context}>
              <div className="flex items-center gap-2">
                {getIcon(context)}
                <span>{getContextDefinition(context).displayName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Edit Context Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Context</DialogTitle>
          </DialogHeader>
          
          {editingContext && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="context-name">Display Name</Label>
                <Input
                  id="context-name"
                  value={editingContext.displayName}
                  onChange={(e) => setEditingContext({
                    ...editingContext,
                    displayName: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="context-description">Description</Label>
                <Textarea
                  id="context-description"
                  value={editingContext.description}
                  onChange={(e) => setEditingContext({
                    ...editingContext,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveContext}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
