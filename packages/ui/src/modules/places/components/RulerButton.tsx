import React from 'react';
import { Ruler, RotateCcw } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useRulerTool } from '../hooks/useRulerTool';

export function RulerButton({ map }: { map: maplibregl.Map | null }) {
    const { active, toggle, reset, formattedTotal, pointCount } = useRulerTool(map);

    return (
        <>
            <button
                onClick={toggle}
                className={`p-1 flex items-center gap-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium ${
                    active
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                        : 'text-gray-500'
                }`}
                title={active ? 'Disable Ruler' : 'Measure Distance'}
            >
                <Ruler className="w-3.5 h-3.5" />
                {active && pointCount >= 2 && (
                    <span className="text-[10px] font-mono font-bold">{formattedTotal}</span>
                )}
            </button>
            {active && pointCount > 0 && (
                <button
                    onClick={reset}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-600 transition-colors"
                    title="Clear Measurement"
                >
                    <RotateCcw className="w-3 h-3" />
                </button>
            )}
        </>
    );
}
