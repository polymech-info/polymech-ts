import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type GridPreset, getPresetVisibilityModel, GRID_TYPES_FILTER_EXCLUDES_ANY_OF } from './useGridColumns';
import {
    DataGrid,
    useGridApiRef,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
    GridToolbarQuickFilter,
    type GridColDef,
    type GridFilterModel,
    type GridPaginationModel,
    type GridSortModel,
    type GridColumnVisibilityModel,
    GridLogicOperator,
} from '@mui/x-data-grid';
import { type PlaceFull } from '@polymech/shared';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useMuiTheme } from '@/hooks/useMuiTheme';
import { type PlacesSettings } from './usePlacesSettings';

// Extracted utils and components
import {
    filterModelToParams,
    paramsToFilterModel,
    sortModelToParams,
    paramsToSortModel,
    visibilityModelToParams,
    paramsToVisibilityModel,
    paramsToColumnOrder
} from './gridUtils';
import { useGridColumns } from './useGridColumns';

/** Matches email column `valueGetter` / `EmailCell` — used when seeding type excludes so the only MUI filter row can stay on `types` (Community grid allows one filter item). */
function rowHasLeadEmail(row: any): boolean {
    const emails = row.emails || row.meta?.emails || [];
    if (Array.isArray(emails)) {
        const s = emails.map((e: any) => (typeof e === 'string' ? e : e?.email)).filter(Boolean).join(', ');
        return s.trim().length > 0;
    }
    if (typeof emails === 'string') return emails.trim().length > 0;
    return false;
}

export type CompetitorsGridViewHandle = {
    /** Row IDs (place ids) that pass the current grid filter model and quick filter. */
    getFilteredPlaceIds: () => string[];
    /** Currently selected row IDs (checkbox selection). */
    getSelectedPlaceIds: () => string[];
};

interface PlacesGridViewProps {
    competitors: PlaceFull[];
    loading: boolean;
    settings: PlacesSettings;
    updateExcludedTypes: (types: string[]) => Promise<void>;
    selectedPlaceId?: string | null;
    onSelectPlace?: (id: string | null, behavior?: 'select' | 'open' | 'toggle') => void;
    isOwner?: boolean;
    isPublic?: boolean;
    preset?: GridPreset;
    /** When set, seeds `types` column filters (doesNotContain) so rows with these types can be removed from the filter panel without changing saved settings. */
    seedExcludeTypeFilters?: string[];
    /** When false, filter/sort/pagination changes are not written to the URL (avoids collisions with multiple `types` filters). */
    persistFiltersInUrl?: boolean;
    /** Appended after base columns (e.g. AI grid filters). */
    extraColumns?: GridColDef[];
}

const CustomToolbar = ({ selectedCount }: { selectedCount: number }) => {
    return (
        <GridToolbarContainer className="flex w-full items-center px-2 py-1.5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 pl-2">
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarQuickFilter className="w-48 ml-2" />
            </div>

            <div className="flex items-center h-8 ml-auto pr-2 transition-opacity duration-200">
                {selectedCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 select-none shadow-sm">
                        {selectedCount} selected
                    </span>
                )}
            </div>
        </GridToolbarContainer>
    );
};

export const CompetitorsGridView = forwardRef<CompetitorsGridViewHandle, PlacesGridViewProps>(function CompetitorsGridView({
    competitors,
    loading,
    settings,
    updateExcludedTypes,
    selectedPlaceId,
    onSelectPlace,
    isOwner = false,
    isPublic = false,
    preset = 'full',
    seedExcludeTypeFilters,
    persistFiltersInUrl = true,
    extraColumns,
}, ref) {
    const muiTheme = useMuiTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL params
    const [filterModel, setFilterModel] = useState<GridFilterModel>(() => {
        // Community `DataGrid` forces a single filter item — encode all type excludes in one `types` filter (see `excludesAnyOf` in useGridColumns). Email "is not empty" is applied via `displayRows` when seeding type excludes.
        if (seedExcludeTypeFilters?.length) {
            const list = seedExcludeTypeFilters.map((t) => String(t).trim()).filter(Boolean);
            return {
                items: list.length
                    ? [
                        {
                            field: 'types',
                            operator: GRID_TYPES_FILTER_EXCLUDES_ANY_OF,
                            value: JSON.stringify(list),
                            id: 'seed-excludes-types',
                        },
                    ]
                    : [],
                logicOperator: GridLogicOperator.And,
            };
        }
        const fromUrl = persistFiltersInUrl ? paramsToFilterModel(searchParams) : { items: [] as GridFilterModel['items'] };
        let items = [...(fromUrl.items || [])];
        if (items.length === 0 && !searchParams.has('nofilter')) {
            const shouldHideEmptyEmails = !isPublic || isOwner;
            if (shouldHideEmptyEmails) {
                items.push({ field: 'email', operator: 'isNotEmpty', id: 'default-email' });
            }
        }
        return { items, logicOperator: GridLogicOperator.And };
    });

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(() => {
        const page = parseInt(searchParams.get('page') || '0', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
        return { page, pageSize };
    });

    const [sortModel, setSortModel] = useState<GridSortModel>(() => paramsToSortModel(searchParams));

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => paramsToVisibilityModel(searchParams));
    // Deduplicate and filter rows that have no usable ID (livesearch streams may have placeId instead of place_id, or missing IDs)
    const filteredCompetitors = React.useMemo(() => {
        const seen = new Set<string>();
        return competitors.filter(c => {
            const id = c.place_id || (c as any).placeId || (c as any).id;
            if (!id) return false;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [competitors]);

    const displayRows = React.useMemo(() => {
        if (!seedExcludeTypeFilters?.length) return filteredCompetitors;
        const shouldHideEmptyEmails = !isPublic || isOwner;
        if (!shouldHideEmptyEmails) return filteredCompetitors;
        return filteredCompetitors.filter(rowHasLeadEmail);
    }, [filteredCompetitors, seedExcludeTypeFilters, isPublic, isOwner]);

    // Column Widths state
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('competitorsColumnWidths');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Failed to load column widths', e);
            return {};
        }
    });

    const handleColumnResize = React.useCallback((params: any) => {
        const { field, width } = params.colDef;
        setColumnWidths(prev => {
            const next = { ...prev, [field]: width };
            localStorage.setItem('competitorsColumnWidths', JSON.stringify(next));
            return next;
        });
    }, []);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const apiRef = useGridApiRef();
    const containerRef = useRef<HTMLDivElement>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
    const [anchorRowId, setAnchorRowId] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        getFilteredPlaceIds: () => {
            const api = apiRef.current;
            if (!api) return [];
            const allSortedIds = api.getSortedRowIds?.() || [];
            const filteredRowsLookup = (api as any).state?.filter?.filteredRowsLookup || {};
            return allSortedIds
                .filter((id) => filteredRowsLookup[id] !== false)
                .map((id) => String(id));
        },
        getSelectedPlaceIds: () => [...selectedRows],
    }), [selectedRows]);

    // Sync local highlighted state with global selectedPlaceId
    useEffect(() => {
        if (selectedPlaceId !== highlightedRowId) {
            setHighlightedRowId(selectedPlaceId || null);
        }
    }, [selectedPlaceId]);

    // Removed local sidebar panel state (moved to GridSearchResults)

    // Get Columns Definition
    const baseColumns = useGridColumns({
        settings,
        updateExcludedTypes
    });

    const columns = React.useMemo(
        () => [...baseColumns, ...(extraColumns || [])],
        [baseColumns, extraColumns],
    );

    /** Apply min/full preset only when `preset` actually changes — not on remount (keeps URL column visibility / order). */
    const presetVisibilityBootstrappedRef = useRef(false);
    const lastPresetRef = useRef<GridPreset | null>(null);
    useEffect(() => {
        if (!presetVisibilityBootstrappedRef.current) {
            presetVisibilityBootstrappedRef.current = true;
            lastPresetRef.current = preset;
            return;
        }
        if (lastPresetRef.current === preset) return;
        lastPresetRef.current = preset;
        const presetModel = getPresetVisibilityModel(preset);
        setColumnVisibilityModel((prev) => ({ ...prev, ...presetModel }));
    }, [preset]);

    /** Keep filter model in sync when switching “saved excludes as grid filters” without remounting (preserves columns). */
    const filterSyncKey = React.useMemo(() => searchParams.toString(), [searchParams]);
    useEffect(() => {
        if (seedExcludeTypeFilters?.length) {
            const list = seedExcludeTypeFilters.map((t) => String(t).trim()).filter(Boolean);
            setFilterModel({
                items: list.length
                    ? [
                        {
                            field: 'types',
                            operator: GRID_TYPES_FILTER_EXCLUDES_ANY_OF,
                            value: JSON.stringify(list),
                            id: 'seed-excludes-types',
                        },
                    ]
                    : [],
                logicOperator: GridLogicOperator.And,
            });
            return;
        }
        if (!persistFiltersInUrl) {
            setFilterModel({ items: [], logicOperator: GridLogicOperator.And });
            return;
        }
        const fromUrl = paramsToFilterModel(searchParams);
        let items = [...(fromUrl.items || [])];
        if (items.length === 0 && !searchParams.has('nofilter')) {
            const shouldHideEmptyEmails = !isPublic || isOwner;
            if (shouldHideEmptyEmails) {
                items.push({ field: 'email', operator: 'isNotEmpty', id: 'default-email' });
            }
        }
        setFilterModel({ items, logicOperator: GridLogicOperator.And });
    }, [seedExcludeTypeFilters, persistFiltersInUrl, filterSyncKey, isPublic, isOwner, searchParams]);

    // Update URL when filter model changes
    const handleFilterModelChange = (newFilterModel: GridFilterModel) => {
        setFilterModel(newFilterModel);

        if (!persistFiltersInUrl) {
            return;
        }

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);

            // Remove all existing filter params
            Array.from(newParams.keys()).forEach(key => {
                if (key.startsWith('filter_')) {
                    newParams.delete(key);
                }
            });
            newParams.delete('nofilter');

            // Add new filter params
            const filterParams = filterModelToParams(newFilterModel);
            const entries = Object.entries(filterParams);
            if (entries.length === 0) {
                newParams.set('nofilter', 'true');
            } else {
                entries.forEach(([key, value]) => {
                    newParams.set(key, value);
                });
            }

            return newParams;
        }, { replace: true });
    };

    // Update URL when pagination changes
    const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
        setPaginationModel(newPaginationModel);

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (newPaginationModel.page !== 0) {
                newParams.set('page', newPaginationModel.page.toString());
            } else {
                newParams.delete('page');
            }
            if (newPaginationModel.pageSize !== 10) {
                newParams.set('pageSize', newPaginationModel.pageSize.toString());
            } else {
                newParams.delete('pageSize');
            }
            return newParams;
        }, { replace: true });
    };

    // Update URL when sort model changes
    const handleSortModelChange = (newSortModel: GridSortModel) => {
        setSortModel(newSortModel);

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            const sortParams = sortModelToParams(newSortModel);

            // Remove existing sort param
            newParams.delete('sort');

            // Add new sort param if exists
            if (sortParams.sort) {
                newParams.set('sort', sortParams.sort);
            }

            return newParams;
        }, { replace: true });
    };

    // Update URL when column visibility changes
    const handleColumnVisibilityModelChange = (newModel: GridColumnVisibilityModel) => {
        setColumnVisibilityModel(newModel);

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            const visibilityParams = visibilityModelToParams(newModel);

            // Remove existing hidden param
            newParams.delete('hidden');

            // Add new hidden param if exists (including empty string)
            if (visibilityParams.hidden !== undefined) {
                newParams.set('hidden', visibilityParams.hidden);
            }

            return newParams;
        }, { replace: true });
    };

    const handleColumnOrderChange = (params: any) => {
        // params.column is the column that moved
        // params.targetIndex is the new index
        // params.oldIndex is the old index
        // We need to calculate the new full order

        const currentOrder = orderedColumns.map(c => c.field);
        const { field } = params.column;
        const { targetIndex, oldIndex } = params;

        const newOrder = [...currentOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(targetIndex, 0, field);

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('order', newOrder.join(','));
            return newParams;
        }, { replace: true });
    };

    // Apply column order from URL
    const orderedColumns = React.useMemo(() => {
        // Apply saved widths
        const columnsWithWidths = columns.map(col => {
            const savedWidth = columnWidths[col.field];
            if (savedWidth) {
                // If we have a saved width, we must remove/override flex to let width take effect
                const { flex, ...rest } = col;
                return {
                    ...rest,
                    width: savedWidth,
                };
            }
            return col;
        });

        const order = paramsToColumnOrder(searchParams);
        if (order.length === 0) return columnsWithWidths;

        const columnMap = new Map(columnsWithWidths.map(col => [col.field, col]));
        const ordered: GridColDef[] = [];

        // Add columns in specified order
        order.forEach(field => {
            const col = columnMap.get(field);
            if (col) {
                ordered.push(col);
                columnMap.delete(field);
            }
        });

        // Add remaining columns
        columnMap.forEach(col => ordered.push(col));

        return ordered;
    }, [searchParams, columns, columnWidths]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (!apiRef.current) return;

            // Get row IDs in currently sorted/filtered visual order
            const allSortedIds = apiRef.current.getSortedRowIds?.() || [];
            // Retrieve MUI's internal lookup of which rows are hidden by filters
            const filteredRowsLookup = apiRef.current.state?.filter?.filteredRowsLookup || {};

            // Keep only rows that are NOT explicitly filtered out
            const rowIds = allSortedIds.filter(id => filteredRowsLookup[id] !== false);

            if (rowIds.length === 0) return;

            const maxIdx = rowIds.length - 1;
            let currentIdx = highlightedRowId ? rowIds.indexOf(highlightedRowId) : -1;
            if (currentIdx < 0) currentIdx = 0;

            let nextIdx = currentIdx;
            let handled = false;

            if (e.key === 'ArrowDown') {
                nextIdx = Math.min(maxIdx, currentIdx + 1);
                handled = true;
            } else if (e.key === 'ArrowUp') {
                nextIdx = Math.max(0, currentIdx - 1);
                handled = true;
            } else if (e.key === 'Home') {
                nextIdx = 0;
                handled = true;
            } else if (e.key === 'End') {
                nextIdx = maxIdx;
                handled = true;
            } else if (e.key === 'Enter') {
                handled = true;
                onSelectPlace?.(highlightedRowId, 'toggle');
            } else if (e.key === ' ') {
                handled = true;
                const currentId = String(rowIds[currentIdx]);
                setSelectedRows(prev => {
                    const isSelected = prev.includes(currentId);
                    return isSelected ? prev.filter(x => x !== currentId) : [...prev, currentId];
                });
                setAnchorRowId(currentId);
            } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                handled = true;
                setSelectedRows(rowIds.map(id => String(id)));
            } else if (e.key === 'Escape') {
                handled = true;
                setSelectedRows([]);
            }

            if (handled) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Crucial: Stop MUI from interpreting it
                e.stopPropagation();

                if (nextIdx !== currentIdx || !highlightedRowId) {
                    const nextId = String(rowIds[nextIdx]);
                    setHighlightedRowId(nextId);
                    onSelectPlace?.(nextId, 'select');

                    if (e.shiftKey) {
                        const anchorIdx = anchorRowId ? rowIds.indexOf(anchorRowId) : currentIdx;
                        const effectiveAnchor = anchorIdx >= 0 ? anchorIdx : currentIdx;
                        const start = Math.min(effectiveAnchor, nextIdx);
                        const end = Math.max(effectiveAnchor, nextIdx);
                        const newRange = rowIds.slice(start, end + 1).map(id => String(id));

                        if (e.ctrlKey || e.metaKey) {
                            setSelectedRows(prev => Array.from(new Set([...prev, ...newRange])));
                        } else {
                            setSelectedRows(newRange);
                        }
                    } else if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'a' && e.key !== 'Escape') {
                        setAnchorRowId(nextId);
                    }

                    requestAnimationFrame(() => {
                        try {
                            apiRef.current?.scrollToIndexes({ rowIndex: nextIdx });
                        } catch (err) { }
                    });
                }
            }
        };

        // Use capture phase to intercept before DataGrid native handlers
        el.addEventListener('keydown', handleKeyDown, true);
        return () => el.removeEventListener('keydown', handleKeyDown, true);
    }, [highlightedRowId, anchorRowId, apiRef]);

    const activeDetailCompetitor = React.useMemo(() => {
        if (!selectedPlaceId || !highlightedRowId) return null;
        return competitors.find(c => String(c.place_id || (c as any).placeId || (c as any).id) === highlightedRowId);
    }, [selectedPlaceId, highlightedRowId, competitors]);

    return (
        <div
            ref={containerRef}
            className="flex w-full h-full flex-row outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset rounded-lg"
            tabIndex={0}
        >
            <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden flex flex-col">
                <MuiThemeProvider theme={muiTheme}>
                    <DataGrid
                        apiRef={apiRef}
                        rows={displayRows}
                        columns={orderedColumns}
                        getRowId={(row) => row.place_id || row.placeId || row.id}
                        loading={loading}
                        filterModel={filterModel}
                        onFilterModelChange={handleFilterModelChange}
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={sortModel}
                        onSortModelChange={handleSortModelChange}
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
                        onColumnWidthChange={handleColumnResize}
                        onColumnOrderChange={handleColumnOrderChange}
                        pageSizeOptions={[20, 50, 100, 250]}
                        checkboxSelection
                        showToolbar
                        disableRowSelectionOnClick
                        slots={{
                            toolbar: () => <CustomToolbar selectedCount={selectedRows.length} />
                        }}
                        slotProps={{
                            toolbar: {
                                showQuickFilter: true,
                            } as any
                        }}
                        rowSelectionModel={{ type: 'include', ids: new Set(selectedRows) } as any}
                        getRowClassName={(params) => {
                            return String(params.id) === highlightedRowId ? 'row-custom-highlighted' : '';
                        }}
                        onRowClick={(params) => {
                            const id = String(params.id);
                            setHighlightedRowId(id);
                            setAnchorRowId(id);
                            onSelectPlace?.(id, 'toggle');
                        }}
                        onRowSelectionModelChange={(newSelection) => {
                            // Handle Array, Object with ids, Set, or generic Iterable
                            let ids: any[] = [];

                            if (Array.isArray(newSelection)) {
                                ids = newSelection;
                            } else if (newSelection && typeof newSelection === 'object') {
                                if ('ids' in newSelection) {
                                    ids = Array.from((newSelection as any).ids);
                                } else if ((newSelection as any) instanceof Set) {
                                    ids = Array.from(newSelection as any);
                                } else {
                                    // Try generic iterable if safe
                                    try {
                                        ids = Array.from(newSelection as any);
                                    } catch (e) {
                                        console.warn('Could not parse selection model:', newSelection);
                                    }
                                }
                            }
                            setSelectedRows(ids.map(id => String(id)));
                        }}
                        className="border-0 rounded-none h-full"
                        sx={{
                            border: 0,
                            bgcolor: 'transparent',
                            color: 'hsl(var(--foreground))',
                            '& .MuiDataGrid-columnHeaders': {
                                borderColor: 'hsl(var(--border))',
                            },
                            '& .MuiDataGrid-cell': {
                                borderColor: 'hsl(var(--border))',
                                '&:focus, &:focus-within': { outline: 'none' },
                            },
                            '& .MuiDataGrid-columnHeader': {
                                '&:focus, &:focus-within': { outline: 'none' },
                            },
                            '& .MuiDataGrid-row.Mui-selected': {
                                backgroundColor: 'hsl(var(--primary) / 0.05)',
                                '&:hover': {
                                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                                },
                            },
                            '& .MuiDataGrid-row.row-custom-highlighted': {
                                backgroundColor: 'hsl(var(--primary) / 0.15) !important',
                                '& .MuiDataGrid-cell': {
                                    borderTop: '1px solid hsl(var(--primary)) !important',
                                    borderBottom: '1px solid hsl(var(--primary)) !important',
                                }
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderColor: 'hsl(var(--border))',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'hsl(var(--muted-foreground))',
                            },
                            '& .MuiDataGrid-overlay': {
                                bgcolor: 'transparent',
                            },
                            '& .MuiCheckbox-root': {
                                color: 'hsl(var(--muted-foreground))',
                                '&.Mui-checked': {
                                    color: 'hsl(var(--primary))',
                                },
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                color: 'hsl(var(--border))',
                            },
                            '& .MuiDataGrid-menuIcon button, & .MuiDataGrid-iconButtonContainer button': {
                                color: 'hsl(var(--muted-foreground))',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                overflowX: 'auto',
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                color: 'hsl(var(--foreground))',
                                '& .MuiButtonBase-root': {
                                    color: 'hsl(var(--muted-foreground))',
                                },
                            },
                        }}
                    />
                </MuiThemeProvider>
            </div>

        </div>
    );
});
