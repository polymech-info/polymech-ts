import React, { useState, useEffect, useMemo } from 'react';
import { Search, History, Loader2, MapPin, Calendar, Globe, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { T } from '@/i18n';
import { fetchPlacesGridSearches, fetchPlacesGridSearchById, fetchPlacesGridSearchRunState, GridSearchSummary } from '@/modules/places/client-gridsearch';
import { LocationSelection } from './types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchesTabProps {
    onUpdate: (selection: LocationSelection) => void;
    initialSelection?: LocationSelection;
    currentSelection?: LocationSelection | null;
}

export default function SearchesTab({ onUpdate, initialSelection, currentSelection }: SearchesTabProps) {
    const [jobs, setJobs] = useState<GridSearchSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingDetails, setFetchingDetails] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Local override for immediate feedback while fetching metadata
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
    const activeJobId = localSelectedId || currentSelection?.jobId || initialSelection?.jobId;

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchPlacesGridSearches();
                setJobs(data || []);
            } catch (err) {
                console.error('Failed to load past searches:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredJobs = useMemo(() => {
        if (!searchQuery) return jobs;
        const q = searchQuery.toLowerCase();
        return jobs.filter(j =>
            j.regionName?.toLowerCase().includes(q) ||
            j.query?.toLowerCase().includes(q) ||
            j.id.toLowerCase().includes(q)
        );
    }, [jobs, searchQuery]);

    const handleSelect = async (job: GridSearchSummary) => {
        if (fetchingDetails) return;
        setLocalSelectedId(job.id);
        setFetchingDetails(job.id);
        try {
            // Minimal fetch: just get the job search summary/request for label and center
            const fullJob = await fetchPlacesGridSearchById(job.id);
            const data = fullJob?.data || fullJob;

            // Try to find a center point if available
            const lat = data?.request?.enumerate?.lat || data?.request?.search?.lat || data?.query?.lat;
            const lng = data?.request?.enumerate?.lng || data?.request?.search?.lng || data?.query?.lng;

            const selection: LocationSelection = {
                type: 'job',
                jobId: job.id,
                label: `${job.query || 'General Search'} @ ${job.regionName}`,
                lat: lat ? parseFloat(lat) : undefined,
                lng: lng ? parseFloat(lng) : undefined
            };

            // console.log('SearchesTab updating parent', selection);
            onUpdate(selection);
        } catch (err) {
            console.error('Failed to fetch job details for selection:', err);
            // Fallback to basic info if details fetch fails
            onUpdate({
                type: 'job',
                jobId: job.id,
                jobSummary: job,
                label: `${job.query || 'General Search'} @ ${job.regionName}`,
            });
        } finally {
            setFetchingDetails(null);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground"><T>Loading past searches...</T></p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            <div className="px-6 py-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search history by region or query..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 grid gap-2">
                    {filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <History className="w-12 h-12 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-medium text-foreground"><T>No searches found</T></p>
                            <p className="text-xs text-muted-foreground mt-1">
                                <T>Your past Grid Search results will appear here.</T>
                            </p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <button
                                key={job.id}
                                onClick={() => handleSelect(job)}
                                disabled={fetchingDetails !== null}
                                className={`
                                    w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group
                                    ${activeJobId === job.id
                                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                                        : 'bg-card hover:bg-muted/50 border-border hover:border-muted-foreground/30'
                                    }
                                    ${fetchingDetails === job.id ? 'opacity-80' : ''}
                                `}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5 h-5 bg-background">
                                                {job.id.slice(0, 8)}
                                            </Badge>
                                            <span className={`
                                                text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                                                ${job.status === 'completed' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                                                    job.status === 'failed' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                                                        'text-amber-600 bg-amber-50 dark:bg-amber-900/20'}
                                            `}>
                                                {job.status}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                                            {job.query || <span className="italic opacity-50"><T>General Search</T></span>}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="truncate">{job.regionName}</span>
                                            {job.level && <span className="opacity-60 text-[10px]">L{String(job.level)}</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(job.generatedAt), { addSuffix: true })}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {job.results !== undefined && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                    <Database className="w-3 h-3" />
                                                    {job.results} <T>pts</T>
                                                </div>
                                            )}
                                            {fetchingDetails === job.id && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {activeJobId === job.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
