import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { translate } from '@/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFileBrowser, type Side } from './FileBrowserContext';
import FileBrowserPanel from './FileBrowserPanel';

interface PanelSideProps {
    side: Side;
}

const PanelSide: React.FC<PanelSideProps> = ({ side }) => {
    const isMobile = useIsMobile();
    const {
        leftPanels, rightPanels,
        activeSide, activePanelIdx,
        setActivePanel, updatePanel, removePanel,
        viewMode, showToolbar, initialFile, mode, index, chrome,
    } = useFileBrowser();

    /** Ribbon replaces the per-panel toolbar on desktop only; mobile uses the compact toolbar. */
    const showPanelToolbar = showToolbar && (chrome !== 'ribbon' || isMobile);

    const panels = side === 'left' ? leftPanels : rightPanels;
    const isActiveSide = activeSide === side;
    const activeIdx = isActiveSide ? activePanelIdx : 0;
    const currentIdx = Math.min(activeIdx, panels.length - 1);

    const panel = panels[currentIdx];

    const handlePathChange = useCallback((path: string) => {
        updatePanel(side, currentIdx, { path });
    }, [side, currentIdx, updatePanel]);

    const handleMountChange = useCallback((mount: string) => {
        updatePanel(side, currentIdx, { mount, path: '/' });
    }, [side, currentIdx, updatePanel]);

    const handleSelect = useCallback((node: any) => {
        updatePanel(side, currentIdx, { selected: node });
    }, [side, currentIdx, updatePanel]);

    const handleFilterChange = useCallback((glob: string, showFolders: boolean) => {
        updatePanel(side, currentIdx, { glob, showFolders });
    }, [side, currentIdx, updatePanel]);

    const handleToggleExplorer = useCallback(() => {
        updatePanel(side, currentIdx, { showExplorer: !panel.showExplorer });
    }, [side, currentIdx, updatePanel, panel.showExplorer]);

    const handleTogglePreview = useCallback(() => {
        updatePanel(side, currentIdx, { showPreview: panel.showPreview === false ? true : false });
    }, [side, currentIdx, updatePanel, panel.showPreview]);

    return (
        <div
            onClick={() => { if (!isActiveSide) setActivePanel(side, currentIdx); }}
            style={{
                height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                minHeight: 0,
                border: isActiveSide ? '2px solid var(--ring, #3b82f6)' : '2px solid transparent',
                borderRadius: 6,
                minWidth: 0,
            }}
        >
            {/* ── Tabs ──────────────────────────────────── */}
            {panels.length > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'stretch',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--muted)',
                    overflow: 'hidden',
                }}>
                    {panels.map((p, i) => {
                        const isActive = i === currentIdx;
                        return (
                            <div
                                key={p.id}
                                onClick={(e) => { e.stopPropagation(); setActivePanel(side, i); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                                    borderRight: '1px solid var(--border)',
                                    background: isActive ? 'var(--background)' : 'transparent',
                                    color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                                    fontWeight: isActive ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.mount}:{p.path || '/'}
                                </span>
                                {panels.length > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removePanel(side, i); }}
                                        title={translate("Close tab")}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: 2, display: 'flex', color: 'inherit', opacity: 0.5,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Active Panel ─────────────────────────── */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <FileBrowserPanel
                    key={panel.id}
                    panelId={panel.id}
                    browserSide={side}
                    mount={panel.mount}
                    path={panel.path}
                    glob={panel.glob}
                    searchQuery={panel.searchQuery}
                    mode={mode}
                    viewMode={viewMode}
                    showToolbar={showPanelToolbar}
                    canChangeMount={true}
                    allowFileViewer={true}
                    allowLightbox={true}
                    allowDownload={true}
                    showFolders={panel.showFolders}
                    showExplorer={panel.showExplorer}
                    showPreview={panel.showPreview !== false}
                    onPathChange={handlePathChange}
                    onMountChange={handleMountChange}
                    onSelect={handleSelect}
                    onFilterChange={handleFilterChange}
                    onToggleExplorer={handleToggleExplorer}
                    onTogglePreview={handleTogglePreview}
                    onSearchQueryChange={(q) => updatePanel(side, currentIdx, { searchQuery: q })}
                    initialFile={side === 'left' ? initialFile : undefined}
                    index={index}
                    autoSaveId={`fb-${side}-${panel.id}`}
                />
            </div>
        </div>
    );
};

export default PanelSide;
