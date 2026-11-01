import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, History, Check, MapPin, Users } from 'lucide-react';
import { T, translate } from '@/i18n';
import { fetchPlacesGridSearches, GridSearchSummary } from '@/modules/places/client-gridsearch';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface GridSearchRunPickerProps {
    onSelect: (item: GridSearchSummary) => void;
    id?: string | null;
    excludeId?: string | null;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export const GridSearchRunPicker: React.FC<GridSearchRunPickerProps> = ({ 
    onSelect, 
    id: externalSelectedId,
    excludeId,
    placeholder,
    autoFocus = true,
    className = ""
}) => {
    const [query, setQuery] = useState('');
    const [allRuns, setAllRuns] = useState<GridSearchSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

    const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchPlacesGridSearches();
                // Filter out the current run and children (if nested)
                const filtered = res.filter(r => r.id !== excludeId);
                setAllRuns(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [excludeId]);

    const filteredResults = allRuns.filter(run => {
        const searchText = `${run.regionName} ${run.query} ${run.id}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });

    const handleSelect = (item: GridSearchSummary) => {
        setInternalSelectedId(item.id);
        onSelect(item);
    };

    return (
        <div className={`flex flex-col h-[500px] bg-background ${className}`}>
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    placeholder={placeholder || translate("Find a past search...")} 
                    className="pl-12 h-14 text-lg shadow-sm border-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed">
                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50 mb-3" />
                        <p className="text-sm font-medium"><T>Loading past searches...</T></p>
                    </div>
                )}
                
                {!loading && filteredResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed animate-in scale-in duration-300">
                        <History className="w-12 h-12 opacity-20 mb-4" />
                        <p className="text-sm">
                            {query 
                                ? `${translate("No matching searches found for")} "${query}"` 
                                : translate("No other searches available to merge.")
                            }
                        </p>
                    </div>
                )}

                {!loading && filteredResults.map((item, i) => {
                    const isSelected = selectedId === item.id;
                    
                    return (
                        <div 
                            key={item.id || i}
                            onClick={() => handleSelect(item)}
                            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group shadow-sm ${
                                isSelected 
                                ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md transform scale-[1.01]' 
                                : 'bg-card hover:bg-accent/50 hover:border-accent hover:shadow-md'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                isSelected ? 'bg-primary text-white' : 'bg-muted group-hover:bg-background text-muted-foreground group-hover:text-primary'
                            }`}>
                                <History className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium truncate text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`} title={item.regionName}>
                                        <span className="font-bold text-sm capitalize">{item.query}</span> @ {item.regionName} <span className="text-xs font-normal opacity-70">({item.level})</span>
                                    </h4>
                                    {isSelected && (
                                        <div className="bg-primary/10 p-1 rounded-full">
                                            <Check className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={item.query}>
                                        {item.query}
                                    </p>
                                    {(item.results != null && item.results > 0) && (
                                        <span className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap" title="Total results">
                                            <MapPin className="w-3 h-3 mr-0.5 inline" />
                                            {item.results}
                                        </span>
                                    )}
                                </div>

                                <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-mono">
                                    {item.generatedAt ? formatDistanceToNow(new Date(item.generatedAt), { addSuffix: true }) : 'Unknown date'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Badge variant="outline" className={`text-[9px] font-mono font-bold tracking-tight px-1.5 py-0 ${isSelected ? 'bg-primary/10 border-primary/20 text-primary' : 'text-muted-foreground/70'}`}>
                                    {item.id.slice(0, 8)}
                                </Badge>
                                {item.countries && item.countries.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider">
                                        {item.countries[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GridSearchRunPicker;
