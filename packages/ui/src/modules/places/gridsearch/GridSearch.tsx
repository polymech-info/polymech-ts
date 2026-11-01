import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { PlusCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { OngoingSearches } from './OngoingSearches';
import { GridSearchWizard } from './GridSearchWizard';
import { JobViewer } from './JobViewer';
import { useRestoredSearch, RestoredSearchProvider } from './RestoredSearchContext';
import { useAppStore } from '@/store/appStore';

function GridSearchLayout({ selectedJobId, setSelectedJobId }: { selectedJobId: string | null, setSelectedJobId: (id: string | null, forceView?: string) => void }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sidebarWidth, setSidebarWidth] = useState(320);
    
    const isSidebarOpen = searchParams.get('hasSidebar') !== 'false';
    const setIsSidebarOpen = useCallback((open: boolean) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (open) {
                next.delete('hasSidebar');
            } else {
                next.set('hasSidebar', 'false');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const [isResizing, setIsResizing] = useState(false);
    const [initialWizardSettings, setInitialWizardSettings] = useState<any>(null);
    const [wizardSessionKey, setWizardSessionKey] = useState(0);

    const { state: restoredState } = useRestoredSearch();
    const isSharedView = restoredState !== null && restoredState.run?.isOwner === false;



    const startResizing = useCallback((shouldStart: boolean) => {
        setIsResizing(shouldStart);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // The sidebar starts from the left edge of its container, but we are inside the main App layout 
            // the main App layout has a max container (1400px centered) plus left nav... Wait, in App.tsx it's max-w-[1400px].
            // To make resizing robust without worrying about offsetLeft, we can calculate width based on movement delta, 
            // but the simplest is just taking `e.clientX - sidebarRect.left`. So we attach a ref if needed.
            // For now, let's just use `e.clientX` minus an approximate offset or just track delta.
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Better resizing logic matching delta
    const handleDragStart = (e: React.MouseEvent) => {
        startResizing(true);
        e.preventDefault();
    };

    const sidebarRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleDrag = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            let newWidth = Math.max(0, e.clientX - sidebarRect.left);
            setSidebarWidth(newWidth);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleDrag);
        }
        return () => window.removeEventListener('mousemove', handleDrag);
    }, [isResizing]);



    const handleToggleSidebar = useCallback(() => setIsSidebarOpen(!isSidebarOpen), [isSidebarOpen, setIsSidebarOpen]);

    return (
        <div className="flex h-[calc(100vh-64px)] w-full relative">

            {/* Left Sidebar */}
            {!isSharedView && (
                <div
                    ref={sidebarRef}
                    className={`flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col relative transition-[width] duration-300 ${!isSidebarOpen ? 'overflow-hidden' : ''}`}
                    style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
                >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                        <button
                            onClick={() => { setSelectedJobId(null); setInitialWizardSettings(null); setWizardSessionKey(k => k + 1); }}
                            className={`w-full flex items-center justify-center p-3 rounded-xl font-medium transition-colors ${!selectedJobId ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50'}`}
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            New Search
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                        <OngoingSearches
                            selectedJobId={selectedJobId}
                            onSelectJob={setSelectedJobId}
                            onSearchDeleted={(deletedId) => {
                                if (selectedJobId === deletedId) {
                                    setSelectedJobId(null);
                                    setWizardSessionKey(k => k + 1);
                                }
                            }}
                        />
                    </div>

                    {/* Resizer handle */}
                    {isSidebarOpen && (
                        <div
                            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-50 transition-colors"
                            onMouseDown={handleDragStart}
                        />
                    )}
                </div>
            )}



            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 w-full overflow-hidden">
                {!isSidebarOpen && !isSharedView && !selectedJobId && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        title="Open Past Searches"
                    >
                        <PanelLeftOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                )}
                {selectedJobId ? (
                    <JobViewer key={selectedJobId} jobId={selectedJobId} isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
                ) : (
                    <GridSearchWizard key={wizardSessionKey} initialSettings={initialWizardSettings} onJobSubmitted={(id) => setSelectedJobId(id, 'map')} setIsSidebarOpen={setIsSidebarOpen} />
                )}
            </div>
        </div>
    );
}

export default function GridSearch() {
    const { setShowGlobalFooter } = useAppStore();

    useEffect(() => {
        setShowGlobalFooter(false);
        return () => setShowGlobalFooter(true);
    }, [setShowGlobalFooter]);

    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const selectedJobId = searchParams.get('jobId');

    const setSelectedJobId = useCallback((id: string | null, forceView?: string) => {
        const next = new URLSearchParams(location.search);
        if (id) {
            next.set('jobId', id);
            if (forceView) {
                next.set('view', forceView);
            }
        } else {
            next.delete('jobId');
        }
        navigate(`${location.pathname}?${next.toString()}`, { replace: true });
    }, [navigate, location.search, location.pathname]);

    return (
        <RestoredSearchProvider key={selectedJobId || 'none'} jobId={selectedJobId}>
            <GridSearchLayout selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} />
        </RestoredSearchProvider>
    );
}
