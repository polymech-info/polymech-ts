import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, Phone, Clock, Calendar, Image as ImageIcon, Instagram, Facebook, Linkedin, Youtube, Twitter, Star, Fingerprint, ListOrdered, Loader2, Sparkles, Building2, GitBranch, Users } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { API_URL, THUMBNAIL_WIDTH } from '../../constants';
import type { PlaceFull } from '@polymech/shared';
import { fetchCompetitorById, fetchPlacePhotos, fetchPlaceLlmSummary, type PlaceLlmSummary } from './client-gridsearch';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { T, translate, getCurrentLang } from '../../i18n';

// Extracted Presentation Component
export const LocationDetailView = React.memo(({
    competitor,
    onClose,
    livePhotos,
    gridSearchRunId,
}: {
    competitor: PlaceFull;
    onClose?: () => void;
    livePhotos?: any;
    /** When set (e.g. grid search job id), server loads grid_search_runs.request for place summary context */
    gridSearchRunId?: string | null;
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'summary' | 'homepage' | 'debug'>('overview');
    const [fetchedPhotos, setFetchedPhotos] = useState<any>(null);
    const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);
    const [summaryData, setSummaryData] = useState<PlaceLlmSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const showDebug = import.meta.env.VITE_LOCATION_DETAIL_DEBUG === 'true';

    useEffect(() => {
        // Reset local fetched state when competitor changes
        setFetchedPhotos(null);
        setIsFetchingPhotos(false);
        setSummaryData(null);
        setSummaryError(null);

        // Fetch photos on-the-fly (async, non-blocking) if we don't already have them
        if (!livePhotos && !competitor.raw_data?.google_media?.photos?.length) {
            setIsFetchingPhotos(true);
            fetchPlacePhotos(competitor.place_id)
                .then(photos => { if (photos?.photos?.length) setFetchedPhotos(photos); })
                .catch(err => console.warn('Photos fetch skipped:', err.message))
                .finally(() => setIsFetchingPhotos(false));
        }
    }, [competitor.place_id, livePhotos, competitor.raw_data?.google_media?.photos?.length]);

    useEffect(() => {
        if (activeTab !== 'summary' || !competitor.place_id) return;
        let cancelled = false;
        setSummaryLoading(true);
        setSummaryError(null);
        const lang = getCurrentLang();
        fetchPlaceLlmSummary(competitor.place_id, {
            lang,
            runId: gridSearchRunId || undefined,
        })
            .then((data) => {
                if (!cancelled) setSummaryData(data);
            })
            .catch((e: Error) => {
                if (!cancelled) setSummaryError(e?.message || 'Failed to load summary');
            })
            .finally(() => {
                if (!cancelled) setSummaryLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeTab, competitor.place_id, gridSearchRunId]);

    // Prefer prop-injected, then dynamically fetched, then DB-cached
    const photoSource = livePhotos || fetchedPhotos || competitor.raw_data?.google_media;
    const summaryHasContent =
        summaryData &&
        !!(
            summaryData.summary ||
            (summaryData.services?.length ?? 0) > 0 ||
            (summaryData.industries?.length ?? 0) > 0 ||
            (summaryData.products?.length ?? 0) > 0 ||
            (summaryData.priceRange && String(summaryData.priceRange).length > 0) ||
            (summaryData.companySizeEstimate && String(summaryData.companySizeEstimate).length > 0) ||
            summaryData.differentiators ||
            typeof summaryData.potentialCustomer === 'number' ||
            summaryData.isBranch === true ||
            summaryData.isFamilyBusiness === true ||
            summaryData.isFamilyBusiness === false
        );
    const photos = photoSource?.photos?.map((photo: any) => ({
        src: photo.image,
        alt: competitor.title,
    })) || [];

    const rd = competitor.raw_data as any;

    const socialLinks = [
        { name: 'Instagram', icon: Instagram, url: rd?.instagram || rd?.meta?.social?.find((p: any) => p.source === 'instagram')?.url, color: 'text-pink-600' },
        { name: 'Facebook', icon: Facebook, url: rd?.facebook || rd?.meta?.social?.find((p: any) => p.source === 'facebook')?.url, color: 'text-blue-600' },
        { name: 'LinkedIn', icon: Linkedin, url: rd?.linkedin || rd?.meta?.social?.find((p: any) => p.source === 'linkedin')?.url, color: 'text-blue-700' },
        { name: 'YouTube', icon: Youtube, url: rd?.youtube || rd?.meta?.social?.find((p: any) => p.source === 'youtube')?.url, color: 'text-red-600' },
        { name: 'Twitter', icon: Twitter, url: rd?.twitter || rd?.meta?.social?.find((p: any) => p.source === 'twitter')?.url, color: 'text-blue-400' },
    ].filter(link => link.url);

    return (
        <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
            {onClose && (
                // Property Pane Header
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate pr-4">{competitor.title}</h2>
                    <div className="flex items-center gap-1">
                        <Link
                            to={`/products/places/detail/${competitor.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-full hover: text-gray-500"
                            title={translate("Open details in new tab")}
                        >
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Link>
                        <button onClick={onClose} className="p-1 rounded-full hover: text-gray-500">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className={onClose ? "p-4 space-y-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8"}>
                {/* Header Section (Title & Tags) - Hide title if in pane header, or show specific layout */}
                {!onClose && (
                    <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">{competitor.title}</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {competitor.types?.map((type) => (
                                        <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100 capitalize">
                                            {type.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                    {competitor.raw_data?.google_media?.categories?.map((category: any) => (
                                        <span key={category.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  text-gray-800">
                                            {category.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {competitor.thumbnail && (
                                <img
                                    src={competitor.thumbnail}
                                    alt={competitor.title}
                                    className="h-24 w-24 object-cover rounded-lg shadow-sm"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* For Pane View: Use a more compact header if desired, or reuse the same blocks */}
                {onClose && (
                    <div className="flex gap-4 items-start">
                        {competitor.thumbnail && (
                            <img
                                src={competitor.thumbnail}
                                alt={competitor.title}
                                className="h-20 w-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-1 mb-2">
                                {competitor.types?.slice(0, 3).map((type) => (
                                    <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-100 capitalize border border-blue-100 dark:border-blue-800">
                                        {type.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-1 px-4" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`${activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-1.5`}
                            >
                                <T>Overview</T>
                            </button>
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`${activeTab === 'summary'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-1.5`}
                            >
                                <Sparkles className="h-4 w-4 shrink-0 opacity-80" />
                                <T>Summary</T>
                            </button>
                            {competitor.website && (
                                <button
                                    onClick={() => setActiveTab('homepage')}
                                    className={`${activeTab === 'homepage'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    <T>Homepage</T>
                                </button>
                            )}
                            {showDebug && (
                                <button
                                    onClick={() => setActiveTab('debug')}
                                    className={`${activeTab === 'debug'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    <T>Debug</T>
                                </button>
                            )}
                        </nav>
                    </div>

                {activeTab === 'overview' ? (
                    <>
                        <div className={`bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm ${!onClose && 'shadow overflow-hidden sm:rounded-lg'}`}>
                            <div className={!onClose ? "px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700" : "mb-3"}>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center">
                                    <ImageIcon className="h-5 w-5 mr-2" />
                                    <T>Photos</T> <span className="ml-1">{photos.length > 0 ? `(${photos.length})` : ''}</span>
                                    {isFetchingPhotos && <Loader2 className="ml-2 h-4 w-4 animate-spin text-indigo-500" />}
                                </h3>
                            </div>
                            <div className={`grid gap-2 ${onClose ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 pb-4'}`}>
                                {photos.slice(0, onClose ? 6 : undefined).map((photo: any, index: number) => {
                                    const thumbSrc = photo.src.replace(/=w\d+[^&]*/, `=w${THUMBNAIL_WIDTH}`);
                                    return (
                                        <div
                                            key={index}
                                            className="aspect-square cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow relative group"
                                            onClick={() => {
                                                setLightboxIndex(index);
                                                setLightboxOpen(true);
                                            }}
                                        >
                                            <img
                                                src={thumbSrc}
                                                alt={`Photo ${index + 1}`}
                                                className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                            {onClose && index === 5 && photos.length > 6 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                                                    +{photos.length - 6}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>


                        <div className={`bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm ${!onClose && 'shadow overflow-hidden sm:rounded-lg'}`}>
                            <div className={!onClose ? "border-t border-gray-200 px-4 py-5 sm:px-6" : ""}>
                                <dl className={`grid grid-cols-1 gap-x-4 gap-y-4 ${!onClose ? 'sm:grid-cols-2 gap-y-8' : ''}`}>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <MapPin className="h-4 w-4 mr-2" /> <T>Address</T>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                                            {competitor.address}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(competitor.title)}&query_place_id=${competitor.place_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                                                >
                                                    <T>View on Map</T>
                                                </a>
                                                {competitor.gps_coordinates && (
                                                    <a
                                                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${competitor.gps_coordinates.latitude},${competitor.gps_coordinates.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 font-medium ml-3"
                                                    >
                                                        <T>Street View</T>
                                                    </a>
                                                )}
                                            </div>
                                        </dd>
                                    </div>

                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <Globe className="h-4 w-4 mr-2" /> <T>Website</T>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 break-all">
                                            {competitor.website ? (
                                                <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                                    <T>Visit Website</T>
                                                </a>
                                            ) : <T>N/A</T>}
                                        </dd>
                                    </div>

                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                            <Phone className="h-4 w-4 mr-2" /> <T>Phone</T>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{competitor.phone || <T>N/A</T>}</dd>
                                    </div>

                                    {socialLinks.length > 0 && (
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center mb-1">
                                                <T>Social Profiles</T>
                                            </dt>
                                            <dd className="flex flex-wrap gap-3 mt-1">
                                                {socialLinks.map((social) => (
                                                    <a
                                                        key={social.name}
                                                        href={social.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${social.color}`}
                                                        title={translate(social.name)}
                                                    >
                                                        <social.icon className="h-5 w-5" />
                                                    </a>
                                                ))}
                                            </dd>
                                        </div>
                                    )}

                                    {competitor.raw_data?.rating !== undefined && (
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                                <Star className="h-4 w-4 mr-2 text-yellow-500" /> <T>Rating</T>
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-medium">
                                                {competitor.raw_data.rating} <span className="text-gray-500 dark:text-gray-400 font-normal">({competitor.raw_data.reviews || 0} <T>reviews</T>)</span>
                                            </dd>
                                        </div>
                                    )}

                                    {competitor.raw_data?.provider_id && (
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                                <Fingerprint className="h-4 w-4 mr-2" /> <T>Provider ID</T>
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-mono text-xs break-all">
                                                {competitor.raw_data.provider_id}
                                            </dd>
                                        </div>
                                    )}

                                    {competitor.raw_data?.position !== undefined && (
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                                <ListOrdered className="h-4 w-4 mr-2" /> <T>Search Position</T>
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                                                #{competitor.raw_data.position}
                                            </dd>
                                        </div>
                                    )}

                                    {!onClose && (
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" /> <T>Last Updated</T>
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                                                {competitor.updated_at ? new Date(competitor.updated_at).toLocaleDateString() : <T>N/A</T>}
                                            </dd>
                                        </div>
                                    )}

                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center mb-2">
                                            <Clock className="h-4 w-4 mr-2" /> <T>Operating Hours</T>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
                                            {competitor.operating_hours ? (
                                                <ul className="grid grid-cols-1 gap-1 text-xs sm:text-sm">
                                                    {Object.entries(competitor.operating_hours).map(([day, hours]) => (
                                                        <li key={day} className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1 last:border-0">
                                                            <span className="capitalize font-medium text-gray-600 dark:text-gray-400 w-24">{(translate(day) !== day) ? translate(day) : day}</span>
                                                            <span>{hours as string}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <T>Not available</T>}
                                        </dd>
                                    </div>

                                    {competitor.raw_data?.description && (
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"><T>Description</T></dt>
                                            <dd className="text-sm text-gray-900 dark:text-gray-200">{competitor.raw_data.description}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </div>

                        {competitor.sites && competitor.sites.length > 0 && (
                            <div className={`mt-6 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm ${!onClose && 'shadow overflow-hidden sm:rounded-lg'}`}>
                                <div className={!onClose ? "px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700" : "mb-3"}>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center">
                                        <Globe className="h-5 w-5 mr-2 text-gray-500" />
                                        <T>Extracted Web Content</T>
                                    </h3>
                                </div>
                                <div className="p-4 space-y-6">
                                    {competitor.sites.map((site: any, idx: number) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                                            <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-400/50"></span>
                                                    {site.name} <T>Page</T>
                                                </span>
                                                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-full text-xs" title={site.url}>
                                                    {site.url}
                                                </a>
                                            </div>
                                            <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                                                <MarkdownRenderer content={site.content || ''} baseUrl={site.url} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'summary' ? (
                    <div className={`bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm ${!onClose && 'shadow overflow-hidden sm:rounded-lg'} p-2`}>
                        <div className={!onClose ? 'px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700' : 'mb-3'}>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
                                <T>Summary</T>
                                {summaryLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                            </h3>                            
                        </div>
                        <div className="px-4 py-5 sm:px-6 space-y-6">
                            {summaryError && (
                                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                                    {summaryError}
                                </div>
                            )}
                            {!summaryLoading && !summaryError && summaryData && (
                                <>
                                    {summaryData.summary && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"><T>Details</T></h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summaryData.summary}</p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {summaryData.isBranch === true && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 px-2.5 py-0.5 text-xs font-medium">
                                                <GitBranch className="h-3.5 w-3.5" />
                                                <T>Branch / part of larger firm</T>
                                            </span>
                                        )}
                                        {summaryData.isFamilyBusiness === true && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 px-2.5 py-0.5 text-xs font-medium">
                                                <Users className="h-3.5 w-3.5" />
                                                <T>Family business</T>
                                            </span>
                                        )}
                                        {summaryData.isFamilyBusiness === false && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-2.5 py-0.5 text-xs font-medium">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <T>Not indicated as family-owned</T>
                                            </span>
                                        )}
                                    </div>
                                    {(summaryData.companySizeEstimate || summaryData.priceRange) && (
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            {summaryData.companySizeEstimate && (
                                                <div>
                                                    <dt className="text-gray-500 dark:text-gray-400 font-medium"><T>Company size (estimate)</T></dt>
                                                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{summaryData.companySizeEstimate}</dd>
                                                </div>
                                            )}
                                            {summaryData.priceRange ? (
                                                <div>
                                                    <dt className="text-gray-500 dark:text-gray-400 font-medium"><T>Price range</T></dt>
                                                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{summaryData.priceRange}</dd>
                                                </div>
                                            ) : null}
                                        </dl>
                                    )}
                                    {summaryData.services && summaryData.services.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"><T>Services</T></h4>
                                            <ul className="flex flex-wrap gap-1.5">
                                                {summaryData.services.map((s, i) => (
                                                    <li key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 text-xs">{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {summaryData.industries && summaryData.industries.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"><T>Industries</T></h4>
                                            <ul className="flex flex-wrap gap-1.5">
                                                {summaryData.industries.map((s, i) => (
                                                    <li key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs">{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {summaryData.products && summaryData.products.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"><T>Products</T></h4>
                                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/80 text-left text-xs text-gray-600 dark:text-gray-400">
                                                            <th className="px-3 py-2 font-medium"><T>Type</T></th>
                                                            <th className="px-3 py-2 font-medium"><T>Price range</T></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {summaryData.products.map((p, i) => (
                                                            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.type || '—'}</td>
                                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{p.priceRange || '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {summaryData.differentiators && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"><T>Differentiators</T></h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summaryData.differentiators}</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {!summaryLoading && !summaryError && summaryData && !summaryHasContent && (
                                <p className="text-sm text-gray-500 dark:text-gray-400"><T>No summary fields returned.</T></p>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'homepage' && competitor.website ? (
                    <div className={`mt-4 bg-white dark:bg-gray-800 ${!onClose && 'shadow sm:rounded-lg'} overflow-hidden min-h-[600px] flex flex-col`}>
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate mr-4">
                                {competitor.website}
                            </span>
                            <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline shrink-0 font-medium px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30">
                                <T>Open in new tab</T>
                            </a>
                        </div>
                        <iframe
                            src={competitor.website}
                            className="w-full flex-1 border-0 min-h-[600px] bg-white"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            referrerPolicy="no-referrer"
                            title={translate("Homepage Preview")}
                        />
                    </div>
                ) : (
                    <div className={!onClose ? "shadow overflow-hidden sm:rounded-lg" : ""}>
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"><T>Raw Data</T></h3>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                    {JSON.stringify(competitor, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}


            </div>

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={photos}
                render={{
                    slide: ({ slide }) => (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img
                                src={slide.src}
                                alt={slide.alt}
                                referrerPolicy="no-referrer"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                    ),
                }}
            />
        </div >
    );
});

const LocationDetail: React.FC = () => {
    const { place_id } = useParams<{ place_id: string }>();
    const [competitor, setCompetitor] = useState<PlaceFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [livePhotos, setLivePhotos] = useState<any>(null);

    useEffect(() => {
        const fetchCompetitor = async () => {
            if (!place_id) return;
            try {
                const data = await fetchCompetitorById(place_id);
                setCompetitor(data);

                // Fetch photos on-the-fly (async, non-blocking)
                if (!data?.raw_data?.google_media?.photos?.length) {
                    fetchPlacePhotos(place_id)
                        .then(photos => { if (photos?.photos?.length) setLivePhotos(photos); })
                        .catch(err => console.warn('Photos fetch skipped:', err.message));
                }
            } catch (err) {
                console.error('Error fetching competitor details:', err);
                setError('Failed to load competitor details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCompetitor();
    }, [place_id]);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    if (error || !competitor) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4"><T>Error</T></h2>
                <p className="text-gray-600 mb-8">{error || <T>Competitor not found</T>}</p>
                <Link to="/products/places" className="text-indigo-600 hover:underline"><T>Return to list</T></Link>
            </div>
        );
    }

    return <LocationDetailView competitor={competitor} livePhotos={livePhotos} />;
};
export default LocationDetail;
