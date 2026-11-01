import React from 'react';
import { LayoutGrid, Info } from 'lucide-react';

interface MapOverlayToolbarsProps {
    features: any;
    sidebarOpen: boolean;
    gadmPickerActive: boolean;
    simulatorActive: boolean;
    setSidebarOpen: (v: boolean) => void;
    setGadmPickerActive: (v: boolean) => void;
    setSimulatorActive: (v: boolean) => void;
    infoPanelOpen: boolean;
    setInfoPanelOpen: (v: boolean) => void;
}

export function MapOverlayToolbars({
    features,
    sidebarOpen,
    gadmPickerActive,
    simulatorActive,
    setSidebarOpen,
    setGadmPickerActive,
    setSimulatorActive,
    infoPanelOpen,
    setInfoPanelOpen
}: MapOverlayToolbarsProps) {
    const isExpanded = gadmPickerActive || simulatorActive || sidebarOpen;

    return (
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none items-start">
            <div className="flex flex-wrap items-start gap-2 w-full max-w-full">
                
                {/* Tools & Info Buttons */}
                {(features.enableSidebarTools || features.showSidebar || features.enableInfoPanel) && (
                    <div className="flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 pointer-events-auto shrink-0">
                        {/* Sidebar Toggle Button */}
                        {(features.enableSidebarTools || features.showSidebar) && (
                            <button
                                onClick={() => {
                                    if (isExpanded) {
                                        setGadmPickerActive(false);
                                        setSimulatorActive(false);
                                        setSidebarOpen(false);
                                    } else {
                                        setSidebarOpen(true);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                    isExpanded
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                }`}
                                title="Toggle Sidebar"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                {isExpanded ? 'Hide Tools' : 'Show Tools'}
                            </button>
                        )}

                        {/* Info Button */}
                        {features.enableInfoPanel && (
                            <button
                                onClick={() => setInfoPanelOpen(!infoPanelOpen)}
                                className={`p-2 rounded-md transition-colors ${infoPanelOpen
                                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                title="Show Information"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
                
                {/* Portal target for Simulator Controls */}
                <div 
                    id="sim-controls-portal" 
                    className="flex max-w-full items-center justify-start pointer-events-auto empty:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 shrink-0"
                ></div>

                <div className="flex-1 min-w-0"></div> { /* Spacer */}
            </div>
        </div>
    );
}
