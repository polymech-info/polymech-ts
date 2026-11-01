import React, { useEffect, useState } from 'react';
import { ExternalLink, BookOpen, X, Info, Globe } from 'lucide-react';
import CollapsibleSection from '../../components/CollapsibleSection';
import { serverUrl } from '@/lib/db';
import { getCurrentLang } from '@/i18n';

interface WikiResult {
    pageid: number;
    title: string;
    distance: number; // meters
}

interface LlmInfo {
    population?: string;
    industry?: string;
    status?: string;
    currency?: string;
    description?: string;
}

interface InfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    lat?: number;
    lng?: number;
    locationName?: string | null;
}

export const InfoPanel = React.memo(({ isOpen, onClose, lat, lng, locationName }: InfoPanelProps) => {
    const [articles, setArticles] = useState<WikiResult[]>([]);
    const [llmInfo, setLlmInfo] = useState<LlmInfo | null>(null);
    const [loadingWiki, setLoadingWiki] = useState(false);
    const [loadingLlm, setLoadingLlm] = useState(false);
    const [errorWiki, setErrorWiki] = useState<string | null>(null);

    // Stability check for coordinates to avoid fetching on microscopic jitter
    const stableLat = lat ? Math.round(lat * 1000) / 1000 : null;
    const stableLng = lng ? Math.round(lng * 1000) / 1000 : null;

    // Fetch Wiki Data
    useEffect(() => {
        if (!isOpen || !stableLat || !stableLng) return;

        const fetchArticles = async () => {
            console.log("InfoPanel [Fetch Triggered]", stableLat, stableLng);
            setLoadingWiki(true);
            setErrorWiki(null);
            try {
                const res = await fetch(`${serverUrl}/api/locations/wiki?lat=${stableLat}&lon=${stableLng}&limit=20`);
                if (res.ok) {
                    const json = await res.json();
                    setArticles(json.data || []);
                } else {
                    setErrorWiki('Failed to fetch articles');
                }
            } catch (e) {
                console.error("Wiki fetch error", e);
                setErrorWiki('Error loading articles');
            } finally {
                setLoadingWiki(false);
            }
        };

        const timer = setTimeout(fetchArticles, 500);
        return () => clearTimeout(timer);
    }, [isOpen, stableLat, stableLng]);

    // Fetch LLM Info
    useEffect(() => {
        if (!isOpen || !locationName) return;

        const fetchLlmInfo = async () => {
            setLoadingLlm(true);
            setLlmInfo(null);
            try {
                const lang = getCurrentLang();
                const res = await fetch(
                    `${serverUrl}/api/locations/llm-info?location=${encodeURIComponent(locationName)}&lang=${encodeURIComponent(lang)}`,
                );
                if (res.ok) {
                    const json = await res.json();
                    setLlmInfo(json.data);
                }
            } catch (e) {
                console.error("LLM Info fetch error", e);
            } finally {
                setLoadingLlm(false);
            }
        };

        // Debounce slightly to avoid rapid updates if panning quickly changes the name
        const timer = setTimeout(fetchLlmInfo, 1000); // 1s debounce for LLM
        return () => clearTimeout(timer);

    }, [isOpen, locationName]);

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-600" />
                    Information
                </h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* General Info (LLM) */}
                <CollapsibleSection
                    title={
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>General Info</span>
                        </div>
                    }
                    initiallyOpen={true}
                    storageKey="info-panel-general-section"
                    className="border-none shadow-none bg-transparent"
                    headerClassName="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2"
                    titleClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
                    contentClassName="pt-2 text-sm px-2"
                    minimal={true}
                >
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        {loadingLlm && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                                <Globe className="w-3 h-3 animate-spin" />
                                Generating summary...
                            </div>
                        )}

                        {!loadingLlm && llmInfo && (
                            <>
                                {llmInfo.description && <p className="italic mb-2">{llmInfo.description}</p>}
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    {llmInfo.population && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-500 w-20">Population:</span>
                                            <span>{llmInfo.population}</span>
                                        </div>
                                    )}
                                    {llmInfo.currency && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-500 w-20">Currency:</span>
                                            <span>{llmInfo.currency}</span>
                                        </div>
                                    )}
                                    {llmInfo.status && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-500 w-20">Status:</span>
                                            <span className={`px-1.5 rounded ${llmInfo.status.toLowerCase().includes('conflict') || llmInfo.status.toLowerCase().includes('war')
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                                }`}>{llmInfo.status}</span>
                                        </div>
                                    )}
                                    {llmInfo.industry && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-500 w-20">Industry:</span>
                                            <span>{llmInfo.industry}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {!loadingLlm && !llmInfo && locationName && (
                            <div className="text-gray-400 text-xs italic">No general info available</div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Wiki Info */}
                <CollapsibleSection
                    title={
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Wikipedia Articles</span>
                        </div>
                    }
                    initiallyOpen={true}
                    storageKey="info-panel-wiki-section"
                    className="border-none shadow-none bg-transparent"
                    headerClassName="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2"
                    titleClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
                    contentClassName="pt-2 text-sm"
                    minimal={true}
                >
                    <div className="space-y-2">
                        {loadingWiki && <div className="text-center py-4 text-gray-500 text-xs">Loading...</div>}

                        {!loadingWiki && errorWiki && <div className="text-center py-4 text-red-500 text-xs">{errorWiki}</div>}

                        {!loadingWiki && !errorWiki && articles.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-xs">
                                No articles found nearby.
                            </div>
                        )}

                        {!loadingWiki && articles.map(article => (
                            <a
                                key={article.pageid}
                                href={`https://en.wikipedia.org/?curid=${article.pageid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 rounded border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-xs">
                                        {article.title}
                                    </h3>
                                    <ExternalLink className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                    {article.distance}m away
                                </div>
                            </a>
                        ))}
                    </div>
                </CollapsibleSection>

            </div>
        </div>
    );
});
