import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export interface SimulatorLayersProps {
    map: maplibregl.Map | null;
    isDarkStyle: boolean;
    simulatorData?: any;
    simulatorPath?: any;
    simulatorScanner?: any;
}

const emptyFc = { type: 'FeatureCollection', features: [] };

// Inject scanner CSS once
let _scannerCssInjected = false;
function injectScannerCSS() {
    if (_scannerCssInjected) return;
    _scannerCssInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        .sim-pacman-wrap {
            width: 52px; height: 52px;
            position: relative;
            pointer-events: none;
            filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.5));
            z-index: 9999 !important;
        }
        /* Glow ring pulse behind pacman */
        .sim-pacman-glow {
            position: absolute;
            top: 50%; left: 50%;
            width: 40px; height: 40px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(250, 204, 21, 0.25) 0%, transparent 70%);
            animation: pac-glow 1.2s ease-in-out infinite alternate;
        }
        @keyframes pac-glow {
            0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        /* Dot trail particles */
        .sim-pacman-dots {
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
        }
        .sim-pacman-dot {
            position: absolute;
            width: 5px; height: 5px;
            border-radius: 50%;
            background: rgba(250, 204, 21, 0.7);
            animation: pac-dot-fade 0.8s ease-out forwards;
        }
        .sim-pacman-dot:nth-child(1) { transform: translate(-18px, 0); animation-delay: 0s; }
        .sim-pacman-dot:nth-child(2) { transform: translate(-30px, 0); animation-delay: 0.15s; }
        .sim-pacman-dot:nth-child(3) { transform: translate(-42px, 0); animation-delay: 0.3s; }
        @keyframes pac-dot-fade {
            0% { opacity: 0.8; transform: translate(var(--dx, -18px), 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--dx, -18px), 0) scale(0.3); }
        }
        /* The pacman SVG container */
        .sim-pacman-body {
            position: absolute;
            top: 50%; left: 50%;
            width: 36px; height: 36px;
            transform: translate(-50%, -50%);
            z-index: 2;
        }
        .sim-pacman-body svg {
            width: 100%; height: 100%;
            overflow: visible;
        }
        /* Mouth chomp animation */
        .pac-mouth-top {
            animation: pac-chomp-top 0.35s ease-in-out infinite alternate;
            transform-origin: 50% 50%;
        }
        .pac-mouth-bot {
            animation: pac-chomp-bot 0.35s ease-in-out infinite alternate;
            transform-origin: 50% 50%;
        }
        @keyframes pac-chomp-top {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-25deg); }
        }
        @keyframes pac-chomp-bot {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(25deg); }
        }
    `;
    document.head.appendChild(style);
}

function createPacmanElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'sim-pacman-wrap';
    el.innerHTML = `
        <div class="sim-pacman-glow"></div>
        <div class="sim-pacman-dots">
            <div class="sim-pacman-dot"></div>
            <div class="sim-pacman-dot"></div>
            <div class="sim-pacman-dot"></div>
        </div>
        <div class="sim-pacman-body">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="pac-grad" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#fde047"/>
                        <stop offset="60%" stop-color="#eab308"/>
                        <stop offset="100%" stop-color="#ca8a04"/>
                    </radialGradient>
                    <filter id="pac-shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#92400e" flood-opacity="0.3"/>
                    </filter>
                </defs>
                <!-- Top jaw -->
                <path class="pac-mouth-top"
                    d="M50,50 L95,30 A48,48 0 0,0 2,50 Z"
                    fill="url(#pac-grad)" filter="url(#pac-shadow)"/>
                <!-- Bottom jaw -->
                <path class="pac-mouth-bot"
                    d="M50,50 L95,70 A48,48 0 0,1 2,50 Z"
                    fill="url(#pac-grad)" filter="url(#pac-shadow)"/>
                <!-- Eye -->
                <circle cx="42" cy="28" r="6" fill="#1e1b4b" opacity="0.9"/>
                <circle cx="44" cy="26" r="2.2" fill="white" opacity="0.9"/>
            </svg>
        </div>
    `;
    return el;
}

export function SimulatorLayers({ map, isDarkStyle, simulatorData, simulatorPath, simulatorScanner }: SimulatorLayersProps) {
    
    const isDarkStyleRef = useRef(isDarkStyle);
    isDarkStyleRef.current = isDarkStyle;

    const simulatorDataRef = useRef(simulatorData);
    simulatorDataRef.current = simulatorData;

    const simulatorPathRef = useRef(simulatorPath);
    simulatorPathRef.current = simulatorPath;

    // DOM marker ref for the scanner (renders ABOVE all map layers + pins)
    const scannerMarkerRef = useRef<maplibregl.Marker | null>(null);
    const scannerElementRef = useRef<HTMLDivElement | null>(null);

    // Add Sources and Layers (grid + path only — scanner is a DOM marker now)
    useEffect(() => {
        if (!map) return;
        
        injectScannerCSS();

        const setupMapLayers = () => {
            if (!map.getStyle()) return;

            const currentIsDark = isDarkStyleRef.current;

            if (!map.getSource('simulator-grid')) {
                map.addSource('simulator-grid', { type: 'geojson', data: simulatorDataRef.current || emptyFc as any });
            }
            if (!map.getLayer('simulator-grid-fill')) {
                map.addLayer({
                    id: 'simulator-grid-fill',
                    type: 'fill',
                    source: 'simulator-grid',
                    paint: {
                        'fill-color': [
                            'match', ['get', 'sim_status'],
                            'pending', currentIsDark ? 'rgba(150, 150, 150, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                            'skipped', currentIsDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.6)', 
                            'processed', 'rgba(0,0,0,0)', 
                            'rgba(0,0,0,0)'
                        ],
                        'fill-outline-color': currentIsDark ? 'rgba(150, 150, 150, 0.5)' : 'rgba(0, 0, 0, 0.6)'
                    }
                });
            }

            if (!map.getSource('simulator-path')) {
                map.addSource('simulator-path', { type: 'geojson', data: simulatorPathRef.current || emptyFc as any });
            }
            if (!map.getLayer('simulator-path-line')) {
                map.addLayer({
                    id: 'simulator-path-line',
                    type: 'line',
                    source: 'simulator-path',
                    paint: {
                        'line-color': 'rgba(250, 204, 21, 0.4)',
                        'line-width': 3,
                        'line-dasharray': [0, 3]
                    },
                    layout: {
                        'line-cap': 'round',
                        'line-join': 'round'
                    }
                });
            }
        };

        if (map.getStyle()) setupMapLayers();
        map.on('styledata', setupMapLayers);
        map.on('style.load', setupMapLayers);

        return () => {
            if (map && map.getStyle()) {
                map.off('styledata', setupMapLayers);
                map.off('style.load', setupMapLayers);
                if (scannerMarkerRef.current) {
                    scannerMarkerRef.current.remove();
                    scannerMarkerRef.current = null;
                }
                if (map.getLayer('simulator-grid-fill')) map.removeLayer('simulator-grid-fill');
                if (map.getLayer('simulator-path-line')) map.removeLayer('simulator-path-line');
                if (map.getSource('simulator-grid')) map.removeSource('simulator-grid');
                if (map.getSource('simulator-path')) map.removeSource('simulator-path');
            }
        };
    }, [map]);

    // Update Styles when theme changes
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        if (map.getLayer('simulator-grid-fill')) {
            map.setPaintProperty('simulator-grid-fill', 'fill-color', [
                'match', ['get', 'sim_status'],
                'pending', isDarkStyle ? 'rgba(150, 150, 150, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                'skipped', isDarkStyle ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.6)', 
                'processed', 'rgba(0,0,0,0)', 
                'rgba(0,0,0,0)'
            ]);
            map.setPaintProperty('simulator-grid-fill', 'fill-outline-color', isDarkStyle ? 'rgba(150, 150, 150, 0.5)' : 'rgba(0, 0, 0, 0.6)');
        }
    }, [map, isDarkStyle]);

    // Update grid + path data
    useEffect(() => {
        if (!map || !map.getStyle()) return;
        try {
            if (map.getSource('simulator-grid')) (map.getSource('simulator-grid') as maplibregl.GeoJSONSource).setData(simulatorData || emptyFc as any);
            if (map.getSource('simulator-path')) (map.getSource('simulator-path') as maplibregl.GeoJSONSource).setData(simulatorPath || emptyFc as any);
        } catch (e) {
            console.warn("Could not update simulator data", e);
        }
    }, [map, simulatorData, simulatorPath]);

    // Update pacman DOM marker position + rotation
    useEffect(() => {
        if (!map || !map.getStyle()) return;

        const fc = simulatorScanner as any;
        const feature = fc?.features?.[0];

        if (!feature?.geometry?.coordinates) {
            if (scannerMarkerRef.current) {
                scannerMarkerRef.current.remove();
                scannerMarkerRef.current = null;
                scannerElementRef.current = null;
            }
            return;
        }

        const [lng, lat] = feature.geometry.coordinates;
        // Default to a 90 degree bearing (East) if not provided or exactly 0 (backend's rest default)
        let bearing = feature.properties?.bearing ?? 90;
        if (bearing === 0) bearing = 90;

        if (!scannerMarkerRef.current) {
            const el = createPacmanElement();
            el.style.zIndex = '9999';
            scannerElementRef.current = el;

            scannerMarkerRef.current = new maplibregl.Marker({
                element: el,
                anchor: 'center',
            })
            .setLngLat([lng, lat])
            .addTo(map);

            // Also ensure the MapLibre marker container stays on top
            const markerEl = scannerMarkerRef.current.getElement();
            if (markerEl) markerEl.style.zIndex = '9999';

            // Force the MapLibre marker wrapper above all other markers
            const wrapper = scannerMarkerRef.current.getElement()?.parentElement;
            if (wrapper) wrapper.style.zIndex = '9999';
        } else {
            scannerMarkerRef.current.setLngLat([lng, lat]);
        }

        // Convert MapLibre bearing (0=N, 90=E, 180=S, -90=W) to CSS rotate (0=Right, 90=Down)
        let rot = bearing - 90;
        
        // Normalize to -180 to +180
        while (rot > 180) rot -= 360;
        while (rot < -180) rot += 360;
        
        // If pacman points Left-ish, he flips upside down (eye on bottom). Flip Y to fix.
        const flip = Math.abs(rot) > 90 ? -1 : 1;

        // Rotate the whole pacman body to face bearing direction
        if (scannerElementRef.current) {
            const body = scannerElementRef.current.querySelector('.sim-pacman-body') as HTMLElement;
            if (body) {
                body.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scaleY(${flip})`;
            }
            // Rotate dots opposite so they trail behind
            const dots = scannerElementRef.current.querySelector('.sim-pacman-dots') as HTMLElement;
            if (dots) {
                dots.style.transform = `rotate(${rot}deg)`;
            }
        }
    }, [map, simulatorScanner]);

    return null;
}
