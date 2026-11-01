import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, X, Copy, Trash2, Pencil, Check, BookmarkCheck, Loader2 } from 'lucide-react';
import { T, translate } from '@/i18n';
import { useWidgetSnippets, WidgetSnippetData } from './useWidgetSnippets';

type Layout = any; // TODO: replace with actual type

interface WidgetPaletteProps {
  isVisible: boolean;
  onClose: () => void;
  onWidgetAdd: (widgetId: string, initialProps?: Record<string, any>) => void;
}

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({
  isVisible,
  onClose,
  onWidgetAdd
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'registry' | 'saved'>('registry');

  // Snippet management
  const { snippets, loading: snippetsLoading, cloneSnippet, removeSnippet, updateSnippetName } = useWidgetSnippets();
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        const searchInput = document.querySelector('#widget-search-input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const allWidgets = widgetRegistry.getAll();

  const dynamicCategories = Array.from(new Set([
    'all',
    'control',
    'display',
    'chart',
    'system',
    'custom',
    ...allWidgets.map(w => w.metadata.category)
  ]));

  const widgets = searchQuery
    ? widgetRegistry.search(searchQuery)
    : selectedCategory === 'all'
      ? allWidgets
      : widgetRegistry.getByCategory(selectedCategory);

  const filteredSnippets = searchQuery
    ? snippets.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : snippets;

  const handleSnippetClick = (snippet: Layout) => {
    const data = snippet.layout_json as unknown as WidgetSnippetData;
    if (data?.widgetId) {
      onWidgetAdd(data.widgetId, data.props);
      onClose();
    }
  };

  const handleStartRename = (snippet: Layout, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSnippetId(snippet.id);
    setEditingName(snippet.name);
  };

  const handleConfirmRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingSnippetId && editingName.trim()) {
      await updateSnippetName(editingSnippetId, editingName.trim());
    }
    setEditingSnippetId(null);
    setEditingName('');
  };

  const handleClone = async (snippet: Layout, e: React.MouseEvent) => {
    e.stopPropagation();
    await cloneSnippet(snippet);
  };

  const handleDelete = async (snippet: Layout, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${translate("Delete")} "${snippet.name}"?`)) {
      await removeSnippet(snippet.id);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 dark:bg-black/50 flex items-center justify-center z-[99999]"
      onClick={onClose}
      style={{ zIndex: 99999 }}
    >
      <Card
        className="glass-card dark:bg-slate-800/80 bg-white w-96 max-w-[90vw] max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 100000 }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg"><T>Add Widget</T></CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tabs: Registry / Saved */}
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 pb-2">
            <Button
              size="sm"
              variant={activeTab === 'registry' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('registry')}
              className="text-xs h-7"
            >
              <T>Widgets</T>
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'saved' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('saved')}
              className="text-xs h-7 gap-1"
            >
              <BookmarkCheck className="h-3 w-3" />
              <T>Saved</T>
              {snippets.length > 0 && (
                <span className="ml-1 text-[10px] bg-primary/20 rounded-full px-1.5">
                  {snippets.length}
                </span>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="widget-search-input"
              placeholder={activeTab === 'registry' ? "Search widgets..." : "Search saved widgets..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 glass-input"
            />
          </div>

          {activeTab === 'registry' && (
            <>
              {/* Categories */}
              <div className="flex flex-wrap gap-1">
                {dynamicCategories.map(category => (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs h-7"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Widget List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {widgets.map(widget => (
                  <div
                    key={widget.metadata.id}
                    className="flex items-center justify-between p-3 border border-slate-300/30 dark:border-white/10 rounded-lg bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
                    onClick={() => {
                      onWidgetAdd(widget.metadata.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {widget.metadata.icon && (
                        <div className="h-5 w-5 text-slate-600 dark:text-slate-300 shrink-0">
                          {React.createElement(widget.metadata.icon, {})}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{widget.metadata.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {widget.metadata.description}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWidgetAdd(widget.metadata.id);
                        onClose();
                      }}
                      className="h-8 w-8 glass-button shrink-0"
                      title={`Add ${widget.metadata.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {widgets.length === 0 && (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                    <T>No widgets found</T>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {snippetsLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <T>Loading...</T>
                </div>
              ) : filteredSnippets.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  <div className="text-sm mb-2"><T>No saved widgets yet</T></div>
                  <div className="text-xs"><T>Select a widget in the editor and use "Save as Widget" to create one.</T></div>
                </div>
              ) : (
                filteredSnippets.map(snippet => {
                  const snippetData = snippet.layout_json as unknown as WidgetSnippetData;
                  const widgetDef = snippetData?.widgetId ? widgetRegistry.get(snippetData.widgetId) : null;

                  return (
                    <div
                      key={snippet.id}
                      className="flex items-center justify-between p-3 border border-slate-300/30 dark:border-white/10 rounded-lg bg-white/5 dark:bg-black/5 hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer group"
                      onClick={() => handleSnippetClick(snippet)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {widgetDef?.metadata.icon && (
                          <div className="h-5 w-5 text-slate-600 dark:text-slate-300 shrink-0">
                            {React.createElement(widgetDef.metadata.icon, {})}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          {editingSnippetId === snippet.id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-6 text-sm px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleConfirmRename(e as any);
                                  if (e.key === 'Escape') {
                                    setEditingSnippetId(null);
                                    setEditingName('');
                                  }
                                }}
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleConfirmRename}>
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-sm truncate">{snippet.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {widgetDef?.metadata.name || snippetData?.widgetId || 'Unknown widget'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title={translate("Rename")}
                          onClick={(e) => handleStartRename(snippet, e)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title={translate("Clone")}
                          onClick={(e) => handleClone(snippet, e)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          title={translate("Delete")}
                          onClick={(e) => handleDelete(snippet, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
};
