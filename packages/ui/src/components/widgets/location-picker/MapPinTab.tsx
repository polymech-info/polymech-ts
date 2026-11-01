import React, { useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import SharedMap from './SharedMap';
import { LocationSelection } from './types';
import { fetchReverseGeocode } from '@/modules/places/client-gridsearch';
import { MapPin, Navigation, Info, Loader2 } from 'lucide-react';
import { T } from '@/i18n';
import { Button } from '@/components/ui/button';

interface MapPinTabProps {
    onUpdate: (s: LocationSelection) => void;
    initialLat?: number;
    initialLng?: number;
    currentSelection?: LocationSelection | null;
}

/**
 * MapPinTab - Manual geographic target selection.
 * Features a draggable marker with high-precision coordinate tracking and reverse geocoding.
 */
const MapPinTab: React.FC<MapPinTabProps> = ({ onUpdate, initialLat, initialLng, currentSelection }) => {
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [loadingAddr, setLoadingAddr] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );

    const updateLocation = async (lat: number, lng: number) => {
        setCoords({ lat, lng });
        setLoadingAddr(true);
        try {
            const geo = await fetchReverseGeocode(lat, lng);
            const label = [geo?.city || geo?.locality, geo?.countryName].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(label);
            onUpdate({
                type: 'point',
                lat,
                lng,
                label,
                address: geo?.formattedAddress || label
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAddr(false);
        }
    };

    useEffect(() => {
        if (!map) return;

        const startCoords: [number, number] = coords ? [coords.lng, coords.lat] : [13.4050, 52.5200];
        
        // Fly to initial if provided
        if (initialLat && initialLng) {
            map.jumpTo({ center: [initialLng, initialLat], zoom: 14 });
        }

        const newMarker = new maplibregl.Marker({
            draggable: true,
            color: '#3b82f6'
        })
            .setLngLat(startCoords)
            .addTo(map);

        setMarker(newMarker);

        newMarker.on('dragend', () => {
            const lngLat = newMarker.getLngLat();
            updateLocation(lngLat.lat, lngLat.lng);
        });

        // Initialize with default if not set
        if (!coords) {
            updateLocation(startCoords[1], startCoords[0]);
        }

        return () => {
            newMarker.remove();
        };
    }, [map]);

    const handleLocateMe = () => {
        if (!map) return;
        setLoadingAddr(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                map.flyTo({ center: [longitude, latitude], zoom: 14 });
                marker?.setLngLat([longitude, latitude]);
                updateLocation(latitude, longitude);
            },
            (err) => {
                console.error(err);
                setLoadingAddr(false);
            }
        );
    };

    return (
        <div className="flex h-full w-full bg-background overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 relative group">
                <SharedMap 
                    onMapLoad={setMap} 
                    center={coords ? [coords.lng, coords.lat] : undefined}
                    className="w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 ease-in-out" 
                />
                
                {/* Locate Me Overlay */}
                <div className="absolute top-4 right-14 z-10">
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={handleLocateMe}
                        className="bg-background/90 dark:bg-card/90 shadow-2xl backdrop-blur-xl hover:bg-background border border-primary/10 group h-10 px-5 rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                        <Navigation className="w-4 h-4 mr-2.5 group-hover:animate-pulse text-primary fill-primary/20" />
                        <span className="text-[11px] font-bold uppercase tracking-wider"><T>Auto Detect</T></span>
                    </Button>
                </div>

                <div className="absolute inset-0 pointer-events-none border-r-2 border-primary/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]" />
            </div>

            <div className="w-[400px] h-full border-l flex flex-col p-8 bg-card/20 backdrop-blur-xl shadow-[inset_15px_0_30px_rgba(0,0,0,0.03)] border-primary/5">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80"><T>Point Targeting</T></h3>
                </div>

                <div className="space-y-8">
                    <div className="p-6 rounded-[2rem] bg-white dark:bg-black/40 border border-primary/10 shadow-xl shadow-black/5 transition-all hover:shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <MapPin className="w-4.5 h-4.5 text-blue-500" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest opacity-50"><T>Active Marker</T></span>
                            </div>
                            {!loadingAddr && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                        </div>

                        {loadingAddr ? (
                            <div className="flex flex-col items-center justify-center py-6 animate-pulse">
                                <div className="bg-primary/5 p-3 rounded-full mb-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground"><T>Resolving Location Data</T></span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-xl font-black leading-tight tracking-tight text-foreground/90">
                                    {address || <T>Precision marker active</T>}
                                </p>
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-primary/5">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest">Latitude</p>
                                        <p className="text-sm font-mono font-bold tabular-nums text-primary/80">
                                            {coords?.lat.toFixed(6) ?? '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest">Longitude</p>
                                        <p className="text-sm font-mono font-bold tabular-nums text-primary/80">
                                            {coords?.lng.toFixed(6) ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 transition-colors hover:bg-primary/10">
                        <div className="bg-primary/20 p-2 rounded-lg h-fit group-hover:scale-110 transition-transform">
                            <Info className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs leading-relaxed text-foreground/70 font-bold italic">
                            <T>The marker can be positioned anywhere on the global map. Coordinates update in real-time as you drag.</T>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center flex flex-col items-center">
                    <div className="relative mb-6">
                        <MapPin className="w-32 h-32 stroke-[0.1] text-primary/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-primary/40 blur-sm animate-ping" />
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40"><T>Precision Unit Alpha</T></p>
                </div>
            </div>
        </div>
    );
};

export default MapPinTab;
