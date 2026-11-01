import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { POSTER_THEMES, applyPosterTheme } from '../utils/poster-themes';
import { serverUrl } from '@/lib/db';

// Fallback feather icons if lucide-react unavailable, or just raw SVG
const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const PaletteIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>
);

interface MapPosterOverlayProps {
    map: maplibregl.Map | null;
    pickerRegions: any[];
    pickerPolygons?: any[];
    posterTheme: string;
    setPosterTheme: (theme: string) => void;
    onClose: () => void;
}

const MapIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
);

export function MapPosterOverlay({ map, pickerRegions, pickerPolygons, posterTheme, setPosterTheme, onClose }: MapPosterOverlayProps) {
    const theme = POSTER_THEMES[posterTheme] || POSTER_THEMES['terracotta'];
    const [center, setCenter] = useState<{ lat: number, lng: number } | null>(null);

    const [inferredCity, setInferredCity] = useState("CITY NAME");
    const [inferredCountry, setInferredCountry] = useState("COUNTRY");

    useEffect(() => {
        if (!map) return;
        const updateCenter = () => {
            const c = map.getCenter();
            setCenter({ lat: c.lat, lng: c.lng });
        };

        const fetchGeo = async () => {
            const c = map.getCenter();
            try {
                const res = await fetch(`${serverUrl}/api/regions/reverse?lat=${c.lat}&lon=${c.lng}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        const geo = json.data;
                        let cty = geo.city && geo.city !== 'unknown' ? geo.city :
                            geo.locality && geo.locality !== 'unknown' ? geo.locality :
                                geo.principalSubdivision && geo.principalSubdivision !== 'unknown' ? geo.principalSubdivision : null;
                        let ctry = geo.countryName || null;
                        if (cty && cty !== "unknown") setInferredCity(cty);
                        if (ctry && ctry !== "unknown") setInferredCountry(ctry);
                    }
                }
            } catch (e) { }
        };

        updateCenter();
        fetchGeo();

        // Use moveend instead of move — the poster footer coordinates don't need 60fps updates
        map.on('moveend', updateCenter);
        map.on('moveend', fetchGeo);

        return () => {
            map.off('moveend', updateCenter);
            map.off('moveend', fetchGeo);
        }
    }, [map]);

    let city = "CITY NAME";
    let country = "COUNTRY";

    if (pickerRegions && pickerRegions.length > 0) {
        const countryRegion = pickerRegions.find(r => r.level === 0);
        const cityRegion = pickerRegions.slice().reverse().find(r => r.level > 0);
        if (countryRegion && countryRegion.name) country = countryRegion.name;
        if (cityRegion && cityRegion.name) city = cityRegion.name;
        else if (countryRegion && countryRegion.name) city = countryRegion.name;
    }

    city = (city === "CITY NAME" || !city) ? inferredCity : city;
    country = (country === "COUNTRY" || !country) ? inferredCountry : country;

    const formatCoords = (c: { lat: number, lng: number }) => {
        const latStr = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? 'N' : 'S'}`;
        const lngStr = `${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? 'E' : 'W'}`;
        return `${latStr} / ${lngStr}`;
    };

    const displayCity = city.toUpperCase().split('').join('  ');

    const gradientTop = `linear-gradient(to bottom, ${theme.gradient_color}FF 0%, ${theme.gradient_color}00 100%)`;
    const gradientBottom = `linear-gradient(to top, ${theme.gradient_color}FF 30%, ${theme.gradient_color}00 100%)`;

    const [showGadmBorders, setShowGadmBorders] = useState(true);

    // Apply exact map layer styling based on poster theme
    useEffect(() => {
        if (!map) return;
        const _apply = () => {
            const isDark = document.documentElement.classList.contains('dark');
            applyPosterTheme(map, theme, isDark);
        };

        if (map.isStyleLoaded()) _apply();

        map.on('style.load', _apply);
        map.on('styledata', _apply);

        return () => {
            map.off('style.load', _apply);
            map.off('styledata', _apply);
        };
    }, [map, theme]);

    useEffect(() => {
        if (!map || !pickerPolygons || pickerPolygons.length === 0) return;

        const combinedFeatures = pickerPolygons.flatMap(fc => fc.features || []);
        const fc = { type: 'FeatureCollection', features: combinedFeatures };

        if (!map.getSource('poster-gadm')) {
            map.addSource('poster-gadm', { type: 'geojson', data: fc as any });
            map.addLayer({
                id: 'poster-gadm-borders',
                type: 'line',
                source: 'poster-gadm',
                paint: {
                    'line-color': theme.text,
                    'line-width': 1.5,
                    'line-dasharray': [4, 4]
                }
            });
        }

        if (showGadmBorders) {
            map.setLayoutProperty('poster-gadm-borders', 'visibility', 'visible');
            map.setPaintProperty('poster-gadm-borders', 'line-color', theme.text);
        } else {
            map.setLayoutProperty('poster-gadm-borders', 'visibility', 'none');
        }

        return () => {
            const style = map.getStyle();
            if (style) {
                if (map.getLayer('poster-gadm-borders')) map.removeLayer('poster-gadm-borders');
                if (map.getSource('poster-gadm')) map.removeSource('poster-gadm');
            }
        };
    }, [map, pickerPolygons, showGadmBorders, theme.text]);

    return (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between overflow-hidden mix-blend-normal">
            {/* Top Gradient */}
            <div className="w-full h-32 absolute top-0 left-0" style={{ background: gradientTop }} />

            {/* Controls (pointer events auto) */}
            <div id="poster-controls" className="absolute top-4 left-4 flex gap-2 pointer-events-auto z-50">

                {pickerPolygons && pickerPolygons.length > 0 && (
                    <button
                        onClick={() => setShowGadmBorders(!showGadmBorders)}
                        className={`flex items-center px-3 py-1.5 ${showGadmBorders ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100'} rounded text-sm font-medium transition-colors shadow-sm`}
                        title="Toggle GADM Borders"
                    >
                        <MapIcon className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded text-sm font-medium transition-colors shadow-sm"
                >
                    <XIcon className="w-4 h-4 mr-1.5" /> Exit Poster Mode
                </button>
            </div>

            {/* Bottom Content Area */}
            <div className="w-full h-72 absolute bottom-0 left-0 flex flex-col justify-end items-center pb-3" style={{ background: gradientBottom }}>
                <div
                    className="text-center transition-colors duration-500"
                    style={{ color: theme.text }}
                >
                    <div className="font-bold tracking-[0.2em] text-3xl mb-4 font-mono leading-none drop-shadow-sm">
                        {displayCity}
                    </div>

                    <div className="w-16 h-[2px] mx-auto opacity-70 mb-4 drop-shadow-sm" style={{ backgroundColor: theme.text }} />

                    <div className="text-lg tracking-[0.3em] font-light mb-2 drop-shadow-sm">
                        {country.toUpperCase()}
                    </div>

                    <div className="text-sm opacity-80 font-mono tracking-wider drop-shadow-sm">
                        {center ? formatCoords(center) : 'Loading...'}
                    </div>
                </div>
            </div>
        </div>
    );
}