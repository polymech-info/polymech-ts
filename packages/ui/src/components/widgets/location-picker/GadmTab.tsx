import React, { useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GadmPicker, GadmRegion } from '@/modules/places/gadm-picker/GadmPicker';
import { LocationSelection } from './types';
import SharedMap from './SharedMap';
import { T } from '@/i18n';

interface GadmTabProps {
    onUpdate: (s: LocationSelection) => void;
    initialRegions?: GadmRegion[];
    currentSelection?: LocationSelection | null;
}

/**
 * GadmTab - Integration with the administrative areas picker.
 * Wraps the existing GadmPicker and provides a shared map viewer.
 */
const GadmTab: React.FC<GadmTabProps> = ({ onUpdate, initialRegions, currentSelection }) => {
    const [map, setMap] = useState<maplibregl.Map | null>(null);

    const handleSelectionChange = (regions: GadmRegion[], geojsons: any[]) => {
        if (regions.length > 0) {
            onUpdate({
                type: 'gadm',
                gadmRegions: regions,
                geojsons: geojsons,
                label: regions.map(r => r.gadmName).join(', ')
            });
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            <div className="w-[420px] h-full border-r flex flex-col p-6 overflow-y-auto bg-card/30 backdrop-blur-md shadow-[inset_-10px_0_20px_rgba(0,0,0,0.02)] custom-scrollbar border-primary/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground"><T>Administrative Boundaries</T></h3>
                </div>
                
                <GadmPicker 
                    active={true}
                    map={map}
                    onSelectionChange={handleSelectionChange}
                    initialRegions={initialRegions?.map(r => ({ gid: r.gid, name: r.gadmName, level: r.level }))}
                    className="p-0 border-0 bg-transparent flex-1 space-y-6"
                />
            </div>
            
            <div className="flex-1 h-full relative group bg-muted/20">
                <SharedMap 
                    onMapLoad={setMap} 
                    className="w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-1000 ease-in-out" 
                />
                
                {/* Visual accents */}
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-2xl pointer-events-none">
                    <div className="text-[10px] font-bold text-white/80 uppercase tracking-tighter flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <T>Live GADM Inspector Active</T>
                    </div>
                </div>
                
                <div className="absolute inset-0 pointer-events-none border-l-2 border-primary/10 shadow-[inset_0_0_60px_rgba(0,0,0,0.1)]" />
            </div>
        </div>
    );
};

export default GadmTab;
