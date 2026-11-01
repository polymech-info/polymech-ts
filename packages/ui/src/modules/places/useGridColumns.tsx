import React from 'react';
import { Link } from 'react-router-dom';
import type { GridColDef, GridFilterOperator, GridRenderCellParams } from '@mui/x-data-grid';
import { getGridStringOperators, GridFilterInputValue } from '@mui/x-data-grid';
import { Globe, Instagram, Facebook, Linkedin, Youtube, Twitter, Github, Star } from 'lucide-react';
import { EmailCell } from './EmailCell';
import { TypeCell } from './TypeCell';
import type { PlacesSettings } from './usePlacesSettings';
import { T, translate } from '../../i18n';

export type GridPreset = 'full' | 'min';

interface UseGridColumnsProps {
    settings: PlacesSettings;
    updateExcludedTypes: (types: string[]) => Promise<void>;
}

export const getPresetVisibilityModel = (preset: GridPreset) => {
    const allFields = [
        'thumbnail', 'title', 'email', 'phone', 'address',
        'city', 'country', 'website', 'rating', 'types', 'social'
    ];

    const minFields = ['thumbnail', 'title', 'types', 'social', 'rating'];

    const model: Record<string, boolean> = {};

    if (preset === 'min') {
        allFields.forEach(f => {
            model[f] = minFields.includes(f);
        });
    } else {
        // 'full'
        allFields.forEach(f => {
            model[f] = f !== 'city'; // default full has no city
        });
    }

    return model;
};

// Helper: find a social URL from any of the known data shapes
export const findSocialUrl = (row: any, platform: string): string => {
    const match = (p: any) => p.source === platform || p.platform === platform;
    const rd = row.raw_data as any;
    return rd?.[platform] ||                          // raw_data.instagram etc
        rd?.meta?.social?.find(match)?.url ||      // raw_data.meta.social[]
        row.meta?.social?.find(match)?.url ||      // meta.social[] (nested)
        row.social?.find(match)?.url ||             // social[] (DB singular)
        row.socials?.find(match)?.url ||            // socials[] (SSE plural)
        '';
};

/** Community `@mui/x-data-grid` allows only one `filterModel` item — use this operator to encode many excluded types at once. */
export const GRID_TYPES_FILTER_EXCLUDES_ANY_OF = 'excludesAnyOf';

function buildExcludesAnyOfTypesOperator(): GridFilterOperator<any, string, any> {
    return {
        label: translate('Excludes any of (types)'),
        value: GRID_TYPES_FILTER_EXCLUDES_ANY_OF,
        getApplyFilterFn: (filterItem) => {
            const raw = filterItem.value;
            if (raw == null || String(raw).trim() === '') return null;
            let excluded: string[];
            try {
                const parsed = JSON.parse(String(raw));
                excluded = Array.isArray(parsed) ? parsed.map((x) => String(x).trim()).filter(Boolean) : [];
            } catch {
                return null;
            }
            if (excluded.length === 0) return null;
            const excludedSet = new Set(excluded.map((t) => t.toLowerCase()));
            return (_cellValue: any, row: any) => {
                const types = row.types || [];
                return !types.some((t: string) => excludedSet.has(String(t).toLowerCase()));
            };
        },
        InputComponent: GridFilterInputValue,
    };
}

export const useGridColumns = ({
    settings,
    updateExcludedTypes
}: UseGridColumnsProps): GridColDef[] => {

    return React.useMemo(() => [
        {
            field: 'thumbnail',
            headerName: translate('Image'),
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                params.value ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <img
                            src={params.value}
                            alt="Thumbnail"
                            className="h-10 w-10 object-cover rounded"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ) : null
            ),
        },
        {
            field: 'title',
            headerName: translate('Name'),
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => {
                const placeId = params.row.place_id || params.row.placeId;
                return placeId ? (
                    <Link
                        to={`/products/places/detail/${placeId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                    >
                        {params.value}
                    </Link>
                ) : (
                    <span className="font-medium">{params.value}</span>
                );
            },
        },
        {
            field: 'email',
            headerName: translate('Email'),
            width: 250,
            valueGetter: (value: any, row: any) => {
                const emails = row.emails || row.meta?.emails || [];
                if (Array.isArray(emails)) {
                    return emails.map(e => typeof e === 'string' ? e : e.email).join(', ');
                }
                if (typeof emails === 'string') return emails;
                return '';
            },
            renderCell: (params: GridRenderCellParams) => {
                const isExcluded = (params.row.types || []).some((type: string) =>
                    (settings.excluded_types || []).includes(type)
                );

                // Fallback to reading directly from the Competitor object if available
                const emails = params.row.emails || [];

                return (
                    <EmailCell
                        emails={emails}
                        website={params.row.website}
                        isExcluded={isExcluded}
                    />
                );
            },
        },
        {
            field: 'phone',
            headerName: translate('Phone'),
            width: 150,
        },
        {
            field: 'address',
            headerName: translate('Address'),
            width: 200,
        },
        {
            field: 'city',
            headerName: translate('City'),
            width: 120,
            valueGetter: (value: any, row: any) => {
                return row.city || row.geo?.city || row.meta?.geo?.city || row.raw_data?.geo?.city || '';
            },
        },
        {
            field: 'country',
            headerName: translate('Country'),
            width: 120,
            valueGetter: (value: any, row: any) => {
                return row.country || row.geo?.country || row.geo?.countryName || row.meta?.geo?.countryName || row.meta?.geo?.country || row.raw_data?.geo?.countryName || '';
            },
        },
        {
            field: 'website',
            headerName: translate('Website'),
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                params.value ? (
                    <a
                        href={params.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center h-full"
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        <T>Visit</T>
                    </a>
                ) : null
            ),
        },
        {
            field: 'rating',
            headerName: translate('Rating'),
            width: 100,
            type: 'number',
            valueGetter: (value: any, row: any) => {
                const rd = row.raw_data as any;
                if (rd?.rating != null) return rd.rating;
                if (row.meta?.rating != null) return row.meta.rating;
                if (row.rating != null) return row.rating;
                return null;
            },
            renderCell: (params: GridRenderCellParams) => {
                const rating = params.value;
                if (rating == null) return null;

                const reviews = params.row.raw_data?.reviews || params.row.meta?.reviews || params.row.reviews;

                return (
                    <div className="flex flex-col justify-center h-full leading-tight">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {rating}
                        </div>
                        {reviews != null && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                {reviews} {reviews === 1 ? translate('rev') : translate('revs')}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            field: 'types',
            headerName: translate('Types'),
            width: 200,
            filterOperators: [...getGridStringOperators(), buildExcludesAnyOfTypesOperator()],
            valueGetter: (value: any, row: any) => {
                const types = row.types || [];
                return types.join(', ');
            },
            renderCell: (params: GridRenderCellParams) => (
                <TypeCell
                    types={params.row.types || []}
                    excludedTypes={settings.excluded_types || []}
                    onToggle={(type) => {
                        const currentExcluded = settings.excluded_types || [];
                        if (currentExcluded.includes(type)) {
                            updateExcludedTypes(currentExcluded.filter(t => t !== type));
                        } else {
                            updateExcludedTypes([...currentExcluded, type]);
                        }
                    }}
                />
            ),
        },
        {
            field: 'social',
            headerName: translate('Social'),
            width: 140,
            sortable: false,
            filterable: false,
            valueGetter: (value: any, row: any) => {
                const platforms = ['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'github', 'tiktok'];
                const links: string[] = [];
                for (const p of platforms) {
                    const url = findSocialUrl(row, p);
                    if (url) links.push(`${p}: ${url}`);
                }
                return links.join('; ');
            },
            renderCell: (params: GridRenderCellParams) => {
                const row = params.row;
                const socials: { platform: string; url: string; icon: React.ReactNode; color: string }[] = [];

                const platforms = [
                    { key: 'instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-pink-600 hover:text-pink-800 dark:text-pink-400' },
                    { key: 'facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-blue-600 hover:text-blue-800 dark:text-blue-400' },
                    { key: 'linkedin', icon: <Linkedin className="h-4 w-4" />, color: 'text-blue-700 hover:text-blue-900 dark:text-blue-400' },
                    { key: 'youtube', icon: <Youtube className="h-4 w-4" />, color: 'text-red-600 hover:text-red-800 dark:text-red-400' },
                    { key: 'twitter', icon: <Twitter className="h-4 w-4" />, color: 'text-blue-400 hover:text-blue-600 dark:text-blue-300' },
                    { key: 'github', icon: <Github className="h-4 w-4" />, color: 'text-gray-700 hover:text-gray-900 dark:text-gray-300' },
                    { key: 'tiktok', icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.79a8.18 8.18 0 004.76 1.52V6.88a4.84 4.84 0 01-1-.19z" /></svg>, color: 'text-gray-800 hover:text-black dark:text-gray-300' },
                ];

                for (const p of platforms) {
                    const url = findSocialUrl(row, p.key);
                    if (url) socials.push({ platform: p.key, url, icon: p.icon, color: p.color });
                }

                if (!socials.length) return null;

                return (
                    <div className="flex items-center gap-1.5 h-full">
                        {socials.map(s => (
                            <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className={s.color}>
                                {s.icon}
                            </a>
                        ))}
                    </div>
                );
            },
        },
    ] as GridColDef[], [settings, updateExcludedTypes]);
};
