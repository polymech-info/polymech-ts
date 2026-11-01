import React, { useEffect, useMemo, useState } from 'react';
import { fetchPlacesGridSearches, deletePlacesGridSearch, postPlacesGridSearchControl, GridSearchSummary } from '../client-gridsearch';
import { Loader2, XCircle, CheckCircle, ChevronRight, Trash2, Clock, GitBranch, MapPin, Mail, CircleStop, Square } from 'lucide-react';
import { readStoredGridSearchProgress } from './GridSearchStreamContext';
import { getCurrentLang } from '@/i18n';

function getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    try {
        const lang = getCurrentLang();
        const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = date.getTime() - now.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        if (Math.abs(diffDay) >= 7) {
            return date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
        } else if (Math.abs(diffDay) >= 1) {
            return rtf.format(diffDay, 'day');
        } else if (Math.abs(diffHour) >= 1) {
            return rtf.format(diffHour, 'hour');
        } else if (Math.abs(diffMin) >= 1) {
            return rtf.format(diffMin, 'minute');
        } else {
            return rtf.format(diffSec, 'second');
        }
    } catch (e) {
        return '';
    }
}

const StatusIcon = ({ status, isSelected }: { status: string; isSelected: boolean }) => {
    if (status === 'searching' || status === 'enriching') {
        return <Loader2 className="shrink-0 w-4 h-4 text-amber-500 animate-spin" />;
    }
    if (status === 'failed') {
        return <XCircle className="shrink-0 w-4 h-4 text-red-500" />;
    }
    if (status === 'cancelled') {
        return <CircleStop className="shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    return <CheckCircle className={`shrink-0 w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-green-500'}`} />;
};

const SearchRow = ({
    search,
    isSelected,
    isChild,
    onSelect,
    onDelete,
    storedProgressPct,
    onStopActive,
}: {
    search: GridSearchSummary;
    isSelected: boolean;
    isChild?: boolean;
    onSelect: () => void;
    onDelete: () => void;
    storedProgressPct: number | null;
    onStopActive?: (e: React.MouseEvent) => void;
}) => {
    const isActiveJob = search.status === 'searching' || search.status === 'enriching';
    return (
    <div
        onClick={onSelect}
        className={`flex flex-col cursor-pointer border-b dark:border-gray-800 transition-colors
            ${isChild ? 'pl-7 pr-3 py-2' : 'p-3'}
            ${isSelected
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-l-indigo-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-l-transparent'
            }`}
    >
        <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
            {isChild ? (
                <GitBranch className="shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            ) : null}
            <StatusIcon status={search.status} isSelected={isSelected} />
            <div className="min-w-0 pr-2">
                <h4 className={`font-medium truncate ${isChild ? 'text-xs' : 'text-sm'} ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`} title={search.regionName}>
                    <span className="font-bold text-sm capitalize">{search.query}</span> @ {search.regionName} {!isChild && <span className="text-xs font-normal opacity-70">({search.level})</span>}
                </h4>
                <div className="flex items-center space-x-2 mt-0.5">
                    <p className={`text-gray-500 dark:text-gray-400 truncate max-w-[140px] ${isChild ? 'text-[10px]' : 'text-xs'}`} title={search.query}>
                        {search.query}
                    </p>
                    {(search.results != null && search.results > 0) && (
                        <span className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap" title="Total results">
                            <MapPin className="w-3 h-3 mr-0.5 inline" />
                            {search.results}
                        </span>
                    )}
                    {(search.emails != null && search.emails > 0) && (
                        <span className="flex items-center text-[10px] text-emerald-500 dark:text-emerald-400 whitespace-nowrap" title="Emails found">
                            <Mail className="w-3 h-3 mr-0.5 inline" />
                            {search.emails}
                        </span>
                    )}
                    {search.generatedAt && (
                        <span className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            {getRelativeTime(search.generatedAt)}
                        </span>
                    )}
                </div>
                {!isChild && (() => {
                    const crumbs = search.hierarchy && search.hierarchy.length > 0
                        ? search.hierarchy.filter(h => h !== search.regionName)
                        : (search.countries && search.countries.length > 0 && !search.countries.includes(search.regionName)
                            ? search.countries
                            : []);
                    if (crumbs.length === 0) return null;
                    return (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5" title={crumbs.join(' › ')}>
                            {crumbs.join(' › ')}
                        </p>
                    );
                })()}
            </div>
        </div>
        <div className="flex items-center shrink-0 space-x-1">
            {isActiveJob && onStopActive && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStopActive(e);
                    }}
                    className="p-1.5 rounded-md transition-colors text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/40"
                    title="Stop search"
                >
                    <Square className="w-3.5 h-3.5 fill-current" />
                </button>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className={`p-1.5 rounded-md transition-colors ${isChild
                    ? 'text-gray-300 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                title="Delete Search"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isSelected && <ChevronRight className="w-4 h-4 text-indigo-500 ml-1" />}
        </div>
        </div>
        {isActiveJob && (
            <div className="mt-1.5 pl-0 pr-1 flex items-center gap-2 w-full min-w-0">
                <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden min-w-0">
                    <div
                        className={`h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500 ${
                            storedProgressPct == null ? 'opacity-80 animate-pulse' : ''
                        }`}
                        style={{ width: storedProgressPct != null ? `${storedProgressPct}%` : '32%' }}
                    />
                </div>
                {storedProgressPct != null && (
                    <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 shrink-0">{storedProgressPct}%</span>
                )}
            </div>
        )}
    </div>
);
};

export const OngoingSearches = ({ onSelectJob, selectedJobId, onSearchDeleted }: { onSelectJob?: (jobId: string) => void, selectedJobId?: string | null, onSearchDeleted?: (jobId: string) => void }) => {
    const [pastSearches, setPastSearches] = useState<GridSearchSummary[]>([]);
    const [, bumpProgressRead] = useState(0);

    const hasActiveInList = useMemo(() => {
        const active = (s: GridSearchSummary) => s.status === 'searching' || s.status === 'enriching';
        return pastSearches.some(s => active(s) || s.children?.some(active));
    }, [pastSearches]);

    useEffect(() => {
        if (!hasActiveInList) return;
        const t = setInterval(() => bumpProgressRead(n => n + 1), 1500);
        return () => clearInterval(t);
    }, [hasActiveInList]);

    const loadPast = async () => {
        try {
            const history = await fetchPlacesGridSearches();
            setPastSearches(history);
        } catch (err) {
            console.error('Failed to load past searches', err);
        }
    };

    useEffect(() => {
        loadPast();
        // Poll past searches frequently so live searches update in the list
        const interval = setInterval(loadPast, 10_000);
        return () => clearInterval(interval);
    }, []);

    const handleStopSearch = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await postPlacesGridSearchControl(id, 'cancel');
            await loadPast();
        } catch (err) {
            console.error('Stop search failed:', err);
        }
    };

    const handleDelete = async (id: string, parent?: string) => {
        if (confirm('Are you sure you want to delete this search?')) {
            try {
                await deletePlacesGridSearch(id);
                setPastSearches(prev => {
                    if (parent) {
                        return prev.map(p => p.id === parent ? { ...p, children: p.children?.filter(c => c.id !== id) } : p);
                    }
                    return prev.filter(s => s.id !== id);
                });
                if (onSearchDeleted) onSearchDeleted(id);
            } catch (err) {
                console.error('Failed to delete search', err);
                alert('Failed to delete search.');
            }
        }
    };

    return (
        <div className="w-full flex mt-4 flex-col">
            {pastSearches.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Searches</h3>
                    <div className="flex flex-col">
                        {pastSearches.map(search => (
                            <React.Fragment key={search.id}>
                                <SearchRow
                                    search={search}
                                    isSelected={selectedJobId === search.id}
                                    onSelect={() => onSelectJob && onSelectJob(search.id)}
                                    onDelete={() => handleDelete(search.id)}
                                    storedProgressPct={
                                        search.status === 'searching' || search.status === 'enriching'
                                            ? readStoredGridSearchProgress(search.id)?.pct ?? null
                                            : null
                                    }
                                    onStopActive={(e) => handleStopSearch(e, search.id)}
                                />
                                {search.children && search.children.length > 0 && search.children.map(child => (
                                    <SearchRow
                                        key={child.id}
                                        search={child}
                                        isSelected={selectedJobId === child.id}
                                        isChild
                                        onSelect={() => onSelectJob && onSelectJob(child.id)}
                                        onDelete={() => handleDelete(child.id, search.id)}
                                        storedProgressPct={
                                            child.status === 'searching' || child.status === 'enriching'
                                                ? readStoredGridSearchProgress(child.id)?.pct ?? null
                                                : null
                                        }
                                        onStopActive={(e) => handleStopSearch(e, child.id)}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
