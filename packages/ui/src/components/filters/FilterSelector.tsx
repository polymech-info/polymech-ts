/**
 * Filter selector component for the filter system
 */

import React, { useState, useEffect } from 'react';
import { FilterFlag, FilterCategory, TemplateContext } from '@/llm/filters/types';
import { getInstructionsByCategory, INSTRUCTIONS } from '@/llm/filters/instructions';
import { getContextDefaultFilters } from '@/llm/filters/contexts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Info, Settings, Shield, FileText, Wand2, Plus, Edit, Trash2 } from 'lucide-react';

interface FilterSelectorProps {
  context: TemplateContext;
  customFilters: FilterFlag[];
  onFiltersChange: (filters: FilterFlag[]) => void;
  disabled?: boolean;
  className?: string;
  showManagement?: boolean;
}

const categoryIcons: Record<string, any> = {
  tone: Wand2,
  content: FileText,
  moderation: Shield,
  format: Settings,
  context: Info,
};

const categoryDescriptions: Record<string, string> = {
  tone: 'Adjust the tone and style of the content',
  content: 'Modify and clean up the content itself',
  moderation: 'Filter out inappropriate or suspicious content',
  format: 'Change the structure and formatting',
  context: 'Context-specific instructions and settings',
};

const predefinedFilters: Record<FilterCategory, FilterFlag[]> = {
  [FilterCategory.TONE]: [
    { category: FilterCategory.TONE, flag: 'formal', enabled: false },
    { category: FilterCategory.TONE, flag: 'casual', enabled: false },
    { category: FilterCategory.TONE, flag: 'professional', enabled: false },
  ],
  [FilterCategory.CONTENT]: [
    { category: FilterCategory.CONTENT, flag: 'spellCheck', enabled: false },
    { category: FilterCategory.CONTENT, flag: 'removeEmojis', enabled: false },
    { category: FilterCategory.CONTENT, flag: 'convertUnits', enabled: false },
    { category: FilterCategory.CONTENT, flag: 'removeLinks', enabled: false },
    { category: FilterCategory.CONTENT, flag: 'shorten', enabled: false },
  ],
  [FilterCategory.MODERATION]: [
    { category: FilterCategory.MODERATION, flag: 'mafiaFilter', enabled: false },
    { category: FilterCategory.MODERATION, flag: 'deprogramming', enabled: false },
  ],
  [FilterCategory.FORMAT]: [
    { category: FilterCategory.FORMAT, flag: 'formatStructured', enabled: false },
  ],
};

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  context,
  customFilters,
  onFiltersChange,
  disabled = false,
  className = '',
  showManagement = true
}) => {
  const [availableFilters, setAvailableFilters] = useState<Record<string, Array<{flag: string; text: string}>>>({});
  const [contextDefaults, setContextDefaults] = useState<Record<string, string[]>>({});
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customFilterName, setCustomFilterName] = useState('');
  const [customFilterDescription, setCustomFilterDescription] = useState('');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Load instructions from the instruction system
        const allInstructions: Record<string, Array<{flag: string; text: string}>> = {};
        Object.entries(INSTRUCTIONS).forEach(([category, instructions]) => {
          allInstructions[category] = instructions;
        });
        setAvailableFilters(allInstructions);
        
        const defaults = getContextDefaultFilters(context);
        setContextDefaults(defaults);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };

    loadFilters();
  }, [context]);

  const handleFilterToggle = (category: FilterCategory, flag: string) => {
    if (disabled) return;

    const existingFilter = customFilters.find(f => f.category === category && f.flag === flag);
    
    if (existingFilter) {
      // Toggle existing filter
      const updatedFilters = customFilters.map(f => 
        f === existingFilter ? { ...f, enabled: !f.enabled } : f
      );
      onFiltersChange(updatedFilters);
    } else {
      // Add new filter
      const newFilter: FilterFlag = { category, flag, enabled: true };
      onFiltersChange([...customFilters, newFilter]);
    }
  };

  const isFilterEnabled = (category: FilterCategory, flag: string) => {
    const filter = customFilters.find(f => f.category === category && f.flag === flag);
    return filter?.enabled || false;
  };

  const isFilterDefault = (category: FilterCategory, flag: string) => {
    const categoryDefaults = contextDefaults[category] || [];
    return categoryDefaults.includes(flag);
  };

  const getFilterDescription = (category: string, flag: string) => {
    const categoryInstructions = availableFilters[category] || [];
    const instruction = categoryInstructions.find(i => i.flag === flag);
    return instruction?.text || 'Custom filter';
  };

  const handleAddCustomFilter = () => {
    if (customFilterName.trim()) {
      // TODO: Implement custom filter creation
      console.log('Adding custom filter:', { name: customFilterName, description: customFilterDescription });
      setCustomFilterName('');
      setCustomFilterDescription('');
      setIsCustomDialogOpen(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Custom Filters</label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {customFilters.filter(f => f.enabled).length} enabled
          </Badge>
          {showManagement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomDialogOpen(true)}
              disabled={disabled}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(availableFilters).map(([category, instructions]) => {
          const IconComponent = categoryIcons[category] || Settings;
          const isContextDefault = Object.keys(contextDefaults).includes(category);
          
          return (
            <Card key={category} className={isContextDefault ? 'border-primary/20' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                  {isContextDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryDescriptions[category] || 'Filter instructions'}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid gap-3">
                  {instructions.map((instruction) => {
                    const isEnabled = isFilterEnabled(category as FilterCategory, instruction.flag);
                    const isDefault = isFilterDefault(category as FilterCategory, instruction.flag);
                    
                    return (
                      <div key={instruction.flag} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${category}-${instruction.flag}`}
                          checked={isEnabled}
                          onCheckedChange={() => handleFilterToggle(category as FilterCategory, instruction.flag)}
                          disabled={disabled}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`${category}-${instruction.flag}`} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            {instruction.flag}
                            {isDefault && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Default
                              </Badge>
                            )}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {instruction.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Context Default Filters Info */}
      {Object.keys(contextDefaults).length > 0 && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Context Defaults</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Object.entries(contextDefaults).map(([category, filters]) => (
                <div key={category} className="text-xs">
                  <span className="font-medium capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filters.map((filter) => (
                      <Badge key={filter} variant="secondary" className="text-xs">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Filter Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Filter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                value={customFilterName}
                onChange={(e) => setCustomFilterName(e.target.value)}
                placeholder="e.g., myCustomFilter"
              />
            </div>
            
            <div>
              <Label htmlFor="filter-description">Description</Label>
              <Textarea
                id="filter-description"
                value={customFilterDescription}
                onChange={(e) => setCustomFilterDescription(e.target.value)}
                placeholder="Describe what this filter does..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomFilter} disabled={!customFilterName.trim()}>
                Add Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
