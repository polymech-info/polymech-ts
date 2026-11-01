import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2 } from 'lucide-react';

interface SharedMapProps {
    onMapLoad: (map: maplibregl.Map) => void;
    center?: [number, number];
    zoom?: number;
    className?: string;
}

/**
 * A reusable MapLibre component for the picker tabs.
 * Standardizes initialization and styling.
 */
const SharedMap: React.FC<SharedMapProps> = ({ 
    onMapLoad, 
    center = [13.4050, 52.5200], // Berlin default
    zoom = 4,
    className = ""
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize Map
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: center,
            zoom: zoom,
            attributionControl: false
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('load', () => {
            mapRef.current = map;
            setIsLoaded(true);
            onMapLoad(map);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            <div ref={mapContainerRef} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-[2px] z-50">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                </div>
            )}
        </div>
    );
};

export default SharedMap;
