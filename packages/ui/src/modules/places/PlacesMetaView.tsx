import React, { useMemo } from 'react';
import { type PlaceFull } from '@polymech/shared';
import { PieChart, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { CompetitorSettings } from './usePlacesSettings';

interface PlacesMetaViewProps {
    places: PlaceFull[];
    settings: CompetitorSettings;
    updateExcludedTypes: (types: string[]) => void;
}

export const PlacesMetaView: React.FC<PlacesMetaViewProps> = ({ places, settings, updateExcludedTypes }) => {

    // Aggregate types
    const typeStats = useMemo(() => {
        const stats: Record<string, number> = {};

        places.forEach(comp => {
            if (comp.types) {
                comp.types.forEach(t => {
                    stats[t] = (stats[t] || 0) + 1;
                });
            }
        });

        // Add excluded types that might not be in current results but are relevant
        // actually, we only care about what's found or what's excluded globally?
        // Let's stick to what's found for now to "clean up" the results, 
        // but maybe we also want to see what's filtered out? 
        // For now, let's show what is explicitly IN the result set + what is in the excluded list (if we want to un-exclude)
        // Wait, if they are excluded, they won't be in 'competitors' list if the filter is active!
        // We might need the 'raw' list or just manage exclusions based on what we see. 
        // If we want to UN-exclude, we need to list the excluded types somewhere.

        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [places]);

    const handleToggleExclusion = (type: string) => {
        const currentExcluded = settings.excluded_types || [];
        if (currentExcluded.includes(type)) {
            updateExcludedTypes(currentExcluded.filter(t => t !== type));
        } else {
            updateExcludedTypes([...currentExcluded, type]);
        }
    };

    return (
        <div className="p-6 space-y-8 bg-gray-50/50 dark:bg-gray-900/50 min-h-full">

            {/* Found Types Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                            Found Business Types
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Click on a card to exclude that business type from future searches.
                        </p>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        {typeStats.length} types found
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {typeStats.map(([type, count]) => {
                        const isExcluded = settings.excluded_types?.includes(type);
                        return (
                            <button
                                key={type}
                                onClick={() => handleToggleExclusion(type)}
                                className={`
                                    relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200
                                    ${isExcluded
                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50 opacity-60 grayscale-[0.5]'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between w-full mb-2">
                                    <span className={`
                                        text-xs font-bold px-2 py-1 rounded-full 
                                        ${isExcluded
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                        }
                                    `}>
                                        {count}
                                    </span>
                                    {isExcluded ? (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                                <span className={`font-medium text-sm capitalize ${isExcluded ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {type.replace(/_/g, ' ')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Excluded Types (that are NOT in the current results, so we can un-exclude them) */}
                {settings.excluded_types && settings.excluded_types.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Currently Excluded Types
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {settings.excluded_types.map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleToggleExclusion(type)}
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                                    <XCircle className="w-3.5 h-3.5 ml-2" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
