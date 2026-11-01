import React from 'react';
import { Users, MapPin } from 'lucide-react';

export interface MapLayerTogglesProps {
    showDensity?: boolean;
    onToggleDensity?: (visible: boolean) => void;
    showCenters?: boolean;
    onToggleCenters?: (visible: boolean) => void;
}

export function MapLayerToggles({
    showDensity,
    onToggleDensity,
    showCenters,
    onToggleCenters
}: MapLayerTogglesProps) {
    return (
        <>
            {[
                {
                    show: onToggleDensity,
                    isActive: showDensity,
                    onToggle: () => onToggleDensity?.(!showDensity),
                    activeClasses: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
                    title: 'Population Density',
                    icon: Users,
                    label: 'Density'
                },
                {
                    show: onToggleCenters,
                    isActive: showCenters,
                    onToggle: () => onToggleCenters?.(!showCenters),
                    activeClasses: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
                    title: 'Population & Built Centers',
                    icon: MapPin,
                    label: 'Centers'
                }
            ].map(({ show, isActive, onToggle, activeClasses, title, icon: Icon, label }) => show && (
                <button
                    key={label}
                    onClick={onToggle}
                    className={`p-1 flex items-center gap-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isActive ? activeClasses : 'text-gray-500'} font-medium`}
                    title={title}
                >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </>
    );
}
