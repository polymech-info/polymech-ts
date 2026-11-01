import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Search, MapPin, CheckCircle, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { submitPlacesGridSearchJob, getGridSearchExcludeTypes, saveGridSearchExcludeTypes, getPlacesTypes } from '../client-gridsearch';
import { PlacesMapView } from '../PlacesMapView';
import { GadmRegionCollector } from '../gadm-picker/GadmRegionCollector';
import { GadmPickerProvider, useGadmPicker } from '../gadm-picker/GadmPickerContext';
import { Badge } from "@/components/ui/badge";
import { T, translate } from '@/i18n';

export function GridSearchWizard({ onJobSubmitted, initialSettings, setIsSidebarOpen }: { onJobSubmitted: (jobId: string) => void, initialSettings?: any, setIsSidebarOpen?: (open: boolean) => void }) {
    const initNodes = initialSettings?.guidedAreas?.map((a: any) => ({
        gid: a.gid,
        name: a.name,
        level: a.level,
        hasPolygons: true
    })) || [];
    return (
        <GadmPickerProvider initialSelectedNodes={initNodes}>
            <GridSearchWizardInner onJobSubmitted={onJobSubmitted} initialSettings={initialSettings} setIsSidebarOpen={setIsSidebarOpen} />
        </GadmPickerProvider>
    );
}

function GridSearchWizardInner({ onJobSubmitted, initialSettings, setIsSidebarOpen }: { onJobSubmitted: (jobId: string) => void, initialSettings?: any, setIsSidebarOpen?: (open: boolean) => void }) {
    const [step, setStep] = useState(() => {
        return (initialSettings?.guidedAreas && initialSettings.guidedAreas.length > 0) ? 2 : 1;
    });

    // Step 1: Region is now provided by GadmPickerContext.
    const { selectedNodes: collectedNodes, setSelectedNodes: setCollectedNodes } = useGadmPicker();

    // Step 2: Query
    const [searchQuery, setSearchQuery] = useState(initialSettings?.searchQuery || '');

    // Step 3: Preview
    const [simulatorSettings, setSimulatorSettings] = useState<any>({
        gridMode: 'centers',
        pathOrder: 'snake',
        groupByRegion: true,
        cellSize: 10,
        cellOverlap: 0,
        centroidOverlap: 0,
        ghsFilterMode: 'OR',
        maxCellsLimit: 10000,
        maxElevation: 1000,
        minDensity: 10,
        minGhsPop: 1,
        minGhsBuilt: 0,
        allowMissingGhs: false,
        bypassFilters: true,
        ...(initialSettings?.simulatorSettings || {})
    });

    const [resolutions, setResolutions] = useState<Record<string, number>>(() => {
        if (!initialSettings?.guidedAreas) return {};
        const res: Record<string, number> = {};
        initialSettings.guidedAreas.forEach((a: any) => { res[a.gid] = a.level; });
        console.log(`resolutions:`, res);
        return res;
    });
    const [excludeTypesStr, setExcludeTypesStr] = useState(initialSettings?.excludeTypes?.join(', ') || '');
    const [knownTypes, setKnownTypes] = useState<string[]>([]);
    const [enableEnrichments, setEnableEnrichments] = useState(initialSettings?.enableEnrichments ?? true);
    const [searchLimit, setSearchLimit] = useState(initialSettings?.searchLimit ?? 20);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mapState, setMapState] = useState<{lat: number, lng: number, zoom: number} | null>(null);

    const [pastSearches, setPastSearches] = useState<string[]>(() => {
        try {
            const past = JSON.parse(localStorage.getItem('gridSearchPastQueries') || '[]');
            console.log(past);
            return past;
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (!initialSettings?.excludeTypes) {
            getGridSearchExcludeTypes().then(types => {
                setExcludeTypesStr(types.join(', '));
            });
        }
        getPlacesTypes().then(types => {
            setKnownTypes(types);
        });
    }, [initialSettings]);


    const handleNext = async () => {
        if (step === 2 && !searchQuery.trim()) {
            setSearchQuery('business,shop,factory,service,industry,company');
        }

        if (step === 1) { setStep(2); return; }

        if (step === 2) {
            setStep(3);
            setIsSidebarOpen?.(false);
            return;
        }

        if (step === 3) { setStep(4); return; }
    };

    const handleBack = () => {
        setStep(Math.max(1, step - 1));
        setError('');
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const excludeTypes = excludeTypesStr.split(',').map(s => s.trim()).filter(Boolean);
            await saveGridSearchExcludeTypes(excludeTypes);

            // Save search to history
            const newPastSearches = Array.from(new Set([searchQuery.trim(), ...pastSearches])).filter(Boolean).slice(0, 15);
            localStorage.setItem('gridSearchPastQueries', JSON.stringify(newPastSearches));
            setPastSearches(newPastSearches);

            const regionNames = collectedNodes.map(n => n.name).join(' | ');

            const areas = collectedNodes.map(node => {
                return {
                    gid: node.gid,
                    name: node.name,
                    level: resolutions[node.gid] ?? node.level,
                    raw: {
                        level: node.level,
                        gadmName: node.name,
                        gid: node.gid
                    }
                };
            });

            const guided = {
                areas,
                settings: simulatorSettings
            };

            const res = await submitPlacesGridSearchJob({
                region: regionNames || 'Manual Selection',
                types: [searchQuery.trim() || 'business,shop,factory,service,industry,company'],
                excludeTypes,
                limitPerArea: searchLimit,
                enrichers: enableEnrichments ? ['meta', 'emails'] : [],
                guided
            });
            onJobSubmitted(res.jobId);
            setStep(5);
        } catch (err: any) {
            setError(err.message || translate('Failed to submit job'));
        }
        setSubmitting(false);
    };

    const handleDiscover = async () => {
        setSubmitting(true);
        setError('');
        try {
            const excludeTypes = excludeTypesStr.split(',').map(s => s.trim()).filter(Boolean);
            await saveGridSearchExcludeTypes(excludeTypes);

            const q = searchQuery.trim() || 'business,shop,factory,service,industry,company';
            if (!searchQuery.trim()) setSearchQuery(q);

            // Save search to history
            const newPastSearches = Array.from(new Set([q, ...pastSearches])).filter(Boolean).slice(0, 15);
            localStorage.setItem('gridSearchPastQueries', JSON.stringify(newPastSearches));
            setPastSearches(newPastSearches);

            const res = await submitPlacesGridSearchJob({
                region: 'Viewport Discover',
                types: [q],
                excludeTypes,
                limitPerArea: searchLimit,
                enrichers: enableEnrichments ? ['meta', 'emails'] : [],
                viewportSearch: true,
                viewportCenter: { lat: mapState?.lat || 0, lng: mapState?.lng || 0 },
                viewportZoom: mapState?.zoom || 15,
                guided: { areas: [], settings: simulatorSettings }
            } as any);
            onJobSubmitted(res.jobId);
            setStep(5);
        } catch (err: any) {
            setError(err.message || translate('Failed to submit job'));
        }
        setSubmitting(false);
    };

    const handleReset = () => {
        setStep(1);
        setCollectedNodes([]);
        setSearchQuery('');
        setResolutions({});
        setError('');
    };


    const initialGadmRegions = useMemo(() => {
        return collectedNodes.map(n => ({
            gid: n.gid,
            name: n.name,
            level: resolutions[n.gid] ?? n.level,
            raw: n.data
        }));
    }, [collectedNodes, resolutions]);

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full border-box w-full">

            {step < 5 && (
                <div className="w-full max-w-2xl mb-8 flex justify-between items-center px-4">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-16 h-1 mx-2 rounded transition-colors ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className={`w-full flex-grow flex flex-col ${step === 3 ? 'max-w-6xl' : 'max-w-xl'} bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300`}>
                <div className="p-8 flex-grow overflow-y-auto flex flex-col min-h-0">

                    {step === 1 && (
                        <div className="flex flex-col flex-1 min-h-0 space-y-6">
                            <div className="shrink-0">
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"><T>Where do you want to search?</T></h2>
                                <p className="text-gray-500 dark:text-gray-400"><T>Select one or more countries, regions, or cities to perform the grid search.</T></p>
                            </div>
                            <GadmRegionCollector
                                resolutions={resolutions}
                                onChangeResolution={
                                    (gid, lvl) => {
                                        setResolutions(prev => ({ ...prev, [gid]: lvl }));
                                        console.log(`resolutions collector:`, resolutions);
                                    }
                                }
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"><T>What are you looking for?</T></h2>
                            <p className="text-gray-500 dark:text-gray-400"><T>Enter your SerpAPI search query for Google Maps.</T></p>

                            <div className="relative mt-8">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-6 w-6 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    list="past-searches"
                                    placeholder={translate('e.g., HVAC contractors')}
                                    className="w-full block pl-12 pr-4 py-4 text-lg border-2 border-transparent bg-gray-100 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 focus:ring-0 rounded-xl transition-colors dark:text-white"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                                />
                                <datalist id="past-searches">
                                    {pastSearches.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700 shrink-0">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100"><T>Preview & Simulate</T></h2>
                            </div>
                            <div className="border rounded-xl overflow-hidden flex-1 min-h-0 mt-3 flex flex-col">
                                <PlacesMapView
                                    preset="Minimal"
                                    places={[]}
                                    onMapCenterUpdate={() => { }}
                                    onMapMove={setMapState}
                                    enrich={async () => { }}
                                    isEnriching={false}
                                    initialGadmRegions={initialGadmRegions}
                                    simulatorSettings={simulatorSettings}
                                    onSimulatorSettingsChange={setSimulatorSettings}
                                    onRegionsChange={(regions) => {
                                        console.log('regions', regions);
                                        setCollectedNodes(prev => {
                                            if (prev.length === regions.length && prev.every((n, i) => n.gid === regions[i].gid)) return prev;
                                            return regions.map((r: any) => ({
                                                gid: r.gid,
                                                name: r.gadmName || r.name,
                                                level: r.raw?.level ?? r.level,
                                                hasChildren: r.raw?.hasChildren ?? true,
                                                hasPolygons: r.raw?.hasPolygons ?? true,
                                                data: r.raw
                                            }));
                                        });
                                        setResolutions(prev => {
                                            const next = { ...prev };
                                            let changed = false;
                                            regions.forEach((r: any) => {
                                                if (next[r.gid] !== r.level) {
                                                    next[r.gid] = r.level;
                                                    changed = true;
                                                }
                                            });
                                            const gids = new Set(regions.map((r: any) => r.gid));
                                            for (const k in next) {
                                                if (!gids.has(k)) {
                                                    delete next[k];
                                                    changed = true;
                                                }
                                            }
                                            return changed ? next : prev;
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2"><T>Ready to Launch</T></h2>
                            <p className="text-gray-500 dark:text-gray-400"><T>Configure your grid granularity and start the scan.</T></p>

                            <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4"><T>Search Summary</T></h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400"><T>Regions</T>:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-xs">{collectedNodes.map(n => n.name).join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400"><T>Query</T>:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">"{searchQuery}"</span>
                                    </div>
                                    <div className="pt-4 border-t dark:border-gray-700 mt-4">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="enableEnrichments"
                                                checked={enableEnrichments}
                                                onChange={(e) => setEnableEnrichments(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <label htmlFor="enableEnrichments" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                <T>Enable Auto-Enrichments (Website & Email Lookup)</T>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                                            <T>Automatically fetch the website and look up emails for each found location. Select this for deeper data collection (uses more credits).</T>
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t dark:border-gray-700 mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><T>Search Limit per grid cell (Max 100)</T></label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={searchLimit}
                                            onChange={(e) => setSearchLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 100)))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <T>Maximum number of results to fetch per grid cell from Google Maps. Allowed range: 1-20. Lower limits save credits and time.</T>
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t dark:border-gray-700 mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><T>Exclude Types (comma separated)</T></label>
                                        <input
                                            type="text"
                                            value={excludeTypesStr}
                                            onChange={(e) => setExcludeTypesStr(e.target.value)}
                                            placeholder={translate('e.g. restaurant, lodging')}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1"><T>Found places with these types will be ignored globally.</T></p>

                                        {knownTypes.length > 0 && (
                                            <div className="mt-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><T>Known Types in Database</T></label>
                                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                                    {knownTypes.map(type => {
                                                        const exclusions = excludeTypesStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                                                        const isExcluded = exclusions.includes(type.toLowerCase());
                                                        return (
                                                            <Badge
                                                                key={type}
                                                                variant={isExcluded ? "destructive" : "secondary"}
                                                                className={`cursor-pointer transition-colors ${isExcluded ? 'line-through opacity-70' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                                                onClick={() => {
                                                                    let parts = excludeTypesStr.split(',').map(s => s.trim()).filter(Boolean);
                                                                    if (isExcluded) {
                                                                        // Need case-insensitive filter
                                                                        parts = parts.filter(p => p.toLowerCase() !== type.toLowerCase());
                                                                    } else {
                                                                        parts.push(type);
                                                                    }
                                                                    setExcludeTypesStr(parts.join(', '));
                                                                }}
                                                            >
                                                                {type.replace(/_/g, ' ')}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 5 && (
                        <div className="text-center py-16 space-y-6 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100"><T>Search Launched!</T></h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                <T>Your grid search has been successfully queued. You can monitor its progress in the sidebar.</T>
                            </p>
                            <div className="pt-6">
                                <button className="text-indigo-600 font-medium hover:underline bg-indigo-50 px-4 py-2 rounded-lg" onClick={handleReset}>
                                    <T>Start Another Search</T>
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {step < 5 && (
                    <div className="shrink-0 bg-gray-50 dark:bg-gray-900/50 px-8 py-4 border-t dark:border-gray-700 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || submitting}
                            className="flex items-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-0 transition-opacity"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" /> <T>Back</T>
                        </button>

                        {step < 4 ? (
                            <div className="flex space-x-3">
                                {step === 3 && (
                                    <button
                                        onClick={handleDiscover}
                                        disabled={submitting || !mapState}
                                        className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MapPin className="w-5 h-5 mr-2" />}
                                        <T>Discover Area</T>
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    <T>Continue</T> <ChevronRight className="w-5 h-5 ml-1" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || collectedNodes.length === 0}
                                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                {submitting ? <T>Launching...</T> : <T>Launch Search</T>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
