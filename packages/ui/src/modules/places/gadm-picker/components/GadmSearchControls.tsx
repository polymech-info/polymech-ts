import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2 } from 'lucide-react';

export const LEVEL_OPTIONS = [
    { value: 0, label: 'Country (Level 0)' },
    { value: 1, label: 'State (Level 1)' },
    { value: 2, label: 'Province (Level 2)' },
    { value: 3, label: 'District (Level 3)' },
    { value: 4, label: 'City (Level 4)' },
    { value: 5, label: 'Town (Level 5)' },
];

export interface GadmSearchControlsProps {
    levelOption: number;
    setLevelOption: (v: number) => void;
    resolutionOption: number;
    setResolutionOption: (v: number) => void;
    query: string;
    setQuery: (v: string) => void;
    suggestions: any[];
    loadingSuggestions: boolean;
    showSuggestions: boolean;
    setShowSuggestions: (v: boolean) => void;
    onSelectSuggestion: (s: any, ctrlKey: boolean) => void;
    suggestionsWrapRef: React.RefObject<HTMLDivElement>;
    layout?: 'vertical' | 'horizontal';
}

export function GadmSearchControls({
    levelOption, setLevelOption,
    resolutionOption, setResolutionOption,
    query, setQuery,
    suggestions, loadingSuggestions, showSuggestions, setShowSuggestions,
    onSelectSuggestion, suggestionsWrapRef,
    layout = 'vertical'
}: GadmSearchControlsProps) {
    const isHorizontal = layout === 'horizontal';

    const renderSegments = (value: number, setValue: (v: number) => void, label: string) => (
        <div className={`flex ${isHorizontal ? 'items-center gap-2' : 'flex-col gap-1'}`}>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}</span>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-md border dark:border-gray-700">
                {LEVEL_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        title={opt.label}
                        onClick={() => setValue(opt.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-sm transition-colors ${value === opt.value
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        L{opt.value}
                    </button>
                ))}
            </div>
        </div>
    );

    const [levelsPortal, setLevelsPortal] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (isHorizontal) {
            setLevelsPortal(document.getElementById('gadm-controls-portal-levels'));
        }
    }, [isHorizontal]);

    const levelsContent = (
        <div className={`flex ${isHorizontal ? 'flex-row items-center justify-center gap-6 px-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 w-[500px]' : 'flex-col gap-3'}`}>
            {renderSegments(levelOption, setLevelOption, 'Select Level : Country, State, Cities, ...')}
            {renderSegments(resolutionOption, setResolutionOption, 'Resolution Level : Country, State, Cities, ...')}
        </div>
    );

    return (
        <div className={`flex ${isHorizontal ? 'flex-col items-start gap-2 w-[500px]' : 'flex-col gap-4'} flex-shrink-0`}>
            {/* Search Input */}
            <div className={`relative z-20 w-full ${isHorizontal ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50' : ''}`} ref={suggestionsWrapRef}>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${LEVEL_OPTIONS.find(o => o.value === levelOption)?.label}...`}
                        className="w-full pl-9 pr-10 py-1.5 border rounded-md text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {loadingSuggestions && <div className="absolute right-3 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto w-[150%]">
                        {suggestions.map((s, i) => {
                            const nameMatches = Object.keys(s).filter(k => k.startsWith('NAME_')).sort().reverse();
                            const primaryName = nameMatches.length > 0 ? s[nameMatches[0]] : (s.name || s.gadmName);
                            const subText = nameMatches.length > 1 ? s[nameMatches[nameMatches.length - 1]] : '';
                            const gidKey = Object.keys(s).find(k => k.startsWith('GID_'));
                            return (
                                <li
                                    key={i}
                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0"
                                    onMouseDown={(e) => { e.preventDefault(); onSelectSuggestion(s, e.ctrlKey || e.metaKey); }}
                                >
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{primaryName || "Unknown"}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{subText ? `${subText} • ` : ''}{gidKey && s[gidKey] ? s[gidKey] : ''}</div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Level Selectors */}
            {levelsPortal
                ? createPortal(levelsContent, levelsPortal)
                : levelsContent
            }
        </div>
    );
}
