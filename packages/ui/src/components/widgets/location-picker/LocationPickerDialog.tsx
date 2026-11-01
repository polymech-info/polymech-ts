import React, { useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { T } from '@/i18n';
import { Search, MapPin, Globe, Loader2, Check, History } from 'lucide-react';
import { LocationSelection, LocationPickerDialogProps } from './types';
import { Button } from '@/components/ui/button';

// Lazy-loaded components to keep initial bundle small
const GadmTab = lazy(() => import('./GadmTab'));
const MapPinTab = lazy(() => import('./MapPinTab'));
const SearchTab = lazy(() => import('./SearchTab'));
const SearchesTab = lazy(() => import('./SearchesTab'));

/**
 * LocationPickerDialog - A unified component for location selection.
 * Integrates Search, Administrative Boundaries (GADM), and manual point picking.
 */
export const LocationPickerDialog: React.FC<LocationPickerDialogProps> = ({
    isOpen,
    onClose,
    onSelect,
    initialSelection
}) => {
    const [activeTab, setActiveTab] = useState<'search' | 'searches' | 'gadm' | 'point'>(initialSelection?.type === 'job' ? 'searches' : (initialSelection?.type || 'search'));
    const [currentSelection, setCurrentSelection] = useState<LocationSelection | null>(initialSelection || null);

    const handleSelect = () => {
        if (currentSelection) {
            onSelect(currentSelection);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-0 sm:rounded-2xl">
                <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2.5 text-xl">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                        </span>
                        <T>Select Location</T>
                    </DialogTitle>
                    <DialogDescription className="pl-10.5">
                        <T>Choose a method to specify the geographic target for your analysis.</T>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 mt-2">
                        <TabsList className="grid w-fit grid-cols-4 bg-muted/50 p-1">
                            <TabsTrigger value="search" className="flex items-center gap-2 px-6">
                                <Search className="w-4 h-4" />
                                <T>Search</T>
                            </TabsTrigger>
                            <TabsTrigger value="searches" className="flex items-center gap-2 px-6">
                                <History className="w-4 h-4" />
                                <T>Searches</T>
                            </TabsTrigger>
                            <TabsTrigger value="gadm" className="flex items-center gap-2 px-6">
                                <Globe className="w-4 h-4" />
                                <T>Administrative</T>
                            </TabsTrigger>
                            <TabsTrigger value="point" className="flex items-center gap-2 px-6">
                                <MapPin className="w-4 h-4" />
                                <T>Map Pick</T>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 min-h-0 mt-4 relative overflow-hidden bg-muted/5 flex flex-col">
                        <Suspense fallback={
                            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/10 backdrop-blur-sm">
                                <div className="p-4 rounded-full bg-primary/5 mb-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-70" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide uppercase"><T>Initializing Interface...</T></p>
                            </div>
                        }>
                            <TabsContent value="search" className="h-full m-0 focus-visible:ring-0 flex flex-col">
                                <SearchTab onUpdate={setCurrentSelection} currentSelection={currentSelection} />
                            </TabsContent>
                            <TabsContent value="searches" className="h-full m-0 focus-visible:ring-0 flex flex-col">
                                <SearchesTab onUpdate={setCurrentSelection} currentSelection={currentSelection} initialSelection={initialSelection} />
                            </TabsContent>
                            <TabsContent value="gadm" className="h-full m-0 focus-visible:ring-0 flex flex-col">
                                <GadmTab onUpdate={setCurrentSelection} initialRegions={initialSelection?.gadmRegions} currentSelection={currentSelection} />
                            </TabsContent>
                            <TabsContent value="point" className="h-full m-0 focus-visible:ring-0 flex flex-col">
                                <MapPinTab 
                                    onUpdate={setCurrentSelection} 
                                    initialLat={initialSelection?.lat} 
                                    initialLng={initialSelection?.lng} 
                                    currentSelection={currentSelection}
                                />
                            </TabsContent>
                        </Suspense>
                    </div>
                </Tabs>

                <div className="p-6 py-4 border-t bg-card/50 backdrop-blur-md flex items-center justify-between gap-6 flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        {currentSelection ? (
                            <div className="flex flex-col">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1"><T>Current Selection</T></p>
                                <div className="text-sm font-semibold truncate flex items-center gap-2 text-foreground mb-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                    {currentSelection.label || currentSelection.address || `${currentSelection.lat?.toFixed(4)}, ${currentSelection.lng?.toFixed(4)}`}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-muted shadow-inner" />
                                <T>Please select a location above...</T>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 items-center">
                        <Button variant="ghost" onClick={onClose} className="hover:bg-muted font-medium"><T>Cancel</T></Button>
                        <Button 
                            disabled={!currentSelection} 
                            onClick={handleSelect} 
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 transition-all hover:scale-105 active:scale-95"
                        >
                            <T>Use Selection</T>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LocationPickerDialog;
