import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/components/ThemeProvider';

/* ── Types ─────────────────────────────────────────────────────────── */
export interface MapLocation {
    lat: number;
    lng: number;
    city: string;
    country: string;
    visitors: number;
    hits: number;
}

interface AnalyticsMapProps {
    locations: MapLocation[];
    className?: string;
}

/* ── Map tile styles ──────────────────────────────────────────────── */
const MAP_STYLES = {
    light: 'https://api.maptiler.com/maps/basic-v2/style.json?key=aQ5CJxgn3brYPrfV3ws9',
    dark:  'https://api.maptiler.com/maps/dataviz-dark/style.json?key=aQ5CJxgn3brYPrfV3ws9',
};

/* ── Marker sizing by visitor count ──────────────────────────────── */
function markerSize(visitors: number): number {
    if (visitors <= 1) return 14;
    if (visitors <= 5) return 20;
    if (visitors <= 20) return 28;
    if (visitors <= 50) return 36;
    return 44;
}

function markerEl(loc: MapLocation, isNew = false): HTMLElement {
    const size = markerSize(loc.visitors);
    // Outer wrapper with invisible padding to stabilise hover hit-area
    const wrapper = document.createElement('div');
    wrapper.className = 'analytics-marker-wrap';
    wrapper.style.cssText = `padding: 6px; cursor: pointer;`;

    const el = document.createElement('div');
    el.className = 'analytics-marker';
    el.style.cssText = `
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: ${isNew ? 'rgba(34, 197, 94, 0.85)' : 'rgba(99, 102, 241, 0.75)'};
        border: 2px solid ${isNew ? '#16a34a' : '#4f46e5'};
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: ${Math.max(9, size * 0.35)}px; font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        transition: transform 0.2s, box-shadow 0.2s;
        pointer-events: none;
    `;
    el.textContent = String(loc.visitors);

    wrapper.appendChild(el);
    wrapper.title = `${loc.city || loc.country || 'Unknown'} — ${loc.visitors} visitor${loc.visitors !== 1 ? 's' : ''}, ${loc.hits} hit${loc.hits !== 1 ? 's' : ''}`;

    // Hover on the stable wrapper → scale the inner circle
    wrapper.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)'; });
    wrapper.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'; });

    // Pulse animation for new SSE markers
    if (isNew) {
        el.style.animation = 'analytics-marker-pulse 1.5s ease-out';
    }

    return wrapper;
}

/* ── Component ─────────────────────────────────────────────────────── */
const AnalyticsMap: React.FC<AnalyticsMapProps> = ({ locations, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const { theme } = useTheme();

    const getResolvedTheme = useCallback(() => {
        if (theme === 'system' && typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme === 'dark' ? 'dark' : 'light';
    }, [theme]);

    const [resolvedTheme, setResolvedTheme] = React.useState<'dark' | 'light'>(getResolvedTheme());

    useEffect(() => {
        const updateTheme = () => setResolvedTheme(getResolvedTheme());
        updateTheme();
        
        if (theme === 'system') {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.addEventListener("change", updateTheme);
            return () => mediaQuery.removeEventListener("change", updateTheme);
        }
    }, [theme, getResolvedTheme]);

    const style = useMemo(() => resolvedTheme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light, [resolvedTheme]);

    // Init map
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;
        const m = new maplibregl.Map({
            container: containerRef.current,
            style,
            center: [10, 30],
            zoom: 1.8,
            pitch: 0,
            attributionControl: false,
        });
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = m;

        return () => { m.remove(); mapRef.current = null; };
    }, []); // intentionally stable

    // Style sync
    useEffect(() => {
        mapRef.current?.setStyle(style);
    }, [style]);

    // Place / update markers
    const prevLocKeyRef = useRef('');
    useEffect(() => {
        const m = mapRef.current;
        if (!m) return;

        // Serialise to detect change
        const key = locations.map(l => `${l.lat},${l.lng},${l.visitors}`).join('|');
        const isInitial = prevLocKeyRef.current === '';
        prevLocKeyRef.current = key;

        // Clear old markers
        markersRef.current.forEach(mk => mk.remove());
        markersRef.current = [];

        if (locations.length === 0) return;

        // Add new markers
        locations.forEach(loc => {
            const el = markerEl(loc);
            const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: '220px' })
                .setHTML(`
                    <div style="padding: 6px 10px; font-size: 12px; line-height: 1.5;">
                        <div style="font-weight: 600; margin-bottom: 2px;">${loc.city || 'Unknown city'}</div>
                        <div style="color: #888;">${loc.country || ''}</div>
                        <div style="margin-top: 4px;">
                            <strong>${loc.visitors}</strong> visitor${loc.visitors !== 1 ? 's' : ''} &middot;
                            <strong>${loc.hits}</strong> hit${loc.hits !== 1 ? 's' : ''}
                        </div>
                    </div>
                `);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([loc.lng, loc.lat])
                .setPopup(popup)
                .addTo(m);

            markersRef.current.push(marker);
        });

        // Fit bounds on initial load
        if (isInitial && locations.length > 1) {
            const bounds = new maplibregl.LngLatBounds();
            locations.forEach(l => bounds.extend([l.lng, l.lat]));
            m.fitBounds(bounds, { padding: 50, maxZoom: 8 });
        }
    }, [locations]);

    return (
        <div className={className} style={{ position: 'relative' }}>
            <style>{`
                @keyframes analytics-marker-pulse {
                    0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
                    70%  { box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
                }
            `}</style>
            <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius, 8px)' }} />
        </div>
    );
};

export default AnalyticsMap;
