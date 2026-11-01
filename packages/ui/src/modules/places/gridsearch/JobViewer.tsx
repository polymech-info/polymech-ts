import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Lock, MapPin, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPlacesGridSearchById, retryPlacesGridSearchJob, getGridSearchExcludeTypes, saveGridSearchExcludeTypes, updatePlacesGridSearchSettings } from '../client-gridsearch';
import { GridSearchResults } from './GridSearchResults';

import { useRestoredSearch } from './RestoredSearchContext';
import { GridSearchStreamProvider, useGridSearchStream } from './GridSearchStreamContext';
import CollapsibleSection from '@/components/CollapsibleSection';
import { T, translate } from '@/i18n';

const LiveGridSearchResults = React.memo(({ jobId, excludedTypes, dummyUpdateExcluded, onExpandSubmitted, onMergeSubmitted, isOwner, isPublic, onTogglePublic, isSidebarOpen, onToggleSidebar }: any) => {
    const { competitors, liveAreas, liveRadii, liveNodes, stats, streaming, statusMessage, liveScanner, sseLogs } = useGridSearchStream();

    return (
        <GridSearchResults
            jobId={jobId}
            competitors={competitors}
            excludedTypes={excludedTypes}
            updateExcludedTypes={dummyUpdateExcluded}
            liveAreas={liveAreas}
            liveRadii={liveRadii}
            liveNodes={liveNodes}
            liveScanner={liveScanner}
            stats={stats}
            streaming={streaming}
            statusMessage={statusMessage}
            sseLogs={sseLogs}
            onExpandSubmitted={onExpandSubmitted}
            onMergeSubmitted={onMergeSubmitted}
            isOwner={isOwner}
            isPublic={isPublic}
            onTogglePublic={onTogglePublic}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
        />
    );
});

const JobMetadataDisplay = React.memo(({ jobId, jobData, foundTypes }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
        <p><span className="font-medium"><T>Job ID:</T></span> <span className="text-gray-800 dark:text-gray-300 select-all">{jobId}</span></p>
        {jobData && (
            <>
                {jobData.request?.search?.types && (
                    <p><span className="font-medium"><T>Queries:</T></span> <span className="text-gray-800 dark:text-gray-300">{jobData.request.search.types.join(', ')}</span></p>
                )}
                {(jobData.query?.region || jobData.request?.enumerate?.region) && (
                    <p><span className="font-medium"><T>Region:</T></span> <span className="text-gray-800 dark:text-gray-300">{jobData.query?.region || jobData.request?.enumerate?.region}</span></p>
                )}
                {(jobData.query?.level || jobData.request?.enumerate?.level) && (
                    <p><span className="font-medium"><T>Level:</T></span> <span className="text-gray-800 dark:text-gray-300">{jobData.query?.level || jobData.request?.enumerate?.level}</span></p>
                )}
                {jobData.areas && (
                    <p><span className="font-medium"><T>Areas Scanned:</T></span> <span className="text-gray-800 dark:text-gray-300">{jobData.areas.length}</span></p>
                )}
                {jobData.generatedAt && (
                    <p><span className="font-medium"><T>Generated At:</T></span> <span className="text-gray-800 dark:text-gray-300">{new Date(jobData.generatedAt).toLocaleString()}</span></p>
                )}
                {foundTypes.length > 0 && (
                    <div className="col-span-full mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="font-medium mr-1 text-gray-800 dark:text-gray-300"><T>Found Types:</T></span>
                        {foundTypes.map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-md text-xs font-medium">
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </>
        )}
    </div>
));

const GadmAreasDisplay = React.memo(({ guidedAreas, isLocked, isComplete }: any) => (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <T>GADM Areas</T> ({guidedAreas.length})
            </span>
            {isLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                    <Lock className="w-3 h-3" /> <T>Locked</T>
                </span>
            )}
            {isComplete && (
                <span className="text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                    <T>Complete</T>
                </span>
            )}
        </div>
        <div className="flex flex-wrap gap-1.5">
            {guidedAreas.map((area: any) => (
                <span
                    key={area.gid}
                    className="inline-flex items-center gap-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50 rounded-md px-2 py-1"
                    title={area.gid}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                    {area.name}
                    <span className="text-[10px] opacity-60">L{area.level}</span>
                </span>
            ))}
        </div>
    </div>
));

const SearchSettingsDisplay = React.memo(({ searchSettings }: any) => (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
        {searchSettings.cellSize && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"><T>Cell:</T> {searchSettings.cellSize}km</span>}
        {searchSettings.minPopDensity > 0 && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"><T>Min Pop:</T> {searchSettings.minPopDensity}</span>}
        {searchSettings.pathOrder && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"><T>Path:</T> {searchSettings.pathOrder}</span>}
        {searchSettings.gridMode && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"><T>Grid:</T> {searchSettings.gridMode}</span>}
    </div>
));

export const JobViewer = React.memo(({ jobId, isSidebarOpen, onToggleSidebar }: { jobId: string; isSidebarOpen?: boolean; onToggleSidebar?: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [competitors, setCompetitors] = useState<any[]>([]);

    const [jobData, setJobData] = useState<any>(null);
    const { state: restoredState, isLocked, isComplete, loading: restoredLoading, refetch } = useRestoredSearch();
    const guidedAreas = restoredState?.run?.request?.guided?.areas || [];
    const searchSettings = restoredState?.run?.request?.guided?.settings || null;

    const [retrying, setRetrying] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const [isSharingTarget, setIsSharingTarget] = useState(false);

    // For CompetitorsGridView props
    const [excludedTypes, setExcludedTypes] = useState<string[]>([]);

    // Load initial exclude types
    useEffect(() => {
        getGridSearchExcludeTypes().then(types => setExcludedTypes(types));
    }, []);

    useEffect(() => {
        if (!jobId) return;

        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchPlacesGridSearchById(jobId);
                if (!active) return;

                // Backend always returns { request, result, areas, status }
                const payload = data?.data ? data.data : data;
                setJobData(payload);

                const enrichResults = payload?.result?.enrichResults;
                if (Array.isArray(enrichResults)) {
                    setCompetitors(enrichResults);
                } else {
                    setCompetitors([]);
                }
                setIsSharingTarget(payload?.isPublic === true);
            } catch (err: any) {
                if (active) setError(err.message || 'Failed to load data');
                console.error('Failed to load job data:', err);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => { active = false; };
    }, [jobId, reloadKey]);

    const handleUpdateExcluded = useCallback(async (types: string[]) => {
        setExcludedTypes(types);
        try {
            await saveGridSearchExcludeTypes(types);
        } catch (e) {
            console.error('Failed to save excluded types:', e);
        }
    }, []);

    const handleRetry = useCallback(async () => {
        try {
            setRetrying(true);
            await retryPlacesGridSearchJob(jobId);
            // Bust the dedup cache and re-trigger the useEffect instead of hard-reloading
            setReloadKey(k => k + 1);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to retry job');
        } finally {
            setRetrying(false);
        }
    }, [jobId]);

    const handleTogglePublic = useCallback(async () => {
        const newValue = !isSharingTarget;
        setIsSharingTarget(newValue);
        try {
            await updatePlacesGridSearchSettings(jobId, { is_public: newValue });
            if (newValue) {
                const url = window.location.href;
                await navigator.clipboard.writeText(url);
                toast.success('Public link enabled and copied to clipboard');
            } else {
                toast.success('Public link disabled');
            }
        } catch (e) {
            console.error(e);
            setIsSharingTarget(!newValue); // revert on failure
            toast.error('Failed to update sharing settings');
        }
    }, [isSharingTarget, jobId]);


    if (!jobId) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-6 flex-1 w-full box-border min-h-0">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500"><T>Loading search results...</T></p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 flex-1 w-full box-border max-w-4xl mx-auto min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        <T>Error</T>
                    </h2>
                    <div className="text-red-500 dark:text-red-400 max-w-lg mx-auto bg-red-50 dark:bg-red-900/50 p-4 rounded-xl font-mono text-sm break-all border border-red-200 dark:border-red-900">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (jobData?.status === 'failed') {
        const errorMsg = jobData.result?.error || 'Unknown error during job execution. The backend worker may have crashed or timed out.';
        return (
            <div className="flex flex-col items-center justify-center p-6 flex-1 w-full box-border max-w-4xl mx-auto min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        <T>Job Failed</T>
                    </h2>
                    <div className="text-red-500 dark:text-red-400 max-w-lg mx-auto bg-red-50 dark:bg-red-900/50 p-4 rounded-xl font-mono text-sm break-all border border-red-200 dark:border-red-900">
                        {errorMsg}
                    </div>
                    {jobData?.isOwner && (
                        <div className="pt-4">
                            <button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 inline-flex items-center"
                            >
                                {retrying ? (
                                    <><Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> <T>Retrying...</T></>
                                ) : (
                                    <T>Retry Job</T>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const allResults = jobData?.result?.searchResult?.results || competitors;
    const foundTypes = Array.from(new Set(allResults.flatMap((r: any) => r.types || []).filter(Boolean))).sort() as string[];
    return (
        <div className="flex flex-col flex-1 w-full overflow-hidden min-h-0 mt-2 dark:bg-gray-800/70 p-1">
            <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl shadow-xl transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                    <div className="w-full">
                        <CollapsibleSection
                            title={
                                <div className="flex items-center gap-2">
                                    <T>Search Configuration & Metadata</T>
                                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">
                                        ({allResults.length} <T>results</T>)
                                    </span>
                                </div>
                            }
                            minimal
                            initiallyOpen={false}
                            storageKey={`gridSearchViewMetaCollapse`}
                            className=""
                        >
                            <JobMetadataDisplay jobId={jobId} jobData={jobData} foundTypes={foundTypes} />

                            {/* Restored GADM Areas */}
                            {guidedAreas.length > 0 && (
                                <GadmAreasDisplay guidedAreas={guidedAreas} isLocked={isLocked} isComplete={isComplete} />
                            )}

                            {/* Search Settings Summary */}
                            {searchSettings && (
                                <SearchSettingsDisplay searchSettings={searchSettings} />
                            )}
                        </CollapsibleSection>
                    </div>
                </div>
                <div className="flex-grow min-h-0 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
                    <GridSearchStreamProvider key={jobId} jobId={jobId} active={isLocked} initialCompetitors={competitors}>
                        <LiveGridSearchResults
                            jobId={jobId}
                            excludedTypes={excludedTypes}
                            dummyUpdateExcluded={handleUpdateExcluded}
                            onMergeSubmitted={() => {
                                toast.success(translate("Search results merged!"));
                                refetch();
                            }}
                            isOwner={jobData?.isOwner === true || restoredState?.run?.isOwner === true}
                            isPublic={jobData?.isPublic === true || restoredState?.run?.isPublic === true || isSharingTarget}
                            onTogglePublic={handleTogglePublic}
                            isSidebarOpen={isSidebarOpen}
                            onToggleSidebar={onToggleSidebar}
                        />
                    </GridSearchStreamProvider>
                </div>
            </div>
        </div>
    );
});
