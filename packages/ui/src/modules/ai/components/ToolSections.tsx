/**
 * ToolSections — shared tool toggle sections used by ChatSidebar and AIPageGenerator.
 * Each section is a collapsible with a switch toggle + description of available tools.
 */

import React from 'react';
import { Wrench, FolderOpen, Settings, Globe, Image as ImageIcon } from 'lucide-react';
import { T } from '@/i18n';
import { Switch } from '@/components/ui/switch';
import CollapsibleSection from '@/components/CollapsibleSection';
import { ModelSelectorPanel } from '@/modules/ai/images/components';

export interface ToolSectionsProps {
    /** Storage key prefix for collapsible states (e.g. 'chat-tool' or 'aipg-tool') */
    storagePrefix?: string;
    /** ID prefix for switch elements */
    idPrefix?: string;

    toolsEnabled: boolean;
    onToolsEnabledChange: (v: boolean) => void;
    pageToolsEnabled: boolean;
    onPageToolsEnabledChange: (v: boolean) => void;
    imageToolsEnabled: boolean;
    onImageToolsEnabledChange: (v: boolean) => void;
    imageModel: string;
    onImageModelChange: (model: string) => void;
    vfsToolsEnabled: boolean;
    onVfsToolsEnabledChange: (v: boolean) => void;
    webSearchEnabled: boolean;
    onWebSearchEnabledChange: (v: boolean) => void;

    isGenerating: boolean;

    /** Extra toggles to render at the end */
    extraToggles?: React.ReactNode;
}

const ToolSections: React.FC<ToolSectionsProps> = ({
    storagePrefix = 'chat-tool',
    idPrefix = '',
    toolsEnabled, onToolsEnabledChange,
    pageToolsEnabled, onPageToolsEnabledChange,
    imageToolsEnabled, onImageToolsEnabledChange,
    imageModel, onImageModelChange,
    vfsToolsEnabled, onVfsToolsEnabledChange,
    webSearchEnabled, onWebSearchEnabledChange,
    isGenerating,
    extraToggles,
}) => (
    <div className="space-y-1">

        {/* Search Tools */}
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm"><T>Search Tools</T></span>
                </div>
            }
            storageKey={`${storagePrefix}-search`}
            minimal
            initiallyOpen={false}
            headerContent={
                <Switch
                    id={`${idPrefix}tools-toggle`}
                    checked={toolsEnabled}
                    onCheckedChange={onToolsEnabledChange}
                    disabled={isGenerating}
                />
            }
        >
            <div className="space-y-0.5 pl-2">
                {[
                    ['search_content', 'Full-text search across pages, posts, pictures'],
                    ['find_pages', 'Find pages by query'],
                    ['find_pictures', 'Find pictures by query'],
                    ['get_page_content', 'Read a page\'s full content'],
                    ['list_categories', 'List all categories'],
                    ['find_by_category', 'List items in a category'],
                ].map(([name, desc]) => (
                    <div key={name} className="text-[11px] text-muted-foreground">
                        <code className="text-[10px] text-primary/70">{name}</code> — <T>{desc}</T>
                    </div>
                ))}
            </div>
        </CollapsibleSection>

        {/* Page Tools */}
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm"><T>Page Tools</T></span>
                </div>
            }
            storageKey={`${storagePrefix}-page`}
            minimal
            initiallyOpen={false}
            headerContent={
                <Switch
                    id={`${idPrefix}page-tools-toggle`}
                    checked={pageToolsEnabled}
                    onCheckedChange={onPageToolsEnabledChange}
                    disabled={isGenerating}
                />
            }
        >
            <div className="space-y-0.5 pl-2">
                {[
                    ['create_page', 'Create a new page with markdown content'],
                ].map(([name, desc]) => (
                    <div key={name} className="text-[11px] text-muted-foreground">
                        <code className="text-[10px] text-primary/70">{name}</code> — <T>{desc}</T>
                    </div>
                ))}
            </div>
        </CollapsibleSection>

        {/* Image Tools — with ModelSelectorPanel settings */}
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm"><T>Image Tools</T></span>
                    {imageToolsEnabled && <Settings className="h-3 w-3 text-muted-foreground/50" />}
                </div>
            }
            storageKey={`${storagePrefix}-image`}
            minimal
            initiallyOpen={false}
            headerContent={
                <Switch
                    id={`${idPrefix}image-tools-toggle`}
                    checked={imageToolsEnabled}
                    onCheckedChange={onImageToolsEnabledChange}
                    disabled={isGenerating}
                />
            }
        >
            <div className="space-y-3 pl-2">
                <div className="space-y-0.5">
                    {[
                        ['generate_image', 'Generate an image from a text prompt'],
                    ].map(([name, desc]) => (
                        <div key={name} className="text-[11px] text-muted-foreground">
                            <code className="text-[10px] text-primary/70">{name}</code> — <T>{desc}</T>
                        </div>
                    ))}
                </div>
                {imageToolsEnabled && (
                    <div className="border-t border-border pt-2">
                        <ModelSelectorPanel
                            value={imageModel}
                            onChange={onImageModelChange}
                            showStepNumber={false}
                        />
                    </div>
                )}
            </div>
        </CollapsibleSection>

        {/* VFS / File Tools */}
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm"><T>File Tools</T></span>
                </div>
            }
            storageKey={`${storagePrefix}-vfs`}
            minimal
            initiallyOpen={false}
            headerContent={
                <Switch
                    id={`${idPrefix}vfs-tools-toggle`}
                    checked={vfsToolsEnabled}
                    onCheckedChange={onVfsToolsEnabledChange}
                    disabled={isGenerating}
                />
            }
        >
            <div className="space-y-0.5 pl-2">
                {[
                    ['fs_ls', 'List directory contents'],
                    ['fs_read', 'Read file contents'],
                    ['fs_write', 'Write/create a file'],
                    ['fs_mkdir', 'Create a directory'],
                    ['fs_delete', 'Delete a file or directory'],
                ].map(([name, desc]) => (
                    <div key={name} className="text-[11px] text-muted-foreground">
                        <code className="text-[10px] text-primary/70">{name}</code> — <T>{desc}</T>
                    </div>
                ))}
            </div>
        </CollapsibleSection>

        {/* Web Search Tools (SerpAPI) */}
        <CollapsibleSection
            title={
                <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm"><T>Web Search</T></span>
                </div>
            }
            storageKey={`${storagePrefix}-web-search`}
            minimal
            initiallyOpen={false}
            headerContent={
                <Switch
                    id={`${idPrefix}web-search-toggle`}
                    checked={webSearchEnabled}
                    onCheckedChange={onWebSearchEnabledChange}
                    disabled={isGenerating}
                />
            }
        >
            <div className="space-y-0.5 pl-2">
                {[
                    ['web_search', 'Search the web via Google (SerpAPI)'],
                    ['markdown_scraper', 'Scrape URL and extract readable markdown'],
                ].map(([name, desc]) => (
                    <div key={name} className="text-[11px] text-muted-foreground">
                        <code className="text-[10px] text-primary/70">{name}</code> — <T>{desc}</T>
                    </div>
                ))}
            </div>
        </CollapsibleSection>

        {extraToggles}
    </div>
);

export default ToolSections;
