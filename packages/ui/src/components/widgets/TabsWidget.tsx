import React, { useState, useEffect } from 'react';
import { GenericCanvas } from '@/modules/layout/GenericCanvas';
import { cn } from '@/lib/utils';
import { T } from '@/i18n';
import * as LucideIcons from 'lucide-react';
import { useLayout } from '@/modules/layout/LayoutContext';
import { PageLayout } from '@/modules/layout/LayoutManager';

export interface TabDefinition {
    id: string;
    label: string;
    layoutId: string;
    icon?: string;
    layoutData?: PageLayout;
}

interface TabsWidgetProps {
    widgetInstanceId: string;
    tabs?: TabDefinition[];
    activeTabId?: string;
    orientation?: 'horizontal' | 'vertical';
    tabBarPosition?: 'top' | 'bottom' | 'left' | 'right';
    className?: string; // Container classes
    tabBarClassName?: string; // Tab bar specific classes
    contentClassName?: string; // Content area classes
    isEditMode?: boolean;
    onPropsChange: (props: Record<string, any>) => void;
    selectedWidgetId?: string | null;
    onSelectWidget?: (id: string, pageId?: string) => void;
    onSelectContainer?: (containerId: string | null, pageId?: string) => void;
    editingWidgetId?: string | null;
    onEditWidget?: (id: string | null) => void;
    contextVariables?: Record<string, any>;
}

const TabsWidget: React.FC<TabsWidgetProps> = ({
    widgetInstanceId,
    tabs = [],
    activeTabId,
    orientation = 'horizontal',
    tabBarPosition = 'top',
    className = '',
    tabBarClassName = '',
    contentClassName = '',
    isEditMode = false,
    onPropsChange,
    selectedWidgetId,
    onSelectWidget,
    onSelectContainer,
    editingWidgetId,
    onEditWidget,
    contextVariables,
}) => {
    const [currentTabId, setCurrentTabId] = useState<string | undefined>(activeTabId);
    const { loadedPages, addPageContainer, hydratePageLayout } = useLayout();

    // Effect to ensure we have a valid currentTabId
    useEffect(() => {
        if (tabs.length > 0) {
            if (!currentTabId || !tabs.find(t => t.id === currentTabId)) {
                setCurrentTabId(tabs[0].id);
            }
        } else {
            setCurrentTabId(undefined);
        }
    }, [tabs, currentTabId]);

    // Effect to ensure at least one container exists in the tab layout
    useEffect(() => {
        if (currentTabId && isEditMode) {
            const tab = tabs.find(t => t.id === currentTabId);
            if (tab) {
                const currentLayout = loadedPages.get(tab.layoutId);
                // Check if layout is loaded but has no containers
                if (currentLayout && currentLayout.containers.length === 0) {
                    addPageContainer(tab.layoutId).catch(console.error);
                }
            }
        }
    }, [currentTabId, tabs, loadedPages, isEditMode, addPageContainer]);

    // Effect to sync prop activeTabId if it changes externally
    useEffect(() => {
        if (activeTabId && tabs.find(t => t.id === activeTabId)) {
            setCurrentTabId(activeTabId);
        }
    }, [activeTabId, tabs]);


    const handleTabClick = (tabId: string) => {
        setCurrentTabId(tabId);
        // Optionally persist selection?
        // onPropsChange({ activeTabId: tabId }); 
        // Usually tabs reset on reload unless specifically desired. 
        // Let's keep it local state for now unless user demands persistence.
    };

    const currentTab = tabs.find(t => t.id === currentTabId);

    // Sync Layout Data back to props — sync ALL tabs, not just current
    useEffect(() => {
        if (!isEditMode) return;
        let changed = false;
        const newTabs = tabs.map(t => {
            const layout = loadedPages.get(t.layoutId);
            if (layout) {
                // Guard: never overwrite stored data that has widgets with an empty layout
                // This prevents the race condition where loadPageLayout creates empty defaults
                const storedWidgetCount = t.layoutData?.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0) || 0;
                const liveWidgetCount = layout.containers?.reduce((sum: number, c: any) => sum + (c.widgets?.length || 0), 0) || 0;
                if (liveWidgetCount === 0 && storedWidgetCount > 0) {
                    hydratePageLayout(t.layoutId, t.layoutData!);
                    return t;
                }
                const propTimestamp = t.layoutData?.updatedAt || 0;
                if (layout.updatedAt > propTimestamp) {
                    const layoutChanged = JSON.stringify(layout) !== JSON.stringify(t.layoutData);
                    if (layoutChanged) {
                        changed = true;
                        return { ...t, layoutData: layout };
                    }
                }
            }
            return t;
        });
        if (changed) {
            console.log('[TabsWidget SYNC-BACK] Calling onPropsChange with updated tabs', Date.now());
            onPropsChange({ tabs: newTabs });
        } else {
            console.log('[TabsWidget SYNC-BACK] No changes detected');
        }
    }, [loadedPages, isEditMode, onPropsChange, tabs, hydratePageLayout]);


    const renderIcon = (iconName?: string) => {
        if (!iconName) return null;
        const Icon = (LucideIcons as any)[iconName];
        return Icon ? <Icon className="w-4 h-4 mr-2" /> : null;
    };

    const isVertical = tabBarPosition === 'left' || tabBarPosition === 'right';

    const flexDirection = (() => {
        switch (tabBarPosition) {
            case 'left': return 'flex-row';
            case 'right': return 'flex-row-reverse';
            case 'bottom': return 'flex-col-reverse';
            case 'top':
            default: return 'flex-col';
        }
    })();

    const tabBarClasses = cn(
        "flex gap-1 overflow-auto scrollbar-hide bg-slate-100 dark:bg-slate-800/50 p-1 rounded-t-md",
        isVertical ? "flex-col w-48 min-w-[12rem]" : "flex-row w-full",
        tabBarClassName
    );

    const tabButtonClasses = (isActive: boolean) => cn(
        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
        isActive
            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
        isVertical ? "w-full justify-start" : "flex-1 justify-center"
    );

    if (tabs.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <div className="text-center text-slate-500">
                    <LucideIcons.Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p><T>No tabs configured.</T></p>
                    {isEditMode && <p className="text-xs mt-1"><T>Add tabs in widget settings.</T></p>}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex w-full h-full min-h-[300px]", flexDirection, className)}>
            {/* Tab Bar */}
            <div className={tabBarClasses}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={tabButtonClasses(tab.id === currentTabId)}
                    >
                        {renderIcon(tab.icon)}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className={cn("flex-1 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-b-md relative overflow-hidden", contentClassName)}>
                {currentTab ? (
                    <GenericCanvas
                        key={currentTab.layoutId} // Important: force remount so GenericCanvas loads new pageId
                        pageId={currentTab.layoutId}
                        pageName={currentTab.label}
                        isEditMode={isEditMode}
                        showControls={false} // Tabs usually hide nested canvas controls to look cleaner
                        initialLayout={currentTab.layoutData} // Hydrate from embedded data
                        className="p-4"
                        selectedWidgetId={selectedWidgetId}
                        onSelectWidget={(id, pId) => {
                            onSelectWidget?.(id, pId);
                        }}
                        onSelectContainer={(id, pId) => {
                            onSelectContainer?.(id, pId);
                        }}
                        editingWidgetId={editingWidgetId}
                        onEditWidget={onEditWidget}
                        contextVariables={contextVariables}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <T>Select a tab</T>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabsWidget;
