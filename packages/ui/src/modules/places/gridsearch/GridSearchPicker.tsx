import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Globe, Check } from 'lucide-react';
import { T, translate } from '@/i18n';
import { searchGadmRegions } from '@/modules/places/client-gridsearch';
import { Badge } from '@/components/ui/badge';

export interface SearchPickerProps {
    onSelect: (item: any) => void;
    selectedId?: string | null;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export const SearchPicker: React.FC<SearchPickerProps> = ({ 
    onSelect, 
    selectedId: externalSelectedId,
    placeholder,
    autoFocus = true,
    className = ""
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

    const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const tid = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await searchGadmRegions(query);
                setResults(res || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(tid);
    }, [query]);

    const handleSelect = (item: any) => {
        const id = item.gid || item.id;
        setInternalSelectedId(id);
        onSelect(item);
    };

    return (
        <div className={`flex flex-col h-full bg-background ${className}`}>
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    placeholder={placeholder || translate("Search for a city, region, or address...")} 
                    className="pl-12 h-14 text-lg shadow-sm border-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed animate-in fade-in duration-500">
                        <div className="p-3 rounded-full bg-primary/5 mb-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                        </div>
                        <p className="text-sm font-medium"><T>Searching for locations...</T></p>
                    </div>
                )}
                {!loading && query.length >= 2 && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed animate-in scale-in duration-300">
                        <Globe className="w-12 h-12 opacity-20 mb-4" />
                        <p className="text-sm"><T>No matching locations found for</T> <span className="font-bold underline">"{query}"</span></p>
                    </div>
                )}
                {!loading && results.map((item, i) => {
                    const id = item.gid || item.id;
                    const isSelected = selectedId === id;
                    const nameMatches = Object.keys(item).filter(k => k.startsWith('NAME_')).sort().reverse();
                    const primaryName = nameMatches.length > 0 ? item[nameMatches[0]] : (item.name || item.gadmName);
                    const subTexts = nameMatches.slice(1).map(k => item[k]).filter(Boolean);
                    
                    return (
                        <div 
                            key={id || i}
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
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-bold truncate text-base ${isSelected ? 'text-primary uppercase tracking-tight' : 'text-foreground'}`}>
                                        {primaryName}
                                    </h4>
                                    {isSelected && (
                                        <div className="bg-primary/10 p-1 rounded-full">
                                            <Check className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                                    {subTexts.join(' • ')}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Badge variant="outline" className={`text-[9px] font-mono font-bold tracking-tight px-1.5 py-0 ${isSelected ? 'bg-primary/10 border-primary/20 text-primary' : 'text-muted-foreground/70'}`}>
                                    {id}
                                </Badge>
                                {(item.latitude || item.lat) && (
                                    <p className="text-[10px] text-muted-foreground/40 font-mono font-bold tabular-nums">
                                        {(item.latitude || item.lat).toFixed(4)}°N, {(item.longitude || item.lng).toFixed(4)}°E
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {!loading && query.length < 2 && (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground opacity-20 select-none animate-in fade-in zoom-in duration-700">
                        <div className="p-8 rounded-full bg-muted/50 mb-6">
                            <Search className="w-20 h-20" />
                        </div>
                        <p className="text-xl font-bold tracking-tight uppercase"><T>Type to Search Global Targets</T></p>
                        <p className="text-sm font-medium mt-2"><T>Cities, Provinces, Countries, or GIDs</T></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPicker;
