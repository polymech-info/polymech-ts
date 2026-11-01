
import React, { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { searchGadmRegions } from '../client-gridsearch';

interface Region {
    [key: string]: any;
}

interface RegionSelectorProps {
    onSelect: (region: Region) => void;
    className?: string;
    contentLevel?: number;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({ onSelect, className, contentLevel }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchGadmRegions(query, contentLevel);
                setResults(data);
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className={`relative ${className}`}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search region (e.g. France, California)..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                />
            </div>

            {open && (query.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Searching...</div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">No regions found</div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="py-1">
                            {results.map((region, idx) => (
                                <div
                                    key={idx}
                                    className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex items-center gap-3 transition-colors group"
                                    onClick={() => {
                                        onSelect(region);
                                        const nameKey = Object.keys(region).find(k => k.startsWith('NAME_') && !k.endsWith('_0')) || 'NAME_0';
                                        setValue(region[nameKey] || region.NAME_0);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="p-1.5  dark:bg-gray-700 rounded-md group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {(() => {
                                                const nameKey = Object.keys(region).find(k => k.startsWith('NAME_') && !k.endsWith('_0')) || 'NAME_0';
                                                // Sort to find deepst level? Usually just one specific level per result from Names()
                                                // Actually Names() returns e.g. NAME_2, GID_2. It doesn't return NAME_0 usually unless requested.
                                                // But wait, our debug output showed: {'NAME_2': 'Barcelona', 'GID_2': 'BRA.20.15_2'}
                                                // It does NOT have NAME_0.
                                                return region[nameKey];
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                            {(() => {
                                                const typeKey = Object.keys(region).find(k => k.startsWith('TYPE_'));
                                                return region[typeKey || ''] || "Region";
                                            })()}
                                            {/* We don't have NAME_0 available from Names() call usually, so skip it or fetch it if needed? 
                                                Actually for now let's just show the GID if we can't find context */}
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            {(() => {
                                                const gidKey = Object.keys(region).find(k => k.startsWith('GID_'));
                                                return region[gidKey || ''] || '';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop to close on click outside */}
            {open && (
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />
            )}
        </div>
    );
};
